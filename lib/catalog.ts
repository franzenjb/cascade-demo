/**
 * Semantic catalog loader.
 *
 * Loads data/semantic_catalog.json and provides helpers for looking up layers,
 * resolving env-var service URLs, matching natural-language aliases, and
 * retrieving disaster playbooks.
 */

import type {
  SemanticCatalog,
  LayerDefinition,
  DisasterType,
  RelevanceLevel,
} from "./types";
import catalogData from "../data/semantic_catalog.json";

const catalog = catalogData as unknown as SemanticCatalog;

/**
 * Get the AGOL REST service URL for a layer, resolved from environment variable.
 */
export function getLayerServiceUrl(layerId: string): string | null {
  const layer = catalog.layers.find((l) => l.id === layerId);
  if (!layer) return null;
  const url = process.env[layer.service_url_env];
  return url || null;
}

/**
 * Look up a layer definition by its exact ID.
 */
export function getLayerById(layerId: string): LayerDefinition | null {
  return catalog.layers.find((l) => l.id === layerId) || null;
}

/**
 * Find layers that match a natural-language query term, ranked by relevance
 * for the current disaster type.
 *
 * Returns layer IDs in priority order. Used by Claude when reasoning about
 * which layer to query for a given user request.
 */
export function findLayersForQuery(
  query: string,
  disasterType?: DisasterType
): LayerDefinition[] {
  const queryLower = query.toLowerCase();
  const matches: Array<{ layer: LayerDefinition; score: number }> = [];

  for (const layer of catalog.layers) {
    let score = 0;

    // Exact alias match
    for (const alias of layer.aliases) {
      if (queryLower.includes(alias.toLowerCase())) {
        score += 10;
      }
    }

    // Display name partial match
    if (queryLower.includes(layer.display_name.toLowerCase())) {
      score += 5;
    }

    // Disaster relevance multiplier
    if (disasterType) {
      const relevance = layer.disaster_relevance[disasterType];
      if (relevance === "high") score *= 2;
      else if (relevance === "medium") score *= 1.5;
      else if (relevance === "low") score *= 0.8;
    }

    if (score > 0) {
      matches.push({ layer, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.map((m) => m.layer);
}

/**
 * Get the default layer set for a disaster type from the playbooks.
 */
export function getPlaybookLayers(disasterType: string): string[] {
  const playbook = catalog.disaster_playbooks[disasterType];
  return playbook?.default_layers || [];
}

/**
 * Get the narrative structure (ordered section list) for a disaster type.
 */
export function getPlaybookNarrative(disasterType: string): string[] {
  const playbook = catalog.disaster_playbooks[disasterType];
  return playbook?.narrative_structure || [];
}

/**
 * Produce a compact summary of the catalog for injection into Claude's
 * system prompt. The full catalog is a large JSON blob; this returns a
 * trimmed version that omits fields Claude doesn't need in prompt context.
 */
export function getCatalogForSystemPrompt(): string {
  const compactLayers = catalog.layers.map((layer) => ({
    id: layer.id,
    display_name: layer.display_name,
    aliases: layer.aliases,
    disaster_relevance: layer.disaster_relevance,
    why_it_matters: layer.why_it_matters,
    schema: layer.schema,
    access_tier: layer.access_tier,
  }));

  return JSON.stringify(
    {
      catalog_version: catalog.catalog_version,
      synthetic_data_notice: catalog.synthetic_data_notice,
      layers: compactLayers,
      disaster_playbooks: catalog.disaster_playbooks,
    },
    null,
    2
  );
}

/**
 * Get the full catalog object (for cases that need everything).
 */
export function getFullCatalog(): SemanticCatalog {
  return catalog;
}
