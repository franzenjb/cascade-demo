/**
 * Record + replay for the chat stream.
 *
 * Demo mode lets us avoid calling the real Anthropic API on every click
 * (each live run costs real money and also varies — bad for a demo where
 * the same click should feel identical every time).
 *
 *   DEMO_MODE=replay   (default) if a transcript file exists for the given
 *                      scenario_id, replay it with original pacing; else
 *                      fall through to live without recording.
 *   DEMO_MODE=live     call the real Anthropic API AND save the stream to
 *                      data/recorded_transcripts/<scenario_id>.json for
 *                      future replays. Overwrites any prior recording.
 *   DEMO_MODE=off      call the real API, no replay, no recording.
 *
 * Transcripts capture every SSE event (text, tool_call, tool_result,
 * map_instruction, error, done) along with `t` = ms from recording start.
 * On replay the generator sleeps to reproduce the original cadence.
 */

import fs from "fs/promises";
import path from "path";
import type { ChatStreamEvent } from "./claude";

const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  "data",
  "recorded_transcripts"
);

export interface TranscriptEvent {
  t: number;
  event: ChatStreamEvent;
}

export interface Transcript {
  scenario_id: string;
  recorded_at: string;
  events: TranscriptEvent[];
}

function transcriptPath(scenarioId: string): string {
  const safe = scenarioId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(TRANSCRIPTS_DIR, `${safe}.json`);
}

export async function hasTranscript(scenarioId: string): Promise<boolean> {
  try {
    await fs.access(transcriptPath(scenarioId));
    return true;
  } catch {
    return false;
  }
}

export async function loadTranscript(
  scenarioId: string
): Promise<Transcript | null> {
  try {
    const raw = await fs.readFile(transcriptPath(scenarioId), "utf8");
    return JSON.parse(raw) as Transcript;
  } catch {
    return null;
  }
}

export async function saveTranscript(transcript: Transcript): Promise<void> {
  await fs.mkdir(TRANSCRIPTS_DIR, { recursive: true });
  await fs.writeFile(
    transcriptPath(transcript.scenario_id),
    JSON.stringify(transcript, null, 2),
    "utf8"
  );
}

export async function* replayTranscript(
  transcript: Transcript
): AsyncGenerator<ChatStreamEvent> {
  const start = Date.now();
  for (const { t, event } of transcript.events) {
    const wait = t - (Date.now() - start);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    yield event;
  }
}

/**
 * Wraps a live chat generator so every yielded event is also captured
 * into an in-memory transcript. Call `finalize()` after the stream is
 * drained to persist the transcript to disk.
 */
export function recordStream(
  scenarioId: string,
  source: AsyncGenerator<ChatStreamEvent>
): {
  recording: AsyncGenerator<ChatStreamEvent>;
  finalize: () => Promise<void>;
} {
  const events: TranscriptEvent[] = [];
  const start = Date.now();

  async function* recording(): AsyncGenerator<ChatStreamEvent> {
    for await (const event of source) {
      events.push({ t: Date.now() - start, event });
      yield event;
    }
  }

  return {
    recording: recording(),
    async finalize() {
      await saveTranscript({
        scenario_id: scenarioId,
        recorded_at: new Date().toISOString(),
        events,
      });
    },
  };
}
