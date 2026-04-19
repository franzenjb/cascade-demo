/**
 * Publish Fire-Scenario Layers to AGOL
 * =====================================
 *
 * Reads GeoJSON files from scripts/output/fire/, publishes each as a hosted
 * feature service on the Red Cross NHQ AGOL org, and shares it public-read.
 * Writes an env snippet with the resulting FeatureServer URLs.
 *
 * Prereqs (set by scripts/agol_oauth_login.ts):
 *   .env.local must contain:
 *     AGOL_PORTAL_URL           https://arc-nhq-gis.maps.arcgis.com
 *     AGOL_OAUTH_CLIENT_ID      {native app client id}
 *     AGOL_REFRESH_TOKEN        {14-day refresh token}
 *
 * Usage:
 *   npx ts-node scripts/publish_fire_layers.ts              # dry-run (default)
 *   npx ts-node scripts/publish_fire_layers.ts --confirm    # actually publish
 *
 * Outputs (on --confirm):
 *   scripts/output/fire/.env.fire.snippet   — paste into .env.local + Vercel
 */

import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, basename } from "node:path";

const ENV_PATH = join(process.cwd(), ".env.local");
const FIRE_DIR = join(process.cwd(), "scripts/output/fire");

// Map GeoJSON filename → (AGOL item title, env var name)
// Titles prefix with DEMO_FireArea_ so they don't collide with the Cascade layers.
const LAYERS: Array<{
  file: string;
  title: string;
  envVar: string;
  description: string;
  tags: string[];
}> = [
  {
    file: "fire_census_tracts.geojson",
    title: "DEMO_FireArea_Census_Tracts",
    envVar: "AGOL_FIRE_CENSUS_TRACTS_URL",
    description:
      "Synthetic census tracts for Shasta County wildfire demo. Real geography, fictional numeric fields.",
    tags: ["demo", "cascade", "fire", "shasta", "census"],
  },
  {
    file: "fire_stations.geojson",
    title: "DEMO_FireArea_Fire_Stations",
    envVar: "AGOL_FIRE_STATIONS_URL",
    description:
      "Fire stations in Shasta County (RFD, Anderson FPD, Shasta Co FD, CAL FIRE, volunteers). Synthetic staffing.",
    tags: ["demo", "cascade", "fire", "shasta", "fire-stations"],
  },
  {
    file: "police_stations.geojson",
    title: "DEMO_FireArea_Police_Stations",
    envVar: "AGOL_FIRE_POLICE_URL",
    description:
      "Law-enforcement agencies in Shasta County (Redding PD, Anderson PD, Sheriff substations, CHP).",
    tags: ["demo", "cascade", "fire", "shasta", "police"],
  },
  {
    file: "hospitals.geojson",
    title: "DEMO_FireArea_Hospitals",
    envVar: "AGOL_FIRE_HOSPITALS_URL",
    description:
      "Hospitals serving Shasta County. Bed counts and trauma levels are synthetic.",
    tags: ["demo", "cascade", "fire", "shasta", "hospitals"],
  },
  {
    file: "dialysis_clinics.geojson",
    title: "DEMO_FireArea_Dialysis_Clinics",
    envVar: "AGOL_FIRE_DIALYSIS_URL",
    description:
      "Outpatient dialysis clinics in Shasta County with synthetic chair and home-dialysis patient counts.",
    tags: ["demo", "cascade", "fire", "shasta", "dialysis"],
  },
  {
    file: "red_cross_shelters.geojson",
    title: "DEMO_FireArea_Red_Cross_Shelters",
    envVar: "AGOL_FIRE_SHELTERS_URL",
    description:
      "Red Cross shelter locations (schools, churches, rec centers) for Shasta County wildfire demo.",
    tags: ["demo", "cascade", "fire", "shasta", "shelters"],
  },
];

// ─── Arg parsing ────────────────────────────────────────────
const CONFIRM = process.argv.includes("--confirm");

// ─── Env loading ────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  const text = readFileSync(ENV_PATH, "utf-8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const PORTAL = (env.AGOL_PORTAL_URL || "").replace(/\/+$/, "");
const CLIENT_ID = env.AGOL_OAUTH_CLIENT_ID;
const REFRESH_TOKEN = env.AGOL_REFRESH_TOKEN;

function die(msg: string): never {
  console.error(`\n✗  ${msg}`);
  process.exit(1);
}

if (!PORTAL) die("AGOL_PORTAL_URL missing in .env.local");
if (!CLIENT_ID) die("AGOL_OAUTH_CLIENT_ID missing. Run scripts/agol_oauth_login.ts.");
if (!REFRESH_TOKEN) die("AGOL_REFRESH_TOKEN missing. Run scripts/agol_oauth_login.ts.");

// ─── AGOL helpers ───────────────────────────────────────────

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  username?: string;
  error?: { code?: number; message?: string; details?: string[] };
};

async function exchangeRefreshToken(): Promise<{
  accessToken: string;
  username: string;
}> {
  const body = new URLSearchParams({
    f: "json",
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
  });
  const res = await fetch(`${PORTAL}/sharing/rest/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const tok = (await res.json()) as TokenResponse;
  if (tok.error || !tok.access_token) {
    die(`Refresh-token exchange failed: ${JSON.stringify(tok)}`);
  }
  const whoRes = await fetch(
    `${PORTAL}/sharing/rest/community/self?f=json&token=${encodeURIComponent(
      tok.access_token!
    )}`
  );
  const who = (await whoRes.json()) as { username?: string; error?: unknown };
  if (!who.username) die(`community/self failed: ${JSON.stringify(who)}`);
  return { accessToken: tok.access_token!, username: who.username };
}

type AddItemResponse = {
  success?: boolean;
  id?: string;
  error?: { code?: number; message?: string; details?: string[] };
};

async function addGeoJsonItem(
  accessToken: string,
  username: string,
  layer: (typeof LAYERS)[number]
): Promise<string> {
  const filePath = join(FIRE_DIR, layer.file);
  const fileBuf = readFileSync(filePath);
  const form = new FormData();
  form.append("f", "json");
  form.append("token", accessToken);
  form.append("type", "GeoJson");
  form.append("title", layer.title);
  form.append("description", layer.description);
  form.append("tags", layer.tags.join(","));
  form.append(
    "file",
    new Blob([fileBuf], { type: "application/geo+json" }),
    layer.file
  );

  const res = await fetch(
    `${PORTAL}/sharing/rest/content/users/${encodeURIComponent(username)}/addItem`,
    { method: "POST", body: form }
  );
  const data = (await res.json()) as AddItemResponse;
  if (!data.success || !data.id) {
    die(`addItem failed for ${layer.file}: ${JSON.stringify(data)}`);
  }
  return data.id!;
}

type PublishResponse = {
  services?: Array<{
    type?: string;
    serviceurl?: string;
    serviceItemId?: string;
    jobId?: string;
    size?: number;
    error?: { code?: number; message?: string; details?: string[] };
  }>;
  error?: { code?: number; message?: string; details?: string[] };
};

async function publishItem(
  accessToken: string,
  username: string,
  itemId: string,
  title: string
): Promise<{ serviceUrl: string; serviceItemId: string }> {
  const publishParameters = {
    name: title,
    hasStaticData: true,
    maxRecordCount: 5000,
    layerInfo: { capabilities: "Query" },
  };
  const body = new URLSearchParams({
    f: "json",
    token: accessToken,
    itemid: itemId,
    filetype: "geojson",
    publishParameters: JSON.stringify(publishParameters),
  });
  const res = await fetch(
    `${PORTAL}/sharing/rest/content/users/${encodeURIComponent(username)}/publish`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );
  const data = (await res.json()) as PublishResponse;
  if (data.error) die(`publish failed for ${title}: ${JSON.stringify(data)}`);
  const svc = data.services?.[0];
  if (!svc || !svc.serviceurl || !svc.serviceItemId) {
    die(`publish returned no service for ${title}: ${JSON.stringify(data)}`);
  }
  if (svc.error) {
    die(`publish service error for ${title}: ${JSON.stringify(svc.error)}`);
  }
  return { serviceUrl: svc.serviceurl!, serviceItemId: svc.serviceItemId! };
}

async function shareItemEveryone(
  accessToken: string,
  username: string,
  itemId: string
): Promise<void> {
  const body = new URLSearchParams({
    f: "json",
    token: accessToken,
    everyone: "true",
    org: "true",
  });
  const res = await fetch(
    `${PORTAL}/sharing/rest/content/users/${encodeURIComponent(
      username
    )}/items/${encodeURIComponent(itemId)}/share`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );
  const data = (await res.json()) as {
    notSharedWith?: string[];
    itemId?: string;
    error?: { code?: number; message?: string };
  };
  if (data.error) {
    die(`share failed for ${itemId}: ${JSON.stringify(data)}`);
  }
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60));
  console.log(
    `Publish Fire Layers → AGOL  ${CONFIRM ? "[LIVE — will create items]" : "[DRY-RUN]"}`
  );
  console.log("═".repeat(60));
  console.log(`Portal:   ${PORTAL}`);

  // Validate all inputs exist first
  const missing = LAYERS.filter((l) => !existsSync(join(FIRE_DIR, l.file)));
  if (missing.length) {
    die(
      `Missing GeoJSON files:\n  ${missing.map((l) => l.file).join("\n  ")}\n\n` +
        `Run: npx ts-node scripts/generate_fire_scenario_data.ts`
    );
  }
  console.log(`Layers:   ${LAYERS.length} GeoJSON files found`);

  // Preview sizes + feature counts
  const existing = readdirSync(FIRE_DIR)
    .filter((f) => f.endsWith(".geojson"))
    .sort();
  console.log();
  console.log("Plan:");
  for (const layer of LAYERS) {
    const buf = readFileSync(join(FIRE_DIR, layer.file), "utf-8");
    const fc = JSON.parse(buf) as { features: unknown[] };
    const sizeKB = Math.round((Buffer.byteLength(buf) / 1024) * 10) / 10;
    console.log(
      `  ${layer.file.padEnd(30)} → ${layer.title.padEnd(36)}  ${String(
        fc.features.length
      ).padStart(3)} features / ${sizeKB} KB`
    );
  }
  const orphans = existing.filter(
    (f) => !LAYERS.some((l) => l.file === f)
  );
  if (orphans.length) {
    console.log();
    console.log("Note: these files exist but will NOT be published:");
    for (const o of orphans) console.log(`  ${o}`);
  }

  if (!CONFIRM) {
    console.log();
    console.log("─".repeat(60));
    console.log(
      "Dry-run complete. Re-run with --confirm to publish to AGOL."
    );
    console.log("─".repeat(60));
    return;
  }

  // Live run
  console.log();
  console.log("Authenticating…");
  const { accessToken, username } = await exchangeRefreshToken();
  console.log(`  ✓ access token for ${username}`);

  console.log();
  const results: Array<{
    envVar: string;
    title: string;
    serviceUrl: string;
    layerUrl: string;
    serviceItemId: string;
  }> = [];

  for (const layer of LAYERS) {
    console.log(`→ ${layer.title}`);
    console.log("  uploading…");
    const itemId = await addGeoJsonItem(accessToken, username, layer);
    console.log(`  ✓ item ${itemId}`);
    console.log("  publishing…");
    const { serviceUrl, serviceItemId } = await publishItem(
      accessToken,
      username,
      itemId,
      layer.title
    );
    console.log(`  ✓ service ${serviceItemId}`);
    console.log("  sharing public…");
    await shareItemEveryone(accessToken, username, serviceItemId);
    // AGOL serviceurl is the FeatureServer root; app layers usually reference /0
    const layerUrl = `${serviceUrl.replace(/\/+$/, "")}/0`;
    console.log(`  ✓ ${layerUrl}`);
    results.push({
      envVar: layer.envVar,
      title: layer.title,
      serviceUrl,
      layerUrl,
      serviceItemId,
    });
  }

  // Emit env snippet
  const snippetPath = join(FIRE_DIR, ".env.fire.snippet");
  const snippet =
    "# ─── Fire scenario AGOL layers (Shasta County) ──────────────\n" +
    "# Generated by scripts/publish_fire_layers.ts\n" +
    results.map((r) => `${r.envVar}=${r.layerUrl}`).join("\n") +
    "\n";
  writeFileSync(snippetPath, snippet);

  console.log();
  console.log("─".repeat(60));
  console.log("Done. Wrote env snippet:");
  console.log(`  ${snippetPath}`);
  console.log();
  console.log(snippet);
  console.log(
    "Paste the snippet into .env.local and Vercel env, then run the wire-up step."
  );
}

main().catch((e) => {
  console.error("\n✗ Fatal:", e);
  process.exit(1);
});
