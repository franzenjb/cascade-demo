/**
 * ArcGIS Online REST client.
 *
 * Thin wrapper around AGOL Feature Service REST endpoints. Handles authentication,
 * query construction, and spatial operations.
 *
 * For Phase 1 demo, we use unauthenticated public-read queries wherever possible.
 * If credentials are provided via env vars, we'll acquire a token.
 */

import type { GeoJSONPolygon, GeoJSONPoint, GeoJSONGeometry } from "./types";

const PORTAL_URL = process.env.AGOL_PORTAL_URL || "https://arc-nhq-gis.maps.arcgis.com";

// ═══════════════════════════════════════════════════════════
// Token management
// ═══════════════════════════════════════════════════════════

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (process.env.AGOL_TOKEN) return process.env.AGOL_TOKEN;

  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const username = process.env.AGOL_USERNAME;
  const password = process.env.AGOL_PASSWORD;
  if (!username || !password) return null;

  const tokenUrl = `${PORTAL_URL}/sharing/rest/generateToken`;
  const body = new URLSearchParams({
    username,
    password,
    referer: PORTAL_URL,
    f: "json",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (data.token) {
    cachedToken = {
      token: data.token,
      expires: Date.now() + 50 * 60 * 1000, // 50-minute safety buffer
    };
    return data.token;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// Generic query builder
// ═══════════════════════════════════════════════════════════

export interface QueryOptions {
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  geometryType?: string;
  spatialRel?: string;
  geometry?: object;
  inSR?: number;
  outSR?: number;
}

export interface Feature {
  attributes: Record<string, unknown>;
  geometry?: object;
}

/**
 * Generic query against a Feature Service.
 */
export async function queryFeatures(
  serviceUrl: string,
  options: QueryOptions
): Promise<Feature[]> {
  const queryUrl = `${serviceUrl}/query`;
  const params = new URLSearchParams({
    f: "json",
    where: options.where || "1=1",
    outFields: options.outFields || "*",
    returnGeometry: String(options.returnGeometry ?? false),
  });

  if (options.geometry) {
    params.set("geometry", JSON.stringify(options.geometry));
    params.set("geometryType", options.geometryType || "esriGeometryPolygon");
    params.set("spatialRel", options.spatialRel || "esriSpatialRelIntersects");
    params.set("inSR", String(options.inSR || 4326));
  }
  params.set("outSR", String(options.outSR || 4326));

  const token = await getToken();
  if (token) params.set("token", token);

  const res = await fetch(queryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    throw new Error(`AGOL query failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`AGOL query error: ${JSON.stringify(data.error)}`);
  }

  return data.features || [];
}

/**
 * Query features by a GeoJSON geometry (wraps queryFeatures with spatial params).
 */
export async function queryFeaturesByGeometry(
  serviceUrl: string,
  geometry: unknown,
  options: Omit<QueryOptions, "geometry" | "geometryType" | "spatialRel"> = {}
): Promise<Feature[]> {
  // Convert GeoJSON to Esri geometry
  const esriGeometry = geoJsonToEsri(geometry as GeoJSONGeometry);
  const geometryType = getEsriGeometryType(geometry as GeoJSONGeometry);

  return queryFeatures(serviceUrl, {
    ...options,
    geometry: esriGeometry,
    geometryType,
    spatialRel: "esriSpatialRelIntersects",
    inSR: 4326,
  });
}

/**
 * Buffer a GeoJSON geometry by a given distance in miles.
 * Uses the AGOL geometry service.
 */
export async function bufferGeometry(
  geometry: unknown,
  distanceMiles: number
): Promise<GeoJSONPolygon> {
  const geometryServiceUrl =
    "https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/buffer";

  const esriGeometry = geoJsonToEsri(geometry as GeoJSONGeometry);

  const params = new URLSearchParams({
    f: "json",
    geometries: JSON.stringify({
      geometryType: getEsriGeometryType(geometry as GeoJSONGeometry),
      geometries: [esriGeometry],
    }),
    inSR: "4326",
    outSR: "4326",
    bufferSR: "102100", // Web Mercator for metric buffering
    distances: String(distanceMiles * 1609.34),
    unit: "9001", // meters
    unionResults: "true",
  });

  const res = await fetch(geometryServiceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Buffer failed: ${JSON.stringify(data.error)}`);
  }

  const buffered = data.geometries?.[0];
  if (!buffered) throw new Error("Buffer service returned no geometry");

  return esriToGeoJson(buffered) as GeoJSONPolygon;
}

// ═══════════════════════════════════════════════════════════
// GeoJSON ↔ Esri conversion helpers
// ═══════════════════════════════════════════════════════════

function getEsriGeometryType(geo: GeoJSONGeometry): string {
  if (geo.type === "Polygon") return "esriGeometryPolygon";
  if (geo.type === "Point") return "esriGeometryPoint";
  return "esriGeometryPolygon";
}

function geoJsonToEsri(geo: GeoJSONGeometry): object {
  if (geo.type === "Polygon") {
    return {
      rings: geo.coordinates,
      spatialReference: { wkid: 4326 },
    };
  }
  if (geo.type === "Point") {
    return {
      x: geo.coordinates[0],
      y: geo.coordinates[1],
      spatialReference: { wkid: 4326 },
    };
  }
  throw new Error(`Unsupported geometry type: ${(geo as GeoJSONGeometry).type}`);
}

function esriToGeoJson(esri: { rings?: number[][][]; x?: number; y?: number }): GeoJSONGeometry {
  if (esri.rings) {
    return { type: "Polygon", coordinates: esri.rings };
  }
  if (typeof esri.x === "number" && typeof esri.y === "number") {
    return { type: "Point", coordinates: [esri.x, esri.y] };
  }
  throw new Error("Unsupported Esri geometry");
}

/**
 * Apply a feature edit to a Feature Service (add / update / delete).
 * Used by the trigger endpoint to populate the active warnings layer.
 */
export async function applyEdits(
  serviceUrl: string,
  edits: {
    adds?: Array<{ geometry: object; attributes: Record<string, unknown> }>;
    updates?: Array<{ geometry?: object; attributes: Record<string, unknown> }>;
    deletes?: number[];
  }
): Promise<void> {
  const url = `${serviceUrl}/applyEdits`;
  const token = await getToken();
  if (!token) {
    throw new Error("applyEdits requires authentication; set AGOL_TOKEN or username/password");
  }

  const params = new URLSearchParams({ f: "json", token });
  if (edits.adds) params.set("adds", JSON.stringify(edits.adds));
  if (edits.updates) params.set("updates", JSON.stringify(edits.updates));
  if (edits.deletes) params.set("deletes", edits.deletes.join(","));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`applyEdits failed: ${JSON.stringify(data.error)}`);
  }
}
