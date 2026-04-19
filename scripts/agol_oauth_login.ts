/**
 * AGOL OAuth Bootstrap (PKCE)
 * ============================
 *
 * One-time interactive flow to mint an AGOL refresh token for publishing
 * new hosted feature services from this machine. MFA-safe — uses a browser
 * auth flow instead of a scripted username/password.
 *
 * Required in .env.local:
 *   AGOL_PORTAL_URL=https://arc-nhq-gis.maps.arcgis.com
 *   AGOL_OAUTH_CLIENT_ID=...   (Native App registered in AGOL UI)
 *
 * Usage:
 *   npx ts-node scripts/agol_oauth_login.ts
 *
 * After success, AGOL_REFRESH_TOKEN is written back into .env.local.
 */

import * as http from "node:http";
import * as crypto from "node:crypto";
import { exec } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENV_PATH = join(process.cwd(), ".env.local");
const REDIRECT_URI = "http://localhost:8765/callback";
const CALLBACK_PORT = 8765;
const TIMEOUT_MS = 2 * 60 * 1000;

function loadEnv(): Record<string, string> {
  const text = readFileSync(ENV_PATH, "utf-8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function upsertEnvVar(name: string, value: string): void {
  const text = readFileSync(ENV_PATH, "utf-8");
  const liveRx = new RegExp(`^${name}=.*$`, "m");
  const commentRx = new RegExp(`^#\\s*${name}=.*$`, "m");
  let next: string;
  if (liveRx.test(text)) {
    next = text.replace(liveRx, `${name}=${value}`);
  } else if (commentRx.test(text)) {
    next = text.replace(commentRx, `${name}=${value}`);
  } else {
    next = text.replace(/\s*$/, "") + `\n${name}=${value}\n`;
  }
  writeFileSync(ENV_PATH, next);
}

const env = loadEnv();
const PORTAL = (env.AGOL_PORTAL_URL || "").replace(/\/+$/, "");
const CLIENT_ID = env.AGOL_OAUTH_CLIENT_ID;

if (!PORTAL) {
  console.error("AGOL_PORTAL_URL missing in .env.local");
  process.exit(1);
}
if (!CLIENT_ID) {
  console.error(
    "AGOL_OAUTH_CLIENT_ID missing in .env.local. Register a Native App in AGOL UI and paste its Client ID."
  );
  process.exit(1);
}

const verifier = base64url(crypto.randomBytes(32));
const challenge = base64url(
  crypto.createHash("sha256").update(verifier).digest()
);
const csrfState = base64url(crypto.randomBytes(16));

const authUrl =
  `${PORTAL}/sharing/rest/oauth2/authorize?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&response_type=code` +
  `&expiration=20160` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&code_challenge=${encodeURIComponent(challenge)}` +
  `&code_challenge_method=S256` +
  `&state=${encodeURIComponent(csrfState)}`;

console.log("═".repeat(60));
console.log("AGOL OAuth Bootstrap (PKCE)");
console.log("═".repeat(60));
console.log(`Portal:    ${PORTAL}`);
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Redirect:  ${REDIRECT_URI}`);
console.log();
console.log("Opening browser for auth. Approve; you'll be redirected back.");
console.log();
console.log(`If it doesn't open automatically, paste this URL:`);
console.log(`  ${authUrl}`);
console.log();

let done = false;

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }
  const u = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
  if (u.pathname !== "/callback") {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }

  const code = u.searchParams.get("code");
  const gotState = u.searchParams.get("state");
  const errParam = u.searchParams.get("error");
  const errDesc = u.searchParams.get("error_description");

  if (errParam) {
    res.writeHead(400, { "content-type": "text/html" });
    res.end(
      `<h1>OAuth error</h1><pre>${errParam}\n${errDesc || ""}</pre>` +
        `<p>Check the terminal and re-run the script.</p>`
    );
    console.error(`\nOAuth error: ${errParam} — ${errDesc || ""}`);
    done = true;
    server.close();
    process.exit(1);
  }

  if (!code || gotState !== csrfState) {
    res.writeHead(400, { "content-type": "text/html" });
    res.end("<h1>Missing code or state mismatch</h1>");
    console.error("\nCallback missing code or state mismatch.");
    done = true;
    server.close();
    process.exit(1);
  }

  try {
    const body = new URLSearchParams({
      f: "json",
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });

    const tokenRes = await fetch(`${PORTAL}/sharing/rest/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      username?: string;
      error?: { message?: string; details?: string[] };
    };

    if (tokens.error || !tokens.access_token) {
      res.writeHead(500, { "content-type": "text/html" });
      res.end(
        `<h1>Token exchange failed</h1><pre>${JSON.stringify(
          tokens,
          null,
          2
        )}</pre>`
      );
      console.error("\nToken exchange failed:", JSON.stringify(tokens, null, 2));
      done = true;
      server.close();
      process.exit(1);
    }

    if (tokens.refresh_token) {
      upsertEnvVar("AGOL_REFRESH_TOKEN", tokens.refresh_token);
    }

    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      `<!doctype html><meta charset="utf-8">` +
        `<title>Cascade Demo — OAuth</title>` +
        `<body style="font-family:system-ui;max-width:560px;margin:80px auto;padding:24px;">` +
        `<h1 style="color:#2d7a2d;">✓ Authorized</h1>` +
        `<p>Refresh token saved to <code>.env.local</code>. You can close this tab.</p>` +
        `<p style="color:#666;font-size:12px;">Return to the terminal — the script has exited.</p>` +
        `</body>`
    );

    console.log();
    console.log("✓  Authorization succeeded.");
    if (tokens.username) console.log(`   username:             ${tokens.username}`);
    console.log(`   access_token:         ${tokens.access_token.slice(0, 24)}…`);
    console.log(`   access expires_in:    ${tokens.expires_in} seconds`);
    if (tokens.refresh_token) {
      console.log(`   refresh_token:        saved to .env.local`);
      if (tokens.refresh_token_expires_in) {
        const days = Math.round(tokens.refresh_token_expires_in / 86400);
        console.log(
          `   refresh expires_in:   ${tokens.refresh_token_expires_in}s (~${days} days)`
        );
      }
    } else {
      console.log(`   ⚠  No refresh_token returned. Access token only.`);
    }

    done = true;
    server.close();
    setTimeout(() => process.exit(0), 100);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.writeHead(500, { "content-type": "text/html" });
    res.end(`<h1>Error</h1><pre>${msg}</pre>`);
    console.error("\nToken exchange exception:", e);
    done = true;
    server.close();
    process.exit(1);
  }
});

server.on("error", (e) => {
  console.error(`\nCallback server failed: ${(e as Error).message}`);
  if ((e as NodeJS.ErrnoException).code === "EADDRINUSE") {
    console.error(`Port ${CALLBACK_PORT} is in use. Kill whatever's on it and retry.`);
  }
  process.exit(1);
});

server.listen(CALLBACK_PORT, () => {
  exec(`open "${authUrl.replace(/"/g, "%22")}"`, (err) => {
    if (err) {
      console.error("Couldn't auto-open browser — paste the URL above.");
    }
  });
});

setTimeout(() => {
  if (done) return;
  console.error(
    `\n⏱  Timed out after ${Math.round(TIMEOUT_MS / 1000)}s. Did you complete the browser flow?`
  );
  server.close();
  process.exit(1);
}, TIMEOUT_MS);
