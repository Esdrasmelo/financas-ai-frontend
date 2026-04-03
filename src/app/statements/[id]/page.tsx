"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatementStatusBadge, type StatementStatus } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { CategoryDonutTooltip } from "@/components/dashboard/category-donut-tooltip";
import { CHART_SERIES_COLORS } from "@/lib/chart-theme";
import { EmptyState } from "@/components/shared/empty-state";

type Detail = {
  statement: {
    id: string;
    creditCardId: string;
    referenceMonth: string;
    dueDate: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    closingDate: string;
  };
  totalPendingCents: number;
  totalInvoiceCents: number;
  navigation: { previousStatementId: string | null; nextStatementId: string | null };
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amountCents: number;
    percentOfTotal: number;
  }[];
  installments: {
    id: string;
    installmentNumber: number;
    totalInstallments: number;
    amountCents: number;
    purchaseDescription: string;
    status: string;
    categoryId: string;
    categoryName: string;
  }[];
};

function toStatementStatus(s: string): StatementStatus {
  if (s === "open" || s === "closed" || s === "paid" || s === "overdue") return s;
  return "open";
}

function installmentStatusLabel(s: string) {
  if (s === "pending") return "Pendente";
  if (s === "paid") return "Pago";
  return s;
}

export default function StatementDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      setLoading(true);
      const r = await fetch(`${base}/statements/${id}`);
      if (cancelled) return;
      if (!r.ok) {
        setErr("Não encontrada");
        setData(null);
        setLoading(false);
        return;
      }
      setData((await r.json()) as Detail);
      setErr(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const chartData = useMemo(() => {
    if (!data?.categoryBreakdown.length) return [];
    return data.categoryBreakdown.map((c) => ({ name: c.categoryName, value: c.amountCents }));
  }, [data]);

  const monthLabel = data ? `fatura ${formatStatementRefDisplay(data.statement.referenceMonth)}` : "";

  if (err) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/statements">Voltar</Link>
        </Button>
        <p className="text-sm text-destructive">{err}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const purchaseQuery = new URLSearchParams({
    creditCardId: data.statement.creditCardId,
    statementId: data.statement.id,
  }).toString();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/statements">Voltar</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {data.navigation.previousStatementId ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/statements/${data.navigation.previousStatementId}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Fatura anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Fatura anterior
            </Button>
          )}
          {data.navigation.nextStatementId ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/statements/${data.navigation.nextStatementId}`}>
                Próxima fatura
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Próxima fatura
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button className="ml-auto" asChild>
          <Link href={`/purchases?${purchaseQuery}`}>
            <Plus className="mr-2 h-4 w-4" />
            Nova compra nesta fatura
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Fatura ${formatStatementRefDisplay(data.statement.referenceMonth)}`}
        subtitle={`Vencimento ${formatDateDdMmYyyy(data.statement.dueDate)}`}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-2">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatementStatusBadge status={toStatementStatus(data.statement.status)} className="mt-1" />
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total pendente</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatBRLFromCents(data.totalPendingCents)}</p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.installments.length} lançamento{data.installments.length !== 1 ? "s" : ""} nesta fatura
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-base font-semibold text-foreground">Gastos por categoria</p>
          <p className="text-sm text-muted-foreground">Valores alocados nesta fatura (BRL e percentual)</p>
        </CardHeader>
        <CardContent className="pt-0">
          {chartData.length === 0 ? (
            <EmptyState title="Sem categorias nesta fatura" />
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
                      labelLine={{ stroke: "var(--border)", strokeWidth: 1 }}
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
                    <Tooltip
                      content={<CategoryDonutTooltip totalCents={data.totalInvoiceCents} monthLabel={monthLabel} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full shrink-0 space-y-2 text-sm lg:max-w-xs">
                {data.categoryBreakdown.map((c, i) => (
                  <li key={c.categoryId} className="flex items-center justify-between gap-2 border-b border-border/80 py-2 last:border-0">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length] }}
                      />
                      <span className="text-foreground">{c.categoryName}</span>
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {formatBRLFromCents(c.amountCents)}
                      <span className="ml-2 text-xs">({c.percentOfTotal.toFixed(1)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-base font-semibold text-foreground">Parcelas e itens</p>
          <p className="text-sm text-muted-foreground">Valores alocados nesta fatura</p>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.installments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.purchaseDescription}</TableCell>
                    <TableCell className="text-muted-foreground">{r.categoryName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {r.installmentNumber}/{r.totalInstallments}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRLFromCents(r.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{installmentStatusLabel(r.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
