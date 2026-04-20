/**
 * System prompt assembly for Claude.
 *
 * Loads the human-readable system prompt from data/system_prompt.md and appends
 * the semantic catalog (trimmed via getCatalogForSystemPrompt) at the bottom.
 * Uses Anthropic's prompt caching feature to avoid resending the large catalog
 * on every turn.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalogForSystemPrompt } from "./catalog";
import { getCatalogSummaryForAI } from "./layer_discovery";

let cachedBasePrompt: string | null = null;

/**
 * Load the base system prompt from data/system_prompt.md.
 * Caches in memory after first read.
 */
function loadBasePrompt(): string {
  if (cachedBasePrompt) return cachedBasePrompt;
  const promptPath = join(process.cwd(), "data", "system_prompt.md");
  cachedBasePrompt = readFileSync(promptPath, "utf-8");
  return cachedBasePrompt;
}

/**
 * Assemble the complete system prompt for Claude.
 *
 * Returns an array of system prompt blocks suitable for Anthropic's Messages API,
 * with cache_control markers on the stable portions to enable prompt caching.
 */
export function buildSystemPrompt(): Array<{
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}> {
  const basePrompt = loadBasePrompt();
  const catalogJson = getCatalogForSystemPrompt();

  return [
    {
      type: "text",
      text: basePrompt,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `\n\n## Live Semantic Catalog\n\nThe following is the current semantic catalog. Use this authoritative list to decide which layers to query.\n\n\`\`\`json\n${catalogJson}\n\`\`\``,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `\n\n## Full Layer Discovery Catalog\n\nThe following catalog shows ALL layers available or planned in the system, matching FEMA RAPT coverage. Layers with status "demo" have synthetic data you can query. Layers with status "coming_soon" do not have data yet but are on the roadmap. When users ask about coming_soon layers, acknowledge they exist, explain what data they would provide (source, description), and note they are planned.\n\n\`\`\`json\n${getCatalogSummaryForAI()}\n\`\`\``,
      cache_control: { type: "ephemeral" },
    },
  ];
}

/**
 * A specialized system prompt directive for the proactive "trigger" moment.
 * Appended to the user message when a new event has fired, so Claude knows
 * to produce the Buncombe-scene-style briefing without waiting for a user prompt.
 */
export function buildTriggerDirective(eventType: string): string {
  return `[SYSTEM EVENT] The NWS has just issued a ${eventType} warning. The active warning layer (DEMO_Cascade_Active_Warnings) has been updated with the polygon.

Your task: produce the proactive situational briefing for this event following the playbook narrative structure. Do not wait for the user to prompt you. Do not ask a clarifying question. Follow the Buncombe-scene signature pattern from your system instructions: under 120 words, warning specifics → population inside → named vulnerability features → infrastructure → offer next step.

Use tool calls to get the actual numbers. Never fabricate.`;
}
