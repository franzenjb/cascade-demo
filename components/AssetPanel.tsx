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

    case "fire_station": {
      const staffing = sum(attrs, "staffing");
      const byAgency: Record<string, number> = {};
      for (const a of attrs) {
        const key = (a.agency || "Unknown").toString();
        byAgency[key] = (byAgency[key] || 0) + 1;
      }
      return {
        title: "Fire Stations",
        summary: (
          <Totals
            items={[
              { label: "Stations", value: String(rows.length) },
              { label: "Staffing", value: staffing.toLocaleString() },
              ...Object.entries(byAgency)
                .slice(0, 2)
                .map(([t, n]) => ({ label: t, value: String(n) })),
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Agency", value: a.agency },
                { label: "Type", value: a.type },
                { label: "Staffing", value: a.staffing },
                a.in_fire_perimeter && {
                  label: "In perimeter",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "police": {
      const staffing = sum(attrs, "staffing");
      return {
        title: "Police Stations",
        summary: (
          <Totals
            items={[
              { label: "Agencies", value: String(rows.length) },
              { label: "Officers", value: staffing.toLocaleString() },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Agency", value: a.agency },
                { label: "Jurisdiction", value: a.jurisdiction },
                { label: "Staffing", value: a.staffing },
                a.in_fire_perimeter && {
                  label: "In perimeter",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "hospital": {
      const beds = sum(attrs, "bed_count");
      const er24h = attrs.filter((a) => a.has_er_24h === true).length;
      return {
        title: "Hospitals",
        summary: (
          <Totals
            items={[
              { label: "Hospitals", value: String(rows.length) },
              { label: "Beds", value: beds.toLocaleString() },
              { label: "24h ER", value: String(er24h) },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Beds", value: a.bed_count },
                { label: "Trauma", value: a.trauma_level },
                {
                  label: "24h ER",
                  value: a.has_er_24h ? "Yes" : "No",
                },
                a.in_fire_perimeter && {
                  label: "In perimeter",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dialysis": {
      const chairs = sum(attrs, "chairs");
      const homePts = sum(attrs, "home_dialysis_patients");
      return {
        title: "Dialysis Clinics",
        summary: (
          <Totals
            items={[
              { label: "Clinics", value: String(rows.length) },
              { label: "Chairs", value: chairs.toLocaleString() },
              { label: "Home patients", value: String(homePts) },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Chairs", value: a.chairs },
                {
                  label: "Home dialysis",
                  value: a.home_dialysis_patients,
                },
                a.in_fire_perimeter && {
                  label: "In perimeter",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "shelter": {
      const capacity = sum(attrs, "capacity");
      const open = attrs.filter((a) => a.status === "open").length;
      const standby = attrs.filter((a) => a.status === "standby").length;
      return {
        title: "Red Cross Shelters",
        summary: (
          <Totals
            items={[
              { label: "Shelters", value: String(rows.length) },
              { label: "Capacity", value: capacity.toLocaleString() },
              { label: "Open", value: String(open) },
              { label: "Standby", value: String(standby) },
            ]}
          />
        ),
        renderRow: (a) => (
          <>
            <RowHeader name={a.name} />
            <RowAddress value={a.address} />
            <RowTags
              tags={[
                { label: "Type", value: a.facility_type },
                { label: "Capacity", value: a.capacity },
                { label: "Status", value: a.status },
                a.in_fire_perimeter && {
                  label: "In perimeter",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dam_hospital": {
      const beds = sum(attrs, "bed_count");
      const er24h = attrs.filter((a) => a.has_er_24h === true).length;
      const inZone = attrs.filter((a) => a.in_inundation_zone).length;
      return {
        title: "Hospitals",
        summary: (
          <Totals
            items={[
              { label: "Hospitals", value: String(rows.length) },
              { label: "Beds", value: beds.toLocaleString() },
              { label: "24h ER", value: String(er24h) },
              ...(inZone > 0
                ? [{ label: "In flood zone", value: String(inZone), warn: true }]
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
                { label: "Beds", value: a.bed_count },
                { label: "Trauma", value: a.trauma_level },
                { label: "24h ER", value: a.has_er_24h ? "Yes" : "No" },
                a.in_inundation_zone && {
                  label: "In flood zone",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dam_nursing_home": {
      const residents = sum(attrs, "current_residents");
      const inZone = attrs.filter((a) => a.in_inundation_zone).length;
      const mobilityPct = attrs.length > 0
        ? Math.round(
            attrs.reduce((s, a) => s + (Number(a.mobility_impaired_pct) || 0), 0) /
              attrs.length *
              100
          )
        : 0;
      return {
        title: "Nursing Homes",
        summary: (
          <Totals
            items={[
              { label: "Facilities", value: String(rows.length) },
              { label: "Residents", value: residents.toLocaleString() },
              { label: "Avg mobility-impaired", value: `${mobilityPct}%` },
              ...(inZone > 0
                ? [{ label: "In flood zone", value: String(inZone), warn: true }]
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
                { label: "Beds", value: a.bed_count },
                { label: "Residents", value: a.current_residents },
                {
                  label: "Mobility-impaired",
                  value: a.mobility_impaired_pct
                    ? `${Math.round(a.mobility_impaired_pct * 100)}%`
                    : "—",
                },
                a.in_inundation_zone && {
                  label: "In flood zone",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dam_school": {
      const enrollment = sum(attrs, "enrollment");
      const inZone = attrs.filter((a) => a.in_inundation_zone).length;
      return {
        title: "Schools",
        summary: (
          <Totals
            items={[
              { label: "Schools", value: String(rows.length) },
              { label: "Students", value: enrollment.toLocaleString() },
              ...(inZone > 0
                ? [{ label: "In flood zone", value: String(inZone), warn: true }]
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
                { label: "Grades", value: a.grade_range },
                { label: "Enrollment", value: a.enrollment },
                a.in_inundation_zone && {
                  label: "In flood zone",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dam_shelter": {
      const capacity = sum(attrs, "capacity");
      const open = attrs.filter((a) => a.status === "open").length;
      const standby = attrs.filter((a) => a.status === "standby").length;
      const inZone = attrs.filter((a) => a.in_inundation_zone).length;
      return {
        title: "Red Cross Shelters",
        summary: (
          <Totals
            items={[
              { label: "Shelters", value: String(rows.length) },
              { label: "Capacity", value: capacity.toLocaleString() },
              { label: "Open", value: String(open) },
              { label: "Standby", value: String(standby) },
              ...(inZone > 0
                ? [{ label: "In flood zone", value: String(inZone), warn: true }]
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
                { label: "Type", value: a.facility_type },
                { label: "Capacity", value: a.capacity },
                { label: "Status", value: a.status },
                a.in_inundation_zone && {
                  label: "In flood zone",
                  value: "Yes",
                  warn: true,
                },
              ]}
            />
          </>
        ),
      };
    }

    case "dam_water_plant": {
      const totalCapacity = sum(attrs, "capacity_mgd");
      const servePop = sum(attrs, "serves_population");
      const inZone = attrs.filter((a) => a.in_inundation_zone).length;
      return {
        title: "Water Treatment Plants",
        summary: (
          <Totals
            items={[
              { label: "Facilities", value: String(rows.length) },
              { label: "Capacity", value: `${totalCapacity} MGD` },
              { label: "Serves", value: servePop.toLocaleString() },
              ...(inZone > 0
                ? [{ label: "In flood zone", value: String(inZone), warn: true }]
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
                { label: "Type", value: (a.facility_type || "").replace(/_/g, " ") },
                { label: "Capacity", value: a.capacity_mgd ? `${a.capacity_mgd} MGD` : "—" },
                { label: "Serves", value: a.serves_population?.toLocaleString() },
                a.in_inundation_zone && {
                  label: "In flood zone",
                  value: "Yes",
                  warn: true,
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
        summary: (
          <Totals items={[{ label: "Features", value: String(rows.length) }]} />
        ),
        renderRow: (a) => {
          const name = a.name || a.park_name || a.tract_name || a.fire_name || a.gauge_id || "Feature";
          const addr = a.address;
          const skip = new Set(["name", "address", "park_name", "tract_name", "OBJECTID", "FID"]);
          const tags = Object.entries(a)
            .filter(([k, v]) => !skip.has(k) && v != null && v !== "")
            .slice(0, 4)
            .map(([k, v]) => ({
              label: k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              value: v,
            }));
          return (
            <>
              <RowHeader name={String(name)} />
              {addr && <RowAddress value={addr} />}
              {tags.length > 0 && <RowTags tags={tags} />}
            </>
          );
        },
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
