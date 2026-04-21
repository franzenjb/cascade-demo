"use client";

import { useRef, useState } from "react";
import MapView from "@/components/MapView";
import ChatPanel from "@/components/ChatPanel";
import TriggerButton from "@/components/TriggerButton";
import AssetPanel from "@/components/AssetPanel";
import AllAssetsAccordion from "@/components/AllAssetsAccordion";
import ThemeToggle from "@/components/ThemeToggle";
import HelpModal from "@/components/HelpModal";
import type { ChatMessage, CatalogLayer, FeatureRow, MapInstruction } from "@/lib/types";
import LayerDiscovery from "@/components/LayerDiscovery";

type TornadoCategory =
  | "mobile_home_park"
  | "school"
  | "medical"
  | "red_cross";

type FireCategory =
  | "fire_station"
  | "police"
  | "hospital"
  | "dialysis"
  | "shelter";

type DamBreakCategory =
  | "dam_hospital"
  | "dam_nursing_home"
  | "dam_school"
  | "dam_shelter"
  | "dam_water_plant";

type CategoryId = TornadoCategory | FireCategory | DamBreakCategory;

type WarningType = "tornado" | "wildfire" | "dam_break";

interface Metrics {
  pop: number;
  pctOver65: number;
  pctLep: number;
  pctDisability: number;
  tractCount: number;
}

type CategoryCounts = Record<CategoryId, number>;

type FeaturesByCategory = Record<CategoryId, FeatureRow[]>;

const EMPTY_COUNTS: CategoryCounts = {
  mobile_home_park: 0,
  school: 0,
  medical: 0,
  red_cross: 0,
  fire_station: 0,
  police: 0,
  hospital: 0,
  dialysis: 0,
  shelter: 0,
  dam_hospital: 0,
  dam_nursing_home: 0,
  dam_school: 0,
  dam_shelter: 0,
  dam_water_plant: 0,
};

const EMPTY_FEATURES: FeaturesByCategory = {
  mobile_home_park: [],
  school: [],
  medical: [],
  red_cross: [],
  fire_station: [],
  police: [],
  hospital: [],
  dialysis: [],
  shelter: [],
  dam_hospital: [],
  dam_nursing_home: [],
  dam_school: [],
  dam_shelter: [],
  dam_water_plant: [],
};

const CATEGORY_LABELS: Record<CategoryId, string> = {
  mobile_home_park: "Mobile Home Parks",
  school: "Schools",
  medical: "Medical",
  red_cross: "Red Cross Assets",
  fire_station: "Fire Stations",
  police: "Police Stations",
  hospital: "Hospitals",
  dialysis: "Dialysis Clinics",
  shelter: "Red Cross Shelters",
  dam_hospital: "Hospitals",
  dam_nursing_home: "Nursing Homes",
  dam_school: "Schools",
  dam_shelter: "Shelters",
  dam_water_plant: "Water Plants",
};

interface ScenarioSection {
  id: CategoryId;
  label: string;
  dot: string;
  layerId: string;
  mapLabel: string;
}

const TORNADO_SECTIONS: ScenarioSection[] = [
  {
    id: "mobile_home_park",
    label: "Mobile Home Parks",
    dot: "#ED1B2E",
    layerId: "DEMO_Cascade_Mobile_Home_Parks",
    mapLabel: "Mobile Home Park",
  },
  {
    id: "school",
    label: "Schools",
    dot: "#1E4A6D",
    layerId: "DEMO_Cascade_Schools",
    mapLabel: "School",
  },
  {
    id: "medical",
    label: "Medical",
    dot: "#2D2D2D",
    layerId: "DEMO_Cascade_Medical_Facilities",
    mapLabel: "Medical Facility",
  },
  {
    id: "red_cross",
    label: "Red Cross Assets",
    dot: "#ED1B2E",
    layerId: "DEMO_Cascade_Red_Cross_Assets",
    mapLabel: "Red Cross Asset",
  },
];

const FIRE_SECTIONS: ScenarioSection[] = [
  {
    id: "fire_station",
    label: "Fire Stations",
    dot: "#E85D04",
    layerId: "DEMO_FireArea_Fire_Stations",
    mapLabel: "Fire Station",
  },
  {
    id: "police",
    label: "Police Stations",
    dot: "#1E4A6D",
    layerId: "DEMO_FireArea_Police_Stations",
    mapLabel: "Police Station",
  },
  {
    id: "hospital",
    label: "Hospitals",
    dot: "#2D2D2D",
    layerId: "DEMO_FireArea_Hospitals",
    mapLabel: "Hospital",
  },
  {
    id: "dialysis",
    label: "Dialysis Clinics",
    dot: "#6B4E9F",
    layerId: "DEMO_FireArea_Dialysis_Clinics",
    mapLabel: "Dialysis Clinic",
  },
  {
    id: "shelter",
    label: "Red Cross Shelters",
    dot: "#ED1B2E",
    layerId: "DEMO_FireArea_Red_Cross_Shelters",
    mapLabel: "Red Cross Shelter",
  },
];

const DAM_BREAK_SECTIONS: ScenarioSection[] = [
  {
    id: "dam_nursing_home",
    label: "Nursing Homes",
    dot: "#1B6EC2",
    layerId: "DEMO_DamBreak_Nursing_Homes",
    mapLabel: "Nursing Home",
  },
  {
    id: "dam_school",
    label: "Schools",
    dot: "#E85D04",
    layerId: "DEMO_DamBreak_Schools",
    mapLabel: "School",
  },
  {
    id: "dam_hospital",
    label: "Hospitals",
    dot: "#2D2D2D",
    layerId: "DEMO_DamBreak_Hospitals",
    mapLabel: "Hospital",
  },
  {
    id: "dam_shelter",
    label: "Shelters",
    dot: "#ED1B2E",
    layerId: "DEMO_DamBreak_Red_Cross_Shelters",
    mapLabel: "Red Cross Shelter",
  },
  {
    id: "dam_water_plant",
    label: "Water Plants",
    dot: "#1E4A6D",
    layerId: "DEMO_DamBreak_Water_Plants",
    mapLabel: "Water Plant",
  },
];

const SCENARIO_CONFIG: Record<
  WarningType,
  { sections: ScenarioSection[]; tractLayerId: string; spatialOnly: boolean }
> = {
  tornado: {
    sections: TORNADO_SECTIONS,
    tractLayerId: "DEMO_Cascade_Census_Tracts",
    spatialOnly: false,
  },
  wildfire: {
    sections: FIRE_SECTIONS,
    tractLayerId: "DEMO_FireArea_Census_Tracts",
    spatialOnly: false,
  },
  dam_break: {
    sections: DAM_BREAK_SECTIONS,
    tractLayerId: "DEMO_DamBreak_Census_Tracts",
    spatialOnly: false,
  },
};

type RightTab = "conversation" | "drill" | "layers";

interface FocusFeature {
  lon: number;
  lat: number;
  n: number;
}

interface HighlightedFeature {
  featureType: CategoryId;
  lon: number;
  lat: number;
  n: number;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mapInstructions, setMapInstructions] = useState<MapInstruction[]>([]);
  const [triggerDirective, setTriggerDirective] = useState<string | null>(null);
  const [clearSignal, setClearSignal] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [counts, setCounts] = useState<CategoryCounts>(EMPTY_COUNTS);
  const [features, setFeatures] = useState<FeaturesByCategory>(EMPTY_FEATURES);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("conversation");
  const [eventId, setEventId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [warningType, setWarningType] = useState<WarningType | null>(null);
  const [focusFeature, setFocusFeature] = useState<FocusFeature | null>(null);
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const focusNonce = useRef(0);
  const [homeSignal, setHomeSignal] = useState(0);
  const [accordionResetSignal, setAccordionResetSignal] = useState(0);
  const [highlightedFeature, setHighlightedFeature] =
    useState<HighlightedFeature | null>(null);
  const highlightNonce = useRef(0);

  const handleTriggerFired = (
    directive: string,
    polygon: unknown,
    sid: string,
    wt: WarningType,
    nwsEventId: string | null
  ) => {
    setMessages([]);
    setMapInstructions([]);
    setClearSignal((c) => c + 1);
    setCounts(EMPTY_COUNTS);
    setFeatures(EMPTY_FEATURES);
    setMetrics(null);
    setActiveCategory(null);
    setRightTab("drill");
    setFocusFeature(null);
    setHighlightedFeature(null);
    setScenarioId(sid);
    setWarningType(wt);
    setEventId(
      nwsEventId || `DEMO-${wt.toUpperCase()}-${new Date().getFullYear()}-0001`
    );
    // Demo trigger goes straight to the assets — skip the Claude narrative.
    // The conversation tab is still available for typed questions.
    void directive;

    if (!polygon) return;

    const polygonStyle =
      wt === "wildfire"
        ? {
            color: "#E85D04",
            opacity: 0.18,
            label: "Fire Perimeter",
            scale: 150000,
          }
        : wt === "dam_break"
        ? {
            color: "#1B6EC2",
            opacity: 0.20,
            label: "Inundation Zone",
            scale: 250000,
          }
        : {
            color: "#ED1B2E",
            opacity: 0.15,
            label: "Tornado Warning",
            scale: 150000,
          };
    const layerLabel =
      wt === "wildfire"
        ? "Fire Perimeter"
        : wt === "dam_break"
        ? "Inundation Zone"
        : "Tornado Warning";

    setMapInstructions((prev) => [
      ...prev,
      {
        action: "draw",
        geometry: polygon as any,
        style: polygonStyle,
        layer_label: layerLabel,
      },
    ]);

    loadMetrics(polygon, wt);
    renderFeaturesInsidePolygon(polygon, wt);
  };

  const loadMetrics = async (polygon: unknown, wt: WarningType) => {
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer_id: SCENARIO_CONFIG[wt].tractLayerId,
          geometry: polygon,
          return_geometry: false,
        }),
      });
      const data = await res.json();
      if (!data.features || data.features.length === 0) return;

      let pop = 0;
      let wOver65 = 0;
      let wLep = 0;
      let wDisability = 0;
      for (const f of data.features) {
        const a = f.attributes || {};
        const p = Number(a.pop) || 0;
        pop += p;
        wOver65 += p * (Number(a.pct_over_65) || 0);
        wLep += p * (Number(a.pct_lep) || 0);
        wDisability += p * (Number(a.pct_disability) || 0);
      }
      setMetrics({
        pop,
        pctOver65: pop > 0 ? wOver65 / pop : 0,
        pctLep: pop > 0 ? wLep / pop : 0,
        pctDisability: pop > 0 ? wDisability / pop : 0,
        tractCount: data.features.length,
      });
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  };

  const renderFeaturesInsidePolygon = async (
    polygon: unknown,
    wt: WarningType
  ) => {
    const cfg = SCENARIO_CONFIG[wt];

    for (const section of cfg.sections) {
      // Tornado scene: tight warning polygon, so mobile-home-parks/schools/
      // medical query spatially (Red Cross assets go unbounded — regional view).
      // Wildfire scene: fire perimeter hugs Whiskeytown but the responder
      // needs Redding-area fire stations/hospitals/shelters visible, so all
      // fire-area point layers query unbounded (they're already regionally scoped).
      // Tornado: spatial for most layers, unbounded for Red Cross.
      // Wildfire: unbounded — assets are regionally scoped already.
      // Dam break: spatial — show only what's in the inundation zone.
      //   Exception: shelters query unbounded (they're outside the zone by design).
      const useGeometry =
        (wt === "tornado" && section.id !== "red_cross") ||
        (wt === "dam_break" && section.id !== "dam_shelter");

      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer_id: section.layerId,
            geometry: useGeometry ? polygon : undefined,
            return_geometry: true,
          }),
        });
        const data = await res.json();
        if (!data.features) continue;

        setCounts((c) => ({ ...c, [section.id]: data.features.length }));
        setFeatures((f) => ({
          ...f,
          [section.id]: data.features.map((feat: any) => {
            const p = extractLonLat(feat.geometry);
            return {
              attributes: feat.attributes || {},
              geometry: p ? { lon: p[0], lat: p[1] } : undefined,
            };
          }),
        }));

        for (const feature of data.features) {
          const coords = extractLonLat(feature.geometry);
          if (!coords) continue;

          const displayLabel =
            feature.attributes?.park_name ||
            feature.attributes?.name ||
            feature.attributes?.asset_name ||
            section.mapLabel;

          setMapInstructions((prev) => [
            ...prev,
            {
              action: "draw",
              geometry: { type: "Point", coordinates: coords },
              style: { label: displayLabel },
              layer_label: section.mapLabel,
              ...({
                featureType: section.id,
                attributes: feature.attributes,
                displayLabel,
              } as any),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch " + section.layerId, err);
      }
    }
  };

  const handleMapInstruction = (instruction: MapInstruction) => {
    setMapInstructions((prev) => [...prev, instruction]);
  };

  const toggleCategory = (cat: CategoryId) => {
    setActiveCategory((prev) => {
      const next = prev === cat ? null : cat;
      setRightTab("drill");
      setFocusFeature(null);
      setHighlightedFeature(null);
      return next;
    });
  };

  const handleIconClick = (info: {
    featureType: string;
    lon: number;
    lat: number;
  }) => {
    const ft = info.featureType as CategoryId;
    if (!CATEGORY_LABELS[ft]) return;
    highlightNonce.current += 1;
    setActiveCategory(ft);
    setRightTab("drill");
    setHighlightedFeature({
      featureType: ft,
      lon: info.lon,
      lat: info.lat,
      n: highlightNonce.current,
    });
  };

  const handleSelectFeature = (row: FeatureRow) => {
    if (!row.geometry) return;
    focusNonce.current += 1;
    setFocusFeature({
      lon: row.geometry.lon,
      lat: row.geometry.lat,
      n: focusNonce.current,
    });
  };

  const handleStreamComplete = () => {
    setRightTab("drill");
  };

  const handleToggleLayer = async (layerId: string, layer: CatalogLayer) => {
    if (enabledLayers.has(layerId)) {
      setEnabledLayers((prev) => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
      setMapInstructions((mi) => [
        ...mi,
        { action: "remove_by_label", layer_label: layerId },
      ]);
      return;
    }

    setEnabledLayers((prev) => {
      const next = new Set(prev);
      next.add(layerId);
      return next;
    });

    // Resolve which AGOL layer to query, or fall back to synthetic data
    const scenario = warningType || "tornado";
    const agolLayerId = layer.scenario_layers?.[scenario];

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer_id: agolLayerId || layerId,
          scenario,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const features = data.features || [];

      // Map layer IDs to icon feature types
      const LAYER_ICON_MAP: Record<string, string> = {
        infra_pharmacies: "pharmacy",
        infra_urgent_care: "urgent_care",
        infra_public_health: "public_health",
        infra_hospitals: "hospital",
        infra_nursing_homes: "dam_nursing_home",
        infra_dialysis: "dialysis",
        infra_fire_stations: "fire_station",
        infra_law_enforcement: "police",
        infra_public_schools: "school",
        infra_private_schools: "school",
        infra_colleges: "college",
        infra_mobile_homes: "mobile_home_park",
        infra_worship: "church",
        infra_snap: "grocery",
        infra_power_plants: "power_plant",
        infra_landfills: "landfill",
        infra_dams: "dam",
        infra_prisons: "prison",
        infra_wastewater: "dam_water_plant",
        infra_red_cross: "shelter",
        haz_stream_gauges: "stream_gauge",
        haz_river_flooding: "stream_gauge",
        haz_wildfire_points: "wildfire_point",
        haz_fire_weather: "wildfire_point",
        haz_tornado_tracks: "tornado_track",
        haz_seismic: "seismic",
        haz_national_risk: "census_tract",
        haz_wea: "weather_alert",
        haz_severe_outlook: "weather_alert",
        haz_excessive_rainfall: "weather_alert",
        haz_climate_outlooks: "weather_alert",
      };

      const featureType = LAYER_ICON_MAP[layerId] ||
        (layer.category === "community_resilience" ? "census_tract" : "medical");

      const newInstructions = features
        .filter((f: any) => f.geometry)
        .map((f: any) => ({
          action: "draw" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [f.geometry.x, f.geometry.y],
          },
          layer_label: layerId,
          style: { color: "#1e4a6d", label: f.attributes?.name || layer.name },
          featureType,
          displayLabel: f.attributes?.name || f.attributes?.tract_name || layer.name,
          attributes: f.attributes,
        }));

      if (newInstructions.length > 0) {
        setMapInstructions((mi) => [...mi, ...newInstructions]);
      }
    } catch {
      // Silently fail — layer toggle stays on visually
    }
  };

  const handleHome = () => {
    setActiveCategory(null);
    setRightTab("drill");
    setFocusFeature(null);
    setHighlightedFeature(null);
    setHomeSignal((s) => s + 1);
    setAccordionResetSignal((s) => s + 1);
  };

  const currentSections =
    warningType ? SCENARIO_CONFIG[warningType].sections : TORNADO_SECTIONS;
  const totalAssetCount = currentSections.reduce(
    (sum, s) => sum + counts[s.id],
    0
  );
  const drillTabAvailable = totalAssetCount > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const assistantText = messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .join("\n\n");

    const lines = [
      "PROJECT CASCADE — DEMO BRIEFING",
      eventId ? `Event: ${eventId}` : "",
      `Issued: ${new Date().toLocaleString()}`,
      "",
    ];
    if (metrics) {
      lines.push(
        `Residents in perimeter: ${metrics.pop.toLocaleString()} ` +
          `(${fmtPct(metrics.pctOver65)} over 65, ${fmtPct(metrics.pctLep)} limited English, ` +
          `${fmtPct(metrics.pctDisability)} with a disability)`
      );
      lines.push("");
    }
    if (assistantText) {
      lines.push(assistantText);
      lines.push("");
    }
    lines.push(`Map: ${window.location.href}`);

    const text = lines.filter((l) => l !== null && l !== undefined).join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-arc-cream dark:bg-arc-black overflow-hidden">
      <header className="bg-white dark:bg-arc-gray-900 border-b-2 border-arc-black dark:border-arc-cream px-4 py-1.5 print:border-b flex-shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" width="22" height="22" className="flex-shrink-0">
              <rect x="12" y="4" width="8" height="24" fill="#ED1B2E" />
              <rect x="4" y="12" width="24" height="8" fill="#ED1B2E" />
            </svg>
            <h1 className="font-headline text-sm font-bold text-arc-black dark:text-arc-cream">
              Project Cascade
            </h1>
            <span className="text-[10px] text-arc-gray-500 dark:text-arc-gray-300 italic hidden sm:inline">
              Anticipatory Mapping for Emergency Response
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HelpModal />
            <ThemeToggle />
            <TriggerButton onFired={handleTriggerFired} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex max-w-[1400px] w-full mx-auto px-4 py-3 gap-4 min-h-0">
        <section
          className="flex-[2] bg-white dark:bg-arc-gray-900 border border-arc-gray-100 dark:border-arc-gray-700 flex flex-col min-h-0"
        >
          {/* ── Emergency Dashboard Header ── */}
          <div className="border-b-2 border-arc-red bg-arc-black dark:bg-arc-black px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-arc-red flex-shrink-0 rounded-sm"></div>
              <div>
                <h2 className="font-headline text-base font-bold text-white tracking-wide uppercase">
                  {warningType === "wildfire"
                    ? "Shasta County, CA"
                    : warningType === "dam_break"
                    ? "Butte County, CA"
                    : "Cascade County"}
                </h2>
                <span className="text-[9px] text-arc-gray-400 font-data uppercase tracking-widest">
                  {warningType === "tornado" ? "Tornado Warning" : warningType === "wildfire" ? "Wildfire Evacuation" : warningType === "dam_break" ? "Dam Failure Alert" : "Active Event"} — Synthetic Data
                </span>
              </div>
            </div>
            {eventId && (
              <span className="text-[10px] font-data text-arc-gray-400 tracking-wider bg-arc-gray-800 px-2 py-1 rounded">{eventId}</span>
            )}
          </div>

          {/* ── KPI Cards ── */}
          {metrics && (
            <div className="border-b border-arc-gray-100 dark:border-arc-gray-700 bg-gradient-to-r from-arc-red/5 to-transparent dark:from-arc-red/10 dark:to-transparent px-3 py-2.5">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-arc-red rounded px-3 py-2 text-center shadow-sm">
                  <div className="text-2xl font-headline font-black text-white leading-none">{metrics.pop.toLocaleString()}</div>
                  <div className="text-[10px] font-data text-white/90 uppercase tracking-wider mt-1 font-bold">Residents at Risk</div>
                </div>
                <div className="bg-arc-black dark:bg-arc-gray-800 rounded px-3 py-2 text-center shadow-sm">
                  <div className="text-2xl font-headline font-black text-white leading-none">{fmtPct(metrics.pctOver65)}</div>
                  <div className="text-[10px] font-data text-white/80 uppercase tracking-wider mt-1 font-bold">Over 65</div>
                </div>
                <div className="bg-arc-black dark:bg-arc-gray-800 rounded px-3 py-2 text-center shadow-sm">
                  <div className="text-2xl font-headline font-black text-white leading-none">{fmtPct(metrics.pctLep)}</div>
                  <div className="text-[10px] font-data text-white/80 uppercase tracking-wider mt-1 font-bold">Limited English</div>
                </div>
                <div className="bg-arc-black dark:bg-arc-gray-800 rounded px-3 py-2 text-center shadow-sm">
                  <div className="text-2xl font-headline font-black text-white leading-none">{fmtPct(metrics.pctDisability)}</div>
                  <div className="text-[10px] font-data text-white/80 uppercase tracking-wider mt-1 font-bold">Disability</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Asset Category Buttons ── */}
          {totalAssetCount > 0 && (
            <div className="border-b border-arc-gray-100 dark:border-arc-gray-700 px-3 py-1.5 flex gap-1.5 flex-wrap">
              {currentSections.map((section) => (
                <Chip
                  key={section.id}
                  active={activeCategory === section.id}
                  onClick={() => toggleCategory(section.id)}
                  label={section.label}
                  count={counts[section.id]}
                  dot={section.dot}
                />
              ))}
            </div>
          )}

          <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
            <MapView
              mapInstructions={mapInstructions}
              clearSignal={clearSignal}
              activeCategory={activeCategory}
              focusFeature={focusFeature}
              homeSignal={homeSignal}
              onHome={handleHome}
              showHomeButton={drillTabAvailable}
              onIconClick={handleIconClick}
            />
          </div>
        </section>

        <section className="flex-1 bg-white dark:bg-arc-gray-900 border border-arc-gray-100 dark:border-arc-gray-700 flex flex-col min-h-0 max-w-md">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2">
            <div className="red-rule flex-1"></div>
            <div className="flex gap-1 print:hidden">
              <button
                onClick={handleCopy}
                disabled={messages.length === 0}
                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 border border-arc-gray-300 dark:border-arc-gray-700 text-arc-gray-900 dark:text-arc-cream hover:bg-arc-black hover:text-white hover:border-arc-black dark:hover:bg-arc-cream dark:hover:text-arc-black dark:hover:border-arc-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Copy briefing as text for email or SMS"
              >
                Copy
              </button>
              <button
                onClick={handlePrint}
                disabled={messages.length === 0}
                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 border border-arc-gray-300 dark:border-arc-gray-700 text-arc-gray-900 dark:text-arc-cream hover:bg-arc-black hover:text-white hover:border-arc-black dark:hover:bg-arc-cream dark:hover:text-arc-black dark:hover:border-arc-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Print the current briefing"
              >
                Print
              </button>
            </div>
          </div>

          <div className="flex border-b border-arc-gray-100 dark:border-arc-gray-700 px-2">
            <TabButton
              active={rightTab === "conversation"}
              onClick={() => setRightTab("conversation")}
              label="Conversation"
            />
            {drillTabAvailable && (
              <TabButton
                active={rightTab === "drill"}
                onClick={() => setRightTab("drill")}
                label={
                  activeCategory ? CATEGORY_LABELS[activeCategory] : "Assets"
                }
                count={
                  activeCategory ? counts[activeCategory] : totalAssetCount
                }
              />
            )}
            <TabButton
              active={rightTab === "layers"}
              onClick={() => setRightTab("layers")}
              label="Layers"
              count={enabledLayers.size > 0 ? enabledLayers.size : undefined}
            />
          </div>

          <div
            className="flex-1 flex flex-col min-h-0"
            style={{ display: rightTab === "conversation" ? "flex" : "none" }}
          >
            <ChatPanel
              messages={messages}
              setMessages={setMessages}
              triggerDirective={triggerDirective}
              scenarioId={scenarioId}
              onTriggerConsumed={() => setTriggerDirective(null)}
              onMapInstruction={handleMapInstruction}
              onStreamComplete={handleStreamComplete}
            />
          </div>

          {drillTabAvailable && (
            <div
              className="flex-1 flex flex-col min-h-0"
              style={{ display: rightTab === "drill" ? "flex" : "none" }}
            >
              {activeCategory ? (
                <AssetPanel
                  category={activeCategory}
                  features={features[activeCategory]}
                  onSelect={handleSelectFeature}
                  highlighted={
                    highlightedFeature &&
                    highlightedFeature.featureType === activeCategory
                      ? highlightedFeature
                      : null
                  }
                />
              ) : (
                <AllAssetsAccordion
                  sections={currentSections.map((s) => ({
                    id: s.id,
                    label: s.label,
                    dot: s.dot,
                  }))}
                  features={features}
                  onSelect={handleSelectFeature}
                  resetSignal={accordionResetSignal}
                />
              )}
            </div>
          )}

          <div
            className="flex-1 flex flex-col min-h-0"
            style={{ display: rightTab === "layers" ? "flex" : "none" }}
          >
            <LayerDiscovery
              enabledLayers={enabledLayers}
              onToggleLayer={handleToggleLayer}
              warningType={warningType}
            />
          </div>
        </section>
      </main>

    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-data uppercase tracking-widest text-arc-gray-500 dark:text-arc-gray-300">
        {label}
      </div>
      <div className="text-xl font-headline font-bold text-arc-black dark:text-arc-cream leading-tight mt-0.5">
        {value}
      </div>
      {suffix && (
        <div className="text-[10px] font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300 mt-0.5">
          {suffix}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors -mb-[1px] ${
        active
          ? "border-arc-red text-arc-black dark:text-arc-cream"
          : "border-transparent text-arc-gray-500 dark:text-arc-gray-300 hover:text-arc-black dark:hover:text-arc-cream"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`ml-1.5 text-[11px] font-data px-1.5 py-0.5 ${
            active
              ? "bg-arc-red text-white"
              : "bg-arc-cream dark:bg-arc-black text-arc-gray-900 dark:text-arc-cream"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot: string;
}) {
  const base =
    "flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold border transition-colors";
  const styles = active
    ? "bg-arc-black text-white border-arc-black dark:bg-arc-cream dark:text-arc-black dark:border-arc-cream"
    : "bg-white dark:bg-arc-gray-900 text-arc-gray-900 dark:text-arc-cream border-arc-gray-300 dark:border-arc-gray-700 hover:border-arc-black dark:hover:border-arc-cream";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: dot }}
      />
      <span>{label}</span>
      <span
        className={`text-[11px] font-data px-1.5 py-0.5 ${
          active
            ? "bg-white/20 text-white dark:bg-arc-black/20 dark:text-arc-black"
            : "bg-arc-cream dark:bg-arc-black text-arc-gray-900 dark:text-arc-cream"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function fmtPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function extractLonLat(geometry: any): [number, number] | null {
  if (!geometry) return null;

  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates[0], geometry.coordinates[1]];
  }

  if (typeof geometry.x === "number" && typeof geometry.y === "number") {
    if (Math.abs(geometry.x) > 200) {
      const lon = (geometry.x / 20037508.34) * 180;
      const latRadians = (geometry.y / 20037508.34) * Math.PI;
      const lat =
        (180 / Math.PI) *
        (2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
      return [lon, lat];
    }
    return [geometry.x, geometry.y];
  }

  return null;
}
