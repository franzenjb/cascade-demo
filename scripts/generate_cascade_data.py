"""
Project Cascade — Synthetic Data Generator
===========================================

Generates 10 GeoJSON files representing the fictional Cascade County, calibrated
so the canonical tornado scenario produces the Buncombe-preserving numbers from
the white paper (2847 residents, Mountain View Estates 148 units, etc.).

USAGE:
    python scripts/generate_cascade_data.py

OUTPUT:
    scripts/output/*.geojson — one file per layer

AFTER RUNNING:
    1. In AGOL, click "New item" → file upload for each .geojson
    2. Use the exact filename as the item title (e.g., "DEMO_Cascade_Boundary")
    3. Publish as hosted Feature Layer
    4. Share as public (for demo)
    5. Copy each service URL into .env.local
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)  # Reproducible

# ─── Cascade County parameters ──────────────────────────────
BOUNDS = {"west": -81.8, "east": -81.2, "south": 35.8, "north": 36.2}
TORNADO_POLYGON = [
    [-81.5400, 36.0100], [-81.5100, 36.0350], [-81.4750, 36.0500],
    [-81.4500, 36.0600], [-81.4250, 36.0550], [-81.4350, 36.0300],
    [-81.4800, 36.0150], [-81.5200, 36.0050], [-81.5400, 36.0100],
]


def in_tornado(x, y):
    xs = [p[0] for p in TORNADO_POLYGON]
    ys = [p[1] for p in TORNADO_POLYGON]
    return min(xs) <= x <= max(xs) and min(ys) <= y <= max(ys)


def square_around(cx, cy, size=0.02):
    return [[cx - size, cy - size], [cx + size, cy - size],
            [cx + size, cy + size], [cx - size, cy + size],
            [cx - size, cy - size]]


def fc(features):
    return {"type": "FeatureCollection", "features": features}


def feat(geom_type, coords, props):
    return {"type": "Feature",
            "geometry": {"type": geom_type, "coordinates": coords},
            "properties": props}


# ─── Generators ─────────────────────────────────────────────

def boundary():
    return fc([feat("Polygon", [[
        [BOUNDS["west"], BOUNDS["south"]], [BOUNDS["east"], BOUNDS["south"]],
        [BOUNDS["east"], BOUNDS["north"]], [BOUNDS["west"], BOUNDS["north"]],
        [BOUNDS["west"], BOUNDS["south"]],
    ]], {"county_name": "Cascade County", "area_sq_mi": 750})])


def census_tracts():
    """28 tracts. 4 inside tornado sum to exactly 2,847 residents."""
    features = []
    # 4 tornado-zone tracts — calibrated
    tornado_tracts = [
        (742, 0.22, 0.06, -81.50, 36.02),
        (813, 0.19, 0.11, -81.48, 36.03),
        (601, 0.15, 0.08, -81.46, 36.04),
        (691, 0.16, 0.12, -81.52, 36.015),
    ]
    # Total: 2847, weighted pct_over_65 ≈ 0.18, weighted pct_lep ≈ 0.09
    for i, (pop, over65, lep, cx, cy) in enumerate(tornado_tracts):
        features.append(feat("Polygon", [square_around(cx, cy)], {
            "tract_id": f"CASCADE-{i+1:03d}",
            "pop": pop, "pct_over_65": over65, "pct_under_18": 0.21,
            "pct_lep": lep, "pct_poverty": 0.14, "pct_disability": 0.11,
            "median_income": 52000, "crci_score": 0.42,
            "crci_top_drivers": "limited English, poverty, over 65",
        }))

    # 24 more tracts outside tornado
    remaining = 128400 - 2847
    avg = remaining / 24
    placed = 0
    while placed < 24:
        cx = random.uniform(BOUNDS["west"] + 0.05, BOUNDS["east"] - 0.05)
        cy = random.uniform(BOUNDS["south"] + 0.05, BOUNDS["north"] - 0.05)
        if in_tornado(cx, cy):
            continue
        pop = int(avg * random.uniform(0.6, 1.4))
        features.append(feat("Polygon", [square_around(cx, cy)], {
            "tract_id": f"CASCADE-{100+placed:03d}",
            "pop": pop,
            "pct_over_65": round(random.uniform(0.14, 0.22), 3),
            "pct_under_18": round(random.uniform(0.18, 0.24), 3),
            "pct_lep": round(random.uniform(0.04, 0.10), 3),
            "pct_poverty": round(random.uniform(0.10, 0.20), 3),
            "pct_disability": round(random.uniform(0.08, 0.14), 3),
            "median_income": random.randint(40000, 65000),
            "crci_score": round(random.uniform(0.25, 0.55), 3),
            "crci_top_drivers": "poverty, single-parent households, no vehicle",
        }))
        placed += 1
    return fc(features)


def mobile_home_parks():
    """11 parks. 4 inside tornado totaling 312 units. Mountain View = 148."""
    features = []
    # Inside tornado zone (calibrated)
    tornado_parks = [
        ("Mountain View Estates", 148, -81.495, 36.022),
        ("Ridgeview Park", 82, -81.480, 36.035),
        ("Cascade Trailer Community", 46, -81.465, 36.045),
        ("Fairway Mobile Estates", 36, -81.510, 36.012),
    ]
    for name, units, cx, cy in tornado_parks:
        features.append(feat("Point", [cx, cy], {
            "park_name": name, "unit_count": units,
            "address": f"{random.randint(100, 999)} Valley Rd, Ridgeton",
            "year_established": random.randint(1975, 2005),
        }))
    # Outside
    others = ["Pine Hollow MHP", "Stonecreek Mobile Park", "Millbrook Estates",
              "Ashford Falls Trailer Park", "Highland Mobile Community",
              "Sunny Acres", "Creekside Estates"]
    for name in others:
        while True:
            cx = random.uniform(BOUNDS["west"] + 0.1, BOUNDS["east"] - 0.1)
            cy = random.uniform(BOUNDS["south"] + 0.1, BOUNDS["north"] - 0.1)
            if not in_tornado(cx, cy):
                break
        features.append(feat("Point", [cx, cy], {
            "park_name": name, "unit_count": random.randint(20, 95),
            "address": f"{random.randint(100, 999)} Rural Route {random.randint(1, 10)}",
            "year_established": random.randint(1970, 2010),
        }))
    return fc(features)


def schools():
    """24 schools. 1 elementary inside tornado."""
    features = []
    features.append(feat("Point", [-81.488, 36.028], {
        "name": "Northside Elementary", "type": "elementary",
        "enrollment": 312, "address": "450 Maple Drive, Ridgeton",
        "has_shelter_agreement": False,
    }))
    school_list = [
        ("Ridgeton High", "high", 1450), ("Ridgeton Middle", "middle", 780),
        ("Ridgeton Elementary", "elementary", 520), ("Millbrook High", "high", 420),
        ("Millbrook Elementary", "elementary", 240), ("Ashford Falls K-8", "middle", 310),
        ("Pine Hollow Elementary", "elementary", 180), ("Stonecreek High", "high", 380),
        ("Stonecreek Elementary", "elementary", 210), ("Valley View Elementary", "elementary", 160),
        ("Mountain Crest Middle", "middle", 290), ("Eastwood Elementary", "elementary", 220),
        ("West Cascade High", "high", 510), ("West Cascade Middle", "middle", 340),
        ("Fairview Elementary", "elementary", 175), ("Oak Ridge Elementary", "elementary", 190),
        ("Cedar Creek Middle", "middle", 260), ("Laurel Grove Elementary", "elementary", 145),
        ("Hillside Elementary", "elementary", 200), ("Rivers Edge Middle", "middle", 280),
        ("Highland Elementary", "elementary", 165), ("Birchwood K-8", "middle", 230),
        ("Meadow Brook Elementary", "elementary", 180),
    ]
    for name, stype, enroll in school_list:
        while True:
            cx = random.uniform(BOUNDS["west"] + 0.05, BOUNDS["east"] - 0.05)
            cy = random.uniform(BOUNDS["south"] + 0.05, BOUNDS["north"] - 0.05)
            if not in_tornado(cx, cy):
                break
        features.append(feat("Point", [cx, cy], {
            "name": name, "type": stype, "enrollment": enroll,
            "address": f"{random.randint(100, 999)} School St",
            "has_shelter_agreement": random.random() < 0.3,
        }))
    return fc(features)


def medical_facilities():
    """9 facilities. Dialysis centers calibrated: 28 + 19 = 47 home-dialysis in tornado zone."""
    features = [
        # Inside tornado: assisted living
        feat("Point", [-81.482, 36.033], {
            "name": "Cascade Valley Assisted Living", "type": "clinic",
            "bed_count": 48, "home_dialysis_patients": 0,
            "address": "120 Care Lane, Ridgeton", "has_backup_power": True,
        }),
        # Dialysis centers with service areas covering tornado
        feat("Point", [-81.55, 36.04], {
            "name": "Ridgeton Dialysis Center", "type": "dialysis",
            "bed_count": 18, "home_dialysis_patients": 28,
            "address": "200 Medical Plaza Drive", "has_backup_power": True,
        }),
        feat("Point", [-81.42, 36.01], {
            "name": "Eastside Renal Care", "type": "dialysis",
            "bed_count": 12, "home_dialysis_patients": 19,
            "address": "88 Highway 70 East", "has_backup_power": True,
        }),
        feat("Point", [-81.55, 36.08], {
            "name": "Cascade Regional Hospital", "type": "hospital",
            "bed_count": 186, "home_dialysis_patients": 0,
            "address": "1 Hospital Drive", "has_backup_power": True,
        }),
        feat("Point", [-81.62, 35.95], {
            "name": "Millbrook Family Clinic", "type": "clinic",
            "bed_count": 0, "home_dialysis_patients": 0,
            "address": "42 Main St, Millbrook", "has_backup_power": False,
        }),
        feat("Point", [-81.38, 36.15], {
            "name": "Ashford Falls Urgent Care", "type": "urgent_care",
            "bed_count": 6, "home_dialysis_patients": 0,
            "address": "15 Ashford Rd", "has_backup_power": True,
        }),
        feat("Point", [-81.45, 35.89], {
            "name": "Pine Hollow Medical", "type": "clinic",
            "bed_count": 0, "home_dialysis_patients": 0,
            "address": "10 Pine Hollow Rd", "has_backup_power": False,
        }),
        feat("Point", [-81.58, 36.15], {
            "name": "Highland Memory Care", "type": "clinic",
            "bed_count": 62, "home_dialysis_patients": 0,
            "address": "5 Highland Way", "has_backup_power": True,
        }),
        feat("Point", [-81.28, 36.05], {
            "name": "Eastwood Senior Living", "type": "clinic",
            "bed_count": 88, "home_dialysis_patients": 0,
            "address": "200 Sunrise Blvd", "has_backup_power": True,
        }),
    ]
    return fc(features)


def red_cross_assets():
    """6 assets: office, 2 ERV depots, 2 shelters, 1 warehouse."""
    return fc([
        feat("Point", [-81.54, 36.03], {
            "asset_name": "Cascade County Chapter Office", "type": "office",
            "capacity": 0, "address": "100 Red Cross Way, Ridgeton",
            "operational_status": "active",
        }),
        feat("Point", [-81.55, 36.035], {
            "asset_name": "Ridgeton ERV Depot", "type": "ERV_depot",
            "capacity": 2, "address": "120 Red Cross Way, Ridgeton",
            "operational_status": "active",
        }),
        feat("Point", [-81.40, 36.14], {
            "asset_name": "Hendersonville ERV Depot", "type": "ERV_depot",
            "capacity": 1, "address": "30 Emergency Lane, Hendersonville",
            "operational_status": "active",
        }),
        feat("Point", [-81.495, 36.025], {
            "asset_name": "First Baptist Ridgeton (Partner Shelter)",
            "type": "shelter", "capacity": 250,
            "address": "25 Church St, Ridgeton", "operational_status": "standby",
        }),
        feat("Point", [-81.60, 35.95], {
            "asset_name": "Millbrook Community Center (Partner Shelter)",
            "type": "shelter", "capacity": 180,
            "address": "50 Community Rd, Millbrook", "operational_status": "standby",
        }),
        feat("Point", [-80.85, 35.22], {
            "asset_name": "Charlotte Regional Warehouse", "type": "warehouse",
            "capacity": 5000, "address": "2500 Distribution Way, Charlotte NC",
            "operational_status": "active",
        }),
    ])


def afn_service_areas():
    """15 areas. 3 inside tornado sum to 43 transport-dependent."""
    features = []
    # Inside tornado (calibrated to 43 total)
    tornado_afn = [
        ("Ridgeton Northeast AFN Zone", 18, "transport", -81.49, 36.03),
        ("Valley Community AFN Zone", 15, "transport", -81.47, 36.04),
        ("Tornado Path AFN Zone C", 10, "transport", -81.51, 36.015),
    ]
    for name, count, svc, cx, cy in tornado_afn:
        features.append(feat("Polygon", [square_around(cx, cy, 0.01)], {
            "area_name": name, "aggregated_count": count,
            "service_type": svc, "has_registered_providers": True,
        }))
    # Outside
    services = ["transport", "communication", "medical_equipment", "independence", "support_safety"]
    for i in range(12):
        while True:
            cx = random.uniform(BOUNDS["west"] + 0.08, BOUNDS["east"] - 0.08)
            cy = random.uniform(BOUNDS["south"] + 0.08, BOUNDS["north"] - 0.08)
            if not in_tornado(cx, cy):
                break
        features.append(feat("Polygon", [square_around(cx, cy, 0.015)], {
            "area_name": f"Cascade AFN Zone {i+1}",
            "aggregated_count": random.randint(8, 35),
            "service_type": random.choice(services),
            "has_registered_providers": random.random() < 0.7,
        }))
    return fc(features)


def historical_incidents():
    """14 past events."""
    now = datetime.now()
    events = [
        ("tornado", 730, 180, 3), ("flood", 365, 850, 7),
        ("winter_storm", 730, 4200, 4), ("wildfire", 1095, 620, 12),
        ("tornado", 1825, 95, 2), ("flood", 1460, 1240, 14),
        ("hurricane", 1095, 3100, 10), ("winter_storm", 730, 2800, 3),
        ("tornado", 2190, 240, 4), ("flood", 2555, 560, 8),
        ("wildfire", 365, 310, 6), ("hurricane", 2920, 1800, 11),
        ("winter_storm", 365, 5100, 5), ("flood", 1825, 920, 9),
    ]
    features = []
    for etype, days_ago, pop, duration in events:
        d = now - timedelta(days=days_ago)
        features.append(feat("Point", [
            random.uniform(BOUNDS["west"] + 0.1, BOUNDS["east"] - 0.1),
            random.uniform(BOUNDS["south"] + 0.1, BOUNDS["north"] - 0.1),
        ], {
            "event_date": d.strftime("%Y-%m-%d"),
            "event_type": etype, "affected_pop": pop,
            "duration_days": duration,
            "notes": f"Historical {etype} event affecting Cascade County.",
        }))
    return fc(features)


def roads():
    """60 synthetic road segments."""
    features = []
    for i in range(60):
        sx = random.uniform(BOUNDS["west"] + 0.05, BOUNDS["east"] - 0.05)
        sy = random.uniform(BOUNDS["south"] + 0.05, BOUNDS["north"] - 0.05)
        ex = sx + random.uniform(-0.03, 0.03)
        ey = sy + random.uniform(-0.03, 0.03)
        features.append(feat("LineString", [[sx, sy], [ex, ey]], {
            "road_type": random.choice(["highway", "arterial", "local", "dirt"]),
            "name": f"County Route {i+1}",
            "speed_limit": random.choice([25, 35, 45, 55]),
        }))
    return fc(features)


def active_warnings():
    """Empty. Populated at demo time by /api/trigger."""
    return fc([])


# ─── Main ───────────────────────────────────────────────────

LAYERS = {
    "DEMO_Cascade_Boundary": boundary,
    "DEMO_Cascade_Census_Tracts": census_tracts,
    "DEMO_Cascade_Mobile_Home_Parks": mobile_home_parks,
    "DEMO_Cascade_Schools": schools,
    "DEMO_Cascade_Medical_Facilities": medical_facilities,
    "DEMO_Cascade_Red_Cross_Assets": red_cross_assets,
    "DEMO_Cascade_AFN_Service_Areas": afn_service_areas,
    "DEMO_Cascade_Historical_Incidents": historical_incidents,
    "DEMO_Cascade_Roads": roads,
    "DEMO_Cascade_Active_Warnings": active_warnings,
}


def main():
    out = Path(__file__).parent / "output"
    out.mkdir(exist_ok=True)

    print("═" * 60)
    print("Cascade County Synthetic Data Generator")
    print("═" * 60)
    print()

    for name, gen in LAYERS.items():
        data = gen()
        path = out / f"{name}.geojson"
        path.write_text(json.dumps(data, indent=2))
        n = len(data["features"])
        print(f"  ✓ {name}.geojson  ({n} features)")

    print()
    print("═" * 60)
    print(f"All layers written to: {out}")
    print("═" * 60)
    print()
    print("NEXT STEPS:")
    print("  1. In AGOL, go to Content → New item → Upload file")
    print("  2. For each .geojson, use the filename as the item title")
    print("  3. Choose 'Publish this file as a hosted feature layer'")
    print("  4. Set sharing to 'Everyone (public)' for demo purposes")
    print("  5. Copy each service URL into your .env.local:")
    print()
    for name in LAYERS:
        env_name = name.upper() + "_URL"
        print(f"     {env_name}=<paste service URL here>")
    print()


if __name__ == "__main__":
    main()
