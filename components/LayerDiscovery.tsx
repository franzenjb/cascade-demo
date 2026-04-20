"use client";

import { useMemo, useState } from "react";
import type { CatalogLayer, LayerCategory, ScenarioWarningType } from "@/lib/types";
import { getLayersByCategory, searchLayers } from "@/lib/layer_discovery";

// ─── Category display config ───────────────────────────────

const CATEGORY_META: Record<
  LayerCategory,
  { label: string; accent: string; order: number }
> = {
  infrastructure: { label: "Infrastructure", accent: "#1e4a6d", order: 0 },
  community_resilience: { label: "Community Resilience", accent: "#b8860b", order: 1 },
  hazards_weather: { label: "Hazards & Weather", accent: "#ED1B2E", order: 2 },
};

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  live: { dot: "#2d5a27", label: "Live" },
  demo: { dot: "#1e4a6d", label: "Demo" },
  coming_soon: { dot: "#a3a3a3", label: "Coming Soon" },
};

// ─── Props ─────────────────────────────────────────────────

interface LayerDiscoveryProps {
  enabledLayers: Set<string>;
  onToggleLayer: (layerId: string, layer: CatalogLayer) => void;
  warningType: ScenarioWarningType | null;
}

// ─── Component ─────────────────────────────────────────────

export default function LayerDiscovery({
  enabledLayers,
  onToggleLayer,
  warningType,
}: LayerDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    infrastructure: true,
    community_resilience: false,
    hazards_weather: false,
  });
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => getLayersByCategory(), []);

  const filteredLayers = useMemo(() => {
    if (!query.trim()) return null; // null = show grouped view
    return searchLayers(query);
  }, [query]);

  const toggleCat = (cat: string) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const toggleSub = (key: string) =>
    setOpenSubs((prev) => ({ ...prev, [key]: !prev[key] }));

  // Count active (demo/live) layers per category
  const catCounts = useMemo(() => {
    const counts: Record<string, { active: number; total: number }> = {};
    for (const [cat, subs] of Object.entries(grouped)) {
      let active = 0;
      let total = 0;
      for (const layers of Object.values(subs)) {
        total += layers.length;
        active += layers.filter((l) => l.status !== "coming_soon").length;
      }
      counts[cat] = { active, total };
    }
    return counts;
  }, [grouped]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search */}
      <div className="px-3 py-2 border-b border-arc-gray-100 dark:border-arc-gray-700">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-arc-gray-500"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="6.5" cy="6.5" r="5" />
            <line x1="10" y1="10" x2="15" y2="15" />
          </svg>
          <input
            type="text"
            placeholder="Search layers... (e.g. pharmacy, flood, nursing home)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-arc-cream dark:bg-arc-black/60 border border-arc-gray-100 dark:border-arc-gray-700 text-arc-black dark:text-arc-cream placeholder:text-arc-gray-500 dark:placeholder:text-arc-gray-300 focus:outline-none focus:border-arc-red transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-arc-gray-500 hover:text-arc-black dark:hover:text-arc-cream text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredLayers ? (
          /* ─── Search results (flat list) ─── */
          <div>
            <div className="px-3 py-1.5 text-[10px] font-data text-arc-gray-500 dark:text-arc-gray-300 uppercase tracking-wider border-b border-arc-gray-100 dark:border-arc-gray-700">
              {filteredLayers.length} result{filteredLayers.length !== 1 ? "s" : ""}
            </div>
            {filteredLayers.length === 0 ? (
              <div className="px-4 py-6 text-xs text-arc-gray-500 dark:text-arc-gray-300 text-center">
                No matching layers. Try a different search term.
              </div>
            ) : (
              <div className="divide-y divide-arc-gray-100 dark:divide-arc-gray-700">
                {filteredLayers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    enabled={enabledLayers.has(layer.id)}
                    onToggle={onToggleLayer}
                    warningType={warningType}
                    showCategory
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ─── Grouped accordion view ─── */
          (Object.entries(CATEGORY_META) as [LayerCategory, typeof CATEGORY_META[LayerCategory]][])
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([catKey, catMeta]) => {
              const subs = grouped[catKey];
              const isOpen = openCats[catKey];
              const counts = catCounts[catKey];

              return (
                <div key={catKey} className="border-b border-arc-gray-100 dark:border-arc-gray-700">
                  {/* Category header */}
                  <button
                    type="button"
                    onClick={() => toggleCat(catKey)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-arc-cream/40 dark:hover:bg-arc-black/40 transition-colors text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="w-1 h-5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: catMeta.accent }}
                    />
                    <span className="text-sm font-semibold text-arc-black dark:text-arc-cream flex-1">
                      {catMeta.label}
                    </span>
                    <span className="text-[10px] font-data text-arc-gray-500 dark:text-arc-gray-300">
                      {counts.active > 0 && (
                        <span className="text-arc-black dark:text-arc-cream font-bold">{counts.active}</span>
                      )}
                      {counts.active > 0 && " / "}
                      {counts.total}
                    </span>
                    <Chevron open={isOpen} />
                  </button>

                  {/* Subcategories */}
                  {isOpen && (
                    <div className="border-t border-arc-gray-100 dark:border-arc-gray-700">
                      {Object.entries(subs).map(([subName, layers]) => {
                        const subKey = `${catKey}__${subName}`;
                        const subOpen = openSubs[subKey] !== false; // default open
                        return (
                          <div key={subKey}>
                            <button
                              type="button"
                              onClick={() => toggleSub(subKey)}
                              className="w-full flex items-center gap-2 px-6 py-2 hover:bg-arc-cream/30 dark:hover:bg-arc-black/30 transition-colors text-left"
                              aria-expanded={subOpen}
                            >
                              <span className="text-[11px] font-semibold text-arc-gray-500 dark:text-arc-gray-300 uppercase tracking-wider flex-1">
                                {subName}
                              </span>
                              <span className="text-[10px] font-data text-arc-gray-500 dark:text-arc-gray-300">
                                {layers.length}
                              </span>
                              <Chevron open={subOpen} />
                            </button>

                            {subOpen && (
                              <div className="divide-y divide-arc-gray-100 dark:divide-arc-gray-700">
                                {layers.map((layer) => (
                                  <LayerRow
                                    key={layer.id}
                                    layer={layer}
                                    enabled={enabledLayers.has(layer.id)}
                                    onToggle={onToggleLayer}
                                    warningType={warningType}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

// ─── Layer Row ─────────────────────────────────────────────

function LayerRow({
  layer,
  enabled,
  onToggle,
  warningType,
  showCategory,
}: {
  layer: CatalogLayer;
  enabled: boolean;
  onToggle: (id: string, layer: CatalogLayer) => void;
  warningType: ScenarioWarningType | null;
  showCategory?: boolean;
}) {
  const status = STATUS_CONFIG[layer.status];
  const isToggleable =
    layer.status !== "coming_soon" &&
    warningType !== null &&
    layer.scenario_layers?.[warningType] != null;
  const isComingSoon = layer.status === "coming_soon";

  return (
    <div
      className={`flex items-center gap-3 px-6 py-2.5 text-left transition-colors ${
        isComingSoon
          ? "opacity-50"
          : "hover:bg-arc-cream/40 dark:hover:bg-arc-black/40"
      }`}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: status.dot }}
        title={status.label}
      />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-arc-black dark:text-arc-cream truncate">
          {layer.name}
        </div>
        <div className="text-[10px] text-arc-gray-500 dark:text-arc-gray-300 truncate">
          {showCategory && (
            <span className="font-data uppercase tracking-wider">
              {CATEGORY_META[layer.category]?.label} ·{" "}
            </span>
          )}
          {layer.source}
          {isComingSoon && " · Coming Soon"}
        </div>
      </div>

      {/* Toggle or badge */}
      {isToggleable ? (
        <button
          type="button"
          onClick={() => onToggle(layer.id, layer)}
          className={`w-8 h-4.5 rounded-full relative transition-colors flex-shrink-0 ${
            enabled
              ? "bg-arc-red"
              : "bg-arc-gray-300 dark:bg-arc-gray-700"
          }`}
          title={enabled ? "Hide layer" : "Show layer"}
        >
          <span
            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
              enabled ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      ) : isComingSoon ? (
        <svg
          className="w-3 h-3 text-arc-gray-300 dark:text-arc-gray-700 flex-shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1a4 4 0 0 0-4 4v3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm-2 4a2 2 0 1 1 4 0v3H6V5z" />
        </svg>
      ) : (
        <span className="text-[9px] font-data text-arc-gray-500 dark:text-arc-gray-300 uppercase tracking-wider flex-shrink-0">
          {status.label}
        </span>
      )}
    </div>
  );
}

// ─── Shared Chevron ────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-arc-gray-500 dark:text-arc-gray-300 transition-transform ${
        open ? "rotate-90" : ""
      }`}
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 2 L8 6 L4 10 Z" />
    </svg>
  );
}
