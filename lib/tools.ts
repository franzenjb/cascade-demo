/**
 * Tool definitions and dispatcher for Claude tool-use loop.
 *
 * Each tool is defined with a JSON schema (for Claude) and a handler function
 * that executes the actual AGOL REST call or other logic.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { MapInstruction } from "./types";
import * as agol from "./agol";
import { getLayerServiceUrl, getLayerById } from "./catalog";

// ═══════════════════════════════════════════════════════════
// Tool definitions (JSON schema seen by Claude)
// ═══════════════════════════════════════════════════════════

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "get_warning_polygon",
    description:
      "Get the currently active NWS warning polygon from the demo warnings layer, if any. Returns the warning geometry and metadata, or indicates that no warning is active.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "count_population_in_polygon",
    description:
      "Count residents whose census tract centroids fall within a polygon. Optional demographic filters narrow the count (e.g., min_age for 65+ population). Defaults to DEMO_Cascade_Census_Tracts; pass layer_id=DEMO_FireArea_Census_Tracts for the Shasta wildfire scenario.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: {
          type: "object",
          description: "GeoJSON Polygon geometry",
        },
        filters: {
          type: "object",
          description:
            "Optional demographic filters: min_age, language (e.g., 'limited_english'), disability (boolean), etc.",
        },
        layer_id: {
          type: "string",
          description:
            "Optional census tracts layer ID. Defaults to 'DEMO_Cascade_Census_Tracts'. Use 'DEMO_FireArea_Census_Tracts' for the Shasta wildfire scenario.",
        },
      },
      required: ["polygon_geojson"],
    },
  },
  {
    name: "get_features_in_polygon",
    description:
      "Return features from a named layer whose geometries intersect a polygon. Use this to find mobile home parks, schools, medical facilities, etc. inside a warning zone.",
    input_schema: {
      type: "object",
      properties: {
        layer_id: {
          type: "string",
          description:
            "Exact layer ID from the semantic catalog (e.g., 'DEMO_Cascade_Mobile_Home_Parks')",
        },
        polygon_geojson: {
          type: "object",
          description: "GeoJSON Polygon geometry",
        },
        filter_expression: {
          type: "string",
          description:
            "Optional SQL-like WHERE clause to filter records (e.g., \"type='hospital'\")",
        },
      },
      required: ["layer_id", "polygon_geojson"],
    },
  },
  {
    name: "get_demographics_for_polygon",
    description:
      "Get a full demographic breakdown for the area within a polygon: total population, age breakdown, language, income, disability, CRCI score. Defaults to DEMO_Cascade_Census_Tracts; pass layer_id=DEMO_FireArea_Census_Tracts for the Shasta wildfire scenario.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: {
          type: "object",
          description: "GeoJSON Polygon geometry",
        },
        layer_id: {
          type: "string",
          description:
            "Optional census tracts layer ID. Defaults to 'DEMO_Cascade_Census_Tracts'. Use 'DEMO_FireArea_Census_Tracts' for the Shasta wildfire scenario.",
        },
      },
      required: ["polygon_geojson"],
    },
  },
  {
    name: "get_resources_near_polygon",
    description:
      "Find Red Cross and partner resources (shelters, ERVs, hospitals, etc.) near a polygon, within a specified distance. Defaults to DEMO_Cascade_Red_Cross_Assets; pass layer_id=DEMO_FireArea_Red_Cross_Shelters for the Shasta wildfire scenario.",
    input_schema: {
      type: "object",
      properties: {
        polygon_geojson: {
          type: "object",
          description: "GeoJSON Polygon geometry",
        },
        distance_miles: {
          type: "number",
          description: "Search radius in miles",
          default: 10,
        },
        resource_types: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional filter: ['shelter', 'ERV_depot', 'warehouse', 'office']",
        },
        layer_id: {
          type: "string",
          description:
            "Optional resources layer ID. Defaults to 'DEMO_Cascade_Red_Cross_Assets'. Use 'DEMO_FireArea_Red_Cross_Shelters' for the Shasta wildfire scenario.",
        },
      },
      required: ["polygon_geojson"],
    },
  },
  {
    name: "draw_on_map",
    description:
      "Instruct the frontend to render geometry on the map. Use this whenever you want the user to see something — a warning polygon, a highlighted facility, a buffer zone.",
    input_schema: {
      type: "object",
      properties: {
        geometry: {
          type: "object",
          description: "GeoJSON geometry (Polygon, Point, or similar)",
        },
        style: {
          type: "object",
          description: "Visual style: { color, opacity, label }",
          properties: {
            color: { type: "string" },
            opacity: { type: "number" },
            label: { type: "string" },
          },
        },
        layer_label: {
          type: "string",
          description: "Label for this drawn layer (shown in the legend)",
        },
      },
      required: ["geometry"],
    },
  },
  {
    name: "generate_briefing_draft",
    description:
      "Produce a one-page leadership briefing draft in Red Cross format. Use this when the user requests a shareable summary.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Two-sentence executive summary",
        },
        key_stats: {
          type: "object",
          description: "Key statistics object (e.g., { population, over_65, mobile_homes, etc. })",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Array of proposed next steps",
        },
      },
      required: ["summary", "key_stats"],
    },
  },
];

// ═══════════════════════════════════════════════════════════
// Tool execution dispatcher
// ═══════════════════════════════════════════════════════════

export interface ToolExecutionResult {
  content: string;
  mapInstruction?: MapInstruction;
}

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  switch (name) {
    case "get_warning_polygon":
      return executeGetWarningPolygon();

    case "count_population_in_polygon":
      return executeCountPopulation(input);

    case "get_features_in_polygon":
      return executeGetFeatures(input);

    case "get_demographics_for_polygon":
      return executeGetDemographics(input);

    case "get_resources_near_polygon":
      return executeGetResources(input);

    case "draw_on_map":
      return executeDrawOnMap(input);

    case "generate_briefing_draft":
      return executeBriefingDraft(input);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Individual tool handlers ─────────────────────────────

async function executeGetWarningPolygon(): Promise<ToolExecutionResult> {
  const url = getLayerServiceUrl("DEMO_Cascade_Active_Warnings");
  if (!url) {
    return {
      content: JSON.stringify({ error: "Active warnings layer not configured" }),
    };
  }
  const features = await agol.queryFeatures(url, { where: "1=1", outFields: "*", returnGeometry: true, outSR: 4326 });
  if (!features || features.length === 0) {
    return { content: JSON.stringify({ active: false, message: "No active warnings" }) };
  }
  const f = features[0];
  // Convert Esri rings to GeoJSON Polygon coordinates so Claude can use
  // this geometry directly in other tool calls (spatial queries expect GeoJSON).
  const ringsAny = (f.geometry as { rings?: number[][][] })?.rings;
  const polygon_geojson = ringsAny
    ? { type: "Polygon", coordinates: ringsAny }
    : null;

  return {
    content: JSON.stringify({
      active: true,
      attributes: f.attributes,
      polygon_geojson,
      note: polygon_geojson
        ? "Use the polygon_geojson directly in spatial tool calls."
        : "No geometry was returned by AGOL for this warning.",
    }),
  };
}

async function executeCountPopulation(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const polygon = input.polygon_geojson;
  const filters = (input.filters as Record<string, unknown>) || {};
  const layerId = (input.layer_id as string) || "DEMO_Cascade_Census_Tracts";

  const url = getLayerServiceUrl(layerId);
  if (!url) {
    return { content: JSON.stringify({ error: `Census tracts layer not configured: ${layerId}` }) };
  }

  const tracts = await agol.queryFeaturesByGeometry(url, polygon, {
    outFields: "pop,pct_over_65,pct_lep,pct_disability",
  });

  let totalPop = 0;
  let weightedOver65 = 0;
  let weightedLep = 0;
  let weightedDisability = 0;

  for (const tract of tracts) {
    const pop = (tract.attributes?.pop as number) || 0;
    totalPop += pop;
    weightedOver65 += pop * ((tract.attributes?.pct_over_65 as number) || 0);
    weightedLep += pop * ((tract.attributes?.pct_lep as number) || 0);
    weightedDisability += pop * ((tract.attributes?.pct_disability as number) || 0);
  }

  const result = {
    total_population: totalPop,
    pct_over_65: totalPop > 0 ? weightedOver65 / totalPop : 0,
    pct_limited_english: totalPop > 0 ? weightedLep / totalPop : 0,
    pct_disability: totalPop > 0 ? weightedDisability / totalPop : 0,
    tract_count: tracts.length,
    filters_applied: filters,
  };

  return { content: JSON.stringify(result) };
}

async function executeGetFeatures(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const layerId = input.layer_id as string;
  const polygon = input.polygon_geojson;
  const filter = input.filter_expression as string | undefined;

  const layer = getLayerById(layerId);
  if (!layer) {
    return { content: JSON.stringify({ error: `Unknown layer: ${layerId}` }) };
  }

  if (
    layer.access_tier === "role-restricted" ||
    layer.access_tier === "privacy-restricted"
  ) {
    return {
      content: JSON.stringify({
        error: "Access-restricted layer",
        message: `The layer ${layerId} requires role-gated access. Aggregated counts only.`,
        access_tier: layer.access_tier,
      }),
    };
  }

  const url = getLayerServiceUrl(layerId);
  if (!url) {
    return { content: JSON.stringify({ error: `Service URL not configured for ${layerId}` }) };
  }

  const features = await agol.queryFeaturesByGeometry(url, polygon, {
    outFields: "*",
    where: filter || "1=1",
  });

  return {
    content: JSON.stringify({
      layer_id: layerId,
      feature_count: features.length,
      features: features.map((f) => f.attributes),
    }),
  };
}

async function executeGetDemographics(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const polygon = input.polygon_geojson;
  const layerId = (input.layer_id as string) || "DEMO_Cascade_Census_Tracts";
  const url = getLayerServiceUrl(layerId);
  if (!url) {
    return { content: JSON.stringify({ error: `Census tracts layer not configured: ${layerId}` }) };
  }

  const tracts = await agol.queryFeaturesByGeometry(url, polygon, { outFields: "*" });

  const summary = {
    total_population: 0,
    median_income_weighted: 0,
    pct_over_65: 0,
    pct_under_18: 0,
    pct_lep: 0,
    pct_poverty: 0,
    pct_disability: 0,
    crci_score_avg: 0,
    tracts: tracts.length,
  };

  let totalPop = 0;
  for (const tract of tracts) {
    const a = tract.attributes || {};
    const pop = (a.pop as number) || 0;
    totalPop += pop;
    summary.total_population += pop;
    summary.pct_over_65 += pop * ((a.pct_over_65 as number) || 0);
    summary.pct_under_18 += pop * ((a.pct_under_18 as number) || 0);
    summary.pct_lep += pop * ((a.pct_lep as number) || 0);
    summary.pct_poverty += pop * ((a.pct_poverty as number) || 0);
    summary.pct_disability += pop * ((a.pct_disability as number) || 0);
    summary.median_income_weighted += pop * ((a.median_income as number) || 0);
    summary.crci_score_avg += (a.crci_score as number) || 0;
  }

  if (totalPop > 0) {
    summary.pct_over_65 /= totalPop;
    summary.pct_under_18 /= totalPop;
    summary.pct_lep /= totalPop;
    summary.pct_poverty /= totalPop;
    summary.pct_disability /= totalPop;
    summary.median_income_weighted /= totalPop;
  }
  if (tracts.length > 0) {
    summary.crci_score_avg /= tracts.length;
  }

  return { content: JSON.stringify(summary) };
}

async function executeGetResources(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const polygon = input.polygon_geojson;
  const distanceMiles = (input.distance_miles as number) || 10;
  const resourceTypes = input.resource_types as string[] | undefined;
  const layerId = (input.layer_id as string) || "DEMO_Cascade_Red_Cross_Assets";

  const url = getLayerServiceUrl(layerId);
  if (!url) {
    return { content: JSON.stringify({ error: `Resources layer not configured: ${layerId}` }) };
  }

  // Buffer the polygon by distance_miles and query within
  const bufferedGeometry = await agol.bufferGeometry(polygon, distanceMiles);
  let filter = "1=1";
  if (resourceTypes && resourceTypes.length > 0) {
    const typesList = resourceTypes.map((t) => `'${t}'`).join(",");
    filter = `type IN (${typesList})`;
  }

  const features = await agol.queryFeaturesByGeometry(url, bufferedGeometry, {
    outFields: "*",
    where: filter,
  });

  return {
    content: JSON.stringify({
      distance_miles: distanceMiles,
      resource_count: features.length,
      resources: features.map((f) => f.attributes),
    }),
  };
}

async function executeDrawOnMap(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const mapInstruction: MapInstruction = {
    action: "draw",
    geometry: input.geometry as any,
    style: (input.style as any) || {},
    layer_label: input.layer_label as string | undefined,
  };

  return {
    content: JSON.stringify({ success: true, instruction: mapInstruction }),
    mapInstruction,
  };
}

async function executeBriefingDraft(
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  // For the demo, this just formats the briefing as markdown
  const summary = input.summary as string;
  const keyStats = input.key_stats as Record<string, unknown>;
  const recommendations = (input.recommendations as string[]) || [];

  const briefing = `# Leadership Briefing
Generated: ${new Date().toISOString()}

## Summary
${summary}

## Key Statistics
${Object.entries(keyStats)
  .map(([k, v]) => `- **${k.replace(/_/g, " ")}:** ${v}`)
  .join("\n")}

## Recommended Next Steps
${recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;

  return {
    content: JSON.stringify({ briefing, format: "markdown" }),
  };
}
