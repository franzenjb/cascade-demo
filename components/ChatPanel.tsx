"use client";
import ReactMarkdown from "react-markdown";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, MapInstruction } from "@/lib/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  triggerDirective: string | null;
  scenarioId: string | null;
  onTriggerConsumed: () => void;
  onMapInstruction: (instruction: MapInstruction) => void;
  onStreamComplete?: () => void;
}

export default function ChatPanel({
  messages,
  setMessages,
  triggerDirective,
  scenarioId,
  onTriggerConsumed,
  onMapInstruction,
  onStreamComplete,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState("");
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStreamText]);

  // When a trigger fires, auto-send a message to invoke the proactive briefing
  useEffect(() => {
    if (triggerDirective && !isStreaming) {
      sendMessage("Produce the proactive situational briefing.", triggerDirective);
      onTriggerConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerDirective]);

  async function sendMessage(text: string, directive?: string) {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const historySnapshot = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setCurrentStreamText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historySnapshot,
          message: text,
          trigger_directive: directive,
          scenario_id: directive ? scenarioId : null,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);
            if (event.type === "text") {
              assembled += event.content || "";
              setCurrentStreamText(assembled);
            } else if (event.type === "tool_call") {
              setToolActivity(`Running ${event.toolName}...`);
            } else if (event.type === "tool_result") {
              setToolActivity(null);
            } else if (event.type === "map_instruction" && event.mapInstruction) {
              onMapInstruction(event.mapInstruction);
            } else if (event.type === "error") {
              assembled += `\n\n[Error: ${event.error}]`;
              setCurrentStreamText(assembled);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Finalize the assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: assembled }]);
      setCurrentStreamText("");
      setToolActivity(null);
      onStreamComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `[Error] ${errorMessage}` },
      ]);
      setCurrentStreamText("");
      setToolActivity(null);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !currentStreamText && (
          <div className="text-arc-gray-500 dark:text-arc-gray-300 text-sm italic py-8 text-center">
            Click <span className="font-semibold text-arc-red">Run a Simulation</span>{" "}
            to see the system respond proactively — or type a question to begin.
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {currentStreamText && (
          <MessageBubble
            message={{ role: "assistant", content: currentStreamText }}
            isStreaming
          />
        )}

        {toolActivity && (
          <div className="text-xs text-arc-gray-500 dark:text-arc-gray-300 font-data italic px-3">
            {toolActivity}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-arc-gray-100 dark:border-arc-gray-700 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isStreaming ? "Thinking..." : "Ask about populations, resources, impact..."
            }
            disabled={isStreaming}
            className="flex-1 border border-arc-gray-300 dark:border-arc-gray-700 bg-white dark:bg-arc-gray-900 text-arc-gray-900 dark:text-arc-cream px-3 py-2 text-sm font-body focus:outline-none focus:border-arc-black dark:focus:border-arc-cream disabled:bg-arc-cream dark:disabled:bg-arc-black"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="bg-arc-black dark:bg-arc-cream text-white dark:text-arc-black px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-arc-gray-900 dark:hover:bg-white"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-3 py-2 text-sm ${
          isUser
            ? "bg-arc-black dark:bg-arc-cream text-white dark:text-arc-black whitespace-pre-wrap"
            : "bg-arc-cream dark:bg-arc-black border border-arc-gray-100 dark:border-arc-gray-700 text-arc-gray-900 dark:text-arc-cream prose-sm"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="space-y-2 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-arc-black dark:[&_strong]:text-arc-cream [&_hr]:my-3 [&_hr]:border-arc-gray-100 dark:[&_hr]:border-arc-gray-700">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && <span className="inline-block w-1 h-4 bg-arc-red ml-1 animate-pulse"></span>}
      </div>
    </div>
  );
}
