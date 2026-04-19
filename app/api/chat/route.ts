/**
 * POST /api/chat
 *
 * Main conversational endpoint. Accepts chat history + new user message,
 * streams Claude's response (including tool calls and map instructions)
 * back to the frontend as Server-Sent Events.
 *
 * Demo mode (DEMO_MODE env var):
 *   replay (default) — if a saved transcript exists for body.scenario_id,
 *                      replay it instead of hitting Anthropic. Otherwise
 *                      fall through to the live API without recording.
 *   live             — always call Anthropic; if scenario_id is present,
 *                      save the stream as a transcript (for future replay).
 *   off              — always call Anthropic; never record.
 */

import { NextRequest } from "next/server";
import { chatWithTools, type ChatStreamEvent } from "@/lib/claude";
import {
  hasTranscript,
  loadTranscript,
  recordStream,
  replayTranscript,
} from "@/lib/transcript";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  history: ChatMessage[];
  message: string;
  trigger_directive?: string;
  scenario_id?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.message || typeof body.message !== "string") {
    return new Response(JSON.stringify({ error: "Missing 'message' field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mode = (process.env.DEMO_MODE || "replay").toLowerCase();
  const scenarioId = body.scenario_id?.trim() || "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ChatStreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        if (
          mode === "replay" &&
          scenarioId &&
          (await hasTranscript(scenarioId))
        ) {
          const t = await loadTranscript(scenarioId);
          if (t) {
            for await (const event of replayTranscript(t)) emit(event);
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
        }

        const userMessage = body.trigger_directive
          ? `${body.trigger_directive}\n\n${body.message}`
          : body.message;

        const liveGen = chatWithTools(body.history || [], userMessage);

        if (mode === "live" && scenarioId) {
          const { recording, finalize } = recordStream(scenarioId, liveGen);
          for await (const event of recording) emit(event);
          try {
            await finalize();
          } catch (err) {
            console.error("Failed to save transcript:", err);
          }
        } else {
          for await (const event of liveGen) emit(event);
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        emit({ type: "error", error: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
