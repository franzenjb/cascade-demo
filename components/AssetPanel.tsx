"use client";

import { useEffect, useRef } from "react";
import type { FeatureRow } from "@/lib/types";

interface AssetPanelProps {
  category: string;
  features: FeatureRow[];
  onSelect?: (row: FeatureRow) => void;
  highlighted?: { lon: number; lat: number; n: number } | null;
}

function sameCoords(
  a: { lon: number; lat: number } | undefined,
  b: { lon: number; lat: number } | null | undefined
): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.lon - b.lon) < 0.0000005 && Math.abs(a.lat - b.lat) < 0.0000005
  );
}

/**
 * Fills the right-side tabbed container when the user picks a category.
 * No header, no close button — the tab bar above handles switching back
 * to Conversation, and the chip in the map section toggles the filter.
 */
export default function AssetPanel({
  category,
  features,
  onSelect,
  highlighted,
}: AssetPanelProps) {
  const rows = features ?? [];
  const cfg = configFor(category, rows);
  const highlightedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (highlighted && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlighted?.n]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {cfg.summary && (
        <div className="px-4 py-3 border-b border-arc-gray-100 dark:border-arc-gray-700 bg-arc-cream/60 dark:bg-arc-black/60 text-xs text-arc-gray-900 dark:text-arc-cream">
          {cfg.summary}
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-arc-gray-100 dark:divide-arc-gray-700">
        {rows.length === 0 && (
          <div className="p-4 text-xs text-arc-gray-500 dark:text-arc-gray-300 italic">
            No features captured yet.
          </div>
        )}
        {rows.map((row, i) => {
          const clickable = Boolean(row.geometry && onSelect);
          const isHighlighted = sameCoords(row.geometry, highlighted);
          return (
            <button
              key={i}
              type="button"
              ref={isHighlighted ? highlightedRef : undefined}
              onClick={clickable ? () => onSelect?.(row) : undefined}
              disabled={!clickable}
              className={`w-full text-left p-3 text-xs transition-colors ${
                isHighlighted
                  ? "bg-arc-red/10 ring-2 ring-arc-red ring-inset"
                  : clickable
                  ? "hover:bg-arc-cream/60 dark:hover:bg-arc-black/40 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              {cfg.renderRow(row.attributes)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface CategoryConfig {
  title: string;
  summary: React.ReactNode | null;
  renderRow: (attrs: Record<string, any>) => React.ReactNode;
}

export function configFor(category: string, rows: FeatureRow[]): CategoryConfig {
  const attrs = rows.map((r) => r.attributes || {});

  switch (category) {
    case "mobile_home_park": {
      const units = sum(attrs, "unit_count");
      return {
        title: "Mobile Home Parks",
        summary: (
          <Totals
            items={[
              { label: "Total units", value: units.toLocaleString() },
              { label: "Parks", value: String(rows.length) },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.park_name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Units", value: a.unit_count },
                a.year_established && {
                  label: "Est.",
                  value: a.year_established,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "school": {
      const enrollment = sum(attrs, "enrollment");
      return {
        title: "Schools",
        summary: (
          <Totals
            items={[
              { label: "Students", value: enrollment.toLocaleString() },
              { label: "Schools", value: String(rows.length) },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Type", value: a.type },
                { label: "Enrollment", value: a.enrollment },
              ]}
            />
          </>
        ),
      };
    }

    case "medical": {
      const beds = sum(attrs, "bed_count");
      const dialysis = sum(attrs, "home_dialysis_patients");
      const noBackup = attrs.filter((a) => a.has_backup_power === false).length;
      return {
        title: "Medical Facilities",
        summary: (
          <Totals
            items={[
              { label: "Beds", value: beds.toLocaleString() },
              { label: "Home dialysis", value: String(dialysis) },
              ...(noBackup > 0
                ? [
                    {
                      label: "No backup",
                      value: String(noBackup),
                      warn: true,
                    },
                  ]
                : []),
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Type", value: a.type },
                { label: "Beds", value: a.bed_count },
                a.home_dialysis_patients != null && {
                  label: "Dialysis",
                  value: a.home_dialysis_patients,
                },
                {
                  label: "Backup power",
                  value: a.has_backup_power ? "Yes" : "No",
                  warn: a.has_backup_power === false,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "red_cross": {
      const byType: Record<string, number> = {};
      for (const a of attrs) {
        const t = (a.type || "Unknown").toString();
        byType[t] = (byType[t] || 0) + 1;
      }
      const capacity = sum(attrs, "capacity");
      return {
        title: "Red Cross Assets",
        summary: (
          <Totals
            items={[
              ...Object.entries(byType).map(([t, n]) => ({
                label: t,
                value: String(n),
              })),
              capacity > 0 && {
                label: "Capacity",
                value: capacity.toLocaleString(),
              },
            ].filter(Boolean) as { label: string; value: string }[]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.asset_name || a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Type", value: a.type },
                a.capacity != null && { label: "Capacity", value: a.capacity },
                a.operational_status && {
                  label: "Status",
                  value: a.operational_status,
                },
              ]}
            />
          </>
        ),
      };
    }

    default:
      return {
        title: category,
        summary: null,
        renderRow: (a) => <pre>{JSON.stringify(a, null, 2)}</pre>,
      };
  }
}

function sum(attrs: Record<string, any>[], key: string): number {
  return attrs.reduce((s, a) => s + (Number(a[key]) || 0), 0);
}

function RowHeader({ name }: { name?: string }) {
  return (
    <div className="font-semibold text-sm text-arc-black dark:text-arc-cream">
      {name || "Unnamed"}
    </div>
  );
}

function RowAddress({ value }: { value?: string }) {
  if (!value) return null;
  return <div className="text-arc-gray-500 dark:text-arc-gray-300 mt-0.5">{value}</div>;
}

type TagEntry =
  | { label: string; value: unknown; warn?: boolean }
  | false
  | null
  | undefined;

function RowTags({ tags }: { tags: TagEntry[] }) {
  const cleaned = tags.filter(
    (t): t is { label: string; value: unknown; warn?: boolean } => Boolean(t)
  );
  if (cleaned.length === 0) return null;
  return (
    <div className="flex gap-3 flex-wrap mt-2">
      {cleaned.map((t, i) => (
        <div key={i}>
          <div className="text-[9px] font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300">
            {t.label}
          </div>
          <div
            className={`text-xs font-semibold ${
              t.warn ? "text-arc-red" : "text-arc-black dark:text-arc-cream"
            }`}
          >
            {t.value == null || t.value === "" ? "—" : String(t.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Totals({
  items,
}: {
  items: { label: string; value: string; warn?: boolean }[];
}) {
  return (
    <div className="flex gap-4 flex-wrap">
      {items.map((item, i) => (
        <div key={i}>
          <div className="text-[9px] font-data uppercase tracking-wider text-arc-gray-500 dark:text-arc-gray-300">
            {item.label}
          </div>
          <div
            className={`text-sm font-headline font-bold ${
              item.warn ? "text-arc-red" : "text-arc-black dark:text-arc-cream"
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
