# Launch Checklist

Before going public with Project Cascade. Do not skip steps.

---

## 1. Data layer

- [ ] All 10 `DEMO_Cascade_*` layers published to AGOL
- [ ] Each layer named with exact ID from `data/semantic_catalog.json`
- [ ] Each layer shared as public-read (for demo purposes)
- [ ] Each layer tagged with `demo`, `synthetic`, `cascade-county`
- [ ] Each layer description starts with **"SYNTHETIC DEMONSTRATION DATA — NOT FOR OPERATIONAL USE"** in caps
- [ ] Dedicated AGOL folder named `DEMO_Cascade` containing all 10 items
- [ ] Service URLs pasted into `.env.local`
- [ ] `npm run validate:catalog` passes for all 10 layers

## 2. Buncombe numbers verification

Query each layer manually via its REST endpoint and confirm:

- [ ] Census tracts: 4 tracts inside tornado polygon, populations sum to 2,847
- [ ] Mobile home parks: 4 inside tornado, unit counts sum to 312
- [ ] Mountain View Estates: 148 units
- [ ] Medical facilities: dialysis centers sum to 47 home-dialysis patients in service area
- [ ] Red Cross assets: 2 ERVs at Ridgeton depot, 1 at Hendersonville
- [ ] AFN service areas: 3 inside/touching tornado, counts sum to 43

## 3. Functional testing

- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Map loads and displays Cascade County boundary
- [ ] Clicking "Fire the Tornado" produces a proactive briefing within 10 seconds
- [ ] Briefing includes: 2,847 residents, 18% over 65, 9% LEP, 4 mobile home parks, Mountain View Estates
- [ ] Follow-up: "Show me mobile home parks" — map highlights 4 points
- [ ] Follow-up: "Who are the specific AFN residents?" — system declines, explains access tier
- [ ] Follow-up: "Where are the nearest Red Cross resources?" — names ERVs, warehouse
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs

## 4. Design polish

- [ ] Dragon design tokens applied throughout (cream bg, red accents, three fonts)
- [ ] Red Cross mark visible in header
- [ ] Red rule accent below section headings
- [ ] No emoji except the trigger button's flame (optional)
- [ ] Mobile responsive — test on actual phone, not just resized browser window
- [ ] Loading states present (streaming dots, "thinking..." indicator)
- [ ] Empty state clear (before any interaction)
- [ ] Error states graceful

## 5. Security

- [ ] `.env.local` NOT committed to git
- [ ] `.gitignore` includes `.env*` patterns
- [ ] `ANTHROPIC_API_KEY` set only in Vercel env vars, not in code
- [ ] `AGOL_USERNAME` / `AGOL_PASSWORD` set only in Vercel env vars
- [ ] All API routes confirmed server-side only (no keys leaking to browser bundle)
- [ ] AGOL layers are public-read, not public-edit
- [ ] Check browser DevTools → Sources: no `sk-ant-...` strings visible

## 6. Deployment

- [ ] GitHub repo public or private per your preference
- [ ] Vercel project linked, main branch deploys
- [ ] Production URL works: `cascade.jbf.com` serves the demo
- [ ] HTTPS certificate valid (green padlock)
- [ ] Custom domain DNS resolves (`dig cascade.jbf.com` returns Vercel's IPs)
- [ ] Production deploy tested end-to-end (not just dev)

## 7. Adversarial testing

Have one trusted person try to break the demo. Common attacks:

- [ ] Ask about disasters not in the catalog (wildfire, earthquake) — should gracefully decline
- [ ] Ask for specific individual PII — should refuse
- [ ] Ask about counties other than Cascade — should clarify it's demo-only
- [ ] Try to trick the system into claiming it's real data — should stay honest
- [ ] Rapid-fire questions — should remain coherent across multiple turns
- [ ] Empty prompt / whitespace only — should handle gracefully
- [ ] Extremely long prompt (5000+ chars) — should handle within token limits

## 8. Content

- [ ] 3-minute demo video recorded (screen recording + voiceover)
- [ ] Video uploaded to LinkedIn as native video OR to YouTube as unlisted
- [ ] LinkedIn post copy finalized (already in master markdown)
- [ ] Post mentions: live demo URL, paper URL, GitHub repo URL
- [ ] PDF attached as first comment on LinkedIn post
- [ ] jbf.com/before-you-even-ask serves the paper HTML

## 9. Timing

- [ ] Post scheduled for Tuesday 10 AM Eastern
- [ ] Calendar block at 10 AM Eastern to respond to comments in first 90 min
- [ ] 2–3 close colleagues pre-notified to engage authentically in the first hour
- [ ] No conflicting commitments that day

## 10. Post-launch

Within 24 hours of posting:

- [ ] Check Vercel logs for any errors from real users
- [ ] Check Anthropic API usage dashboard — no unexpected cost spike
- [ ] Respond to all LinkedIn comments
- [ ] Reply to any DMs or emails
- [ ] Track: impressions, reactions, comments, DMs, jbf.com page views, demo URL sessions

Within 1 week:

- [ ] Review demo session recordings (if you added analytics)
- [ ] Document any unexpected user behavior
- [ ] Add top 3 requested features to a Phase 2 list

---

## If things go wrong mid-launch

- **API cost spike:** Check Anthropic dashboard. If you see abuse, add rate limiting to `/api/chat` (simple IP-based).
- **AGOL service throttled:** arc-nhq-gis may have limits. Cache common queries client-side.
- **Demo URL down:** Vercel should auto-restart. If persistent, check GitHub Actions for failed deploy.
- **Something reveals real data:** Take the demo offline immediately. This is the nuclear scenario we designed against but stay vigilant.

---

## Sign-off

- [ ] Dragon has personally run through the full Demo Script
- [ ] Dragon has personally viewed the deployed URL on a phone
- [ ] Dragon has confirmed the LinkedIn post copy reads right
- [ ] Dragon approves launch

**Date:** ______________  **Signed:** ______________
