# Project Cascade — The Build Paper

**A complete guide to building the conversational, anticipatory emergency mapping demo.**

Version 1.0 — prepared for Jeff Franzen (Dragon), American Red Cross GIS Developer

---

## What This Repo Is

This is a **standalone starter repo** for Project Cascade, the working demo companion to the strategic white paper *"Before You Even Ask: Conversational, Anticipatory Mapping for the Non-GIS Responder."*

The goal: a web application where a fictional tornado warning fires over fictional "Cascade County," and an AI-powered conversational interface produces the Buncombe-style map and narrative before anyone types a prompt — using real spatial queries against real AGOL layers containing synthetic data.

By the end of the build, you will have:

1. A live web URL (e.g., `cascade.jbf.com`) that partners can open on any device
2. A fully working conversational loop (Claude + tool calls + AGOL spatial queries)
3. Ten synthetic AGOL layers representing a plausible rural mountain county
4. A semantic catalog that maps natural-language queries to spatial operations
5. A shareable 3-minute screen recording for LinkedIn
6. A codebase that can evolve into Phase 1 production

---

## Table of Contents

1. [Quick Start (90 Minutes to First Smoke Test)](#quick-start-90-minutes-to-first-smoke-test)
2. [Prerequisites & Accounts](#prerequisites--accounts)
3. [Repository Structure](#repository-structure)
4. [Week-by-Week Build Plan](#week-by-week-build-plan)
5. [Cascade County — The Synthetic World](#cascade-county--the-synthetic-world)
6. [The Semantic Catalog](#the-semantic-catalog)
7. [The Claude System Prompt](#the-claude-system-prompt)
8. [Tool-Calling Architecture](#tool-calling-architecture)
9. [The Trigger — Simulating NWS Alerts](#the-trigger--simulating-nws-alerts)
10. [Design System Application](#design-system-application)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)
13. [Security & Secrets](#security--secrets)
14. [Launch Checklist](#launch-checklist)
15. [Troubleshooting Playbook](#troubleshooting-playbook)
16. [Evolution Beyond the Demo](#evolution-beyond-the-demo)

---

## Quick Start (90 Minutes to First Smoke Test)

If you're ready to start immediately, this is the fastest path to seeing something working:

```bash
# 1. Clone/copy this starter repo into your workspace
cd ~/code
cp -r /path/to/cascade1 ./cascade1
cd cascade1

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local — add ANTHROPIC_API_KEY and AGOL credentials

# 4. Run the synthetic data generator (creates your fictional county)
cd scripts
python generate_cascade_data.py
# Follow the output — it will publish layers to your AGOL org

# 5. Start the dev server
cd ..
npm run dev
# Open http://localhost:3000
```

If after 90 minutes you see your fictional Cascade County boundary rendering on a map in your browser, served from your own AGOL org, the pipes are working. Everything after that is additive.

---

## Prerequisites & Accounts

### What you already have (confirmed from our conversations)

- GitHub account
- Vercel account (or you'll create one)
- Access to `arc-nhq-gis` AGOL org with publisher permissions
- Cursor and Claude Code for AI-assisted development
- Python 3.10+
- Node.js 20+

### What you need to set up

**Anthropic API access.** Go to console.anthropic.com, create an API key, set up billing. Budget $20–100 for the full build. Prompt caching will keep ongoing costs low.

**Vercel project.** Link your GitHub repo to Vercel. Vercel will auto-deploy on every push to `main`.

**Domain.** If you want `cascade.jbf.com`, add a CNAME record in your DNS provider pointing to Vercel's servers. Vercel will handle SSL automatically.

**AGOL developer account (optional but recommended for public demo).** Before going public, consider migrating from arc-nhq-gis to a separate dev org to avoid the governance issues we discussed. Free developer accounts at developers.arcgis.com.

---

## Repository Structure

```
cascade1/
├── README.md                      # Quick overview for anyone cloning
├── BUILD.md                       # This file — the master build doc
├── .env.example                   # Template for environment variables
├── .gitignore
├── package.json                   # Node dependencies
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts             # With Dragon design tokens
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout with fonts
│   ├── page.tsx                   # Landing page (the demo itself)
│   ├── globals.css                # Dragon design system tokens
│   └── api/
│       ├── chat/route.ts          # Conversational Claude endpoint
│       ├── trigger/route.ts       # NWS tornado simulation
│       ├── query/route.ts         # AGOL spatial query executor
│       └── export/route.ts        # PDF/PNG export generator
│
├── components/
│   ├── MapView.tsx                # ArcGIS Maps SDK wrapper
│   ├── ChatPanel.tsx              # Conversational UI
│   ├── TriggerButton.tsx          # "Fire the tornado" control
│   ├── LayerToggle.tsx            # Manual layer controls
│   ├── StatsBar.tsx               # Live statistics display
│   └── ExportButton.tsx           # Download map + briefing
│
├── lib/
│   ├── claude.ts                  # Claude API wrapper with tool use
│   ├── agol.ts                    # AGOL REST client
│   ├── catalog.ts                 # Semantic catalog loader
│   ├── spatial.ts                 # Spatial operation helpers
│   ├── prompts.ts                 # System prompts (carefully crafted)
│   └── types.ts                   # Shared TypeScript types
│
├── data/
│   ├── semantic_catalog.json      # THE key artifact
│   ├── tornado_scenarios.json     # Pre-scripted scenarios
│   └── system_prompt.md           # Claude's instructions (human-readable)
│
├── scripts/
│   ├── generate_cascade_data.py   # Creates & publishes synthetic layers
│   ├── validate_catalog.py        # Ensures every catalog entry exists in AGOL
│   └── publish_layers.py          # Publishes to AGOL
│
├── public/                         # Static assets
│   └── (fonts, images, favicon)
│
└── docs/
    ├── DEMO_SCRIPT.md              # Exact scripted demo sequence
    ├── SYNTHETIC_DATA_DESIGN.md    # Rationale for every data choice
    ├── PROMPT_ENGINEERING.md       # Why the prompts are shaped this way
    └── LAUNCH_CHECKLIST.md         # Pre-launch verification steps
```

---

## Week-by-Week Build Plan

### Week 1: Foundation (The Pipes)

**Goal by end of week:** A live web URL that renders the Cascade County boundary from your AGOL org. No AI yet. No conversational UI yet. Just proof that Next.js + AGOL + Vercel work together.

**Day 1 (Monday)**
- Create GitHub repo `cascade1`
- Scaffold Next.js app: `npx create-next-app@latest cascade1 --typescript --tailwind --app --src-dir=false`
- Copy this starter repo's files over the scaffold
- `npm install` and verify it runs locally
- Link to Vercel, verify first deploy succeeds

**Day 2 (Tuesday)**
- Run `scripts/generate_cascade_data.py` with minimal scope (just the county boundary)
- Publish one Feature Service to arc-nhq-gis: `DEMO_Cascade_Boundary`
- Make it public-read for demo purposes
- Verify you can query it via the AGOL REST endpoint

**Day 3 (Wednesday)**
- Install ArcGIS Maps SDK: `npm install @arcgis/core`
- Build `components/MapView.tsx` — basic map component
- Load the Cascade boundary layer
- Push to Vercel, open live URL, see fictional county on a map

**Days 4–5 (Thursday-Friday)**
- Generate and publish the remaining 9 layers (see [Synthetic World](#cascade-county--the-synthetic-world) section)
- Wire up manual layer toggles in the UI (no AI yet)
- Validate every layer loads correctly

**Weekend buffer.** Catch up on anything that took longer.

### Week 2: The Conversation

**Goal by end of week:** A working conversational loop where you type a question, Claude runs tool calls against AGOL, and the map updates with real answers.

**Day 6 (Monday)**
- Complete the semantic catalog (`data/semantic_catalog.json`)
- Run `scripts/validate_catalog.py` — every entry must resolve to a real AGOL layer
- Build `lib/catalog.ts` loader

**Day 7 (Tuesday)**
- Implement the seven Claude tools as API route handlers (see [Tool-Calling Architecture](#tool-calling-architecture))
- Test each tool independently with `curl` or a REST client
- `get_warning_polygon` first, then `count_population_in_polygon`, then the rest

**Day 8 (Wednesday)**
- Build `lib/claude.ts` — Claude Messages API wrapper with tool use
- Implement `app/api/chat/route.ts` using streaming responses
- Test with Postman/Thunder Client — verify Claude can call tools and you can execute them

**Day 9 (Thursday)**
- Build `components/ChatPanel.tsx` — input field, streaming output display
- Wire to `/api/chat`
- Test the full loop: type question → Claude reasons → tools execute → answer streams back → map updates

**Day 10 (Friday)**
- Implement `/api/trigger` (the simulated NWS alert)
- Build `components/TriggerButton.tsx`
- Wire the Buncombe-scene proactive narrative: when triggered, warning polygon renders, Claude generates the "2,847 people live within..." output automatically
- This is the moment of truth. If the trigger works, the demo's core is done.

### Week 3: Polish & Launch

**Goal by end of week:** Public launch. Live URL. LinkedIn post. Paper companion ready.

**Day 11 (Monday)**
- Run the full scripted conversation from `docs/DEMO_SCRIPT.md` against the live system
- Fix every spot that doesn't work or feels wrong
- Add export capability (`/api/export` → PDF or PNG)

**Day 12 (Tuesday)**
- Apply the Dragon design system thoroughly
- Mobile responsive testing
- Loading states, error states, empty states

**Day 13 (Wednesday)**
- Hard adversarial testing — try to break the system
- Find one trusted reviewer (Red Cross colleague, tech friend) to test
- Fix the top 3 things they find

**Day 14 (Thursday)**
- Production deployment to `cascade.jbf.com`
- Screen-record the 3-minute demo with voiceover
- Record a backup 60-second cut for LinkedIn autoplay

**Day 15 (Friday)**
- Write and schedule LinkedIn post (reuse the existing draft, update with live URL)
- Update jbf.com paper page to link to the live demo
- Brief 2–3 close colleagues about the launch
- Launch on Tuesday of the following week at 10am Eastern

---

## Cascade County — The Synthetic World

See `docs/SYNTHETIC_DATA_DESIGN.md` for the full rationale. Here's the fast version.

**Geography.** A composite based on western North Carolina + southwest Virginia mountain geography. Roughly 750 square miles, two river valleys converging at a small city, ridges 500–1800m, forest cover ~68%. Coordinates centered around 36.0°N, 81.5°W (real location of your invented county is up to you — just make sure the generator uses these coordinates consistently).

**Population.** 128,400 residents. Demographics designed to match real mountain-rural patterns:
- 19% over 65 (higher than national average, typical of rural Appalachia)
- 7% limited English
- 14% below poverty line
- 11% with a disability
- 3% medical-baseline-customer equivalent

**Settlements.** One city ("Ridgeton", population ~45,000), four towns (Millbrook, Ashford Falls, Stonecreek, Pine Hollow), scattered rural communities in mountain hollows.

**The ten layers:**

| Layer | Count | Key Attributes |
|---|---|---|
| `DEMO_Cascade_Boundary` | 1 | county_name, area_sq_mi |
| `DEMO_Cascade_Roads` | ~3,500 | road_type, name, speed_limit |
| `DEMO_Cascade_Census_Tracts` | 28 | pop, pct_over_65, pct_lep, pct_poverty, pct_disability, median_income, crci_score |
| `DEMO_Cascade_Mobile_Home_Parks` | 11 | park_name, unit_count, address, year_established |
| `DEMO_Cascade_Schools` | 24 | name, type (elem/middle/high), enrollment, address |
| `DEMO_Cascade_Medical_Facilities` | 9 | name, type (hospital/clinic/dialysis), bed_count, home_dialysis_patients |
| `DEMO_Cascade_AFN_Service_Areas` | ~15 | area_name, aggregated_count, service_type |
| `DEMO_Cascade_Red_Cross_Assets` | 6 | asset_name, type (office/shelter/ERV_depot), capacity |
| `DEMO_Cascade_Historical_Incidents` | 14 | event_date, event_type, affected_pop, duration_days |
| `DEMO_Cascade_Active_Warnings` | 0–1 dynamic | warning_type, issued, expires, polygon |

**The Buncombe-preserving tornado.** Designed so when the demo fires:
- Warning polygon cuts diagonally through northeast Ridgeton
- Exactly 2,847 residents inside (from paper)
- 18% over 65, 9% limited English (from paper)
- 4 mobile home parks inside, largest "Mountain View Estates" with 148 units (from paper)
- First Baptist Ridgeton 600m from Mountain View (from paper)
- 47 home-dialysis patients inside (from paper)

Every number in the demo matches the paper. This is deliberate.

---

## The Semantic Catalog

This is the single highest-leverage artifact. It lives at `data/semantic_catalog.json`. See the file in this repo for the full structure.

**Why it matters.** Claude doesn't access AGOL directly. Claude reads the catalog to decide which layers are relevant, what aliases map to which layer, how to combine them for different disaster types. The catalog is what makes Claude feel like it "already knows" the data.

**Editing discipline.** Every layer gets:

- `id` — exact AGOL service name (must match what's published)
- `service_url` — the AGOL REST endpoint
- `display_name` — what users see
- `aliases` — every way a user might refer to this layer (minimum 5)
- `disaster_relevance` — high/medium/low for each disaster type
- `why_it_matters` — one sentence explaining the operational significance
- `schema` — field name → type
- `access_tier` — public / internal / role-restricted / privacy-restricted
- `data_vintage` — when the data was produced
- `known_limitations` — what this layer gets wrong

**Extensibility proof-point.** When you demo this, say: *"Adding a wildfire perimeter capability is a catalog entry, not a code change."* Then show the file. Partners should see this and realize the system isn't a closed box.

---

## The Claude System Prompt

The exact system prompt is in `data/system_prompt.md`. Here's what's in it and why:

**Section 1 — Identity and mission.** Establishes Claude as an emergency-mapping partner for a non-GIS responder in Cascade County. Sets the tone.

**Section 2 — Operating principles.** Hard rules:
- "You must use tool calls for every spatial or statistical claim. Never state a number you did not receive from a tool."
- "If a tool returns no results, say so. Do not invent data."
- "When multiple tool calls are needed, explain what you're doing as you go."
- "Respect access tiers. Role-restricted layers require explicit authorization context before surfacing individual-level data."

**Section 3 — The semantic catalog.** Full JSON catalog embedded in the system prompt. Prompt caching keeps cost down despite the size.

**Section 4 — Disaster-type playbooks.** For each disaster type (tornado, hurricane, flood, etc.), the default layer set and the typical first-response narrative structure. This is what enables the Buncombe-scene moment.

**Section 5 — Tone guidance.** Professional, concise, confident-but-humble. Use active voice. Lead with the most important information. Offer concrete next steps.

**Section 6 — Failure modes to avoid.** Explicit "do not" list:
- Do not fabricate numbers
- Do not reason causally about why a disaster is happening
- Do not recommend specific interventions (evacuate, shelter in place, etc.) — propose options for the human to decide
- Do not surface individual-level PII unless explicitly authorized for the query context

---

## Tool-Calling Architecture

Claude has seven tools. Each is implemented as a function in `lib/tools/` and exposed through `/api/query`.

```typescript
// Schema Claude sees (from lib/claude.ts)

const tools = [
  {
    name: "get_warning_polygon",
    description: "Get the currently active NWS warning polygon, if any.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "count_population_in_polygon",
    description: "Count residents within a polygon, with optional demographic filters.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: { type: "object", description: "GeoJSON polygon" },
        filters: {
          type: "object",
          description: "Optional: { min_age, max_age, language, disability, etc. }"
        }
      },
      required: ["polygon_geojson"]
    }
  },
  {
    name: "get_features_in_polygon",
    description: "Return features from a named layer that fall within a polygon.",
    input_schema: {
      type: "object",
      properties: {
        layer_id: { type: "string" },
        polygon_geojson: { type: "object" },
        filter_expression: { type: "string", description: "Optional SQL-like filter" }
      },
      required: ["layer_id", "polygon_geojson"]
    }
  },
  {
    name: "get_demographics_for_polygon",
    description: "Return age/language/income breakdown for a polygon.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: { type: "object" }
      },
      required: ["polygon_geojson"]
    }
  },
  {
    name: "get_resources_near_polygon",
    description: "Find Red Cross and partner resources near a polygon.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: { type: "object" },
        distance_miles: { type: "number", default: 10 },
        resource_types: {
          type: "array",
          items: { type: "string" },
          description: "Optional: ['shelter', 'ERV', 'hospital', etc.]"
        }
      },
      required: ["polygon_geojson"]
    }
  },
  {
    name: "draw_on_map",
    description: "Instruct the frontend to render geometry on the map.",
    input_schema: {
      type: "object",
      properties: {
        geometry: { type: "object", description: "GeoJSON" },
        style: {
          type: "object",
          description: "Visual style: color, opacity, label"
        },
        layer_label: { type: "string" }
      },
      required: ["geometry"]
    }
  },
  {
    name: "generate_briefing_draft",
    description: "Produce a one-page leadership briefing in Red Cross format.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        key_stats: { type: "object" },
        recommendations: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["summary", "key_stats"]
    }
  }
];
```

**The critical pattern.** Claude reasons, calls a tool, your API executes it against AGOL, the result streams back, Claude reasons again. This loop continues until Claude has enough information to answer. The frontend receives both the conversational text (streamed) and any `draw_on_map` commands (as structured data).

---

## The Trigger — Simulating NWS Alerts

The trigger is what creates the "before you even ask" moment. Implementation:

1. `components/TriggerButton.tsx` — a UI button (initially visible, eventually hidden behind a URL parameter for demo control)
2. `app/api/trigger/route.ts` — receives the trigger, updates the `DEMO_Cascade_Active_Warnings` layer in AGOL with the pre-designed warning polygon, writes a small "active warning" event to the session
3. The frontend detects the active warning via a subscription
4. Automatically dispatches a "proactive" message to `/api/chat` with a special system prompt directive: "The NWS has issued a tornado warning for [polygon]. Produce a proactive situational briefing without waiting for a user prompt."
5. Claude's response streams in as if the user had just opened the app at the exact right moment

**Timing.** From click to full narrative display should be 5–8 seconds. Prompt caching is critical here.

**For the LinkedIn video.** Record this sequence and you have your money shot.

---

## Design System Application

The Dragon design system CSS tokens are already in `app/globals.css`. Key points:

- **Background:** Cream `#f7f5f2` everywhere except cards
- **Cards:** White on cream, 1px gray-100 border, no border-radius or 4px max
- **Typography:** Libre Baskerville for headlines, Source Sans Pro for body, IBM Plex Mono for data
- **Red accent:** `#ED1B2E` used sparingly — the Red Cross mark in header, one KPI accent, the trigger button
- **The red rule:** 40px × 3px bar below section headings

Don't deviate. The paper lives under this design system; the demo should feel like a continuation of the paper, not a different product.

---

## Testing Strategy

**Unit tests (optional for demo).** Skip for v1. Ship fast.

**Integration tests (required).** For every tool, verify:
- Tool returns expected data shape given valid input
- Tool handles empty results gracefully
- Tool handles AGOL timeouts gracefully

**End-to-end demo test.** Run `docs/DEMO_SCRIPT.md` from top to bottom against the live system. Every exchange should work. Document any deviations.

**Adversarial test.** Try to make Claude fabricate data. Try to make it surface PII. Try to ask about disasters the system doesn't have layers for. Log every failure mode and decide which to fix vs. which to document as known limitations.

---

## Deployment

**Development:** `npm run dev` locally, connected to arc-nhq-gis

**Preview:** Every PR to GitHub triggers a Vercel preview deploy. Share preview URLs with reviewers before merging.

**Production:** Merges to `main` auto-deploy to `cascade.jbf.com`

**Environment variables in Vercel.** Dashboard → project → Settings → Environment Variables:
- `ANTHROPIC_API_KEY` — your Anthropic key
- `AGOL_USERNAME` — your arc-nhq-gis username
- `AGOL_PASSWORD` — your arc-nhq-gis password (or better, use token)
- `AGOL_TOKEN` — short-lived token for AGOL REST calls
- `AGOL_PORTAL_URL` — `https://arc-nhq-gis.maps.arcgis.com`

Mark all as Production only unless you also want them in preview deploys.

---

## Security & Secrets

**Never commit secrets.** `.env.local` is in `.gitignore`. Confirm before every push.

**API key exposure.** The Anthropic API key lives server-side only (in API routes). The browser never sees it. Frontend sends prompts to `/api/chat`; the API route calls Anthropic.

**AGOL credentials.** Same pattern. Server-side only. Frontend never holds credentials.

**Public-read layers only.** Every `DEMO_Cascade_*` layer is public-read. No sensitive data in any of them (they're synthetic anyway). This simplifies the security model dramatically.

**Rate limiting.** Not implemented in v1. If the demo URL goes viral and costs spike, add simple IP-based rate limiting to `/api/chat`.

**CORS.** Next.js API routes are same-origin by default. No CORS config needed unless you expose the API to other domains.

---

## Launch Checklist

See `docs/LAUNCH_CHECKLIST.md` for the full version. Top 10:

1. [ ] All 10 AGOL layers published, public-read, validated
2. [ ] Semantic catalog references every layer correctly
3. [ ] All 7 Claude tools tested and returning expected shapes
4. [ ] Full scripted demo runs end-to-end without errors
5. [ ] Trigger produces Buncombe-scene output in under 10 seconds
6. [ ] Design system applied consistently
7. [ ] Mobile responsive (test on actual phone)
8. [ ] `cascade.jbf.com` DNS live and serving HTTPS
9. [ ] Environment variables set in Vercel production
10. [ ] 3-minute demo video recorded and tested

---

## Troubleshooting Playbook

See `docs/TROUBLESHOOTING.md` for the full version. Common issues:

**"Claude keeps fabricating numbers."**
→ Strengthen the system prompt rule. Add specific examples of prohibited behavior. Consider reducing temperature.

**"AGOL queries are slow (>3s)."**
→ Check spatial indexes are enabled on your Feature Services. Consider client-side caching of frequent queries.

**"The map flickers when layers toggle."**
→ Layer state management issue. Debounce toggle events. Check React re-render patterns.

**"Trigger works locally but not in production."**
→ Environment variable mismatch. Check Vercel dashboard.

**"Claude API returns 529 (overloaded)."**
→ Anthropic infrastructure is busy. Implement exponential backoff.

---

## Evolution Beyond the Demo

Once the demo is live and getting feedback, the natural evolution is:

1. **Add a second disaster type** — hurricane pre-landfall. Different scripted scenario, expanded catalog.
2. **Connect to a real NWS feed** — replace the trigger button with actual NWS CAP feed polling
3. **Add real AGOL layers** — Red Cross operational data for one pilot region
4. **Build the offline mobile capability** — using Field Maps integration
5. **Add the equity audit retrospective** — the second most compelling scenario in the paper

Each of these is a 1–2 week effort. The demo is the foundation; everything else rides on top.

---

## Questions & Next Steps

The fastest way to go from this doc to a working demo: pick a 90-minute block, copy this repo, run the quick start, and get the Cascade County boundary rendering in your browser. Once that works, you've de-risked the whole project and everything else is execution.

When you get to any point where you're stuck, come back with the specific problem and I'll help debug.

Ship fast. Make people lean forward.

---

*Prepared by Claude, drawing on prior conversations about Project Cascade, the Before You Even Ask white paper, and the Dragon design system.*
