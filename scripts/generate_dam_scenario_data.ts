/**
 * Dam Break Scenario Synthetic Data Generator — Butte County, CA
 * ===============================================================
 *
 * Sibling of generate_fire_scenario_data.ts, for the Oroville Dam break scenario.
 * Outputs six GeoJSON files representing real Butte County assets with
 * synthetic numeric fields. Geography and facility names are anchored to real
 * places (Oroville, Thermalito, Chico, Gridley, Paradise) so the demo reads
 * as plausible without claiming authoritative counts.
 *
 * Inundation zone follows the Feather River downstream from Oroville Dam
 * through Oroville and Thermalito, spreading south toward Gridley.
 *
 * Usage:
 *   npx ts-node scripts/generate_dam_scenario_data.ts
 *
 * Output:
 *   scripts/output/dam/
 *     dam_census_tracts.geojson      (~28 tracts, 5 inside inundation zone)
 *     dam_hospitals.geojson           (5 hospitals)
 *     dam_nursing_homes.geojson       (6 nursing homes / assisted living)
 *     dam_schools.geojson             (8 schools in/near inundation zone)
 *     dam_red_cross_shelters.geojson  (6 shelters, outside inundation zone)
 *     dam_water_plants.geojson        (4 water treatment plants)
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "scripts/output/dam");

// ─── Deterministic PRNG ─────────────────────────────────────
let seed = 20260420;
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

// ─── Butte County bounds (real) ─────────────────────────────
const BOUNDS = { west: -122.10, east: -121.10, south: 39.30, north: 40.00 };

// ─── Inundation zone — downstream from Oroville Dam ────────
// Follows the Feather River corridor from the dam through Oroville,
// Thermalito, and south toward Gridley. ~20km long, 5-8km wide.
const INUNDATION_ZONE: [number, number][] = [
  [-121.510, 39.555],   // NE — just below dam
  [-121.490, 39.540],   // dam outlet area
  [-121.480, 39.520],   // downstream east bank
  [-121.485, 39.495],   // Oroville east
  [-121.490, 39.470],   // south of Oroville east
  [-121.500, 39.440],   // approaching Gridley east
  [-121.520, 39.420],   // south end east
  [-121.570, 39.420],   // south end west
  [-121.590, 39.440],   // Thermalito south
  [-121.600, 39.470],   // Thermalito west
  [-121.595, 39.495],   // Oroville west
  [-121.580, 39.520],   // upstream west bank
  [-121.560, 39.540],   // NW — west bank above Oroville
  [-121.540, 39.555],   // close back to NE
  [-121.510, 39.555],
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

  // 5 tracts inside inundation zone — calibrated to 8,420 residents
  // Mix of Oroville urban and rural areas along the river
  const floodTracts: Array<{
    pop: number; over65: number; lep: number; disab: number; pov: number;
    cx: number; cy: number;
  }> = [
    { pop: 2340, over65: 0.22, lep: 0.12, disab: 0.14, pov: 0.21, cx: -121.555, cy: 39.512 }, // Oroville downtown
    { pop: 1890, over65: 0.26, lep: 0.08, disab: 0.16, pov: 0.24, cx: -121.580, cy: 39.495 }, // Thermalito
    { pop: 1640, over65: 0.19, lep: 0.15, disab: 0.11, pov: 0.18, cx: -121.535, cy: 39.480 }, // South Oroville
    { pop: 1430, over65: 0.31, lep: 0.06, disab: 0.20, pov: 0.28, cx: -121.550, cy: 39.450 }, // Rural south
    { pop: 1120, over65: 0.24, lep: 0.10, disab: 0.15, pov: 0.19, cx: -121.520, cy: 39.535 }, // Below dam
  ];
  floodTracts.forEach((t, i) => {
    features.push(
      polygon([squareAround(t.cx, t.cy, 0.012)], {
        tract_id: `BUTTE-${String(i + 1).padStart(3, "0")}`,
        pop: t.pop,
        pct_over_65: t.over65,
        pct_under_18: 0.21,
        pct_lep: t.lep,
        pct_poverty: t.pov,
        pct_disability: t.disab,
        median_income: rint(35000, 52000),
        crci_score: round3(t.over65 * 0.45 + t.pov * 0.35 + t.disab * 0.20),
        crci_top_drivers: "poverty, over 65, limited English",
      })
    );
  });

  // 23 more tracts spread across Butte County, outside the inundation zone
  let placed = 0;
  while (placed < 23) {
    const cx = runif(BOUNDS.west + 0.05, BOUNDS.east - 0.05);
    const cy = runif(BOUNDS.south + 0.05, BOUNDS.north - 0.05);
    if (pointInPolygon([cx, cy], INUNDATION_ZONE)) continue;
    const pop = rint(800, 7200);
    const over65 = round3(runif(0.14, 0.26));
    const pov = round3(runif(0.08, 0.20));
    const disab = round3(runif(0.08, 0.15));
    features.push(
      polygon([squareAround(cx, cy, 0.015)], {
        tract_id: `BUTTE-${String(100 + placed).padStart(3, "0")}`,
        pop,
        pct_over_65: over65,
        pct_under_18: round3(runif(0.18, 0.26)),
        pct_lep: round3(runif(0.03, 0.10)),
        pct_poverty: pov,
        pct_disability: disab,
        median_income: rint(40000, 75000),
        crci_score: round3(over65 * 0.45 + pov * 0.35 + disab * 0.20),
        crci_top_drivers: choice([
          "poverty, rural isolation, no vehicle",
          "over 65, low income",
          "disability, single-parent households",
          "poverty, limited English",
          "mobile homes, rural isolation",
        ]),
      })
    );
    placed++;
  }
  return fc(features);
}

function hospitalsData(): FC {
  const list: Array<{
    name: string; beds: number;
    trauma_level: "trauma_I" | "trauma_II" | "none";
    has_er_24h: boolean; address: string;
    cx: number; cy: number;
  }> = [
    { name: "Oroville Hospital", beds: 133, trauma_level: "none", has_er_24h: true, address: "2767 Olive Hwy, Oroville", cx: -121.524, cy: 39.518 },
    { name: "Enloe Medical Center", beds: 298, trauma_level: "trauma_II", has_er_24h: true, address: "1531 Esplanade, Chico", cx: -121.838, cy: 39.734 },
    { name: "Orchard Hospital", beds: 46, trauma_level: "none", has_er_24h: true, address: "240 Spruce St, Gridley", cx: -121.693, cy: 39.363 },
    { name: "Feather River Hospital (Adventist)", beds: 100, trauma_level: "none", has_er_24h: true, address: "5974 Pentz Rd, Paradise", cx: -121.608, cy: 39.760 },
    { name: "Biggs-Gridley Memorial Hospital", beds: 32, trauma_level: "none", has_er_24h: false, address: "225 W Spruce St, Biggs", cx: -121.713, cy: 39.413 },
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
        in_inundation_zone: pointInPolygon([h.cx, h.cy], INUNDATION_ZONE),
      })
    )
  );
}

function nursingHomes(): FC {
  const list: Array<{
    name: string; beds: number; residents: number;
    mobility_impaired_pct: number; address: string;
    cx: number; cy: number;
  }> = [
    { name: "Oroville Healthcare & Rehab", beds: 99, residents: 82, mobility_impaired_pct: 0.68, address: "2800 Olive Hwy, Oroville", cx: -121.530, cy: 39.515 },
    { name: "Country Crest Post-Acute", beds: 59, residents: 45, mobility_impaired_pct: 0.72, address: "1655 12th St, Oroville", cx: -121.553, cy: 39.507 },
    { name: "Thermalito Gardens Assisted Living", beds: 42, residents: 38, mobility_impaired_pct: 0.55, address: "2960 Grand Ave, Thermalito", cx: -121.585, cy: 39.500 },
    { name: "Sierra View Senior Living", beds: 36, residents: 30, mobility_impaired_pct: 0.50, address: "125 Table Mountain Blvd, Oroville", cx: -121.545, cy: 39.525 },
    { name: "Chico Creek Lodge", beds: 78, residents: 65, mobility_impaired_pct: 0.60, address: "587 Rio Lindo Ave, Chico", cx: -121.822, cy: 39.720 },
    { name: "Gridley Post-Acute Center", beds: 40, residents: 34, mobility_impaired_pct: 0.65, address: "246 Spruce St, Gridley", cx: -121.694, cy: 39.365 },
  ];
  return fc(
    list.map((n, i) =>
      point([n.cx, n.cy], {
        facility_id: `NH-${String(i + 1).padStart(3, "0")}`,
        name: n.name,
        bed_count: n.beds,
        current_residents: n.residents,
        mobility_impaired_pct: n.mobility_impaired_pct,
        address: n.address,
        in_inundation_zone: pointInPolygon([n.cx, n.cy], INUNDATION_ZONE),
      })
    )
  );
}

function schools(): FC {
  const list: Array<{
    name: string; enrollment: number; grade_range: string;
    address: string; cx: number; cy: number;
  }> = [
    { name: "Oroville High School", enrollment: 820, grade_range: "9-12", address: "2211 Washington Ave, Oroville", cx: -121.548, cy: 39.515 },
    { name: "Central Middle School", enrollment: 410, grade_range: "6-8", address: "2255 5th Ave, Oroville", cx: -121.555, cy: 39.510 },
    { name: "Bird Street Elementary", enrollment: 290, grade_range: "K-5", address: "1421 Bird St, Oroville", cx: -121.553, cy: 39.518 },
    { name: "Thermalito Union Elementary", enrollment: 380, grade_range: "K-5", address: "400 Grand Ave, Thermalito", cx: -121.583, cy: 39.503 },
    { name: "Poplar Avenue Elementary", enrollment: 260, grade_range: "K-5", address: "1725 Poplar Ave, Oroville", cx: -121.543, cy: 39.498 },
    { name: "Nelson Avenue Middle School", enrollment: 340, grade_range: "6-8", address: "985 Nelson Ave, Oroville", cx: -121.560, cy: 39.490 },
    { name: "Las Plumas High School", enrollment: 680, grade_range: "9-12", address: "2380 Las Plumas Ave, Oroville", cx: -121.570, cy: 39.485 },
    { name: "Stanford Avenue Elementary", enrollment: 220, grade_range: "K-5", address: "1850 Stanford Ave, Oroville", cx: -121.537, cy: 39.505 },
  ];
  return fc(
    list.map((s, i) =>
      point([s.cx, s.cy], {
        school_id: `SCH-${String(i + 1).padStart(3, "0")}`,
        name: s.name,
        enrollment: s.enrollment,
        grade_range: s.grade_range,
        address: s.address,
        in_inundation_zone: pointInPolygon([s.cx, s.cy], INUNDATION_ZONE),
      })
    )
  );
}

function redCrossShelters(): FC {
  // Shelters placed OUTSIDE the inundation zone — on higher ground
  const list: Array<{
    name: string; facility_type: "school" | "church" | "rec_center";
    capacity: number; status: "open" | "standby";
    address: string; cx: number; cy: number;
  }> = [
    { name: "Chico State University Pavilion", facility_type: "school", capacity: 600, status: "open", address: "400 W 1st St, Chico", cx: -121.848, cy: 39.729 },
    { name: "Silver Dollar Fairgrounds", facility_type: "rec_center", capacity: 800, status: "open", address: "2357 Fair St, Chico", cx: -121.808, cy: 39.710 },
    { name: "Paradise Alliance Church", facility_type: "church", capacity: 250, status: "standby", address: "6491 Clark Rd, Paradise", cx: -121.621, cy: 39.760 },
    { name: "Gridley Community Center", facility_type: "rec_center", capacity: 180, status: "standby", address: "164 Washington St, Gridley", cx: -121.698, cy: 39.363 },
    { name: "Table Mountain School (Shelter)", facility_type: "school", capacity: 200, status: "open", address: "3099 Oro Dam Blvd, Oroville", cx: -121.490, cy: 39.530 },
    { name: "Palermo Community Church", facility_type: "church", capacity: 120, status: "standby", address: "2276 Lincoln Blvd, Palermo", cx: -121.612, cy: 39.434 },
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
        in_inundation_zone: pointInPolygon([s.cx, s.cy], INUNDATION_ZONE),
      })
    )
  );
}

function waterPlants(): FC {
  const list: Array<{
    name: string; type: "water_treatment" | "wastewater" | "pump_station";
    capacity_mgd: number; serves_population: number;
    address: string; cx: number; cy: number;
  }> = [
    { name: "Oroville Water Treatment Plant", type: "water_treatment", capacity_mgd: 12, serves_population: 18000, address: "2290 Feather River Blvd, Oroville", cx: -121.530, cy: 39.508 },
    { name: "Thermalito Water & Sewer District", type: "wastewater", capacity_mgd: 4, serves_population: 8500, address: "410 Grand Ave, Thermalito", cx: -121.588, cy: 39.498 },
    { name: "South Feather Water & Power", type: "pump_station", capacity_mgd: 8, serves_population: 14000, address: "6588 Miners Ranch Rd, Oroville", cx: -121.495, cy: 39.490 },
    { name: "Cal Water — Oroville District", type: "water_treatment", capacity_mgd: 6, serves_population: 11000, address: "1833 Mitchell Ave, Oroville", cx: -121.545, cy: 39.520 },
  ];
  return fc(
    list.map((w, i) =>
      point([w.cx, w.cy], {
        facility_id: `WTP-${String(i + 1).padStart(3, "0")}`,
        name: w.name,
        facility_type: w.type,
        capacity_mgd: w.capacity_mgd,
        serves_population: w.serves_population,
        address: w.address,
        in_inundation_zone: pointInPolygon([w.cx, w.cy], INUNDATION_ZONE),
      })
    )
  );
}

// ─── Emit ───────────────────────────────────────────────────
function write(name: string, data: FC): void {
  const path = join(OUT_DIR, name);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const insideZone = data.features.filter(
    (f) => f.properties.in_inundation_zone === true
  ).length;
  const zoneNote = insideZone > 0 ? ` (${insideZone} in inundation zone)` : "";
  console.log(
    `  ${name.padEnd(38)} ${String(data.features.length).padStart(3)} features${zoneNote}`
  );
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const tracts = censusTracts();
const tractsInZone = tracts.features.filter((f) => {
  const coords = (f.geometry as { coordinates: [number, number][][] }).coordinates[0];
  const cx = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const cy = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  return pointInPolygon([cx, cy], INUNDATION_ZONE);
});
const popInZone = tractsInZone.reduce(
  (s, f) => s + (f.properties.pop as number),
  0
);

console.log("─".repeat(60));
console.log("Dam Break Scenario Synthetic Data — Butte County, CA");
console.log("─".repeat(60));
console.log(
  `  bounds:  ${BOUNDS.west}°W to ${BOUNDS.east}°W, ${BOUNDS.south}°N to ${BOUNDS.north}°N`
);
console.log(`  output:  ${OUT_DIR}`);
console.log();

write("dam_census_tracts.geojson", tracts);
write("dam_hospitals.geojson", hospitalsData());
write("dam_nursing_homes.geojson", nursingHomes());
write("dam_schools.geojson", schools());
write("dam_red_cross_shelters.geojson", redCrossShelters());
write("dam_water_plants.geojson", waterPlants());

const polyCx =
  INUNDATION_ZONE.reduce((s, p) => s + p[0], 0) / INUNDATION_ZONE.length;
const polyCy =
  INUNDATION_ZONE.reduce((s, p) => s + p[1], 0) / INUNDATION_ZONE.length;

console.log();
console.log("Inundation zone:");
console.log(`  vertices:        ${INUNDATION_ZONE.length}`);
console.log(
  `  centroid:        ${polyCx.toFixed(3)}°W, ${polyCy.toFixed(3)}°N (Oroville / Feather River corridor)`
);
console.log(
  `  tracts inside:   ${tractsInZone.length} (${popInZone.toLocaleString()} residents)`
);
console.log();
console.log("Done.");
