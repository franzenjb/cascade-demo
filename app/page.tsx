"use client";

import { useRef, useState } from "react";
import MapView from "@/components/MapView";
import ChatPanel from "@/components/ChatPanel";
import TriggerButton from "@/components/TriggerButton";
import AssetPanel from "@/components/AssetPanel";
import AllAssetsAccordion from "@/components/AllAssetsAccordion";
import ThemeToggle from "@/components/ThemeToggle";
import HelpModal from "@/components/HelpModal";
import type { ChatMessage, FeatureRow, MapInstruction } from "@/lib/types";

type CategoryId = "mobile_home_park" | "school" | "medical" | "red_cross";

interface Metrics {
  pop: number;
  pctOver65: number;
  pctLep: number;
  pctDisability: number;
  tractCount: number;
}

interface CategoryCounts {
  mobile_home_park: number;
  school: number;
  medical: number;
  red_cross: number;
}

type FeaturesByCategory = Record<CategoryId, FeatureRow[]>;

const EMPTY_COUNTS: CategoryCounts = {
  mobile_home_park: 0,
  school: 0,
  medical: 0,
  red_cross: 0,
};

const EMPTY_FEATURES: FeaturesByCategory = {
  mobile_home_park: [],
  school: [],
  medical: [],
  red_cross: [],
};

const CATEGORY_LABELS: Record<CategoryId, string> = {
  mobile_home_park: "Mobile Home Parks",
  school: "Schools",
  medical: "Medical",
  red_cross: "Red Cross Assets",
};

type RightTab = "conversation" | "drill";

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
  const [focusFeature, setFocusFeature] = useState<FocusFeature | null>(null);
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
    warningType: "tornado" | "wildfire",
    nwsEventId: string | null
  ) => {
    setMessages([]);
    setMapInstructions([]);
    setClearSignal((c) => c + 1);
    setCounts(EMPTY_COUNTS);
    setFeatures(EMPTY_FEATURES);
    setMetrics(null);
    setActiveCategory(null);
    setRightTab("conversation");
    setFocusFeature(null);
    setHighlightedFeature(null);
    setScenarioId(sid);
    setEventId(
      nwsEventId || `DEMO-${warningType.toUpperCase()}-${new Date().getFullYear()}-0001`
    );
    setTriggerDirective(directive);

    if (!polygon) return;

    const polygonStyle =
      warningType === "wildfire"
        ? {
            color: "#E85D04",
            opacity: 0.18,
            label: "Fire Perimeter",
            scale: 150000,
          }
        : {
            color: "#ED1B2E",
            opacity: 0.15,
            label: "Tornado Warning",
            scale: 150000,
          };
    const layerLabel =
      warningType === "wildfire" ? "Fire Perimeter" : "Tornado Warning";

    setMapInstructions((prev) => [
      ...prev,
      {
        action: "draw",
        geometry: polygon as any,
        style: polygonStyle,
        layer_label: layerLabel,
      },
    ]);

    loadMetrics(polygon);
    renderFeaturesInsidePolygon(polygon);
  };

  const loadMetrics = async (polygon: unknown) => {
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer_id: "DEMO_Cascade_Census_Tracts",
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

  const renderFeaturesInsidePolygon = async (polygon: unknown) => {
    const layers: Array<{ id: string; featureType: CategoryId; label: string }> = [
      { id: "DEMO_Cascade_Mobile_Home_Parks", featureType: "mobile_home_park", label: "Mobile Home Park" },
      { id: "DEMO_Cascade_Schools", featureType: "school", label: "School" },
      { id: "DEMO_Cascade_Medical_Facilities", featureType: "medical", label: "Medical Facility" },
    ];

    for (const layer of layers) {
      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer_id: layer.id,
            geometry: polygon,
            return_geometry: true,
          }),
        });
        const data = await res.json();
        if (!data.features) continue;

        setCounts((c) => ({ ...c, [layer.featureType]: data.features.length }));
        setFeatures((f) => ({
          ...f,
          [layer.featureType]: data.features.map((feat: any) => {
            const c = extractLonLat(feat.geometry);
            return {
              attributes: feat.attributes || {},
              geometry: c ? { lon: c[0], lat: c[1] } : undefined,
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
            layer.label;

          setMapInstructions((prev) => [
            ...prev,
            {
              action: "draw",
              geometry: { type: "Point", coordinates: coords },
              style: { label: displayLabel },
              layer_label: layer.label,
              ...({
                featureType: layer.featureType,
                attributes: feature.attributes,
                displayLabel,
              } as any),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch " + layer.id, err);
      }
    }

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer_id: "DEMO_Cascade_Red_Cross_Assets",
          return_geometry: true,
        }),
      });
      const data = await res.json();
      if (data.features) {
        setCounts((c) => ({ ...c, red_cross: data.features.length }));
        setFeatures((f) => ({
          ...f,
          red_cross: data.features.map((feat: any) => {
            const c = extractLonLat(feat.geometry);
            return {
              attributes: feat.attributes || {},
              geometry: c ? { lon: c[0], lat: c[1] } : undefined,
            };
          }),
        }));

        for (const feature of data.features) {
          const coords = extractLonLat(feature.geometry);
          if (!coords) continue;

          const displayLabel =
            feature.attributes?.asset_name ||
            feature.attributes?.name ||
            "Red Cross Asset";

          setMapInstructions((prev) => [
            ...prev,
            {
              action: "draw",
              geometry: { type: "Point", coordinates: coords },
              style: { label: displayLabel },
              layer_label: "Red Cross Asset",
              ...({
                featureType: "red_cross",
                attributes: feature.attributes,
                displayLabel,
              } as any),
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Red Cross assets", err);
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

  const handleHome = () => {
    setActiveCategory(null);
    setRightTab("drill");
    setFocusFeature(null);
    setHighlightedFeature(null);
    setHomeSignal((s) => s + 1);
    setAccordionResetSignal((s) => s + 1);
  };

  const totalAssetCount =
    counts.mobile_home_park + counts.school + counts.medical + counts.red_cross;
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
        `Population in warning footprint: ${metrics.pop.toLocaleString()} ` +
          `(${fmtPct(metrics.pctOver65)} over 65, ${fmtPct(metrics.pctLep)} LEP, ` +
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
    <div className="min-h-screen flex flex-col bg-arc-cream dark:bg-arc-black">
      <header className="bg-white dark:bg-arc-gray-900 border-b-[3px] border-arc-black dark:border-arc-cream py-6 print:border-b">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <rect x="12" y="4" width="8" height="24" fill="#ED1B2E" />
              <rect x="4" y="12" width="24" height="8" fill="#ED1B2E" />
            </svg>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-arc-red">
                Project Cascade · Demo
              </div>
              <h1 className="font-headline text-2xl font-bold text-arc-black dark:text-arc-cream mt-1">
                Before You Even Ask
              </h1>
              <div className="text-sm text-arc-gray-500 dark:text-arc-gray-300 italic">
                Conversational, Anticipatory Mapping for the Non-GIS Responder
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HelpModal />
            <ThemeToggle />
            <TriggerButton onFired={handleTriggerFired} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex max-w-[1400px] w-full mx-auto px-6 py-6 gap-6">
        <section
          className="flex-[2] bg-white dark:bg-arc-gray-900 border border-arc-gray-100 dark:border-arc-gray-700 flex flex-col"
          style={{ height: "760px" }}
        >
          <div className="border-b border-arc-gray-100 dark:border-arc-gray-700 p-4">
            <div className="red-rule mb-2"></div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline text-lg font-bold text-arc-black dark:text-arc-cream">
                  Cascade County
                </h2>
                <p className="text-xs text-arc-gray-500 dark:text-arc-gray-300 font-data uppercase tracking-wider mt-1">
                  Synthetic demonstration data
                </p>
              </div>
              {eventId && (
                <div className="text-right">
                  <div className="text-[10px] font-data uppercase tracking-widest text-arc-gray-500 dark:text-arc-gray-300">
                    Event
                  </div>
                  <div className="text-xs font-data text-arc-black dark:text-arc-cream">{eventId}</div>
                </div>
              )}
            </div>
          </div>

          {metrics && (
            <div className="border-b border-arc-gray-100 dark:border-arc-gray-700 bg-arc-cream/50 dark:bg-arc-black/40 px-4 py-3 grid grid-cols-4 gap-3">
              <Metric label="In footprint" value={metrics.pop.toLocaleString()} suffix="residents" />
              <Metric label="Age 65+" value={fmtPct(metrics.pctOver65)} />
              <Metric label="Limited English" value={fmtPct(metrics.pctLep)} />
              <Metric label="With disability" value={fmtPct(metrics.pctDisability)} />
            </div>
          )}

          {(counts.mobile_home_park ||
            counts.school ||
            counts.medical ||
            counts.red_cross) > 0 && (
            <div className="border-b border-arc-gray-100 dark:border-arc-gray-700 px-4 py-3 flex gap-2 flex-wrap">
              <Chip
                active={activeCategory === "mobile_home_park"}
                onClick={() => toggleCategory("mobile_home_park")}
                label="Mobile Home Parks"
                count={counts.mobile_home_park}
                dot="#ED1B2E"
              />
              <Chip
                active={activeCategory === "school"}
                onClick={() => toggleCategory("school")}
                label="Schools"
                count={counts.school}
                dot="#1E4A6D"
              />
              <Chip
                active={activeCategory === "medical"}
                onClick={() => toggleCategory("medical")}
                label="Medical"
                count={counts.medical}
                dot="#2D2D2D"
              />
              <Chip
                active={activeCategory === "red_cross"}
                onClick={() => toggleCategory("red_cross")}
                label="Red Cross Assets"
                count={counts.red_cross}
                dot="#ED1B2E"
              />
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

        <section className="flex-1 bg-white dark:bg-arc-gray-900 border border-arc-gray-100 dark:border-arc-gray-700 flex flex-col min-h-[760px] max-w-md">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
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
                  features={features}
                  onSelect={handleSelectFeature}
                  resetSignal={accordionResetSignal}
                />
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white dark:bg-arc-gray-900 border-t-[3px] border-arc-black dark:border-arc-cream py-6 mt-6 print:hidden">
        <div className="max-w-[1400px] mx-auto px-6 text-sm text-arc-gray-500 dark:text-arc-gray-300">
          <div className="font-headline font-bold text-arc-black dark:text-arc-cream mb-1">
            Project Cascade
          </div>
          <p>
            A working demo companion to the strategic white paper by Jeff Franzen.
            All data is synthetic; no real individuals, facilities, or locations are represented.
            Full paper forthcoming.
          </p>
        </div>
      </footer>
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
      className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-[1px] ${
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
    "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-colors";
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
