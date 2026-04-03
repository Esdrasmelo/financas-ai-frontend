"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

type Detail = {
  statement: { referenceMonth: string; dueDate: string; status: string };
  totalPendingCents: number;
  installments: {
    id: string;
    installmentNumber: number;
    totalInstallments: number;
    amountCents: number;
    purchaseDescription: string;
    status: string;
  }[];
};

function toStatementStatus(s: string): StatementStatus {
  if (s === "open" || s === "closed" || s === "paid" || s === "overdue") return s;
  return "open";
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/statements">Voltar</Link>
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
          <p className="text-base font-semibold text-foreground">Parcelas e itens</p>
          <p className="text-sm text-muted-foreground">Valores alocados nesta fatura</p>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.installments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.purchaseDescription}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {r.installmentNumber}/{r.totalInstallments}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRLFromCents(r.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
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
