/**
 * POST /api/query
 *
 * Direct AGOL query executor. Used by frontend components that need to read
 * layers directly without going through the Claude conversational loop
 * (e.g., the layer-toggle sidebar, the "current warnings" poll).
 */

import { NextRequest } from "next/server";
import { getLayerServiceUrl, getLayerById } from "@/lib/catalog";
import * as agol from "@/lib/agol";

export const runtime = "nodejs";
export const maxDuration = 30;

interface QueryRequest {
  layer_id: string;
  where?: string;
  geometry?: unknown;
  out_fields?: string;
  return_geometry?: boolean;
}

export async function POST(req: NextRequest) {
  let body: QueryRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.layer_id) {
    return new Response(JSON.stringify({ error: "Missing 'layer_id' field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const layer = getLayerById(body.layer_id);
  if (!layer) {
    return new Response(
      JSON.stringify({ error: `Unknown layer: ${body.layer_id}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Access-tier enforcement for direct queries
  if (
    layer.access_tier === "role-restricted" ||
    layer.access_tier === "privacy-restricted"
  ) {
    return new Response(
      JSON.stringify({
        error: "Access-restricted layer",
        message: `${body.layer_id} is ${layer.access_tier}. Use the chat endpoint with proper authorization context.`,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const serviceUrl = getLayerServiceUrl(body.layer_id);
  if (!serviceUrl) {
    return new Response(
      JSON.stringify({ error: `Service URL not configured for ${body.layer_id}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let features;
    if (body.geometry) {
      features = await agol.queryFeaturesByGeometry(serviceUrl, body.geometry, {
        where: body.where,
        outFields: body.out_fields,
        returnGeometry: body.return_geometry,
      });
    } else {
      features = await agol.queryFeatures(serviceUrl, {
        where: body.where,
        outFields: body.out_fields,
        returnGeometry: body.return_geometry,
      });
    }

    return new Response(
      JSON.stringify({
        layer_id: body.layer_id,
        feature_count: features.length,
        features,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
