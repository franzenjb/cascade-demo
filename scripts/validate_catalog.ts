/**
 * Catalog Validator
 * =================
 *
 * Checks that every layer in data/semantic_catalog.json has:
 *   1. A valid service_url_env environment variable name
 *   2. That environment variable actually set in .env.local
 *   3. The URL resolves to an accessible AGOL Feature Service
 *
 * USAGE:
 *   npm run validate:catalog
 *
 * Run this after publishing your 10 DEMO_Cascade_* layers to AGOL and pasting
 * their service URLs into .env.local.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

// Load env vars from .env.local
config({ path: join(process.cwd(), ".env.local") });

interface LayerDef {
  id: string;
  service_url_env: string;
  display_name: string;
  access_tier: string;
}

interface Catalog {
  catalog_version: string;
  layers: LayerDef[];
}

const catalogPath = join(process.cwd(), "data", "semantic_catalog.json");
const catalog: Catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));

console.log("═".repeat(60));
console.log("Project Cascade — Catalog Validator");
console.log("═".repeat(60));
console.log(`Version: ${catalog.catalog_version}`);
console.log(`Layers to validate: ${catalog.layers.length}`);
console.log();

let pass = 0;
let fail = 0;
const failures: string[] = [];

async function validate() {
  for (const layer of catalog.layers) {
    process.stdout.write(`  ${layer.id.padEnd(42)} `);

    const envVarName = layer.service_url_env;
    const url = process.env[envVarName];

    if (!url) {
      console.log(`❌  Env var ${envVarName} not set`);
      failures.push(`${layer.id}: ${envVarName} not set in .env.local`);
      fail++;
      continue;
    }

    if (!url.startsWith("https://")) {
      console.log(`❌  URL doesn't start with https://`);
      failures.push(`${layer.id}: invalid URL format`);
      fail++;
      continue;
    }

    // Try a simple HEAD/GET to verify the service responds
    try {
      const queryUrl = `${url}?f=json`;
      const res = await fetch(queryUrl, { method: "GET" });
      if (!res.ok) {
        console.log(`❌  HTTP ${res.status}`);
        failures.push(`${layer.id}: ${res.status} ${res.statusText}`);
        fail++;
        continue;
      }
      const data = await res.json();
      if (data.error) {
        console.log(`❌  AGOL error: ${data.error.message}`);
        failures.push(`${layer.id}: ${data.error.message}`);
        fail++;
        continue;
      }
      console.log(`✓  OK`);
      pass++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌  ${msg}`);
      failures.push(`${layer.id}: ${msg}`);
      fail++;
    }
  }

  console.log();
  console.log("═".repeat(60));
  console.log(`Results: ${pass} passed, ${fail} failed`);
  console.log("═".repeat(60));

  if (fail > 0) {
    console.log();
    console.log("FAILURES:");
    for (const f of failures) console.log(`  • ${f}`);
    console.log();
    console.log(
      "To fix: publish missing layers to AGOL, then paste service URLs into .env.local."
    );
    process.exit(1);
  }

  console.log();
  console.log("All catalog layers validated. Demo is ready to run.");
}

validate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
