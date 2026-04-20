/**
 * Fire Scenario Synthetic Data Generator — Shasta County, CA
 * ===========================================================
 *
 * Sibling of generate_cascade_data.py, but for the new Shasta wildfire scenario.
 * Outputs six GeoJSON files representing real Shasta County assets with
 * synthetic numeric fields. Geography and facility names are anchored to real
 * places (Redding, Anderson, Shasta Lake, Burney, Cottonwood, etc.) so the
 * demo reads as plausible without claiming authoritative counts.
 *
 * Fire perimeter sits ~8km west of Redding in the Whiskeytown / Carr Fire area.
 *
 * Usage:
 *   npx ts-node scripts/generate_fire_scenario_data.ts
 *
 * Output:
 *   scripts/output/fire/
 *     fire_census_tracts.geojson      (~30 tracts, 4 inside fire perimeter)
 *     fire_stations.geojson           (22 stations: RFD / Anderson / Shasta Co / CAL FIRE)
 *     police_stations.geojson         (8 agencies: PDs + Sheriff substations + CHP)
 *     hospitals.geojson               (5 hospitals)
 *     dialysis_clinics.geojson        (4 clinics — home-dialysis patients = 40 county-wide)
 *     red_cross_shelters.geojson      (7 shelters, mix of open/standby)
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "scripts/output/fire");

// ─── Deterministic PRNG ─────────────────────────────────────
let seed = 20260419;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function rint(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}
function runif(lo: number, hi: number): number {
  return rand() * (hi - lo) + lo;
}
function choice<T>(arr: T[]): T {
  return arr[rint(0, arr.length - 1)];
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ─── Shasta County bounds (real) ────────────────────────────
const BOUNDS = { west: -123.00, east: -121.45, south: 40.40, north: 41.15 };

// ─── Fire perimeter — clipped from real 2018 Carr Fire (NIFC GeoMAC) ────────
// 95 vertices, simplified from 11,434-vertex NIFC perimeter via Douglas-Peucker.
// Covers ~20km span west of Redding, real jagged boundary on east/north/south.
// Bbox: [-122.66, 40.56] to [-122.45, 40.75].
const FIRE_PERIMETER: [number, number][] = [
  [-122.45, 40.75],
  [-122.45, 40.73882],
  [-122.45578, 40.73852],
  [-122.46275, 40.74169],
  [-122.45925, 40.73805],
  [-122.45124, 40.73625],
  [-122.45111, 40.73323],
  [-122.45471, 40.73483],
  [-122.47847, 40.72878],
  [-122.48871, 40.72281],
  [-122.49015, 40.71689],
  [-122.49759, 40.71341],
  [-122.53319, 40.72332],
  [-122.53638, 40.72817],
  [-122.53397, 40.73076],
  [-122.53753, 40.73338],
  [-122.5396, 40.7296],
  [-122.53557, 40.72316],
  [-122.53927, 40.7213],
  [-122.53856, 40.71872],
  [-122.54226, 40.71904],
  [-122.54028, 40.71629],
  [-122.54305, 40.71382],
  [-122.54059, 40.7126],
  [-122.53846, 40.71592],
  [-122.54011, 40.71313],
  [-122.53788, 40.71127],
  [-122.53369, 40.71332],
  [-122.52597, 40.70649],
  [-122.52952, 40.70598],
  [-122.52915, 40.7032],
  [-122.51853, 40.70299],
  [-122.52071, 40.69669],
  [-122.51784, 40.69403],
  [-122.51273, 40.69416],
  [-122.50912, 40.69123],
  [-122.5081, 40.69342],
  [-122.50136, 40.69284],
  [-122.49987, 40.68773],
  [-122.49715, 40.68857],
  [-122.50125, 40.68664],
  [-122.49823, 40.68571],
  [-122.49611, 40.67919],
  [-122.49244, 40.68613],
  [-122.49611, 40.68756],
  [-122.49549, 40.68979],
  [-122.49154, 40.69107],
  [-122.49038, 40.68811],
  [-122.48777, 40.6883],
  [-122.48778, 40.68412],
  [-122.48368, 40.68244],
  [-122.48665, 40.68496],
  [-122.48479, 40.68538],
  [-122.48651, 40.68972],
  [-122.48462, 40.69234],
  [-122.47867, 40.69497],
  [-122.47801, 40.69247],
  [-122.47562, 40.69312],
  [-122.47711, 40.69151],
  [-122.47356, 40.69046],
  [-122.47233, 40.6882],
  [-122.4765, 40.68605],
  [-122.46975, 40.6841],
  [-122.47072, 40.68291],
  [-122.47912, 40.68707],
  [-122.48301, 40.68607],
  [-122.47594, 40.68301],
  [-122.47842, 40.68216],
  [-122.47458, 40.67844],
  [-122.47097, 40.67783],
  [-122.47666, 40.67593],
  [-122.48003, 40.66935],
  [-122.47793, 40.66592],
  [-122.48171, 40.66458],
  [-122.47451, 40.66058],
  [-122.47563, 40.65677],
  [-122.4727, 40.65709],
  [-122.47446, 40.65894],
  [-122.47052, 40.65837],
  [-122.46988, 40.65618],
  [-122.47269, 40.65422],
  [-122.46861, 40.65405],
  [-122.46168, 40.64715],
  [-122.46002, 40.64876],
  [-122.45622, 40.63911],
  [-122.45729, 40.63461],
  [-122.45206, 40.63136],
  [-122.46602, 40.629],
  [-122.45498, 40.62952],
  [-122.4548, 40.62541],
  [-122.45, 40.62209],
  [-122.45, 40.56],
  [-122.66, 40.56],
  [-122.66, 40.75],
  [-122.45, 40.75],
];

function pointInPolygon(pt: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function squareAround(cx: number, cy: number, size = 0.015): [number, number][] {
  return [
    [cx - size, cy - size],
    [cx + size, cy - size],
    [cx + size, cy + size],
    [cx - size, cy + size],
    [cx - size, cy - size],
  ];
}

// ─── Types ──────────────────────────────────────────────────
type Feature = {
  type: "Feature";
  geometry:
    | { type: "Point"; coordinates: [number, number] }
    | { type: "Polygon"; coordinates: [number, number][][] };
  properties: Record<string, unknown>;
};
type FC = { type: "FeatureCollection"; features: Feature[] };

function fc(features: Feature[]): FC {
  return { type: "FeatureCollection", features };
}
function point(coords: [number, number], props: Record<string, unknown>): Feature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coords },
    properties: props,
  };
}
function polygon(
  rings: [number, number][][],
  props: Record<string, unknown>
): Feature {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: rings },
    properties: props,
  };
}

// ─── Generators ─────────────────────────────────────────────

function censusTracts(): FC {
  const features: Feature[] = [];

  // 4 tracts inside fire perimeter — calibrated to 3,257 residents total
  // Elevated vulnerability: rural, older, higher disability, modest poverty
  const fireTracts: Array<{
    pop: number;
    over65: number;
    lep: number;
    disab: number;
    pov: number;
    cx: number;
    cy: number;
  }> = [
    { pop: 1080, over65: 0.28, lep: 0.04, disab: 0.16, pov: 0.19, cx: -122.610, cy: 40.665 },
    { pop: 945,  over65: 0.31, lep: 0.03, disab: 0.18, pov: 0.22, cx: -122.590, cy: 40.650 },
    { pop: 720,  over65: 0.24, lep: 0.05, disab: 0.14, pov: 0.17, cx: -122.595, cy: 40.635 },
    { pop: 512,  over65: 0.33, lep: 0.03, disab: 0.20, pov: 0.25, cx: -122.575, cy: 40.655 },
  ];
  fireTracts.forEach((t, i) => {
    features.push(
      polygon([squareAround(t.cx, t.cy, 0.010)], {
        tract_id: `SHASTA-${String(i + 1).padStart(3, "0")}`,
        pop: t.pop,
        pct_over_65: t.over65,
        pct_under_18: 0.19,
        pct_lep: t.lep,
        pct_poverty: t.pov,
        pct_disability: t.disab,
        median_income: rint(42000, 58000),
        crci_score: round3(t.over65 * 0.55 + t.pov * 0.3 + t.disab * 0.15),
        crci_top_drivers: "over 65, disability, rural isolation",
      })
    );
  });

  // 26 more tracts spread across Shasta County, outside the fire perimeter
  let placed = 0;
  while (placed < 26) {
    const cx = runif(BOUNDS.west + 0.05, BOUNDS.east - 0.05);
    const cy = runif(BOUNDS.south + 0.05, BOUNDS.north - 0.05);
    if (pointInPolygon([cx, cy], FIRE_PERIMETER)) continue;
    const pop = rint(600, 6400);
    const over65 = round3(runif(0.16, 0.28));
    const pov = round3(runif(0.10, 0.22));
    const disab = round3(runif(0.09, 0.16));
    features.push(
      polygon([squareAround(cx, cy, 0.015)], {
        tract_id: `SHASTA-${String(100 + placed).padStart(3, "0")}`,
        pop,
        pct_over_65: over65,
        pct_under_18: round3(runif(0.18, 0.26)),
        pct_lep: round3(runif(0.02, 0.06)),
        pct_poverty: pov,
        pct_disability: disab,
        median_income: rint(38000, 72000),
        crci_score: round3(over65 * 0.55 + pov * 0.3 + disab * 0.15),
        crci_top_drivers: choice([
          "poverty, rural isolation, no vehicle",
          "over 65, low income",
          "disability, single-parent households",
          "poverty, limited English",
        ]),
      })
    );
    placed++;
  }
  return fc(features);
}

function fireStations(): FC {
  const stations: Array<{
    name: string;
    agency: string;
    number: number;
    type: "engine" | "truck" | "rescue";
    staffing: number;
    address: string;
    cx: number;
    cy: number;
  }> = [
    // City of Redding Fire Department
    { name: "Redding FD Station 1", agency: "Redding Fire Department", number: 1, type: "truck", staffing: 5, address: "741 Cypress Ave, Redding", cx: -122.372, cy: 40.579 },
    { name: "Redding FD Station 2", agency: "Redding Fire Department", number: 2, type: "engine", staffing: 4, address: "2925 Freebridge St, Redding", cx: -122.348, cy: 40.587 },
    { name: "Redding FD Station 3", agency: "Redding Fire Department", number: 3, type: "engine", staffing: 4, address: "2755 Shasta View Dr, Redding", cx: -122.349, cy: 40.598 },
    { name: "Redding FD Station 4", agency: "Redding Fire Department", number: 4, type: "engine", staffing: 4, address: "2220 Hilltop Dr, Redding", cx: -122.353, cy: 40.590 },
    { name: "Redding FD Station 5", agency: "Redding Fire Department", number: 5, type: "rescue", staffing: 3, address: "3305 Placer St, Redding", cx: -122.394, cy: 40.576 },
    { name: "Redding FD Station 6", agency: "Redding Fire Department", number: 6, type: "engine", staffing: 4, address: "5225 Westside Rd, Redding", cx: -122.462, cy: 40.540 },
    { name: "Redding FD Station 7", agency: "Redding Fire Department", number: 7, type: "engine", staffing: 4, address: "8725 Airport Rd, Redding", cx: -122.292, cy: 40.506 },
    { name: "Redding FD Station 8", agency: "Redding Fire Department", number: 8, type: "engine", staffing: 4, address: "4500 Old Alturas Rd, Redding", cx: -122.327, cy: 40.625 },
    // Anderson Fire Protection District
    { name: "Anderson FPD Station 1", agency: "Anderson Fire Protection District", number: 1, type: "engine", staffing: 3, address: "1925 Howard St, Anderson", cx: -122.296, cy: 40.448 },
    { name: "Anderson FPD Station 2 (Palo Cedro)", agency: "Anderson Fire Protection District", number: 2, type: "engine", staffing: 3, address: "22335 Deschutes Rd, Palo Cedro", cx: -122.231, cy: 40.554 },
    // Shasta County Fire Department (CAL FIRE contract)
    { name: "Shasta County FD Station 11 (Shasta Lake)", agency: "Shasta County Fire Department", number: 11, type: "engine", staffing: 3, address: "4431 Shasta Dam Blvd, Shasta Lake", cx: -122.380, cy: 40.680 },
    { name: "Shasta County FD Station 22 (Shingletown)", agency: "Shasta County Fire Department", number: 22, type: "engine", staffing: 3, address: "31440 Alpine Meadows Ln, Shingletown", cx: -121.902, cy: 40.492 },
    { name: "Shasta County FD Station 45 (Burney)", agency: "Shasta County Fire Department", number: 45, type: "engine", staffing: 3, address: "20481 Commerce Way, Burney", cx: -121.656, cy: 40.884 },
    { name: "Shasta County FD Station 33 (Cottonwood)", agency: "Shasta County Fire Department", number: 33, type: "engine", staffing: 3, address: "20868 West 1st St, Cottonwood", cx: -122.280, cy: 40.384 },
    // CAL FIRE Shasta-Trinity Unit
    { name: "CAL FIRE Shasta-Trinity Unit HQ", agency: "CAL FIRE — Shasta-Trinity Unit", number: 1, type: "truck", staffing: 6, address: "875 Cypress Ave, Redding", cx: -122.374, cy: 40.581 },
    { name: "CAL FIRE Whiskeytown Station", agency: "CAL FIRE — Shasta-Trinity Unit", number: 2, type: "engine", staffing: 4, address: "13300 Trinity Mountain Rd, French Gulch", cx: -122.641, cy: 40.695 },
    { name: "CAL FIRE Platina Station", agency: "CAL FIRE — Shasta-Trinity Unit", number: 3, type: "engine", staffing: 3, address: "28240 Platina Rd, Platina", cx: -122.885, cy: 40.371 },
    { name: "CAL FIRE Oak Run Station", agency: "CAL FIRE — Shasta-Trinity Unit", number: 4, type: "engine", staffing: 3, address: "15875 Oak Run Rd, Oak Run", cx: -122.023, cy: 40.699 },
    { name: "CAL FIRE Hat Creek Station", agency: "CAL FIRE — Shasta-Trinity Unit", number: 5, type: "engine", staffing: 3, address: "37575 Doty Rd, Hat Creek", cx: -121.466, cy: 40.801 },
    // Volunteer / rural FPDs
    { name: "Happy Valley FPD", agency: "Happy Valley Fire Protection District", number: 1, type: "engine", staffing: 2, address: "8716 Happy Valley Rd, Olinda", cx: -122.455, cy: 40.465 },
    { name: "Millville Volunteer FD", agency: "Millville Volunteer Fire Department", number: 1, type: "engine", staffing: 2, address: "29170 State Hwy 44, Millville", cx: -122.164, cy: 40.555 },
    { name: "Whitmore Volunteer FD", agency: "Whitmore Volunteer Fire Department", number: 1, type: "engine", staffing: 2, address: "31515 Whitmore Rd, Whitmore", cx: -121.905, cy: 40.625 },
  ];
  return fc(
    stations.map((s, i) =>
      point([s.cx, s.cy], {
        station_id: `FS-${String(i + 1).padStart(3, "0")}`,
        name: s.name,
        agency: s.agency,
        station_number: s.number,
        type: s.type,
        staffing: s.staffing,
        address: s.address,
        in_fire_perimeter: pointInPolygon([s.cx, s.cy], FIRE_PERIMETER),
      })
    )
  );
}

function policeStations(): FC {
  const stations: Array<{
    name: string;
    agency: string;
    jurisdiction: string;
    staffing: number;
    address: string;
    cx: number;
    cy: number;
  }> = [
    { name: "Redding Police Department (HQ)", agency: "Redding Police Department", jurisdiction: "City of Redding", staffing: 105, address: "1313 California St, Redding", cx: -122.391, cy: 40.588 },
    { name: "Anderson Police Department", agency: "Anderson Police Department", jurisdiction: "City of Anderson", staffing: 24, address: "2220 North St, Anderson", cx: -122.295, cy: 40.450 },
    { name: "Shasta Lake Police Services", agency: "Shasta County Sheriff — Shasta Lake substation", jurisdiction: "City of Shasta Lake", staffing: 12, address: "4488 Red Bluff St, Shasta Lake", cx: -122.379, cy: 40.679 },
    { name: "Shasta County Sheriff's Office (HQ)", agency: "Shasta County Sheriff's Office", jurisdiction: "Shasta County unincorporated", staffing: 180, address: "300 Park Marina Cir, Redding", cx: -122.380, cy: 40.582 },
    { name: "Sheriff Substation — Burney", agency: "Shasta County Sheriff's Office", jurisdiction: "East Shasta County", staffing: 8, address: "20509 Commerce Way, Burney", cx: -121.656, cy: 40.884 },
    { name: "Sheriff Substation — Shingletown", agency: "Shasta County Sheriff's Office", jurisdiction: "SE Shasta County", staffing: 4, address: "31440 Alpine Meadows Ln, Shingletown", cx: -121.902, cy: 40.492 },
    { name: "Sheriff Substation — Cottonwood", agency: "Shasta County Sheriff's Office", jurisdiction: "South Shasta County", staffing: 6, address: "3231 Main St, Cottonwood", cx: -122.281, cy: 40.382 },
    { name: "CHP Redding Area Office", agency: "California Highway Patrol", jurisdiction: "Shasta / Trinity highways", staffing: 42, address: "5095 Caterpillar Rd, Redding", cx: -122.369, cy: 40.529 },
  ];
  return fc(
    stations.map((s, i) =>
      point([s.cx, s.cy], {
        agency_id: `PD-${String(i + 1).padStart(3, "0")}`,
        name: s.name,
        agency: s.agency,
        jurisdiction: s.jurisdiction,
        staffing: s.staffing,
        address: s.address,
        in_fire_perimeter: pointInPolygon([s.cx, s.cy], FIRE_PERIMETER),
      })
    )
  );
}

function hospitals(): FC {
  const list: Array<{
    name: string;
    beds: number;
    trauma_level: "trauma_I" | "trauma_II" | "none";
    has_er_24h: boolean;
    address: string;
    cx: number;
    cy: number;
  }> = [
    { name: "Mercy Medical Center Redding", beds: 267, trauma_level: "trauma_II", has_er_24h: true, address: "2175 Rosaline Ave, Redding", cx: -122.370, cy: 40.568 },
    { name: "Shasta Regional Medical Center", beds: 226, trauma_level: "none", has_er_24h: true, address: "1100 Butte St, Redding", cx: -122.385, cy: 40.584 },
    { name: "Patients' Hospital of Redding", beds: 56, trauma_level: "none", has_er_24h: false, address: "2800 Eureka Way, Redding", cx: -122.408, cy: 40.589 },
    { name: "Mayers Memorial Hospital (Fall River Mills)", beds: 98, trauma_level: "none", has_er_24h: true, address: "43563 Hwy 299E, Fall River Mills", cx: -121.438, cy: 41.004 },
    { name: "Mayers Memorial — Burney Campus", beds: 24, trauma_level: "none", has_er_24h: false, address: "37143 Main St, Burney", cx: -121.664, cy: 40.883 },
  ];
  return fc(
    list.map((h, i) =>
      point([h.cx, h.cy], {
        facility_id: `HOSP-${String(i + 1).padStart(3, "0")}`,
        name: h.name,
        bed_count: h.beds,
        trauma_level: h.trauma_level,
        has_er_24h: h.has_er_24h,
        address: h.address,
        in_fire_perimeter: pointInPolygon([h.cx, h.cy], FIRE_PERIMETER),
      })
    )
  );
}

function dialysisClinics(): FC {
  // Total home-dialysis patients countywide = 40
  const list: Array<{
    name: string;
    chairs: number;
    home_patients: number;
    address: string;
    cx: number;
    cy: number;
  }> = [
    { name: "DaVita Redding Dialysis", chairs: 24, home_patients: 14, address: "1445 Liberty St, Redding", cx: -122.396, cy: 40.586 },
    { name: "Fresenius Kidney Care Redding", chairs: 18, home_patients: 9, address: "1220 Hartnell Ave, Redding", cx: -122.359, cy: 40.579 },
    { name: "U.S. Renal Care — Redding", chairs: 20, home_patients: 11, address: "2626 Edith Ave, Redding", cx: -122.385, cy: 40.573 },
    { name: "DaVita Anderson Dialysis", chairs: 14, home_patients: 6, address: "2745 Chestnut St, Anderson", cx: -122.295, cy: 40.444 },
  ];
  return fc(
    list.map((d, i) =>
      point([d.cx, d.cy], {
        facility_id: `DIAL-${String(i + 1).padStart(3, "0")}`,
        name: d.name,
        chairs: d.chairs,
        home_dialysis_patients: d.home_patients,
        address: d.address,
        in_fire_perimeter: pointInPolygon([d.cx, d.cy], FIRE_PERIMETER),
      })
    )
  );
}

function redCrossShelters(): FC {
  const list: Array<{
    name: string;
    facility_type: "school" | "church" | "rec_center";
    capacity: number;
    status: "open" | "standby";
    address: string;
    cx: number;
    cy: number;
  }> = [
    { name: "Shasta College Gymnasium", facility_type: "school", capacity: 420, status: "open", address: "11555 Old Oregon Trail, Redding", cx: -122.308, cy: 40.643 },
    { name: "Foothill High School", facility_type: "school", capacity: 350, status: "open", address: "9733 Deschutes Rd, Palo Cedro", cx: -122.228, cy: 40.549 },
    { name: "Anderson High School", facility_type: "school", capacity: 280, status: "standby", address: "1471 Ferry St, Anderson", cx: -122.297, cy: 40.453 },
    { name: "Redding Civic Auditorium", facility_type: "rec_center", capacity: 520, status: "open", address: "700 Auditorium Dr, Redding", cx: -122.376, cy: 40.584 },
    { name: "First Baptist Church Redding", facility_type: "church", capacity: 180, status: "standby", address: "2434 Placer St, Redding", cx: -122.385, cy: 40.577 },
    { name: "Burney Community Center", facility_type: "rec_center", capacity: 140, status: "standby", address: "37477 Main St, Burney", cx: -121.663, cy: 40.884 },
    { name: "Cottonwood Community Church", facility_type: "church", capacity: 90, status: "standby", address: "20720 Gas Point Rd, Cottonwood", cx: -122.286, cy: 40.384 },
  ];
  return fc(
    list.map((s, i) =>
      point([s.cx, s.cy], {
        shelter_id: `SHLT-${String(i + 1).padStart(3, "0")}`,
        name: s.name,
        facility_type: s.facility_type,
        capacity: s.capacity,
        status: s.status,
        address: s.address,
        in_fire_perimeter: pointInPolygon([s.cx, s.cy], FIRE_PERIMETER),
      })
    )
  );
}

// ─── Emit ───────────────────────────────────────────────────
function write(name: string, data: FC): void {
  const path = join(OUT_DIR, name);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const insideFire = data.features.filter(
    (f) => f.properties.in_fire_perimeter === true
  ).length;
  const fireNote = insideFire > 0 ? ` (${insideFire} inside fire)` : "";
  console.log(
    `  ${name.padEnd(35)} ${String(data.features.length).padStart(3)} features${fireNote}`
  );
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const tracts = censusTracts();
const tractsInFire = tracts.features.filter((f) => {
  // census tracts don't have in_fire_perimeter, check centroid instead
  const coords = (f.geometry as { coordinates: [number, number][][] }).coordinates[0];
  const cx = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const cy = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  return pointInPolygon([cx, cy], FIRE_PERIMETER);
});
const popInFire = tractsInFire.reduce(
  (s, f) => s + (f.properties.pop as number),
  0
);

console.log("─".repeat(60));
console.log("Fire Scenario Synthetic Data — Shasta County, CA");
console.log("─".repeat(60));
console.log(
  `  bounds:  ${BOUNDS.west}°W to ${BOUNDS.east}°W, ${BOUNDS.south}°N to ${BOUNDS.north}°N`
);
console.log(`  output:  ${OUT_DIR}`);
console.log();

write("fire_census_tracts.geojson", tracts);
write("fire_stations.geojson", fireStations());
write("police_stations.geojson", policeStations());
write("hospitals.geojson", hospitals());
write("dialysis_clinics.geojson", dialysisClinics());
write("red_cross_shelters.geojson", redCrossShelters());

const polyCx =
  FIRE_PERIMETER.reduce((s, p) => s + p[0], 0) / FIRE_PERIMETER.length;
const polyCy =
  FIRE_PERIMETER.reduce((s, p) => s + p[1], 0) / FIRE_PERIMETER.length;

console.log();
console.log("Fire perimeter:");
console.log(`  vertices:      ${FIRE_PERIMETER.length}`);
console.log(
  `  centroid:      ${polyCx.toFixed(3)}°W, ${polyCy.toFixed(3)}°N (Whiskeytown area, Carr Fire country)`
);
console.log(
  `  tracts inside: ${tractsInFire.length} (${popInFire.toLocaleString()} residents)`
);
console.log();
console.log("Done.");
