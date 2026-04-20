/**
 * Shared TypeScript types for Project Cascade.
 */

// ═══════════════════════════════════════════════════════════
// Semantic Catalog Types
// ═══════════════════════════════════════════════════════════

export type DisasterType =
  | "tornado"
  | "hurricane"
  | "hurricane_pre_landfall"
  | "wildfire"
  | "flood"
  | "earthquake"
  | "winter_storm"
  | "psps";

export type RelevanceLevel = "high" | "medium" | "low" | "none";

export type AccessTier = "public" | "internal" | "role-restricted" | "privacy-restricted";

export interface LayerDefinition {
  id: string;
  service_url_env: string;
  display_name: string;
  aliases: string[];
  disaster_relevance: Partial<Record<DisasterType, RelevanceLevel>>;
  why_it_matters: string;
  schema: Record<string, string>;
  access_tier: AccessTier;
  data_vintage: string;
  known_limitations: string;
}

export interface DisasterPlaybook {
  default_layers: string[];
  narrative_structure?: string[];
}

export interface SemanticCatalog {
  catalog_version: string;
  last_updated: string;
  synthetic_data_notice: string;
  layers: LayerDefinition[];
  disaster_playbooks: Record<string, DisasterPlaybook>;
}

// ═══════════════════════════════════════════════════════════
// GeoJSON Types (simplified)
// ═══════════════════════════════════════════════════════════

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export type GeoJSONGeometry = GeoJSONPolygon | GeoJSONPoint;

// ═══════════════════════════════════════════════════════════
// Chat & Tool Use Types
// ═══════════════════════════════════════════════════════════

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Scenario Types
// ═══════════════════════════════════════════════════════════

export type ScenarioWarningType = "tornado" | "wildfire" | "dam_break";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  warning_type: ScenarioWarningType;
  nws_event_id: string;
  issued_offset_seconds: number;
  expires_offset_seconds: number;
  polygon_geojson: GeoJSONPolygon;
  trigger_directive?: string;
  expected_impact_numbers?: Record<string, number | string | number[] | string[]>;
  narrative_notes: string;
}

export type TornadoScenario = Scenario;

// ═══════════════════════════════════════════════════════════
// Map State Types (frontend ↔ API)
// ═══════════════════════════════════════════════════════════

export interface MapInstruction {
  action: "draw" | "clear" | "zoom_to" | "highlight";
  geometry?: GeoJSONGeometry;
  style?: {
    color?: string;
    opacity?: number;
    label?: string;
    scale?: number;
  };
  layer_label?: string;
}

// ═══════════════════════════════════════════════════════════
// Feature rows (for drill-down panels)
// ═══════════════════════════════════════════════════════════

export interface FeatureRow {
  attributes: Record<string, any>;
  geometry?: { lon: number; lat: number };
}

// ═══════════════════════════════════════════════════════════
// Session State
// ═══════════════════════════════════════════════════════════

export interface SessionState {
  session_id: string;
  started_at: string;
  active_event_id?: string;
  user_role?: string;
  messages: ChatMessage[];
}
