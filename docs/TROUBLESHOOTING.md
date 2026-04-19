# Troubleshooting

Common issues encountered while building and running Project Cascade.

---

## Setup issues

### `npm install` fails

**Symptom:** Peer dependency warnings or errors during install.

**Fix:** Node version matters. Check with `node --version` — must be 20 or higher.
```bash
# If using nvm:
nvm install 20
nvm use 20
npm install
```

### `npm run dev` starts but page is blank

**Symptom:** Dev server says "Ready on localhost:3000" but the page is white.

**Causes:**
1. ArcGIS SDK failing to load — check browser console for network errors
2. Missing env vars — check `.env.local` exists and has at minimum `ANTHROPIC_API_KEY`
3. TypeScript error — check terminal output for red errors

**Fix:** Browser DevTools → Console usually tells you exactly what's wrong.

### ArcGIS Maps SDK errors about CSS

**Symptom:** `@arcgis/core/assets/esri/themes/light/main.css` not found

**Fix:** Next.js needs the ArcGIS CSS imported somewhere. Add to `app/globals.css`:
```css
@import url('https://js.arcgis.com/4.30/@arcgis/core/assets/esri/themes/light/main.css');
```

---

## AGOL issues

### "Service URL not configured for DEMO_Cascade_..."

**Symptom:** Tool calls return this error.

**Fix:** You haven't pasted the service URL into `.env.local` for that layer. Run `npm run validate:catalog` to see all missing URLs.

### "401 Unauthorized" when querying layer

**Symptom:** AGOL query returns 401 even though the layer should be public.

**Fix:** Verify in AGOL that the item is actually shared as "Everyone (public)" — NOT just "Organization." Test by opening the service URL + `?f=json` in an incognito browser window.

### "Invalid parameters" error from AGOL

**Symptom:** Query returns `{"error": {"code": 400, "message": "Invalid parameters"}}`

**Causes:**
1. Geometry format wrong — check that polygon has closed ring (first point = last point)
2. Spatial reference mismatch — ensure `inSR: 4326` and `outSR: 4326` match

### `applyEdits` fails with "Requires token"

**Symptom:** The trigger endpoint can't write to the active warnings layer.

**Fix:** `applyEdits` requires auth even on public layers. Ensure `AGOL_USERNAME` and `AGOL_PASSWORD` are set, OR use `AGOL_TOKEN` instead. The `lib/agol.ts` token-manager handles this automatically.

---

## Claude / LLM issues

### Claude keeps fabricating numbers

**Symptom:** Response includes "approximately 3,000 residents" without a prior tool call.

**Fixes (in order):**
1. Strengthen rule #1 in `data/system_prompt.md` with more explicit language
2. Add examples of violations
3. Lower temperature — add `temperature: 0.3` to `client.messages.stream({...})` in `lib/claude.ts`
4. If still happening, the model may not be matching the latest version. Verify `CLAUDE_MODEL` env var is correct.

### Claude responds but no map updates

**Symptom:** Chat panel shows a response but the map graphics don't change.

**Causes:**
1. Claude didn't call `draw_on_map` — check terminal logs for tool calls
2. MapInstruction received but geometry malformed — check browser console
3. GraphicsLayer not initialized — page may have loaded before ArcGIS SDK finished

**Fix:** Open DevTools → Network → filter by "chat" → expand the SSE stream to see what events Claude emitted.

### Claude's responses are very slow (>30s)

**Symptom:** Every response takes half a minute.

**Causes:**
1. No prompt caching — verify `cache_control` markers in `lib/prompts.ts` are actually being sent
2. Too many tool iterations — check the tool call loop isn't bouncing
3. AGOL queries are slow — check network tab

**Fix:** First-ever request is always slower (cache populates). Second and subsequent should be fast. If sustained, check Anthropic status page.

### 529 (Overloaded) from Anthropic

**Symptom:** `Error: 529 Overloaded` in console.

**Fix:** Anthropic is experiencing high load. Add retry logic with exponential backoff to `lib/claude.ts`. For demo day, have a backup screen recording ready.

---

## Prompt issues

### Claude asks too many clarifying questions

**Symptom:** Every prompt triggers "Could you clarify..." instead of acting.

**Fix:** The "When to Ask vs. When to Act" section of `data/system_prompt.md` needs reinforcement. Add specific examples of prompts Claude should just act on.

### Claude surfaces PII when it shouldn't

**Symptom:** Claude lists individual residents by name/address from the AFN layer.

**Fix:** This should be blocked at the tool layer (see `executeGetFeatures` in `lib/tools.ts` — role-restricted and privacy-restricted layers return an error). Verify that check is still in place. Double-check the catalog entry for `DEMO_Cascade_AFN_Service_Areas` has `access_tier: "privacy-restricted"`.

### Buncombe scene output doesn't match paper

**Symptom:** Numbers are slightly off from the 2,847 / 18% / 9% / 148 / 47 / 43 set.

**Causes:**
1. Synthetic data not regenerated — re-run `python scripts/generate_cascade_data.py` and re-publish
2. Claude aggregated differently — this is acceptable variance for a real LLM; the paper's numbers are the target, not a hard constraint

**Fix:** Verify the raw data first:
```bash
cd scripts
python3 -c "
import json
t = json.load(open('output/DEMO_Cascade_Census_Tracts.geojson'))['features'][:4]
print('Tornado pop:', sum(f['properties']['pop'] for f in t))
"
```

---

## Deploy issues

### Vercel deploy fails with "Module not found: Can't resolve 'fs'"

**Symptom:** Build error, can't use Node APIs in Edge Functions.

**Fix:** API routes using `fs` (like `lib/prompts.ts` reading `system_prompt.md`) need `export const runtime = "nodejs"`. Check `/api/chat/route.ts` has this at the top.

### Production deploys but `/api/chat` returns 500

**Symptom:** Everything works locally, breaks in production.

**Common cause:** Missing env vars in Vercel.

**Fix:** Vercel dashboard → Settings → Environment Variables → add every var from `.env.example` to Production environment.

### Custom domain doesn't resolve

**Symptom:** `cascade.jbf.com` returns DNS error.

**Fix:** Vercel dashboard → Domains → add `cascade.jbf.com`. Vercel will show required DNS records. Add a CNAME in your DNS provider pointing to `cname.vercel-dns.com`. Wait 5–15 minutes for propagation.

---

## Demo-day issues

### Demo URL returns 404

**Fix:** Deploy may have failed overnight. Check Vercel dashboard → Deployments → latest status. Redeploy from GitHub.

### Trigger button does nothing

**Fix:** Check `/api/trigger` endpoint directly (curl or Postman). Most likely AGOL auth issue — verify `AGOL_USERNAME` / `AGOL_PASSWORD` set in production env vars.

### A partner tries to demo it themselves and breaks it

**Fix:** For public launches, consider hiding the trigger button behind a URL parameter:

```env
NEXT_PUBLIC_SHOW_TRIGGER_BUTTON=false
```

Then demo operators use `cascade.jbf.com/?demo=1` to show the button via a URL-parameter check in `TriggerButton.tsx`.

---

## When you're truly stuck

1. **Open GitHub issue** with error message + steps to reproduce
2. **Check Anthropic community** — docs.claude.com/en/docs/build-with-claude
3. **Check Esri community** for AGOL-specific issues — community.esri.com
4. **Vercel support** for deploy/env issues

Don't panic. The system is well-tested in its architecture. Most issues are configuration, not fundamental bugs.
