/**
 * POST /api/export
 *
 * Generates a downloadable artifact (PDF, PNG map, or markdown briefing)
 * from the current session state. For Phase 1, this is stubbed and returns
 * a markdown briefing. Expand this to render actual PDFs and map images
 * once the core demo is working.
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface ExportRequest {
  format: "markdown" | "pdf" | "png";
  briefing_content?: string;
  map_snapshot_base64?: string;
}

export async function POST(req: NextRequest) {
  let body: ExportRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.format === "markdown") {
    const briefing = body.briefing_content || "# Leadership Briefing\n\n*(No content provided.)*\n";
    return new Response(briefing, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="cascade-briefing-${Date.now()}.md"`,
      },
    });
  }

  // PDF / PNG export is a Phase 2 enhancement. For demo, return not-yet-implemented.
  return new Response(
    JSON.stringify({
      error: "Format not yet implemented",
      message: `Export to ${body.format} is coming in Phase 2. For now, use format: "markdown".`,
    }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
}
