"use client";

import { formatBRLFromCents } from "@/lib/money";

export function CategoryDonutTooltip({
  active,
  payload,
  totalCents,
  monthLabel,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number } }[];
  totalCents: number;
  monthLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  const pct = totalCents > 0 ? (row.value / totalCents) * 100 : 0;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{row.name}</p>
      <p className="mt-1 text-base font-medium text-foreground">{formatBRLFromCents(row.value)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {pct.toFixed(1)}% do total de gastos no mês ({monthLabel})
      </p>
    </div>
  );
}
