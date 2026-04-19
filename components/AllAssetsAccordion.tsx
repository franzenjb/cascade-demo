"use client";

import { useEffect, useState } from "react";
import type { FeatureRow } from "@/lib/types";
import { configFor } from "./AssetPanel";

interface SectionDef {
  id: string;
  label: string;
  dot: string;
}

interface AllAssetsAccordionProps {
  sections: SectionDef[];
  features: Record<string, FeatureRow[]>;
  onSelect: (row: FeatureRow) => void;
  resetSignal?: number;
}

export default function AllAssetsAccordion({
  sections,
  features,
  onSelect,
  resetSignal,
}: AllAssetsAccordionProps) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, true]))
  );

  useEffect(() => {
    setOpen(Object.fromEntries(sections.map((s) => [s.id, true])));
  }, [resetSignal, sections]);

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex-1 overflow-y-auto">
      {sections.map((section) => {
        const rows = features[section.id] ?? [];
        const isOpen = open[section.id];
        const cfg = configFor(section.id, rows);
        return (
          <div key={section.id} className="border-b border-arc-gray-100 dark:border-arc-gray-700">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-arc-cream/40 dark:hover:bg-arc-black/40 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: section.dot }}
              />
              <span className="text-sm font-semibold text-arc-black dark:text-arc-cream flex-1">
                {section.label}
              </span>
              <span
                className={`text-[11px] font-data px-1.5 py-0.5 ${
                  rows.length > 0
                    ? "bg-arc-black text-white dark:bg-arc-cream dark:text-arc-black"
                    : "bg-arc-cream dark:bg-arc-black text-arc-gray-500 dark:text-arc-gray-300"
                }`}
              >
                {rows.length}
              </span>
              <svg
                className={`w-3 h-3 text-arc-gray-500 dark:text-arc-gray-300 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
                viewBox="0 0 12 12"
                fill="currentColor"
                aria-hidden
              >
                <path d="M4 2 L8 6 L4 10 Z" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-arc-gray-100 dark:border-arc-gray-700">
                {cfg.summary && rows.length > 0 && (
                  <div className="px-4 py-2.5 bg-arc-cream/60 dark:bg-arc-black/60 text-xs text-arc-gray-900 dark:text-arc-cream">
                    {cfg.summary}
                  </div>
                )}
                {rows.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-arc-gray-500 dark:text-arc-gray-300 italic">
                    No assets in warning footprint.
                  </div>
                ) : (
                  <div className="divide-y divide-arc-gray-100 dark:divide-arc-gray-700">
                    {rows.map((row, i) => {
                      const clickable = Boolean(row.geometry);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={
                            clickable ? () => onSelect(row) : undefined
                          }
                          disabled={!clickable}
                          className={`w-full text-left p-3 text-xs transition-colors ${
                            clickable
                              ? "hover:bg-arc-cream/60 dark:hover:bg-arc-black/40 cursor-pointer"
                              : "cursor-default"
                          }`}
                        >
                          {cfg.renderRow(row.attributes)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
