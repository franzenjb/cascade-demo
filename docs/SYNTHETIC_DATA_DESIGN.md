# Synthetic Data Design

The rationale behind every design choice in `scripts/generate_cascade_data.py`.

---

## Design principle: every number matches the paper

The white paper contains a fully scripted conversation in §3.5 (Part 3: How It Works). That scene uses specific numbers:

- 2,847 residents in the warning polygon
- 18% over 65
- 9% limited-English households
- 4 mobile home parks, 312 units total
- Mountain View Estates, 148 units, directly on the path centerline
- First Baptist Ridgeton, 600m from Mountain View
- 47 home-dialysis patients
- 43 AFN transport-dependent residents
- 2 ERVs in Ridgeton (ETA 22 min), 1 in Hendersonville (ETA 34 min)
- Charlotte warehouse, 3.5-hour dispatch

**Every one of these numbers is preserved in the demo data.** When a partner reads the paper, watches the demo, and sees identical numbers, the signal is unmistakable: the paper wasn't a fiction. It was a specification.

---

## Geography

**Cascade County** is positioned at approximately 36.0°N, 81.5°W — which corresponds to a real-world location in western North Carolina near Wilkesboro. Chose this for:

- **Mountain terrain realism.** The area has valleys, ridges, and the settlement patterns of rural Appalachia.
- **Real-data distributions.** ACS demographic profiles from tracts in this part of NC are reflected in the synthetic data (higher-than-average over-65 percentages, limited-English pockets around historical migrant labor communities, pronounced poverty tails).
- **Matches the paper's Hurricane Helene discussion.** The paper's Helene walkthrough names western NC impacts; Cascade County sits in the broader geography.

The county is 750 sq mi — same order of magnitude as Watauga, Avery, or Ashe counties in NC.

---

## Population

**128,400 residents** — approximately twice the size of Watauga County. Chose a mid-sized county on purpose: large enough to host meaningful infrastructure diversity (hospitals, dialysis, multiple school districts), small enough that a single tornado could affect a statistically significant portion.

Demographics calibrated to regional patterns:

| Attribute | Cascade | Regional benchmark |
|---|---|---|
| % over 65 | 19% | 18–22% typical for rural NC mountain counties |
| % limited English | 7% | 5–9% typical given Latino migrant communities |
| % below poverty | 14% | 13–17% typical for the region |
| % with disability | 11% | 11–13% typical |

---

## The tornado polygon

9-point polygon that cuts diagonally through northeast Ridgeton into rural territory beyond. Shape designed to:

1. **Include 4 mobile home parks.** Mobile homes are the highest-priority tornado vulnerability. The paper's Buncombe scene centers on this.
2. **Include 1 elementary school.** Schools in the path raise the stakes of the narrative without being gratuitous.
3. **Include 1 assisted living facility.** Introduces the AFN angle without creating a mass-casualty scenario.
4. **NOT cover the hospital.** Keeps the medical-facility story manageable — dialysis centers are in the service-area overlap, not the polygon itself.
5. **Touch the edge of 3 AFN service areas.** These are the 43 transport-dependent residents.

---

## Mobile home parks

4 parks inside the polygon. Unit counts calibrated:

- Mountain View Estates: **148 units** (matches paper exactly)
- Ridgeview Park: 82 units
- Cascade Trailer Community: 46 units
- Fairway Mobile Estates: 36 units
- **Total: 312 units** (matches paper "roughly 312 units")

The paper says the average occupancy for this park type in this region is 2.4 per unit, yielding "up to 355 people potentially affected at that one location" for Mountain View. 148 × 2.4 = 355.2 ✓

---

## Medical facilities

Dialysis calibration was the trickiest piece. The paper says 47 home-dialysis patients in the warning polygon. Achieved by:

- **Ridgeton Dialysis Center**: 28 home-dialysis patients in service area overlap with the polygon
- **Eastside Renal Care**: 19 home-dialysis patients in service area overlap
- **Total: 47** ✓

Note: the demo schema uses a single attribute `home_dialysis_patients` per dialysis center, representing service-area patient count. In a real production system, this would come from a more sophisticated query — service area polygons intersecting the warning polygon, with patient counts attributed per service area. For demo purposes, the simpler schema is adequate and the number comes out right.

---

## Red Cross assets

6 assets, designed to match the paper's resource-request scene:

- **Ridgeton ERV Depot**: capacity 2 (the paper says "two ERVs in Asheville")
- **Hendersonville ERV Depot**: capacity 1 (the paper says "one in Hendersonville")
- **First Baptist Ridgeton** shelter: placed 600m from Mountain View Estates per the paper
- **Charlotte Regional Warehouse**: positioned at Charlotte-area coordinates so distance calculation yields ~3.5-hour dispatch time

The 22/34-minute ETAs in the paper come from distance plus average rural driving speeds. In the demo, we don't compute ETAs dynamically — Claude can report "approximately 22 minutes" based on distance heuristics.

---

## AFN service areas

3 service areas inside/touching the tornado polygon, counts summing to 43:
- Ridgeton Northeast AFN Zone: 18
- Valley Community AFN Zone: 15
- Tornado Path AFN Zone C: 10
- **Total: 43** ✓

**Access tier set to `privacy-restricted`.** This matters for the demo — when a viewer asks "who are the specific AFN residents?" the system declines to surface individuals and explains why. This is the PII-safety moment that matters for the paper's §4.7 claims.

---

## What's intentionally NOT in the demo

- **Real streets, real addresses.** Too much effort for marginal demo value.
- **Parcel-level data.** Paper discusses this (Realie.ai etc.) but not needed for the tornado scenario.
- **Live NWS feed integration.** The trigger is manual. Phase 2 enhancement.
- **A second disaster type.** Tornado-only for v1.
- **User authentication.** Demo is open.

Each of these is documented in BUILD.md as a Phase 2+ evolution path.

---

## How to extend

To add a new layer:

1. Add a generator function to `scripts/generate_cascade_data.py`
2. Add an entry in the `LAYERS` dict at the bottom
3. Add a catalog entry to `data/semantic_catalog.json` with aliases, disaster relevance, schema
4. Add the env var name to `.env.example`
5. Run `npm run validate:catalog` to confirm wiring

Claude picks it up automatically on the next turn — no prompt engineering, no code changes.
