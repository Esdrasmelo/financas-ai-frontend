"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Layers,
  PieChart as PieChartIcon,
  Receipt,
  Wallet,
  CalendarClock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatCardCompact } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyValue } from "@/components/shared/money-value";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDonutTooltip } from "@/components/dashboard/category-donut-tooltip";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";
import { competencyMonthsEndingAt, daysInCompetencyMonth } from "@/lib/competency-month";
import { CHART_SERIES_COLORS } from "@/lib/chart-theme";
import { StatementStatusBadge, type StatementStatus } from "@/components/shared/status-badge";

const TOP_CATEGORIES = 8;

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

type MonthlySummary = {
  competencyMonth: string;
  view: string;
  totalSpentCents: number;
  fixedExpensesCents: number;
  variableExpensesCents: number;
  creditCardPortionCents: number;
  entryCount: number;
};

type CreditCardOverview = {
  creditCardId: string;
  name: string;
  limitCents: number | null;
  usedCents: number;
  utilizationPercent: number | null;
  nextStatementCents: number | null;
};

type FutureCommitments = {
  fromCompetencyMonth: string;
  futureInstallmentsCents: number;
  installmentRowCount: number;
  activeInstallmentPurchasesCount: number;
};

type UpcomingStatement = {
  statementId: string;
  creditCardId: string;
  creditCardName: string;
  referenceMonth: string;
  dueDate: string;
  status: string;
  totalPendingCents: number;
};

function monthShortLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function aggregateTopCategories(rows: CatRow[], topN: number): { name: string; value: number }[] {
  const sorted = [...rows].sort((a, b) => b.amountCents - a.amountCents);
  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);
  const otherCents = tail.reduce((s, r) => s + r.amountCents, 0);
  const out = head.map((r) => ({ name: r.categoryName, value: r.amountCents }));
  if (otherCents > 0) out.push({ name: "Outros", value: otherCents });
  return out;
}

function statementStatus(s: string): StatementStatus {
  if (s === "open" || s === "closed" || s === "paid" || s === "overdue") return s;
  return "open";
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentCompetencyMonth());
  const [view, setView] = useState<"occurrence" | "payment">("occurrence");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [monthlyCurrent, setMonthlyCurrent] = useState<MonthlySummary | null>(null);
  const [trend, setTrend] = useState<{ month: string; label: string; totalCents: number }[]>([]);
  const [ccOverview, setCcOverview] = useState<CreditCardOverview[]>([]);
  const [commitments, setCommitments] = useState<FutureCommitments | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    const q = new URLSearchParams({ competencyMonth: month, view });
    const months = competencyMonthsEndingAt(month, 6);

    void (async () => {
      setLoading(true);
      try {
        const trendUrls = months.map(
          (m) => `${base}/dashboard/monthly-summary?competencyMonth=${m}&view=${view}`,
        );
        const results = await Promise.all([
          fetch(`${base}/dashboard/kpis?${q}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<Kpis>;
          }),
          fetch(`${base}/dashboard/category-breakdown?${q}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<CatRow[]>;
          }),
          fetch(`${base}/dashboard/monthly-summary?${q}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<MonthlySummary>;
          }),
          ...trendUrls.map((url) =>
            fetch(url).then(async (r) => {
              if (!r.ok) throw new Error(await r.text());
              return r.json() as Promise<MonthlySummary>;
            }),
          ),
          fetch(`${base}/dashboard/credit-cards-overview`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<CreditCardOverview[]>;
          }),
          fetch(`${base}/dashboard/future-commitments?fromCompetencyMonth=${encodeURIComponent(month)}`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<FutureCommitments>;
          }),
          fetch(`${base}/dashboard/upcoming-statements?limit=6`).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json() as Promise<UpcomingStatement[]>;
          }),
        ]);

        const k = results[0] as Kpis;
        const c = results[1] as CatRow[];
        const mc = results[2] as MonthlySummary;
        const trendOnly = results.slice(3, 9) as MonthlySummary[];
        const cc = results[9] as CreditCardOverview[];
        const comm = results[10] as FutureCommitments;
        const upc = results[11] as UpcomingStatement[];

        if (cancelled) return;
        setKpis(k);
        setCats(c);
        setMonthlyCurrent(mc);
        setTrend(
          trendOnly.map((row) => ({
            month: row.competencyMonth,
            totalCents: row.totalSpentCents,
            label: monthShortLabel(row.competencyMonth),
          })),
        );
        setCcOverview(cc);
        setCommitments(comm);
        setUpcoming(upc);
        setErr(null);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Falha ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, view]);

  const chartData = useMemo(() => aggregateTopCategories(cats, TOP_CATEGORIES), [cats]);
  const chartTotalCents = useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);
  const viewLabel = view === "occurrence" ? "por ocorrência" : "por pagamento";
  const monthLabel = `${month} (${viewLabel})`;

  const topCategory = useMemo(() => {
    if (!cats.length) return null;
    const best = [...cats].sort((a, b) => b.amountCents - a.amountCents)[0]!;
    return best;
  }, [cats]);

  const topCard = useMemo(() => {
    if (!ccOverview.length) return null;
    return [...ccOverview].sort((a, b) => b.usedCents - a.usedCents)[0]!;
  }, [ccOverview]);

  const daysInMonth = daysInCompetencyMonth(month);
  const dailyAvgCents =
    kpis && daysInMonth > 0 ? Math.round(kpis.totalSpentCents / daysInMonth) : 0;

  const momFooter =
    kpis && kpis.monthOverMonthDiffPercent != null
      ? `${kpis.monthOverMonthDiffPercent >= 0 ? "+" : ""}${kpis.monthOverMonthDiffPercent.toFixed(1)}% vs mês anterior`
      : kpis
        ? `${formatBRLFromCents(kpis.monthOverMonthDiffCents)} vs mês anterior`
        : undefined;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard financeiro"
        subtitle="Visão consolidada da competência e tendência recente"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="month" className="text-xs uppercase tracking-wide text-muted-foreground">
              Mês (YYYY-MM)
            </Label>
            <Input id="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-36" />
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "occurrence" | "payment")}>
            <TabsList>
              <TabsTrigger value="occurrence">Por ocorrência</TabsTrigger>
              <TabsTrigger value="payment">Por pagamento</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </PageHeader>

      {err && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </p>
      )}

      {loading && !kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {kpis && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Indicadores principais</h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                highlight
                icon={Wallet}
                label="Total do mês"
                value={<MoneyValue cents={kpis.totalSpentCents} className="text-[2rem]" />}
                footer={momFooter}
              />
              <StatCard
                icon={CreditCard}
                label="Próxima fatura"
                value={
                  kpis.nextStatement ? (
                    <MoneyValue cents={kpis.nextStatement.totalPendingCents} className="text-[2rem]" />
                  ) : (
                    "—"
                  )
                }
                footer={
                  kpis.nextStatement
                    ? `${kpis.nextStatement.creditCardName} · vence ${formatDateDdMmYyyy(kpis.nextStatement.dueDate)}`
                    : "Nenhuma pendência futura"
                }
              />
              <StatCard
                icon={Receipt}
                label="Faturas em aberto"
                value={<MoneyValue cents={kpis.openStatementsPendingCents} className="text-[2rem]" />}
                footer="Total pendente em faturas não pagas"
              />
              <StatCard
                icon={PieChartIcon}
                label="Comprometido (aprox.)"
                value={
                  kpis.percentCommittedApprox != null ? (
                    <span className="text-[2rem] font-bold tracking-tight">{kpis.percentCommittedApprox.toFixed(1)}%</span>
                  ) : (
                    "—"
                  )
                }
                footer={
                  commitments
                    ? `${formatBRLFromCents(commitments.futureInstallmentsCents)} em parcelas futuras`
                    : undefined
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Outros indicadores</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCardCompact icon={CalendarClock} label="Contas fixas" value={<MoneyValue cents={kpis.fixedExpensesCents} />} />
              <StatCardCompact icon={Receipt} label="Gastos variáveis" value={<MoneyValue cents={kpis.variableExpensesCents} />} />
              <StatCardCompact
                icon={Layers}
                label="Parcelas futuras"
                value={<MoneyValue cents={kpis.futureInstallmentsCents} />}
              />
              <StatCardCompact
                icon={Layers}
                label="Compras parceladas ativas"
                value={kpis.activeInstallmentPurchasesCount}
              />
              <StatCardCompact icon={TrendingUp} label="Média diária" value={<MoneyValue cents={dailyAvgCents} />} />
              <StatCardCompact
                icon={PieChartIcon}
                label="Maior categoria"
                value={topCategory ? formatBRLFromCents(topCategory.amountCents) : "—"}
                footer={topCategory?.categoryName}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <SectionCard
              className="lg:col-span-8"
              title="Evolução mensal"
              description={`Total gasto nos últimos 6 meses (${viewLabel})`}
              contentClassName="pt-0"
            >
              {trend.length > 0 ? (
                <MonthlyTrendChart data={trend} />
              ) : (
                <EmptyState title="Sem série histórica" />
              )}
            </SectionCard>
            <Card className="flex flex-col lg:col-span-4">
              <CardContent className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Resumo executivo</h3>
                  <p className="text-sm text-muted-foreground">Leitura rápida do mês {month}</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between gap-2 border-b border-border pb-3">
                    <span className="text-muted-foreground">Lançamentos no mês</span>
                    <span className="font-medium tabular-nums text-foreground">{monthlyCurrent?.entryCount ?? "—"}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-border pb-3">
                    <span className="text-muted-foreground">Maior categoria</span>
                    <span className="max-w-[55%] text-right font-medium text-foreground">
                      {topCategory ? (
                        <>
                          {topCategory.categoryName}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {formatBRLFromCents(topCategory.amountCents)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-border pb-3">
                    <span className="text-muted-foreground">Cartão mais usado</span>
                    <span className="max-w-[55%] text-right font-medium text-foreground">
                      {topCard ? (
                        <>
                          {topCard.name}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {formatBRLFromCents(topCard.usedCents)}
                            {topCard.utilizationPercent != null ? ` · ${topCard.utilizationPercent.toFixed(0)}% limite` : ""}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-border pb-3">
                    <span className="text-muted-foreground">Próxima fatura</span>
                    <span className="text-right font-medium text-foreground">
                      {kpis.nextStatement ? (
                        <>
                          {formatBRLFromCents(kpis.nextStatement.totalPendingCents)}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {kpis.nextStatement.creditCardName}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Compromisso futuro (parcelas)</span>
                    <span className="font-medium text-foreground">
                      {commitments ? formatBRLFromCents(commitments.futureInstallmentsCents) : "—"}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <SectionCard
              className="lg:col-span-8"
              title="Gastos por categoria"
              description={`Até ${TOP_CATEGORIES} categorias + Outros no total do mês (${viewLabel})`}
              contentClassName="pt-0"
            >
              {chartData.length === 0 ? (
                <EmptyState title="Sem dados para o período" description="Cadastre lançamentos ou compras nesta competência." />
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
                          innerRadius={56}
                          outerRadius={100}
                          paddingAngle={2}
                          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
                        >
                          {chartData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length]}
                              stroke="var(--card)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CategoryDonutTooltip totalCents={chartTotalCents} monthLabel={monthLabel} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full shrink-0 space-y-2 lg:max-w-xs lg:border-l lg:border-border lg:pl-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Legenda</p>
                    <p className="text-sm text-muted-foreground">
                      Total: <MoneyValue cents={chartTotalCents} className="text-foreground" />
                    </p>
                    <ul className="space-y-2.5 text-sm">
                      {chartData.map((d, i) => {
                        const pct = chartTotalCents > 0 ? (d.value / chartTotalCents) * 100 : 0;
                        return (
                          <li key={d.name} className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length] }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-foreground">{d.name}</span>
                              <span className="mt-0.5 block text-muted-foreground">
                                {formatBRLFromCents(d.value)}
                                <span className="text-muted-foreground/80"> · {pct.toFixed(1)}%</span>
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </SectionCard>
            <Card className="lg:col-span-4">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">Próximos vencimentos</h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/statements" className="gap-1">
                      Faturas <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma fatura futura pendente.</p>
                ) : (
                  <ul className="space-y-3">
                    {upcoming.map((u) => (
                      <li
                        key={u.statementId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{u.creditCardName}</p>
                          <p className="text-xs text-muted-foreground">Vence {formatDateDdMmYyyy(u.dueDate)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <MoneyValue cents={u.totalPendingCents} className="text-sm" />
                          <StatementStatusBadge status={statementStatus(u.status)} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
