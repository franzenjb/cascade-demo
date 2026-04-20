"use client";

import { useEffect, useRef, useState } from "react";
import type { MapInstruction } from "@/lib/types";

interface MapViewProps {
  mapInstructions: MapInstruction[];
  clearSignal?: number;
  activeCategory?: string | null;
  focusFeature?: { lon: number; lat: number; n: number } | null;
  homeSignal?: number;
  onHome?: () => void;
  showHomeButton?: boolean;
  onIconClick?: (info: {
    featureType: string;
    lon: number;
    lat: number;
  }) => void;
}

/**
 * ArcGIS Maps SDK wrapper.
 *
 * Each MapInstruction with a point geometry produces TWO graphics: one
 * picture-marker icon and one below-the-dot label. They share a
 * `_featureType` attribute so the activeCategory effect can emphasize,
 * dim, or hide them as a pair.
 *
 * Labels are always on (no hover required) so the map reads at a glance
 * during demos and screenshots.
 *
 * We never instantiate a client-side FeatureLayer against a private AGOL
 * item — that surfaces a username/password modal, and Dragon's account
 * is 2FA/OAuth-only. If we need the county outline back, fetch the
 * geometry server-side and draw it as a Graphic here. See docs/IDEAS.md.
 */
type Theme = "light" | "dark";

const BASEMAPS: { name: string; id: string; mode: Theme }[] = [
  { name: "Light", id: "topo-vector", mode: "light" },
  { name: "Dark", id: "dark-gray-vector", mode: "dark" },
  { name: "Streets", id: "streets-vector", mode: "light" },
  { name: "Satellite", id: "hybrid", mode: "dark" },
];

function getInitialBasemapIdx(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem("cascade-basemap");
    if (stored) {
      const idx = BASEMAPS.findIndex((b) => b.id === stored);
      if (idx >= 0) return idx;
    }
  } catch {}
  return 0;
}

export default function MapView({
  mapInstructions,
  clearSignal,
  activeCategory,
  focusFeature,
  homeSignal,
  onHome,
  showHomeButton,
  onIconClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const graphicsLayerRef = useRef<any>(null);
  const lastProcessedIndex = useRef<number>(-1);
  const onIconClickRef = useRef(onIconClick);
  const [bmIdx, setBmIdx] = useState<number>(getInitialBasemapIdx());
  const [pickerOpen, setPickerOpen] = useState(false);
  const themeRef = useRef<Theme>(BASEMAPS[getInitialBasemapIdx()].mode);

  useEffect(() => {
    onIconClickRef.current = onIconClick;
  }, [onIconClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    async function initMap() {
      const [Map, MapView, GraphicsLayer] = await Promise.all([
        import("@arcgis/core/Map"),
        import("@arcgis/core/views/MapView"),
        import("@arcgis/core/layers/GraphicsLayer"),
      ]);

      if (destroyed) return;

      const map = new Map.default({ basemap: BASEMAPS[getInitialBasemapIdx()].id });

      const graphicsLayer = new GraphicsLayer.default({ title: "AI Analysis" });
      map.add(graphicsLayer);
      graphicsLayerRef.current = graphicsLayer;

      const view = new MapView.default({
        container: containerRef.current!,
        map,
        center: [-81.5, 36.0],
        zoom: 10,
        ui: { components: ["zoom", "attribution"] },
        popup: {
          dockEnabled: false,
          dockOptions: { buttonEnabled: false, breakpoint: false },
        },
      });

      viewRef.current = view;

      view.on("click", async (event: any) => {
        const fn = onIconClickRef.current;
        if (!fn) return;
        try {
          const response = await view.hitTest(event);
          const hit = (response.results as any[]).find(
            (r) => r?.graphic?.attributes?._role === "icon"
          );
          if (!hit) return;
          const attrs = hit.graphic.attributes || {};
          const geom = hit.graphic.geometry;
          const lon = typeof geom?.longitude === "number" ? geom.longitude : geom?.x;
          const lat = typeof geom?.latitude === "number" ? geom.latitude : geom?.y;
          if (attrs._featureType && typeof lon === "number" && typeof lat === "number") {
            fn({ featureType: attrs._featureType, lon, lat });
          }
        } catch {}
      });
    }

    initMap().catch((err) => {
      console.error("MapView init failed:", err);
    });

    return () => {
      destroyed = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (graphicsLayerRef.current && clearSignal !== undefined) {
      graphicsLayerRef.current.removeAll();
      lastProcessedIndex.current = -1;
    }
  }, [clearSignal]);

  useEffect(() => {
    if (!graphicsLayerRef.current || mapInstructions.length === 0) return;

    async function applyNew() {
      const [Graphic, Polygon, Point] = await Promise.all([
        import("@arcgis/core/Graphic"),
        import("@arcgis/core/geometry/Polygon"),
        import("@arcgis/core/geometry/Point"),
      ]);

      const startIndex = lastProcessedIndex.current + 1;
      const newOnes = mapInstructions.slice(startIndex);

      for (const inst of newOnes) {
        if (inst.action === "clear") {
          graphicsLayerRef.current.removeAll();
          continue;
        }
        if (inst.action === "remove_by_label" && inst.layer_label) {
          const toRemove = graphicsLayerRef.current.graphics.filter(
            (g: any) => g.attributes?.layer_label === inst.layer_label
          );
          toRemove.forEach((g: any) => graphicsLayerRef.current.remove(g));
          continue;
        }
        if (inst.action !== "draw" || !inst.geometry) continue;

        const color = inst.style?.color || "#ED1B2E";
        const label = inst.style?.label || inst.layer_label || "";
        const featureType = (inst as any).featureType || "generic";
        const displayLabel = (inst as any).displayLabel || label;

        if (inst.geometry.type === "Polygon") {
          const geom = new Polygon.default({
            rings: inst.geometry.coordinates as any,
            spatialReference: { wkid: 4326 },
          });
          const warningScale = inst.style?.scale ?? 150000;
          const graphic = new Graphic.default({
            geometry: geom,
            symbol: {
              type: "simple-fill",
              color: [...hexToRgb(color), 0.15],
              outline: { color: hexToRgb(color), width: 3 },
            } as any,
            attributes: { _role: "warning", label, _scale: warningScale },
          });
          graphicsLayerRef.current.add(graphic);
          viewRef.current?.goTo({ target: graphic, scale: warningScale }).catch(() => {});
        } else if (inst.geometry.type === "Point") {
          const pt = new Point.default({
            x: inst.geometry.coordinates[0],
            y: inst.geometry.coordinates[1],
            spatialReference: { wkid: 4326 },
          });

          const iconGraphic = new Graphic.default({
            geometry: pt,
            symbol: iconSymbol(featureType, "normal", themeRef.current),
            attributes: {
              ...((inst as any).attributes || {}),
              _featureType: featureType,
              _role: "icon",
              _displayLabel: displayLabel,
              layer_label: inst.layer_label || "",
            },
            popupTemplate: popupTemplateForFeatureType(
              featureType,
              (inst as any).attributes,
              label
            ) as any,
          });
          graphicsLayerRef.current.add(iconGraphic);

          if (displayLabel) {
            const labelGraphic = new Graphic.default({
              geometry: pt,
              symbol: labelSymbol(displayLabel, "normal", themeRef.current),
              visible: false,
              attributes: {
                _featureType: featureType,
                _role: "label",
                _displayLabel: displayLabel,
                layer_label: inst.layer_label || "",
              },
            });
            graphicsLayerRef.current.add(labelGraphic);
          }
        }
      }

      lastProcessedIndex.current = mapInstructions.length - 1;
    }

    applyNew().catch(console.error);
  }, [mapInstructions]);

  useEffect(() => {
    if (!graphicsLayerRef.current) return;

    const matchingIcons: any[] = [];
    graphicsLayerRef.current.graphics.forEach((g: any) => {
      const attrs = g.attributes || {};
      const role = attrs._role;
      const ft = attrs._featureType;
      if (!role || role === "warning") return;

      if (role === "icon") {
        if (!activeCategory) {
          g.symbol = iconSymbol(ft, "normal", themeRef.current);
          g.visible = true;
        } else if (ft === activeCategory) {
          g.symbol = iconSymbol(ft, "highlight", themeRef.current);
          g.visible = true;
          matchingIcons.push(g);
        } else {
          g.symbol = iconSymbol(ft, "dim", themeRef.current);
          g.visible = true;
        }
      } else if (role === "label") {
        const displayLabel = attrs._displayLabel || "";
        if (activeCategory && ft === activeCategory) {
          g.symbol = labelSymbol(displayLabel, "highlight", themeRef.current);
          g.visible = true;
        } else {
          g.visible = false;
        }
      }
    });

    if (activeCategory && matchingIcons.length > 0 && viewRef.current) {
      if (matchingIcons.length === 1) {
        viewRef.current
          .goTo({ target: matchingIcons[0].geometry, zoom: 14 })
          .catch(() => {});
      } else {
        viewRef.current
          .goTo({
            target: matchingIcons,
            padding: { top: 60, left: 60, right: 60, bottom: 60 },
          })
          .catch(() => {});
      }
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!focusFeature || !viewRef.current) return;
    let cancelled = false;
    (async () => {
      const Point = (await import("@arcgis/core/geometry/Point")).default;
      if (cancelled || !viewRef.current) return;
      const pt = new Point({
        x: focusFeature.lon,
        y: focusFeature.lat,
        spatialReference: { wkid: 4326 },
      });
      viewRef.current.goTo({ target: pt, zoom: 15 }).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [focusFeature]);

  useEffect(() => {
    if (!homeSignal || !graphicsLayerRef.current || !viewRef.current) return;
    fitToWarning();
  }, [homeSignal]);

  useEffect(() => {
    if (!viewRef.current?.map) return;
    const bm = BASEMAPS[bmIdx];
    viewRef.current.map.basemap = bm.id;
    themeRef.current = bm.mode;
    try {
      localStorage.setItem("cascade-basemap", bm.id);
    } catch {}
    repaintGraphics(bm.mode);
  }, [bmIdx]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-basemap-picker]")) return;
      setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  function repaintGraphics(theme: Theme) {
    if (!graphicsLayerRef.current) return;
    graphicsLayerRef.current.graphics.forEach((g: any) => {
      const attrs = g.attributes || {};
      if (attrs._role === "icon") {
        const ft = attrs._featureType || "generic";
        const isActive = !activeCategory || ft === activeCategory;
        const isDimmed = activeCategory && ft !== activeCategory;
        const mode = isDimmed ? "dim" : isActive && activeCategory ? "highlight" : "normal";
        g.symbol = iconSymbol(ft, mode, theme);
      } else if (attrs._role === "label") {
        const displayLabel = attrs._displayLabel || "";
        const isActive = activeCategory && attrs._featureType === activeCategory;
        g.symbol = labelSymbol(displayLabel, isActive ? "highlight" : "normal", theme);
      }
    });
  }

  function fitToWarning() {
    if (!graphicsLayerRef.current || !viewRef.current) return;
    let warning: any = null;
    graphicsLayerRef.current.graphics.forEach((g: any) => {
      if (g.attributes?._role === "warning") warning = g;
    });
    if (warning) {
      const scale = warning.attributes?._scale ?? 150000;
      viewRef.current.goTo({ target: warning, scale }).catch(() => {});
    }
  }

  function handleHomeClick() {
    fitToWarning();
    onHome?.();
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {showHomeButton && (
        <button
          type="button"
          onClick={handleHomeClick}
          title="Reset view to warning footprint"
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white dark:bg-arc-gray-900 border-2 border-arc-black dark:border-arc-cream px-3 py-2 text-xs font-semibold uppercase tracking-wider text-arc-black dark:text-arc-cream hover:bg-arc-black hover:text-white dark:hover:bg-arc-cream dark:hover:text-arc-black transition-colors shadow-md"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden>
            <path d="M8 1 L1 7 L3 7 L3 14 L6 14 L6 9 L10 9 L10 14 L13 14 L13 7 L15 7 Z" />
          </svg>
          Home
        </button>
      )}

      {pickerOpen && (
        <div
          data-basemap-picker
          className="absolute bottom-20 right-3 z-30 bg-black/90 backdrop-blur rounded-lg overflow-hidden min-w-[140px] shadow-xl"
        >
          {BASEMAPS.map((bm, i) => {
            const isActive = i === bmIdx;
            return (
              <button
                key={bm.id}
                type="button"
                onClick={() => {
                  setBmIdx(i);
                  setPickerOpen(false);
                }}
                className={`block w-full text-left text-xs py-2.5 px-4 border-b border-white/10 last:border-b-0 transition-colors ${
                  isActive
                    ? "bg-arc-red/25 text-white font-bold"
                    : "text-white/70 font-normal hover:bg-white/5"
                }`}
              >
                {bm.name}
              </button>
            );
          })}
        </div>
      )}
      <button
        data-basemap-picker
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        title="Change basemap"
        className="absolute bottom-8 right-3 z-20 w-9 h-9 rounded-lg bg-black/85 backdrop-blur flex items-center justify-center shadow-lg hover:bg-black/95 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/**
 * Distinct icons per feature type. Picture-marker with an inline SVG so
 * we don't ship image assets and the design stays with the code.
 *
 * `mode`:
 *   normal    — default size
 *   highlight — slightly larger, full-color SVG
 *   dim       — small muted simple-marker (picture markers don't alpha
 *               nicely, so we swap the symbol type when dimmed)
 */
function iconSymbol(
  featureType: string,
  mode: "normal" | "highlight" | "dim",
  theme: Theme = "light"
): any {
  if (mode === "dim") {
    const dimColor = theme === "dark" ? [200, 200, 200, 0.35] : [170, 170, 170, 0.35];
    const outlineColor = theme === "dark" ? [60, 60, 60, 0.6] : [255, 255, 255, 0.4];
    return {
      type: "simple-marker",
      style: "circle",
      color: dimColor,
      size: 8,
      outline: { color: outlineColor, width: 1 },
    };
  }

  const size = mode === "highlight" ? 34 : 28;
  const svg = svgForType(featureType, theme);

  return {
    type: "picture-marker",
    url: `data:image/svg+xml;base64,${base64(svg)}`,
    width: `${size}px`,
    height: `${size}px`,
  };
}

function labelSymbol(
  text: string,
  mode: "normal" | "highlight",
  theme: Theme = "light"
): any {
  if (!text) return null;
  const isHighlight = mode === "highlight";
  const isDark = theme === "dark";
  return {
    type: "text",
    text,
    color: isDark ? [247, 245, 242, 1] : [26, 26, 26, 1],
    haloColor: isDark ? [26, 26, 26, 0.95] : [255, 255, 255, 0.95],
    haloSize: 2,
    yoffset: -20,
    font: {
      size: isHighlight ? 11 : 10,
      family: "Arial Unicode MS",
      weight: isHighlight ? "bold" : "normal",
    },
  };
}

function svgForType(featureType: string, theme: Theme = "light"): string {
  const medicalFill = theme === "dark" ? "#f7f5f2" : "#2D2D2D";
  const medicalStripe = theme === "dark" ? "#2D2D2D" : "#ffffff";
  const medicalStroke = "#ffffff";

  switch (featureType) {
    case "mobile_home_park":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#ED1B2E" stroke="#ffffff" stroke-width="2"/>
  <path d="M8.5 17 L16 9.5 L23.5 17 L23.5 23 L8.5 23 Z" fill="#ffffff"/>
  <rect x="14" y="18" width="4" height="5" fill="#ED1B2E"/>
</svg>`.trim();

    case "school":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#E85D04" stroke="#ffffff" stroke-width="2"/>
  <path d="M6 14 L16 9 L26 14 L16 19 Z" fill="#ffffff"/>
  <path d="M10 16 L10 20 C10 22 13 23 16 23 C19 23 22 22 22 20 L22 16" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="14" x2="24" y2="19" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
</svg>`.trim();

    case "medical":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="${medicalFill}" stroke="${medicalStroke}" stroke-width="2"/>
  <rect x="14" y="8" width="4" height="16" fill="${medicalStripe}"/>
  <rect x="8" y="14" width="16" height="4" fill="${medicalStripe}"/>
</svg>`.trim();

    case "red_cross":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect x="2" y="2" width="28" height="28" rx="3" fill="#ffffff" stroke="#ED1B2E" stroke-width="2"/>
  <rect x="14" y="7" width="4" height="18" fill="#ED1B2E"/>
  <rect x="7" y="14" width="18" height="4" fill="#ED1B2E"/>
</svg>`.trim();

    case "fire_station":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#E85D04" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 8 C17 11 20 12 20 16 C20 17 19.5 17.5 19 18 C19.5 17 19 16 18 15.5 C18 17 17 18 16 18 C15 18 14 17.5 14 16 C14 17 13 18 12.5 19 C12 18 11.5 17 11.5 16 C11.5 13 14 12 15 10 C15 11.5 15.5 12 16 12 C16 11 16 9.5 16 8 Z" fill="#ffffff"/>
</svg>`.trim();

    case "police":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
  <polygon points="16,8 17.8,13.6 23.7,13.6 18.95,17.1 20.75,22.7 16,19.2 11.25,22.7 13.05,17.1 8.3,13.6 14.2,13.6" fill="#ffffff"/>
</svg>`.trim();

    case "hospital":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#6B4E9F" stroke="#ffffff" stroke-width="2"/>
  <path d="M10.5 8.5 L13.5 8.5 L13.5 14.5 L18.5 14.5 L18.5 8.5 L21.5 8.5 L21.5 23.5 L18.5 23.5 L18.5 17.5 L13.5 17.5 L13.5 23.5 L10.5 23.5 Z" fill="#ffffff"/>
</svg>`.trim();

    case "dialysis":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#6B4E9F" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 8.5 C16 8.5 10.5 14 10.5 18.5 C10.5 21.5 13 24 16 24 C19 24 21.5 21.5 21.5 18.5 C21.5 14 16 8.5 16 8.5 Z" fill="#ffffff"/>
</svg>`.trim();

    case "shelter":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#ED1B2E" stroke="#ffffff" stroke-width="2"/>
  <path d="M8.5 18 L16 10 L23.5 18 L23.5 24 L8.5 24 Z" fill="#ffffff"/>
  <rect x="15" y="18.5" width="2" height="5.5" fill="#ED1B2E"/>
  <rect x="13.25" y="20.25" width="5.5" height="2" fill="#ED1B2E"/>
</svg>`.trim();

    // ── Dam Break scenario icons ──────────────────────────

    case "dam_hospital":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#1B6EC2" stroke="#ffffff" stroke-width="2"/>
  <path d="M10.5 8.5 L13.5 8.5 L13.5 14.5 L18.5 14.5 L18.5 8.5 L21.5 8.5 L21.5 23.5 L18.5 23.5 L18.5 17.5 L13.5 17.5 L13.5 23.5 L10.5 23.5 Z" fill="#ffffff"/>
</svg>`.trim();

    case "dam_nursing_home":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#1B6EC2" stroke="#ffffff" stroke-width="2"/>
  <circle cx="16" cy="10" r="2.5" fill="#ffffff"/>
  <path d="M12 24 L12 18 C12 15.5 13.5 14 16 14 C18.5 14 20 15.5 20 18 L20 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="10" y1="19" x2="22" y2="19" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
</svg>`.trim();

    case "dam_school":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#E85D04" stroke="#ffffff" stroke-width="2"/>
  <path d="M6 14 L16 9 L26 14 L16 19 Z" fill="#ffffff"/>
  <path d="M10 16 L10 20 C10 22 13 23 16 23 C19 23 22 22 22 20 L22 16" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="14" x2="24" y2="19" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
</svg>`.trim();

    case "dam_shelter":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#ED1B2E" stroke="#ffffff" stroke-width="2"/>
  <path d="M8.5 18 L16 10 L23.5 18 L23.5 24 L8.5 24 Z" fill="#ffffff"/>
  <rect x="15" y="18.5" width="2" height="5.5" fill="#ED1B2E"/>
  <rect x="13.25" y="20.25" width="5.5" height="2" fill="#ED1B2E"/>
</svg>`.trim();

    case "dam_water_plant":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#0891B2" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 8 C16 8 10 14 10 18 C10 21.3 12.7 24 16 24 C19.3 24 22 21.3 22 18 C22 14 16 8 16 8 Z" fill="#ffffff"/>
  <path d="M13 18 Q14.5 16 16 18 Q17.5 20 19 18" fill="none" stroke="#0891B2" stroke-width="1.5" stroke-linecap="round"/>
</svg>`.trim();

    case "pharmacy":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#059669" stroke="#ffffff" stroke-width="2"/>
  <text x="16" y="21.5" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold" font-family="serif">℞</text>
</svg>`.trim();

    case "urgent_care":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#059669" stroke="#ffffff" stroke-width="2"/>
  <rect x="14" y="9" width="4" height="14" fill="#ffffff"/>
  <rect x="9" y="13" width="14" height="4" fill="#ffffff"/>
  <circle cx="22" cy="10" r="4" fill="#ED1B2E"/>
  <text x="22" y="13" text-anchor="middle" fill="#ffffff" font-size="7" font-weight="bold">!</text>
</svg>`.trim();

    case "public_health":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#059669" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 8 L16 24 M11 11 L21 21 M11 21 L21 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="3" fill="#ffffff"/>
</svg>`.trim();

    case "church":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#7C3AED" stroke="#ffffff" stroke-width="2"/>
  <rect x="14.5" y="7" width="3" height="13" fill="#ffffff"/>
  <rect x="12" y="10" width="8" height="3" fill="#ffffff"/>
  <path d="M10 20 L16 14 L22 20 L22 25 L10 25 Z" fill="#ffffff"/>
</svg>`.trim();

    case "grocery":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#D97706" stroke="#ffffff" stroke-width="2"/>
  <path d="M9 10 L11 10 L13 20 L23 20 L24 13 L12 13" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="23" r="1.5" fill="#ffffff"/>
  <circle cx="21" cy="23" r="1.5" fill="#ffffff"/>
</svg>`.trim();

    case "power_plant":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="#ffffff" stroke-width="2"/>
  <path d="M17 7 L12 16 L15 16 L14 25 L21 14 L17 14 Z" fill="#ffffff"/>
</svg>`.trim();

    case "dam":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#1B6EC2" stroke="#ffffff" stroke-width="2"/>
  <path d="M7 14 Q10 11 13 14 Q16 17 19 14 Q22 11 25 14" fill="none" stroke="#ffffff" stroke-width="2"/>
  <path d="M7 19 Q10 16 13 19 Q16 22 19 19 Q22 16 25 19" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="9" y="22" width="14" height="3" fill="#ffffff" rx="1"/>
</svg>`.trim();

    case "prison":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#6B7280" stroke="#ffffff" stroke-width="2"/>
  <rect x="10" y="9" width="12" height="14" fill="none" stroke="#ffffff" stroke-width="2" rx="1"/>
  <line x1="13" y1="9" x2="13" y2="23" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="16" y1="9" x2="16" y2="23" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="19" y1="9" x2="19" y2="23" stroke="#ffffff" stroke-width="1.5"/>
</svg>`.trim();

    case "college":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#E85D04" stroke="#ffffff" stroke-width="2"/>
  <path d="M6 14 L16 9 L26 14 L16 19 Z" fill="#ffffff"/>
  <path d="M10 16 L10 21 C10 23 13 24 16 24 C19 24 22 23 22 21 L22 16" fill="none" stroke="#ffffff" stroke-width="2"/>
  <rect x="23" y="14" width="2" height="7" fill="#ffffff"/>
  <circle cx="24" cy="22" r="1.5" fill="#ffffff"/>
</svg>`.trim();

    case "landfill":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#78716C" stroke="#ffffff" stroke-width="2"/>
  <path d="M8 22 L12 14 L16 18 L20 12 L24 22 Z" fill="#ffffff"/>
  <path d="M10 22 L22 22" stroke="#ffffff" stroke-width="2"/>
</svg>`.trim();

    case "stream_gauge":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#0891B2" stroke="#ffffff" stroke-width="2"/>
  <rect x="14" y="8" width="4" height="16" fill="#ffffff" rx="1"/>
  <line x1="12" y1="12" x2="14" y2="12" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="12" y1="16" x2="14" y2="16" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="12" y1="20" x2="14" y2="20" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="18" y1="14" x2="20" y2="14" stroke="#ffffff" stroke-width="1.5"/>
  <line x1="18" y1="18" x2="20" y2="18" stroke="#ffffff" stroke-width="1.5"/>
</svg>`.trim();

    case "weather_alert":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#DC2626" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 8 L25 24 L7 24 Z" fill="#ffffff"/>
  <rect x="15" y="13" width="2" height="6" fill="#DC2626"/>
  <circle cx="16" cy="21.5" r="1.2" fill="#DC2626"/>
</svg>`.trim();

    case "wildfire_point":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#DC2626" stroke="#ffffff" stroke-width="2"/>
  <path d="M16 7 C17.5 10 21 12 21 16.5 C21 17.5 20.5 18 19.5 18.5 C20 17.5 19.5 16.5 18.5 16 C18.5 18 17.5 19 16 19 C14.5 19 13.5 18.5 13.5 17 C13.5 18 12.5 19 12 19.5 C11.5 18.5 11 17.5 11 16.5 C11 13.5 13.5 12 14.5 10 C14.5 11.5 15 12.5 16 12.5 C16 11 16 9 16 7 Z" fill="#ffffff"/>
</svg>`.trim();

    case "census_tract":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#B8860B" stroke="#ffffff" stroke-width="2"/>
  <circle cx="13" cy="12" r="2.5" fill="#ffffff"/>
  <circle cx="19" cy="12" r="2.5" fill="#ffffff"/>
  <circle cx="16" cy="18" r="2.5" fill="#ffffff"/>
  <path d="M10 23 C10 20.5 12.5 19 16 19 C19.5 19 22 20.5 22 23" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
</svg>`.trim();

    case "tornado_track":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#7C3AED" stroke="#ffffff" stroke-width="2"/>
  <path d="M12 8 L20 8 L18 12 L20 12 L14 24 L16 16 L13 16 Z" fill="#ffffff"/>
</svg>`.trim();

    case "seismic":
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#92400E" stroke="#ffffff" stroke-width="2"/>
  <path d="M7 16 L11 16 L13 10 L15 22 L17 11 L19 20 L21 16 L25 16" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`.trim();

    default:
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#1e4a6d" stroke="#ffffff" stroke-width="2"/>
  <circle cx="16" cy="16" r="4" fill="#ffffff"/>
</svg>`.trim();
  }
}

function base64(input: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(input);
  }
  // Server-side fallback (SSR hydration won't reach here for client "use client",
  // but keeps TypeScript happy and avoids a crash if called early).
  return Buffer.from(input, "utf-8").toString("base64");
}

function popupTemplateForFeatureType(
  featureType: string,
  attributes: Record<string, unknown> | undefined,
  fallback: string
) {
  if (!attributes) {
    return { title: fallback || "Feature", content: "" };
  }

  switch (featureType) {
    case "mobile_home_park":
      return {
        title: "{park_name}",
        content:
          "<b>Unit count:</b> {unit_count}<br>" +
          "<b>Address:</b> {address}<br>" +
          "<b>Year established:</b> {year_established}",
      };
    case "school":
      return {
        title: "{name}",
        content:
          "<b>Type:</b> {type}<br>" +
          "<b>Enrollment:</b> {enrollment}<br>" +
          "<b>Address:</b> {address}",
      };
    case "medical":
      return {
        title: "{name}",
        content:
          "<b>Type:</b> {type}<br>" +
          "<b>Bed count:</b> {bed_count}<br>" +
          "<b>Home-dialysis patients:</b> {home_dialysis_patients}<br>" +
          "<b>Backup power:</b> {has_backup_power}",
      };
    case "red_cross":
      return {
        title: "{asset_name}",
        content:
          "<b>Type:</b> {type}<br>" +
          "<b>Capacity:</b> {capacity}<br>" +
          "<b>Status:</b> {operational_status}<br>" +
          "<b>Address:</b> {address}",
      };
    case "fire_station":
      return {
        title: "{name}",
        content:
          "<b>Agency:</b> {agency}<br>" +
          "<b>Apparatus:</b> {type}<br>" +
          "<b>Staffing:</b> {staffing}<br>" +
          "<b>Address:</b> {address}",
      };
    case "police":
      return {
        title: "{name}",
        content:
          "<b>Agency:</b> {agency}<br>" +
          "<b>Jurisdiction:</b> {jurisdiction}<br>" +
          "<b>Staffing:</b> {staffing}<br>" +
          "<b>Address:</b> {address}",
      };
    case "hospital":
      return {
        title: "{name}",
        content:
          "<b>Beds:</b> {bed_count}<br>" +
          "<b>Trauma level:</b> {trauma_level}<br>" +
          "<b>24h ER:</b> {has_er_24h}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dialysis":
      return {
        title: "{name}",
        content:
          "<b>Chairs:</b> {chairs}<br>" +
          "<b>Home-dialysis patients:</b> {home_dialysis_patients}<br>" +
          "<b>Address:</b> {address}",
      };
    case "shelter":
      return {
        title: "{name}",
        content:
          "<b>Facility type:</b> {facility_type}<br>" +
          "<b>Capacity:</b> {capacity}<br>" +
          "<b>Status:</b> {status}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dam_hospital":
      return {
        title: "{name}",
        content:
          "<b>Beds:</b> {bed_count}<br>" +
          "<b>Trauma level:</b> {trauma_level}<br>" +
          "<b>24h ER:</b> {has_er_24h}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dam_nursing_home":
      return {
        title: "{name}",
        content:
          "<b>Beds:</b> {bed_count}<br>" +
          "<b>Residents:</b> {current_residents}<br>" +
          "<b>Mobility-impaired:</b> {mobility_impaired_pct}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dam_school":
      return {
        title: "{name}",
        content:
          "<b>Grades:</b> {grade_range}<br>" +
          "<b>Enrollment:</b> {enrollment}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dam_shelter":
      return {
        title: "{name}",
        content:
          "<b>Facility type:</b> {facility_type}<br>" +
          "<b>Capacity:</b> {capacity}<br>" +
          "<b>Status:</b> {status}<br>" +
          "<b>Address:</b> {address}",
      };
    case "dam_water_plant":
      return {
        title: "{name}",
        content:
          "<b>Type:</b> {facility_type}<br>" +
          "<b>Capacity:</b> {capacity_mgd} MGD<br>" +
          "<b>Serves:</b> {serves_population}<br>" +
          "<b>Address:</b> {address}",
      };
    default:
      return { title: fallback || "Feature", content: "" };
  }
}
