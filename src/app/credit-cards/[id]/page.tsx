"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getApiBase } from "@/lib/api";
import { currentCompetencyMonth, formatBRLFromCents } from "@/lib/money";
import { addMonthsToCompetencyMonth } from "@/lib/competency-month";
import { chartPrimaryFromTheme, chartSeriesColorsFromTheme } from "@/lib/chart-theme";
import { CategoryDonutTooltip } from "@/components/dashboard/category-donut-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/shared/data-table";
import { CompetencyViewTip } from "@/components/shared/competency-view-tip";
import { CreditCardFace } from "@/components/credit-cards/credit-card-face";

type CardDetail = {
  id: string;
  name: string;
  brand: string | null;
  themeColor: string | null;
  limitCents: number | null;
  closingDay: number;
  dueDay: number;
};

type Analytics = {
  creditCardId: string;
  view: "payment" | "occurrence";
  monthly: { competencyMonth: string; totalCents: number }[];
  categories: { categoryId: string; categoryName: string; amountCents: number; percentOfTotal: number }[];
};

function monthShortLabel(ym: string) {
  const [year, monthNum] = ym.split("-").map(Number);
  const labelDate = new Date(Date.UTC(year, monthNum - 1, 1));
  return labelDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function BarTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; totalCents: number } }[];
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

export default function CreditCardDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const center = currentCompetencyMonth();
  const [fromMonth, setFromMonth] = useState(() => addMonthsToCompetencyMonth(center, -6));
  const [toMonth, setToMonth] = useState(() => addMonthsToCompetencyMonth(center, 6));
  const [view, setView] = useState<"payment" | "occurrence">("payment");
  const [card, setCard] = useState<CardDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await fetch(`${base}/credit-cards/${id}`);
      if (cancelled) return;
      if (!response.ok) {
        setErr("Cartão não encontrado");
        setCard(null);
        return;
      }
      setCard((await response.json()) as CardDetail);
      setErr(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    const analyticsQuery = new URLSearchParams({
      fromCompetencyMonth: fromMonth,
      toCompetencyMonth: toMonth,
      view,
    });
    void (async () => {
      setLoading(true);
      const response = await fetch(`${base}/credit-cards/${id}/analytics?${analyticsQuery}`);
      if (cancelled) return;
      if (!response.ok) {
        setAnalytics(null);
        setLoading(false);
        return;
      }
      setAnalytics((await response.json()) as Analytics);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fromMonth, toMonth, view]);

  const barData = useMemo(() => {
    if (!analytics?.monthly.length) return [];
    return analytics.monthly.map((row) => ({
      ...row,
      label: monthShortLabel(row.competencyMonth),
    }));
  }, [analytics]);

  const pieData = useMemo(() => {
    if (!analytics?.categories.length) return [];
    return analytics.categories.map((slice) => ({ name: slice.categoryName, value: slice.amountCents }));
  }, [analytics]);

  const pieTotal = useMemo(
    () => analytics?.categories.reduce((sum, slice) => sum + slice.amountCents, 0) ?? 0,
    [analytics],
  );

  const pieColors = useMemo(
    () => chartSeriesColorsFromTheme(card?.themeColor ?? null, pieData.length),
    [card?.themeColor, pieData.length],
  );

  const barFill = chartPrimaryFromTheme(card?.themeColor ?? null);

  const viewLabel = view === "payment" ? "por competência (pagamento)" : "por data da compra";

  if (err || !card) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/credit-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">{err ?? "Carregando…"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/credit-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cartões
          </Link>
        </Button>
      </div>

      <PageHeader
        title={card.name}
        subtitle={
          card.limitCents != null
            ? `Limite ${formatBRLFromCents(card.limitCents)} · Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`
            : `Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`
        }
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <CreditCardFace name={card.name} brand={card.brand} themeColor={card.themeColor} variant="compact" />
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Os gráficos abaixo mostram <strong className="font-medium text-foreground">gastos por mês</strong> e{" "}
            <strong className="font-medium text-foreground">por categoria</strong>. Cor, bandeira, nome, limite e datas de
            fechamento ou vencimento você ajusta em{" "}
            <strong className="font-medium text-foreground">Personalizar cartão</strong>.
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          className="h-12 w-full shrink-0 gap-2 rounded-xl px-6 text-base font-semibold shadow-md transition-shadow hover:shadow-lg sm:h-11 sm:w-auto"
          asChild
        >
          <Link href={`/credit-cards/${id}/personalizar`}>
            <Palette className="!size-5" aria-hidden />
            Personalizar cartão
          </Link>
        </Button>
      </div>

      <Card className="mt-1">
        <CardContent className="flex flex-col gap-4 p-5 pt-6 sm:p-6 sm:pt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="from-m">De (YYYY-MM)</Label>
              <Input id="from-m" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-m">Até (YYYY-MM)</Label>
              <Input id="to-m" value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="w-40" />
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as "payment" | "occurrence")}>
              <TabsList>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
                <TabsTrigger value="occurrence">Ocorrência</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CompetencyViewTip />
        </CardContent>
      </Card>

      <SectionCard
        title="Gasto por mês"
        description={`Intervalo ${fromMonth} — ${toMonth} (${viewLabel})`}
        contentClassName="pt-0"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Carregando gráfico…</p>
        ) : barData.length === 0 ? (
          <EmptyState title="Sem dados no período" />
        ) : (
          <div className="h-[300px] w-full min-w-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Tooltip content={<BarTip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="totalCents" fill={barFill} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Por categoria no período" description="Totais e percentuais no intervalo selecionado" contentClassName="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Carregando…</p>
        ) : pieData.length === 0 ? (
          <EmptyState title="Sem categorias no período" />
        ) : (
          <div className="flex flex-col gap-6 pt-4 lg:flex-row lg:items-center">
            <div className="h-[280px] min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={92}
                    paddingAngle={2}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={pieColors[i] ?? pieColors[0]}
                        stroke="var(--card)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CategoryDonutTooltip
                        totalCents={pieTotal}
                        monthLabel={`${fromMonth} — ${toMonth} (${viewLabel})`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable className="lg:max-w-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.categories.map((c) => (
                    <TableRow key={c.categoryId}>
                      <TableCell className="font-medium">{c.categoryName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRLFromCents(c.amountCents)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{c.percentOfTotal.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTable>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
