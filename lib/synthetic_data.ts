/**
 * Synthetic data loader for demo layers.
 *
 * Serves locally-stored JSON features for layers that don't have
 * AGOL feature services yet. Each scenario (tornado, wildfire, dam_break)
 * has its own data file with realistic synthetic features.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface SyntheticFeature {
  attributes: Record<string, unknown>;
  geometry?: { x: number; y: number; spatialReference: { wkid: number } };
}

type SyntheticData = Record<string, SyntheticFeature[]>;

const cache: Record<string, SyntheticData | null> = {};

function loadScenarioData(scenario: string): SyntheticData | null {
  if (scenario in cache) return cache[scenario];

  try {
    const filePath = join(process.cwd(), "data", "synthetic_layers", `${scenario}.json`);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as SyntheticData;
    cache[scenario] = data;
    return data;
  } catch {
    cache[scenario] = null;
    return null;
  }
}

/**
 * Get synthetic features for a layer in a given scenario.
 * Returns null if no data exists for this layer/scenario combination.
 */
export function getSyntheticFeatures(
  layerId: string,
  scenario: string
): SyntheticFeature[] | null {
  const data = loadScenarioData(scenario);
  if (!data) return null;
  return data[layerId] || null;
}

/**
 * Check if synthetic data exists for a layer in a given scenario.
 */
export function hasSyntheticData(layerId: string, scenario: string): boolean {
  const data = loadScenarioData(scenario);
  if (!data) return false;
  return layerId in data;
}
