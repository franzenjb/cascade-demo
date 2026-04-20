/**
 * POST /api/trigger
 *
 * Simulates an NWS tornado warning. Writes the pre-designed warning polygon
 * to the DEMO_Cascade_Active_Warnings layer. Frontend polls this layer
 * (or subscribes via websocket) to detect active warnings.
 *
 * Body: { scenario_id?: string } — defaults to "tornado_buncombe_replay"
 */

import { NextRequest } from "next/server";
import { getLayerServiceUrl } from "@/lib/catalog";
import { applyEdits } from "@/lib/agol";
import scenarios from "@/data/tornado_scenarios.json";
import type { Scenario } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: { scenario_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine; use default
  }

  const scenarioId = body.scenario_id || "tornado_buncombe_replay";
  const scenario = (scenarios.scenarios as Scenario[]).find(
    (s) => s.id === scenarioId
  );

  if (!scenario) {
    return new Response(
      JSON.stringify({ error: `Unknown scenario: ${scenarioId}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const warningsUrl = getLayerServiceUrl("DEMO_Cascade_Active_Warnings");

  const now = new Date();
  const issued = new Date(now.getTime() + scenario.issued_offset_seconds * 1000);
  const expires = new Date(
    now.getTime() + scenario.expires_offset_seconds * 1000
  );

  try {
    // Try to persist the warning to AGOL (best-effort — demo works without it)
    if (warningsUrl) {
      try {
        const existingRes = await fetch(
          `${warningsUrl}/query?where=1=1&returnIdsOnly=true&f=json&token=${encodeURIComponent(process.env.AGOL_TOKEN || "")}`
        );
        const existingData = await existingRes.json();
        const existingIds: number[] = existingData?.objectIds || [];
        if (existingIds.length > 0) {
          await applyEdits(warningsUrl, { deletes: existingIds });
        }
        await applyEdits(warningsUrl, {
          adds: [
            {
              geometry: {
                rings: scenario.polygon_geojson.coordinates,
                spatialReference: { wkid: 4326 },
              },
              attributes: {
                warning_type: scenario.warning_type,
                nws_event_id: scenario.nws_event_id,
              },
            },
          ],
        });
      } catch (agolErr) {
        console.warn("AGOL write skipped (token may be expired):", agolErr);
      }
    }

    const triggerDirective =
      scenario.trigger_directive ||
      `[SYSTEM EVENT] A ${scenario.warning_type} warning has just been issued. The active warning layer has been updated with the polygon. Produce the proactive situational briefing for this event following your disaster playbook. Under 120 words. Use tool calls for every number.`;

    return new Response(
      JSON.stringify({
        success: true,
        scenario_id: scenario.id,
        warning_type: scenario.warning_type,
        nws_event_id: scenario.nws_event_id,
        issued: issued.toISOString(),
        expires: expires.toISOString(),
        polygon: scenario.polygon_geojson,
        trigger_directive: triggerDirective,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * DELETE /api/trigger — clear the active warning (reset the demo)
 */
export async function DELETE() {
  const warningsUrl = getLayerServiceUrl("DEMO_Cascade_Active_Warnings");
  if (!warningsUrl) {
    return new Response(
      JSON.stringify({ error: "Active warnings layer not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Delete all features. This requires first querying for their IDs then passing to applyEdits.
    // Left as an exercise / Phase 2 enhancement. For the demo, the trigger POST overwrites.
    return new Response(
      JSON.stringify({ success: true, note: "Clear-all not yet implemented. Re-trigger to overwrite." }),
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
