"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";

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

export default function StatementDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const r = await fetch(`${base}/statements/${id}`);
      if (cancelled) return;
      if (!r.ok) {
        setErr("Não encontrada");
        return;
      }
      setData((await r.json()) as Detail);
      setErr(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Carregando…</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/statements">Voltar</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Fatura {formatStatementRefDisplay(data.statement.referenceMonth)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Vencimento: {formatDateDdMmYyyy(data.statement.dueDate)}</p>
          <p>Status: {data.statement.status}</p>
          <p className="text-lg font-semibold">Total pendente: {formatBRLFromCents(data.totalPendingCents)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Parcelas / itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.installments.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.purchaseDescription}</TableCell>
                  <TableCell>
                    {r.installmentNumber}/{r.totalInstallments}
                  </TableCell>
                  <TableCell>{formatBRLFromCents(r.amountCents)}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
