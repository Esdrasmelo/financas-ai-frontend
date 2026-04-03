"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";

type Kpis = {
  competencyMonth: string;
  view: string;
  totalSpentCents: number;
  fixedExpensesCents: number;
  variableExpensesCents: number;
  previousMonthTotalCents: number;
  monthOverMonthDiffCents: number;
  monthOverMonthDiffPercent: number | null;
  openStatementsPendingCents: number;
  nextStatement: {
    statementId: string;
    creditCardName: string;
    dueDate: string;
    totalPendingCents: number;
  } | null;
  futureInstallmentsCents: number;
  activeInstallmentPurchasesCount: number;
  percentCommittedApprox: number | null;
};

type CatRow = { categoryId: string; categoryName: string; amountCents: number };

const CHART_COLORS = [
  "#0d9488",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#dc2626",
  "#4f46e5",
];

function CategoryPieTooltip({
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
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-md dark:border-zinc-600 dark:bg-zinc-900">
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{row.name}</p>
      <p className="mt-1 text-base font-medium text-zinc-800 dark:text-zinc-100">
        {formatBRLFromCents(row.value)}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {pct.toFixed(1)}% do total de gastos no mês ({monthLabel})
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentCompetencyMonth());
  const [view, setView] = useState<"occurrence" | "payment">("occurrence");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    const q = new URLSearchParams({ competencyMonth: month, view });
    void (async () => {
      try {
        const [k, c] = await Promise.all([
          fetch(`${base}/dashboard/kpis?${q}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<Kpis>;
          }),
          fetch(`${base}/dashboard/category-breakdown?${q}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<CatRow[]>;
          }),
        ]);
        if (cancelled) return;
        setKpis(k);
        setCats(c);
        setErr(null);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Falha ao carregar");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, view]);

  const chartData = cats.map((c) => ({ name: c.categoryName, value: c.amountCents }));
  const chartTotalCents = chartData.reduce((s, d) => s + d.value, 0);
  const viewLabel = view === "occurrence" ? "por ocorrência" : "por pagamento";
  const monthLabel = `${month} (${viewLabel})`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">KPIs e visão por competência</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Mês (YYYY-MM)</Label>
          <Input id="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "occurrence" | "payment")}>
          <TabsList>
            <TabsTrigger value="occurrence">Por ocorrência</TabsTrigger>
            <TabsTrigger value="payment">Por pagamento</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total no mês</CardTitle>
              <CardDescription>Inclui lançamentos e cartão ({view})</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatBRLFromCents(kpis.totalSpentCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contas fixas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatBRLFromCents(kpis.fixedExpensesCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gastos variáveis</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatBRLFromCents(kpis.variableExpensesCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vs mês anterior</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{formatBRLFromCents(kpis.monthOverMonthDiffCents)}</p>
              {kpis.monthOverMonthDiffPercent != null && (
                <p className="text-sm text-zinc-500">{kpis.monthOverMonthDiffPercent.toFixed(1)}%</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Próxima fatura (total)</CardTitle>
            </CardHeader>
            <CardContent>
              {kpis.nextStatement ? (
                <>
                  <p className="font-medium">{kpis.nextStatement.creditCardName}</p>
                  <p className="text-xl font-semibold">{formatBRLFromCents(kpis.nextStatement.totalPendingCents)}</p>
                  <p className="text-xs text-zinc-500">Vence {formatDateDdMmYyyy(kpis.nextStatement.dueDate)}</p>
                </>
              ) : (
                <p className="text-zinc-500">Nenhuma pendência futura</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Faturas abertas (pendente)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatBRLFromCents(kpis.openStatementsPendingCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Parcelas futuras</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{formatBRLFromCents(kpis.futureInstallmentsCents)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Compras parceladas ativas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{kpis.activeInstallmentPurchasesCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comprometido (aprox.)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {kpis.percentCommittedApprox != null ? `${kpis.percentCommittedApprox.toFixed(1)}%` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoria</CardTitle>
          <CardDescription>
            Parte de cada categoria no total do mês <span className="font-medium">{month}</span> ({viewLabel}). Números
            em <span className="font-medium">reais (R$)</span>, não em centavos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem dados para o período</p>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="h-[280px] min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "#a1a1aa", strokeWidth: 1 }}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <CategoryPieTooltip totalCents={chartTotalCents} monthLabel={monthLabel} />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full shrink-0 space-y-2 lg:max-w-xs lg:border-l lg:border-zinc-200 lg:pl-6 dark:lg:border-zinc-700">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Resumo
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">
                  Total:{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatBRLFromCents(chartTotalCents)}
                  </span>
                </p>
                <ul className="space-y-2.5 text-sm">
                  {chartData.map((d, i) => {
                    const pct = chartTotalCents > 0 ? (d.value / chartTotalCents) * 100 : 0;
                    return (
                      <li key={d.name} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{d.name}</span>
                          <span className="mt-0.5 block text-zinc-600 dark:text-zinc-300">
                            {formatBRLFromCents(d.value)}
                            <span className="text-zinc-400 dark:text-zinc-500"> · {pct.toFixed(1)}%</span>
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
