"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { chartSeriesColorsFromTheme } from "@/lib/chart-theme";
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

type CreditCardOption = { id: string; name: string };

type StatementRow = { id: string; creditCardId: string; referenceMonth: string };

export default function StatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditCardName, setCreditCardName] = useState<string | null>(null);
  const [creditCardThemeColor, setCreditCardThemeColor] = useState<string | null>(null);
  const [cards, setCards] = useState<CreditCardOption[]>([]);
  const [cardSwitchLoading, setCardSwitchLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await fetch(`${base}/credit-cards`);
      if (cancelled || !response.ok) return;
      setCards((await response.json()) as CreditCardOption[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      setLoading(true);
      const response = await fetch(`${base}/statements/${id}`);
      if (cancelled) return;
      if (!response.ok) {
        setErr("Não encontrada");
        setData(null);
        setLoading(false);
        return;
      }
      setData((await response.json()) as Detail);
      setErr(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const creditCardId = data?.statement.creditCardId;
    if (!creditCardId) {
      setCreditCardName(null);
      setCreditCardThemeColor(null);
      return;
    }
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await fetch(`${base}/credit-cards/${creditCardId}`);
      if (cancelled || !response.ok) return;
      const card = (await response.json()) as { name: string; themeColor: string | null };
      if (!cancelled) {
        setCreditCardName(card.name);
        setCreditCardThemeColor(card.themeColor ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.statement.creditCardId]);

  async function onCardChange(newCardId: string) {
    if (!data || newCardId === data.statement.creditCardId) return;
    const refMonth = data.statement.referenceMonth;
    setCardSwitchLoading(true);
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/credit-cards/${newCardId}/statements`);
      if (!response.ok) {
        toast.error("Erro ao carregar faturas deste cartão");
        return;
      }
      const statements = (await response.json()) as StatementRow[];
      const match = statements.find((statementRow) => statementRow.referenceMonth === refMonth);
      if (!match) {
        toast.error(
          `Este cartão não tem fatura no mês ${formatStatementRefDisplay(refMonth)}. Escolha outro cartão ou abra a lista em Faturas.`,
        );
        return;
      }
      router.push(`/statements/${match.id}`);
    } finally {
      setCardSwitchLoading(false);
    }
  }

  const chartData = useMemo(() => {
    if (!data?.categoryBreakdown.length) return [];
    return data.categoryBreakdown.map((slice) => ({ name: slice.categoryName, value: slice.amountCents }));
  }, [data]);

  const chartColors = useMemo(
    () => chartSeriesColorsFromTheme(creditCardThemeColor, chartData.length),
    [creditCardThemeColor, chartData.length],
  );

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
        subtitle={
          creditCardName
            ? `${creditCardName} · Vencimento ${formatDateDdMmYyyy(data.statement.dueDate)}`
            : `Vencimento ${formatDateDdMmYyyy(data.statement.dueDate)}`
        }
      >
        {cards.length > 1 ? (
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
            <Label htmlFor="statement-card-select" className="text-xs font-medium text-muted-foreground">
              Ver mesmo mês em outro cartão
            </Label>
            <Select
              value={data.statement.creditCardId}
              disabled={cardSwitchLoading}
              onValueChange={(value) => void onCardChange(value)}
            >
              <SelectTrigger id="statement-card-select" className="w-full sm:w-[280px]">
                <SelectValue placeholder="Cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </PageHeader>

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
        <CardContent className="space-y-2">
          {creditCardName ? (
            <p className="text-sm text-muted-foreground">
              Cartão{" "}
              <span className="font-medium text-foreground">{creditCardName}</span>
            </p>
          ) : null}
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
                          fill={chartColors[i] ?? chartColors[0]}
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
                        style={{ backgroundColor: chartColors[i] ?? chartColors[0] }}
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
                {data.installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell className="font-medium">{installment.purchaseDescription}</TableCell>
                    <TableCell className="text-muted-foreground">{installment.categoryName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {installment.installmentNumber}/{installment.totalInstallments}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRLFromCents(installment.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{installmentStatusLabel(installment.status)}</Badge>
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
