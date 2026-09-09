"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  Layers,
  PieChart as PieChartIcon,
  Receipt,
  Wallet,
  CalendarClock,
  CalendarDays,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { CompetencyViewTip } from "@/components/shared/competency-view-tip";
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
import {
  EntriesAuditPanel,
  CreditCardAuditPanel,
  type EntryAuditRow,
  type CreditCardAuditRow,
} from "@/components/dashboard/kpi-audit-panel";
import { getApiBase, authFetch, downloadPdf } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";
import { daysInCompetencyMonth } from "@/lib/competency-month";
import { getChartSeriesColors } from "@/lib/chart-theme";
import { StatementStatusBadge, type StatementStatus } from "@/components/shared/status-badge";

const TOP_CATEGORIES = 8;

type Kpis = {
  competencyMonth: string;
  view: string;
  totalSpentCents: number;
  entriesTotalCents: number;
  creditCardPortionCents: number;
  statementsDueInMonthTotalCents: number;
  fixedExpensesCents: number;
  variableExpensesCents: number;
  previousMonthTotalCents: number;
  monthOverMonthDiffCents: number;
  monthOverMonthDiffPercent: number | null;
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
  const [year, monthNum] = ym.split("-").map(Number);
  const labelDate = new Date(Date.UTC(year, monthNum - 1, 1));
  return labelDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

/** Id reservado para a fatia que soma as categorias fora do Top N. */
const OTHER_CATEGORIES_ID = "__other-categories__";

type CategorySlice = { id: string; name: string; value: number };

function aggregateTopCategories(rows: CatRow[], topN: number): CategorySlice[] {
  const sorted = [...rows].sort((a, b) => b.amountCents - a.amountCents);
  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);
  const otherCents = tail.reduce((sum, row) => sum + row.amountCents, 0);
  const slices: CategorySlice[] = head.map((row) => ({
    id: row.categoryId,
    name: row.categoryName,
    value: row.amountCents,
  }));
  if (otherCents > 0) {
    // O usuário pode ter uma categoria própria chamada "Outros" — evita duas fatias com o mesmo rótulo.
    const hasOwnOthersCategory = head.some((row) => row.categoryName.trim().toLowerCase() === "outros");
    slices.push({
      id: OTHER_CATEGORIES_ID,
      name: hasOwnOthersCategory ? "Outras categorias" : "Outros",
      value: otherCents,
    });
  }
  return slices;
}

function statementStatus(s: string): StatementStatus {
  if (s === "open" || s === "closed" || s === "paid" || s === "overdue") return s;
  return "open";
}

/** Dias até o vencimento (meia-noite local); negativo = atrasado. */
function daysUntilDueDate(isoDate: string): number {
  const due = new Date(isoDate);
  const today = new Date();
  const startToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startDue - startToday) / 86400000);
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
  const [pdfLoading, setPdfLoading] = useState(false);

  const [showEntriesPanel, setShowEntriesPanel] = useState(false);
  const [entriesAuditRows, setEntriesAuditRows] = useState<EntryAuditRow[] | null>(null);
  const [entriesAuditLoading, setEntriesAuditLoading] = useState(false);
  const [showCcPanel, setShowCcPanel] = useState(false);
  const [ccAuditRows, setCcAuditRows] = useState<CreditCardAuditRow[] | null>(null);
  const [ccAuditLoading, setCcAuditLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    const dashboardQuery = new URLSearchParams({ competencyMonth: month, view });

    void (async () => {
      setLoading(true);
      try {
        const results = await Promise.all([
          authFetch(`${base}/dashboard/kpis?${dashboardQuery}`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<Kpis>;
          }),
          authFetch(`${base}/dashboard/category-breakdown?${dashboardQuery}`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<CatRow[]>;
          }),
          authFetch(`${base}/dashboard/monthly-summary?${dashboardQuery}`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<MonthlySummary>;
          }),
          authFetch(`${base}/dashboard/monthly-evolution?view=${view}`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<MonthlySummary[]>;
          }),
          authFetch(`${base}/dashboard/credit-cards-overview`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<CreditCardOverview[]>;
          }),
          authFetch(
            `${base}/dashboard/future-commitments?fromCompetencyMonth=${encodeURIComponent(month)}`,
          ).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<FutureCommitments>;
          }),
          authFetch(`${base}/dashboard/upcoming-statements?limit=6`).then(async (response) => {
            if (!response.ok) throw new Error(await response.text());
            return response.json() as Promise<UpcomingStatement[]>;
          }),
        ]);

        const kpisPayload = results[0] as Kpis;
        const categoriesPayload = results[1] as CatRow[];
        const monthlyPayload = results[2] as MonthlySummary;
        const trendOnly = results[3] as MonthlySummary[];
        const creditCardsPayload = results[4] as CreditCardOverview[];
        const commitmentsPayload = results[5] as FutureCommitments;
        const upcomingStatementsPayload = results[6] as UpcomingStatement[];

        if (cancelled) return;
        setKpis(kpisPayload);
        setCats(categoriesPayload);
        setMonthlyCurrent(monthlyPayload);
        setTrend(
          trendOnly.map((row) => ({
            month: row.competencyMonth,
            totalCents: row.totalSpentCents,
            label: monthShortLabel(row.competencyMonth),
          })),
        );
        setCcOverview(creditCardsPayload);
        setCommitments(commitmentsPayload);
        setUpcoming(upcomingStatementsPayload);
        setErr(null);
      } catch (error) {
        if (cancelled) return;
        setErr(error instanceof Error ? error.message : "Falha ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, view]);

  useEffect(() => {
    setEntriesAuditRows(null);
    setCcAuditRows(null);
  }, [month, view]);

  function handleEntriesMouseEnter() {
    setShowEntriesPanel(true);
    if (!entriesAuditRows && !entriesAuditLoading) {
      const base = getApiBase();
      setEntriesAuditLoading(true);
      void authFetch(`${base}/dashboard/entries-breakdown?competencyMonth=${month}`)
        .then(async (r) => {
          if (!r.ok) return;
          setEntriesAuditRows((await r.json()) as EntryAuditRow[]);
        })
        .catch(() => {})
        .finally(() => setEntriesAuditLoading(false));
    }
  }

  function handleCcMouseEnter() {
    setShowCcPanel(true);
    if (!ccAuditRows && !ccAuditLoading) {
      const base = getApiBase();
      setCcAuditLoading(true);
      void authFetch(
        `${base}/dashboard/credit-card-purchases-breakdown?competencyMonth=${month}&view=${view}`,
      )
        .then(async (r) => {
          if (!r.ok) return;
          setCcAuditRows((await r.json()) as CreditCardAuditRow[]);
        })
        .catch(() => {})
        .finally(() => setCcAuditLoading(false));
    }
  }

  const chartData = useMemo(() => aggregateTopCategories(cats, TOP_CATEGORIES), [cats]);
  const chartTotalCents = useMemo(
    () => chartData.reduce((sum, slice) => sum + slice.value, 0),
    [chartData],
  );
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
      />

      <div className="flex max-w-2xl flex-col gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="dash-month">Mês (YYYY-MM)</Label>
            <Input id="dash-month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "occurrence" | "payment")}>
            <TabsList>
              <TabsTrigger value="occurrence">Por ocorrência</TabsTrigger>
              <TabsTrigger value="payment">Por pagamento</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            disabled={pdfLoading || loading}
            onClick={() => {
              setPdfLoading(true);
              downloadPdf(
                `/reports/monthly?competencyMonth=${encodeURIComponent(month)}&view=${view}`,
                `relatorio-mensal-${month}.pdf`,
              ).catch(() => toast.error("Falha ao gerar PDF")).finally(() => setPdfLoading(false));
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {pdfLoading ? "Gerando…" : "Exportar PDF"}
          </Button>
        </div>
        <CompetencyViewTip />
      </div>

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
              <div
                className="relative cursor-help"
                onMouseEnter={handleEntriesMouseEnter}
                onMouseLeave={() => setShowEntriesPanel(false)}
              >
                <StatCard
                  icon={Layers}
                  label="Valor total lançamentos"
                  value={<MoneyValue cents={kpis.entriesTotalCents} className="text-[2rem]" />}
                  footer="Contas fixas + lançamentos variáveis na competência"
                />
                {showEntriesPanel && (
                  <EntriesAuditPanel loading={entriesAuditLoading} rows={entriesAuditRows} />
                )}
              </div>
              <div
                className="relative cursor-help"
                onMouseEnter={handleCcMouseEnter}
                onMouseLeave={() => setShowCcPanel(false)}
              >
                <StatCard
                  icon={CreditCard}
                  label="Faturas na competência"
                  value={<MoneyValue cents={kpis.creditCardPortionCents} className="text-[2rem]" />}
                  footer={
                    view === "occurrence"
                      ? "Cartão: compras com data no mês (por ocorrência)"
                      : "Cartão: parcelas com competência no mês (por pagamento)"
                  }
                />
                {showCcPanel && (
                  <CreditCardAuditPanel loading={ccAuditLoading} rows={ccAuditRows} view={view} />
                )}
              </div>
              <StatCard
                icon={CalendarDays}
                label="Faturas no vencimento"
                value={<MoneyValue cents={kpis.statementsDueInMonthTotalCents} className="text-[2rem]" />}
                footer="Soma das faturas com vencimento neste mês (calendário)"
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
                label="Compras parceladas ativas"
                value={commitments?.activeInstallmentPurchasesCount ?? "—"}
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
              description={`Total estimado nos próximos 6 meses (${viewLabel})`}
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
                          {chartData.map((slice, i) => (
                            <Cell
                              key={slice.id}
                              fill={getChartSeriesColors()[i % getChartSeriesColors().length]}
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
                      {chartData.map((slice, i) => {
                        const pct = chartTotalCents > 0 ? (slice.value / chartTotalCents) * 100 : 0;
                        return (
                          <li key={slice.id} className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: getChartSeriesColors()[i % getChartSeriesColors().length] }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-foreground">{slice.name}</span>
                              <span className="mt-0.5 block text-muted-foreground">
                                {formatBRLFromCents(slice.value)}
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
                    {upcoming.map((upcomingStatement) => {
                      const daysLeft = daysUntilDueDate(upcomingStatement.dueDate);
                      const urgent =
                        daysLeft <= 7
                          ? "border-amber-500/35 bg-amber-500/12 shadow-sm shadow-amber-500/10"
                          : daysLeft <= 21
                            ? "border-border bg-muted/50 ring-1 ring-amber-500/10"
                            : "border-border bg-muted/30";
                      return (
                        <li
                          key={upcomingStatement.statementId}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${urgent}`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{upcomingStatement.creditCardName}</p>
                            <p className="text-xs text-muted-foreground">
                              Vence {formatDateDdMmYyyy(upcomingStatement.dueDate)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <MoneyValue cents={upcomingStatement.totalPendingCents} className="text-sm" />
                            <StatementStatusBadge status={statementStatus(upcomingStatement.status)} />
                          </div>
                        </li>
                      );
                    })}
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
