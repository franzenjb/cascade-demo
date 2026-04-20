"use client";

import { useState } from "react";

type WarningType = "tornado" | "wildfire" | "dam_break";

interface ScenarioOption {
  id: string;
  label: string;
  headline: string;
  summary: string;
  accent: string;
  iconPath: string;
  warningType: WarningType;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: "tornado_buncombe_replay",
    label: "NWS Tornado Warning",
    headline: "Cascade County · Tornado Warning",
    summary:
      "NWS storm-based warning polygon cuts northeast across Cascade County.",
    accent: "#ED1B2E",
    iconPath:
      "M12 2 L6 12 L10 12 L8 22 L18 10 L14 10 L16 2 Z",
    warningType: "tornado",
  },
  {
    id: "fire_shasta_redding",
    label: "Wildfire Evacuation",
    headline: "Shasta County · Redding Fire",
    summary:
      "Active fire perimeter northwest of Redding — evacuation warning in effect.",
    accent: "#E85D04",
    iconPath:
      "M12 2 C8 6 8 10 10 12 C9 9 11 8 12 10 C13 7 16 8 16 12 C18 10 18 6 12 2 Z M8 14 C7 16 8 19 12 22 C16 19 17 16 16 14 C15 16 13 17 12 15 C11 17 9 16 8 14 Z",
    warningType: "wildfire",
  },
  {
    id: "dam_oroville_break",
    label: "Dam Break Inundation",
    headline: "Butte County · Oroville Dam",
    summary:
      "Catastrophic dam failure — inundation zone along the Feather River through Oroville.",
    accent: "#1B6EC2",
    iconPath:
      "M2 20 L6 12 L10 16 L14 8 L18 14 L22 6 L22 20 Z M4 18 Q8 14 12 18 Q16 14 20 18 Z",
    warningType: "dam_break",
  },
];

interface TriggerButtonProps {
  onFired: (
    directive: string,
    polygon: unknown,
    scenarioId: string,
    warningType: WarningType,
    nwsEventId: string | null
  ) => void;
}

export default function TriggerButton({ onFired }: TriggerButtonProps) {
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(
    null
  );
  const [fired, setFired] = useState(false);
  const [showPicker, setShowPicker] = useState(true);

  const showButton = process.env.NEXT_PUBLIC_SHOW_TRIGGER_BUTTON !== "false";
  if (!showButton) return null;

  async function runScenario(option: ScenarioOption) {
    if (loadingScenarioId) return;
    setShowPicker(false);
    setLoadingScenarioId(option.id);
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: option.id }),
      });
      const data = await res.json();
      if (data.success && data.trigger_directive) {
        onFired(
          data.trigger_directive,
          data.polygon,
          data.scenario_id || option.id,
          (data.warning_type as WarningType) || option.warningType,
          data.nws_event_id || null
        );
        setFired(true);
        setTimeout(() => setFired(false), 3000);
      } else {
        console.error("Trigger failed:", data);
      }
    } catch (err) {
      console.error("Trigger error:", err);
    } finally {
      setLoadingScenarioId(null);
    }
  }

  const loading = loadingScenarioId !== null;
  const buttonLabel = loading
    ? "Simulating…"
    : fired
    ? "Warning Active"
    : "Run a Simulation";

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        disabled={loading}
        className={`
          px-4 py-2 text-xs font-semibold
          border-2 border-arc-red text-arc-red
          hover:bg-arc-red hover:text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${fired ? "bg-arc-red text-white" : "bg-white dark:bg-arc-gray-900"}
        `}
      >
        {buttonLabel}
      </button>

      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 px-4"
          onClick={() => setShowPicker(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-arc-gray-900 border-2 border-arc-red max-w-2xl w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-data uppercase tracking-widest text-arc-red mb-2">
              Project Cascade · Simulation
            </div>
            <h3 className="font-headline text-xl font-bold text-arc-black dark:text-arc-cream mb-2 leading-tight">
              Choose a scenario
            </h3>
            <p className="text-sm text-arc-gray-900 dark:text-arc-cream leading-relaxed mb-5">
              Each scenario simulates what would occur if a real alert were
              triggered — the application responds proactively with a live
              situational briefing built from Cascade County layers.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => runScenario(s)}
                  disabled={loading}
                  className="text-left p-4 border-2 bg-white dark:bg-arc-gray-900 hover:bg-arc-cream dark:hover:bg-arc-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: s.accent }}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      className="flex-shrink-0 mt-0.5"
                      fill={s.accent}
                    >
                      <path d={s.iconPath} />
                    </svg>
                    <div className="flex-1">
                      <div
                        className="text-[10px] font-data uppercase tracking-widest mb-0.5"
                        style={{ color: s.accent }}
                      >
                        {s.label}
                      </div>
                      <div className="font-headline text-sm font-bold text-arc-black dark:text-arc-cream leading-tight mb-1">
                        {s.headline}
                      </div>
                      <p className="text-xs text-arc-gray-500 dark:text-arc-gray-300 leading-snug">
                        {s.summary}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPicker(false)}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-arc-gray-300 dark:border-arc-gray-700 text-arc-gray-900 dark:text-arc-cream hover:bg-arc-cream dark:hover:bg-arc-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
