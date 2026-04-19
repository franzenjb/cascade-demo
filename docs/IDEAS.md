# Cascade Ideas Backlog

Running list of enhancements Dragon has raised during the build. Not a spec — a capture file. Add to the top as ideas arrive; move items to an "Implemented" section when they ship.

## Top of stack (next session)

- **Light/dark mode toggle.** Tailwind `darkMode: "class"` + theme toggle in header. Main surfaces (arc-cream/white backgrounds, arc-black/gray text) need dark pairs. ArcGIS basemap swap (`topo-vector` → `dark-gray-vector`). SVG icons (esp. medical = dark gray) need alt colors for dark bg. Rough effort: 1–2h initial pass, another hour polish.
- **Help modal on launch.** Uses Dragon's LinkedIn post + white paper language to explain the whole system. Trigger: "?" or "About" button in header, or auto-shown on first load (dismissible, remembers choice via localStorage). Content: needs Dragon's actual copy — he'll paste in from LinkedIn/white paper next session. Follow the same modal pattern as the new trigger-sim intro.
- **First real recording + inspection pass.** `DEMO_MODE=live` once, fire the sim, inspect `data/recorded_transcripts/tornado_buncombe_replay.json`. If pacing feels off, add a `DEMO_PACE_MULT` env.
- **Polish**. Sequenced dot reveals as Claude narrates. Pulse on the currently-mentioned entity. Smoother transitions when chips toggle. Bolded entity names in chat → click to select matching chip.

## Pending

### From 2026-04-19 chat (session 3)

- **Light/dark mode** (see Top of stack).
- **Help modal** using Dragon's own language from LinkedIn + white paper (see Top of stack).
- **Double-click a dot** to open drill-down scoped to that single feature, not just category.
- **Pulse / ring around highlighted picture marker** when it's the currently-featured one (currently only size change).
- **Dim-state visual.** Currently swaps to a small gray circle when another category is active. Consider a CIMSymbol with opacity for a more natural fade.

### From 2026-04-19 chat (session 2)

- **Print report** — let the user print the current briefing (chat narrative + map snapshot + metrics).
- **Copy-to-clipboard for text/email** — already shipped; keep polishing the output format.

## Known bugs to fix alongside

- Warning polygon alpha — fixed in session 2 (0.15 instead of 40).
- Feature dots — fixed in session 2.
- County outline is currently **not rendered** on the map. A client-side FeatureLayer against the boundary item caused an AGOL username/password sign-in modal (Dragon is OAuth/2FA only). Options to restore the outline: (a) fetch the boundary geometry server-side in an `/api/boundary` route using `AGOL_TOKEN`, pass GeoJSON to the client, draw as a Graphic; (b) implement a proper AGOL OAuth flow for the browser. Do **not** reintroduce a client-side FeatureLayer pointed at an AGOL item.
- Duplicate features accumulate in `DEMO_Cascade_Active_Warnings` on every trigger — the delete path in `/api/trigger/route.ts` now runs, but verify after a few trigger cycles.
- AGOL session token in `.env.local` expires in ~60 minutes. Long-term: IT service account with non-SSO credential.
- Webpack cache rename errors in `.next/cache/webpack/...` — harmless, but clearing `.next` removes the noise.

## Future / larger

- **Wildfire demo** (same map, same county). Perimeter + wind vector + current risk footprint + projected next-hour footprint + features inside projected footprint.
- Hurricane pre-landfall disaster type (semantic catalog already has the playbook stub).
- Migrate the 10 DEMO_Cascade_* layers to a separate AGOL dev org before any public launch.
- Mobile responsiveness below 1024px.
- Vercel deployment at `cascade.jbf.com`.
- AFN aggregate surface (43 transport-dependent) as a separate card or badge, without exposing individuals.

## Implemented

### 2026-04-19 (session 3)

- **Trigger button renamed + intro modal.** Button label is now "Simulating National Weather Service Tornado Alert" (sentence-case, no shout-styling). Click → modal overlay with the NWS framing copy ("This is what would occur if a National Weather Service Tornado Alert was actually issued. A web hook would trigger this application and produce the following:"). Continue fires the sim; Cancel or backdrop click dismisses. Relevant file: `components/TriggerButton.tsx`.
- **Row click in asset panel zooms to feature.** Each row is now a button. Click → `MapView.goTo({ target: Point, zoom: 15 })`. FeatureRow now carries geometry (`lib/types.ts`). Plumbed via `onSelect` in both AssetPanel and AllAssetsAccordion.
- **Chip-switch zoom is reliable per category.** Previous behavior stayed zoomed-out after Red Cross because `goTo(graphics[])` with tight single-point clusters didn't refit. Now: 1 feature → explicit zoom 14; N features → fit-to-extent with 60px padding.
- **Assets accordion on stream complete.** `ChatPanel` now fires `onStreamComplete` after the assistant message finalizes. `page.tsx` flips `rightTab` to "drill". Drill tab has two modes: `activeCategory === null` → new `AllAssetsAccordion` (all 4 categories as expandable sections, each with clickable rows); `activeCategory !== null` → single-category `AssetPanel`. Drill tab is visible once any counts > 0, with label/count switching between "Assets / total" and "{Category name} / count".
- **Home button on map.** Top-right overlay, black bordered "⌂ Home". Click → map refits to the warning polygon (scale 150k), activeCategory cleared, drill tab, accordion re-expanded. `MapView.tsx` handles fit; parent handler clears state via `onHome` callback.
- **Icon click highlights matching row.** Click an SVG icon on the map → `view.on("click")` + `hitTest` identifies the feature → `onIconClick({featureType, lon, lat})` → page sets activeCategory + highlights the row (red inset ring + pale red tint + scrollIntoView). Match is by lon/lat within 5e-7 tolerance.
- **Chip-off stays in drill tab.** Previously clicking the active chip returned to the Conversation tab; now stays in drill and falls back to the accordion view. Keeps the "always see your assets" mental model.

### 2026-04-19 (session 2)

- **Tabbed right panel** (Conversation | Drill-down). Solved "drill-down covers the map" + narrative/drill redundancy complaints.
- **Map labels scoped to active category.** Hidden by default, shown only for matching features when a chip is active.
- **Demo mode (record + replay)**. `DEMO_MODE` env: `replay` (default), `live`, `off`. See `lib/transcript.ts`.
- **Rich asset summary panel** (`components/AssetPanel.tsx`).
- **Better iconography**. Picture-marker icons from inline SVG data URIs, distinct silhouette + color per type.
- **Metrics strip** — pop / %65+ / %LEP / %disability.
- **Clickable category chips with counts**.
- **Print + Copy** buttons in chat panel header.
- **Polygon alpha fix** and **popupTemplate removed** from the warning polygon.
- **Feedback memory**: `feedback_agol_oauth_only.md` + `feedback_screenshot_via_subagent.md`.
