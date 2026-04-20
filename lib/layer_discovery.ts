/**
 * Layer Discovery — search, filter, and bridge functions for the full layer catalog.
 *
 * The layer catalog (data/layer_catalog.json) is a superset of the semantic catalog.
 * It includes every RAPT-equivalent layer, most marked "coming_soon", plus the
 * demo layers that have actual AGOL services behind them.
 */

import catalogData from "@/data/layer_catalog.json";
import type {
  CatalogLayer,
  LayerCatalog,
  LayerCategory,
  ScenarioWarningType,
} from "./types";

// ─── Cached catalog ────────────────────────────────────────

const catalog = catalogData as LayerCatalog;

export function getLayerCatalog(): LayerCatalog {
  return catalog;
}

// ─── Search ────────────────────────────────────────────────

export function searchLayers(query: string): CatalogLayer[] {
  if (!query.trim()) return catalog.layers;

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  const scored: { layer: CatalogLayer; score: number }[] = [];

  for (const layer of catalog.layers) {
    let score = 0;

    // Exact alias match (strongest signal)
    for (const alias of layer.aliases) {
      if (alias.toLowerCase() === q) {
        score += 20;
      } else if (alias.toLowerCase().includes(q)) {
        score += 10;
      }
    }

    // Name match
    const nameLower = layer.name.toLowerCase();
    if (nameLower === q) {
      score += 15;
    } else if (nameLower.includes(q)) {
      score += 8;
    }

    // Word-level matches in description
    const descLower = layer.description.toLowerCase();
    for (const word of words) {
      if (word.length < 2) continue;
      if (descLower.includes(word)) score += 2;
      if (nameLower.includes(word)) score += 3;
      for (const alias of layer.aliases) {
        if (alias.toLowerCase().includes(word)) score += 4;
      }
    }

    if (score > 0) scored.push({ layer, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.layer);
}

// ─── Group by category → subcategory ───────────────────────

export function getLayersByCategory(): Record<
  LayerCategory,
  Record<string, CatalogLayer[]>
> {
  const result: Record<LayerCategory, Record<string, CatalogLayer[]>> = {
    infrastructure: {},
    community_resilience: {},
    hazards_weather: {},
  };

  for (const layer of catalog.layers) {
    const cat = result[layer.category];
    if (!cat[layer.subcategory]) cat[layer.subcategory] = [];
    cat[layer.subcategory].push(layer);
  }

  return result;
}

// ─── Resolve catalog layer → AGOL layer ID for scenario ────

export function resolveScenarioLayerId(
  layer: CatalogLayer,
  warningType: ScenarioWarningType
): string | null {
  return layer.scenario_layers?.[warningType] ?? null;
}

// ─── Counts ────────────────────────────────────────────────

export function countByStatus(
  layers: CatalogLayer[]
): Record<string, number> {
  const counts: Record<string, number> = {
    live: 0,
    demo: 0,
    coming_soon: 0,
  };
  for (const l of layers) counts[l.status]++;
  return counts;
}

export function countByCategory(): Record<LayerCategory, number> {
  const counts: Record<LayerCategory, number> = {
    infrastructure: 0,
    community_resilience: 0,
    hazards_weather: 0,
  };
  for (const l of catalog.layers) counts[l.category]++;
  return counts;
}

// ─── AI system prompt summary ──────────────────────────────

export function getCatalogSummaryForAI(): string {
  const compact = catalog.layers.map((l) => ({
    id: l.id,
    name: l.name,
    status: l.status,
    category: l.category,
    subcategory: l.subcategory,
    source: l.source,
    aliases: l.aliases.slice(0, 4),
    ...(l.description ? { desc: l.description } : {}),
  }));
  return JSON.stringify(compact);
}
