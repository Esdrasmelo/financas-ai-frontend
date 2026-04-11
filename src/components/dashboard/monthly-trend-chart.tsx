"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRLFromCents } from "@/lib/money";
import { getChartPrimaryColor } from "@/lib/chart-theme";

type Row = { month: string; label: string; totalCents: number };

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground">{row.label}</p>
      <p className="text-foreground">{formatBRLFromCents(row.totalCents)}</p>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: Row[] }) {
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Intl.NumberFormat("pt-BR", { notation: v >= 100000 ? "compact" : "standard", maximumFractionDigits: 0 }).format(
                v / 100,
              )
            }
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
          <Bar dataKey="totalCents" fill={getChartPrimaryColor()} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
