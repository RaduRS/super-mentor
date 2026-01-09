import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addDays, format, parse } from "date-fns";

type NutritionTrackingRow = {
  date: string;
  total_vitamin_d_mcg: number | null;
  total_vitamin_b12_mcg: number | null;
  total_iron_mg: number | null;
  total_calcium_mg: number | null;
  total_magnesium_mg: number | null;
  total_omega3_g: number | null;
};

type MetricKey =
  | "total_vitamin_d_mcg"
  | "total_vitamin_b12_mcg"
  | "total_iron_mg"
  | "total_calcium_mg"
  | "total_magnesium_mg"
  | "total_omega3_g";

const metricMeta: Record<
  MetricKey,
  { label: string; unit: string; target: number; color: string }
> = {
  total_vitamin_d_mcg: {
    label: "Vitamin D",
    unit: "mcg",
    target: 15,
    color: "#2563eb",
  },
  total_vitamin_b12_mcg: {
    label: "Vitamin B12",
    unit: "mcg",
    target: 2.4,
    color: "#7c3aed",
  },
  total_iron_mg: {
    label: "Iron",
    unit: "mg",
    target: 8,
    color: "#ea580c",
  },
  total_calcium_mg: {
    label: "Calcium",
    unit: "mg",
    target: 1000,
    color: "#16a34a",
  },
  total_magnesium_mg: {
    label: "Magnesium",
    unit: "mg",
    target: 400,
    color: "#0f172a",
  },
  total_omega3_g: {
    label: "Omega-3",
    unit: "g",
    target: 1.6,
    color: "#0891b2",
  },
};

function formatAxisDate(milliseconds: number) {
  const date = new Date(milliseconds);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NutritionTrendChart(props: {
  endDate: string;
  weekNutrition: NutritionTrackingRow[];
}) {
  const { endDate, weekNutrition } = props;
  const [metric, setMetric] = useState<MetricKey>("total_vitamin_d_mcg");

  const chartData = useMemo(() => {
    const byDate = new Map<string, NutritionTrackingRow>();
    for (const row of weekNutrition) {
      byDate.set(row.date, row);
    }

    const start = addDays(parse(endDate, "yyyy-MM-dd", new Date()), -6);
    const points: Array<{ ts: number; value: number | null; target: number }> =
      [];

    for (let i = 0; i < 7; i += 1) {
      const dateOnly = format(addDays(start, i), "yyyy-MM-dd");
      const row = byDate.get(dateOnly);
      const raw = row?.[metric];
      const value =
        typeof raw === "number" && Number.isFinite(raw) ? raw : null;
      const ts = new Date(`${dateOnly}T00:00:00Z`).getTime();
      points.push({ ts, value, target: metricMeta[metric].target });
    }

    return points;
  }, [endDate, metric, weekNutrition]);

  const yDomain = useMemo(() => {
    const meta = metricMeta[metric];
    let max = meta.target;
    for (const p of chartData) {
      if (typeof p.value === "number" && Number.isFinite(p.value)) {
        max = Math.max(max, p.value);
      }
    }
    const padded = max <= 0 ? 1 : max * 1.15;
    return [0, padded] as const;
  }, [chartData, metric]);

  if (!endDate) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          7-day micronutrient trend
        </div>
        <select
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-black sm:w-auto"
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
        >
          {(Object.keys(metricMeta) as MetricKey[]).map((key) => (
            <option key={key} value={key}>
              {metricMeta[key].label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatAxisDate(Number(v))}
            />
            <YAxis
              domain={yDomain as unknown as [number, number]}
              tickFormatter={(v) => {
                if (typeof v !== "number" || !Number.isFinite(v)) return "—";
                const rounded = Math.round(v * 10) / 10;
                return `${rounded}${metricMeta[metric].unit}`;
              }}
              width={70}
            />
            <Tooltip
              labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
              formatter={(value, name) => {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                  return ["—", String(name)];
                }
                const rounded = Math.round(value * 10) / 10;
                return [
                  `${rounded}${metricMeta[metric].unit}`,
                  name === "value" ? metricMeta[metric].label : "Target",
                ];
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metricMeta[metric].color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 6"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

