# Prompt Engineering

Why the Claude system prompt is shaped the way it is, and what to change if
you want to tune the demo's behavior.

---

## The big picture

Claude's prompt has **three layers**, assembled at runtime in `lib/prompts.ts`:

1. **Base prompt** (`data/system_prompt.md`) — identity, rules, tone, playbooks
2. **Semantic catalog** (compact JSON from `data/semantic_catalog.json`) — layer metadata
3. **Per-turn user message** — what the user (or trigger) just said

The first two layers are marked with `cache_control: { type: "ephemeral" }` so Anthropic caches them. This matters because:

- Per-turn cost drops ~90% vs. resending the full prompt every time
- Large prompts (~15K tokens with catalog) would otherwise be expensive
- Cache holds for ~5 minutes of inactivity, which covers most demo sessions

---

## The seven hard rules (§2 of system_prompt.md)

Each rule addresses a specific failure mode we've seen in LLM-driven mapping:

**1. Never fabricate numbers.** LLMs love to produce plausible-sounding numbers. If Claude says "approximately 3,000 residents" without a tool call, the entire credibility of the demo collapses. The rule is blunt on purpose.

**2. Gracefully handle empty results.** When Claude says "the query returned no dialysis centers in the polygon" that's often more valuable than finding something — it tells the responder the concern is absent.

**3. Show reasoning as you go.** Short narration ("Let me pull the warning polygon first...") turns waiting-for-API-calls into confidence-building-moments.

**4. Respect access tiers.** Every tool call against a `privacy-restricted` layer returns an error message Claude can narrate back to the user. This makes the §4.7 PII-safety claim from the white paper concrete.

**5. No causal reasoning.** "A tornado hit because..." is outside the tool's scope. The system is an early-warning and situational-awareness partner, not a cause-and-effect engine.

**6. Never surface PII.** Enforced at the tool layer (role-restricted tools refuse) AND the prompt layer (Claude is told not to ask).

**7. Defaults are proposals.** Every response should leave the human in the driver's seat. The system proposes, the human disposes.

---

## The Buncombe signature pattern (§"Signature Moment")

When a new tornado warning fires, Claude's first response follows a strict pattern:

1. Warning specifics (one line)
2. Polygon footprint details (one line)
3. Headline statistics: total pop, key demographics
4. Named vulnerability features (park names, facility names)
5. Offer for next step

Target: **under 120 words.** This is the moment that makes viewers lean forward. If it rambles, the demo loses its punch.

The prompt includes an example of good output verbatim. LLMs strongly mirror provided examples; this one was worth including.

---

## Disaster playbooks (§"Disaster Playbooks")

Each disaster type has:

- A default layer set (what to pull first)
- A narrative structure (what sections to produce)

This enables "trigger without typing." When a tornado warning fires, Claude reads the tornado playbook, pulls those layers, and produces the narrative structure. No user prompt needed.

Playbooks live in both `data/system_prompt.md` (for Claude's reasoning) and `data/semantic_catalog.json` (for programmatic access). Keep them in sync.

---

## Tone calibration

The prompt explicitly rejects two common LLM tone failures:

**Sycophancy.** "Great question! Let me help you with that..." destroys credibility in an emergency context. The prompt's "Example openings (bad)" list names and shames these.

**Hedging on retrieved data.** If the tool returns "2,847", Claude says "2,847" — not "approximately 2,847" or "around 2,800". Tool results are authoritative. The prompt says so explicitly.

Hedging IS allowed — and encouraged — for:
- Recommendations ("you may want to consider...")
- Predictions ("it's likely that...")
- Implications ("this could mean...")

The distinction is: facts from tools are confident; judgments from reasoning are qualified.

---

## What to tune if...

**...responses are too long:** Lower `MAX_TOKENS` in `lib/claude.ts` (currently 2048). Add a length constraint to the relevant playbook section.

**...Claude fabricates numbers despite the rules:** Strengthen rule #1 with specific violation examples. Consider lowering temperature via the API (not currently exposed — add `temperature: 0.3` to the `client.messages.stream` call).

**...Claude asks too many clarifying questions:** The "When to Ask vs. When to Act" section already addresses this. Reinforce it. Add specific examples of ambiguous prompts it should act on anyway.

**...Claude doesn't use the map enough:** The `draw_on_map` tool is one of seven. Add a stronger rule in the playbook narrative_structure sections: "After producing the narrative, draw the relevant geometry on the map using draw_on_map."

**...The Buncombe scene is different every time:** That's expected behavior with a real LLM. If the variance is too high for demo purposes, consider few-shot examples of ideal output in the system prompt.

---

## Testing changes

After editing `data/system_prompt.md`:

1. Save the file
2. Restart the dev server (`npm run dev`) — system prompt is loaded at startup
3. Test the three signature moments:
   - Fresh trigger → Buncombe scene
   - "Show me the mobile home parks" → Follow-up with map update
   - "Who are the specific residents needing transport?" → PII refusal

If any of those break, revert and iterate.

---

## Anthropic's guidance

Anthropic recommends system prompts follow this order:
1. Role/identity
2. Specific task
3. Rules and constraints
4. Context
5. Examples

Our prompt follows that order: identity → mission → hard rules → operating context → catalog → playbooks → tone → failure modes → examples.

Full guidance: `https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview`
