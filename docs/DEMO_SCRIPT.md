# Demo Script

The exact sequence to run when demonstrating Project Cascade to a partner.
Target runtime: 3–5 minutes. Rehearse at least twice before a live demo.

---

## Before you begin

- Browser window open to `cascade.jbf.com` (or your deployed URL)
- Second monitor with the white paper open at the Buncombe scene (§3.5)
- If presenting over video: screen-share on, mic clear
- One trusted colleague pre-notified (they can engage in comments afterward on the LinkedIn post)

---

## The Opening (0:00 – 0:30)

**Say:** *"I want to show you something I built. Two minutes. The white paper talks about an anticipatory mapping system. This is it, running against synthetic data for a fictional county I built called Cascade County."*

**Do:**
- Show the map at its starting state — you see Cascade County outlined, a scattering of labels, no warning yet
- Point at the county boundary, schools, Red Cross office markers
- *"All the data is fake. All the statistical patterns are real."*

---

## The Trigger (0:30 – 0:45)

**Say:** *"Now watch what happens when the National Weather Service issues a tornado warning."*

**Do:**
- Click **Fire the Tornado** button
- Let the warning polygon render on the map
- Stay quiet for 5–8 seconds while Claude generates the proactive briefing

**Expected narrative in the chat panel (paraphrased — it's generated live, wording varies):**

> Got it. NWS confirmed tornado warning, polygon active, expires in 30 minutes. I pulled the warning polygon and a 1-mile buffer.
>
> Inside that footprint: 2,847 residents, 18% over 65, 9% limited-English households, 4 mobile home parks with 312 units total, 1 elementary school, 1 assisted living facility.
>
> Map is up. Anything you want me to zoom on?

**Key point to emphasize:** *"I didn't type a thing. The system saw the warning fire, pulled the right layers, ran the right queries, and produced the briefing. This is the 'before you even ask' moment."*

---

## The First Follow-up (0:45 – 1:30)

**Say:** *"Let me ask it a follow-up the way a responder would."*

**Do:** Type in the chat panel:

> Show me the mobile home parks

**Expected response:** Claude highlights the 4 parks on the map, names each one, calls out Mountain View Estates (148 units) as the largest and directly on the path.

**Key point:** *"This is not a scripted response. It's real Claude, making real tool calls against a real AGOL Feature Service, returning real data."*

---

## The PII-Safety Moment (1:30 – 2:15)

**Say:** *"Now let me ask something privacy-sensitive."*

**Do:** Type:

> Who are the specific residents needing transport assistance in the warning zone?

**Expected response:** Claude declines to surface individual records, offers the aggregated count (43 transport-dependent residents), explains that role-restricted data requires authorization context.

**Key point:** *"The white paper talks about privacy-by-design for vulnerable populations. This is it. The AI cannot surface individual-level data without an authorization path. That's enforced at the tool-execution layer, not just the prompt layer."*

---

## The Resource Query (2:15 – 2:45)

**Say:** *"Last thing. Resources."*

**Do:** Type:

> Where are the nearest Red Cross resources?

**Expected response:** Claude identifies the 2 ERVs in Ridgeton (ETA 22 min), 1 in Hendersonville (ETA 34 min), the Charlotte warehouse (3.5-hour dispatch), and First Baptist Ridgeton as the nearest pre-identified shelter at 600m from Mountain View Estates.

**Key point:** *"Every number in this demo matches the scripted conversation on page 10 of the white paper. The paper wasn't fiction. It was a spec."*

---

## The Close (2:45 – 3:15)

**Say:** *"That's it. Strategic paper at jbf.com/before-you-even-ask. Demo at cascade.jbf.com. All the code is in a public GitHub repo. The paper talks about an anticipatory mapping partner for the non-GIS responder. This is what it actually looks like when it's working."*

**Optional:**
- Mention this is tornado-only — hurricane, wildfire, flood are next
- Mention the architecture is buildable entirely within the ArcGIS platform (§4.7 of the paper)
- Mention no upper limit on layers — extensibility is semantic-catalog-driven

---

## Troubleshooting Mid-Demo

**If Claude takes longer than 10 seconds to respond:**
Say: *"Claude's working. Real API calls against real data take real time."*

**If a response doesn't match expectations:**
Say: *"That's one of the things that's different about this — it's not a scripted demo. I can ask it anything and it'll do its best."* Then redirect to something you know works.

**If the trigger button doesn't work:**
Refresh the page and try again. If it still fails, narrate through the static screenshots in your deck.

---

## Recording the Demo Video

- Use OBS, ScreenFlow, or Loom
- Record at 1080p minimum
- Voice-over the same script above
- Keep total runtime under 3:30 for LinkedIn autoplay effectiveness
- Export MP4
- Optional: add intro/outro with the "Before You Even Ask" title card

Post the video as an attachment in the LinkedIn post's first comment, alongside the PDF.
