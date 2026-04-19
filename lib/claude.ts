/**
 * Claude API wrapper with tool-use support.
 *
 * Exposes a single `chatWithTools` function that handles the full tool-use loop:
 * user prompt → Claude responds with tool calls → execute tools → feed results
 * back to Claude → Claude produces final response. Streams tokens as they arrive.
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./prompts";
import { toolDefinitions, executeToolCall } from "./tools";
import type { ChatMessage, MapInstruction } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const MAX_TOOL_ITERATIONS = 8; // Safety limit on how many tool-use rounds per turn

export interface ChatStreamEvent {
  type: "text" | "tool_call" | "tool_result" | "map_instruction" | "done" | "error";
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  mapInstruction?: MapInstruction;
  error?: string;
}

/**
 * Main chat function with tool-use loop.
 * Returns an async generator that yields streaming events.
 */
export async function* chatWithTools(
  history: ChatMessage[],
  userMessage: string
): AsyncGenerator<ChatStreamEvent> {
  const systemBlocks = buildSystemPrompt();

  // Build the message history with the new user message
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    try {
      // Stream Claude's response
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemBlocks,
        tools: toolDefinitions,
        messages,
      });

      let assistantText = "";
      const toolCalls: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];

      // Consume the stream
      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            assistantText += event.delta.text;
            yield { type: "text", content: event.delta.text };
          }
        }
      }

      // Get the final message to extract tool calls
      const finalMessage = await stream.finalMessage();

      // Collect tool calls from the final message
      for (const block of finalMessage.content) {
        if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      // If there are no tool calls, we're done
      if (toolCalls.length === 0) {
        yield { type: "done" };
        return;
      }

      // Add the assistant message with tool calls to history
      messages.push({
        role: "assistant",
        content: finalMessage.content,
      });

      // Execute each tool call and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const call of toolCalls) {
        yield {
          type: "tool_call",
          toolName: call.name,
          toolInput: call.input,
        };

        try {
          const result = await executeToolCall(call.name, call.input);

          // If the tool returned a map instruction, emit it to the frontend
          if (result.mapInstruction) {
            yield {
              type: "map_instruction",
              mapInstruction: result.mapInstruction,
            };
          }

          yield {
            type: "tool_result",
            toolName: call.name,
            toolResult: result.content,
          };

          toolResults.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: result.content,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          yield {
            type: "tool_result",
            toolName: call.name,
            toolResult: `Error: ${errorMessage}`,
          };
          toolResults.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: `Error: ${errorMessage}`,
            is_error: true,
          });
        }
      }

      // Add tool results as a user message and loop for Claude's response
      messages.push({
        role: "user",
        content: toolResults,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      yield { type: "error", error: errorMessage };
      return;
    }
  }

  // Hit the iteration limit
  yield {
    type: "error",
    error: `Exceeded max tool-use iterations (${MAX_TOOL_ITERATIONS}). Check for tool-call loops.`,
  };
}
