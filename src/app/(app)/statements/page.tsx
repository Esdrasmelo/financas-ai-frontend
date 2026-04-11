"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiBase, authFetch } from "@/lib/api";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatementStatusBadge, type StatementStatus } from "@/components/shared/status-badge";
import { MoneyValue } from "@/components/shared/money-value";
import { Skeleton } from "@/components/ui/skeleton";

type Statement = {
  id: string;
  creditCardId: string;
  referenceMonth: string;
  dueDate: string;
  status: string;
};
type CardRow = { id: string; name: string };

type StatementDetail = {
  statement: { referenceMonth: string; dueDate: string; status: string };
  totalPendingCents: number;
  installments: { id: string }[];
};

function toStatementStatus(s: string): StatementStatus {
  if (s === "open" || s === "closed" || s === "paid" || s === "overdue") return s;
  return "open";
}

export default function StatementsPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [cardId, setCardId] = useState("");
  const [list, setList] = useState<Statement[]>([]);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StatementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await authFetch(`${base}/credit-cards`);
      if (cancelled || !response.ok) return;
      const cardsJson = (await response.json()) as CardRow[];
      setCards(cardsJson);
      setCardId((prev) => prev || (cardsJson[0]?.id ?? ""));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await authFetch(`${base}/credit-cards/${cardId}/statements`);
      if (cancelled || !response.ok) return;
      setList((await response.json()) as Statement[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  const loadStatementSummary = useCallback(async (id: string) => {
    const base = getApiBase();
    setDetailLoading(true);
    setDetail(null);
    const response = await authFetch(`${base}/statements/${id}`);
    if (!response.ok) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }
    setDetail((await response.json()) as StatementDetail);
    setDetailLoading(false);
  }, []);

  async function markPaid(id: string) {
    const base = getApiBase();
    const payResponse = await authFetch(`${base}/statements/${id}/pay`, { method: "PATCH" });
    if (!payResponse.ok) {
      toast.error("Erro");
      return;
    }
    toast.success("Marcada como paga");
    const statementsResponse = await authFetch(`${base}/credit-cards/${cardId}/statements`);
    if (statementsResponse.ok) setList((await statementsResponse.json()) as Statement[]);
    if (sheetId === id) {
      setSheetId(null);
    }
  }

  const cardName = cards.find((card) => card.id === cardId)?.name ?? "";

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Faturas" subtitle="Acompanhe vencimento, status e totais por cartão" />

      <Card>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <Label>Cartão</Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {cardName ? `Faturas — ${cardName}` : "Faturas"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((statement) => (
            <Card key={statement.id} className="transition-shadow duration-150 hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {formatStatementRefDisplay(statement.referenceMonth)}
                    </p>
                    <p className="text-sm text-muted-foreground">Vence {formatDateDdMmYyyy(statement.dueDate)}</p>
                  </div>
                  <StatementStatusBadge status={toStatementStatus(statement.status)} className="shrink-0" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Button
                    variant="secondary"
                    size="default"
                    className="w-full"
                    onClick={() => {
                      setSheetId(statement.id);
                      void loadStatementSummary(statement.id);
                    }}
                  >
                    Resumo
                  </Button>
                  <Button variant="outline" size="default" className="w-full" asChild>
                    <Link href={`/statements/${statement.id}`}>Detalhe</Link>
                  </Button>
                  {statement.status !== "paid" && (
                    <Button size="default" className="w-full" onClick={() => void markPaid(statement.id)}>
                      Marcar paga
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma fatura para este cartão.</p>
        )}
      </section>

      <Sheet
        open={sheetId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setSheetId(null);
            setDetail(null);
            setDetailLoading(false);
          }
        }}
      >
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Resumo da fatura</SheetTitle>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Referência <span className="font-medium text-foreground">{formatStatementRefDisplay(detail.statement.referenceMonth)}</span>
              </p>
              <p className="text-muted-foreground">
                Vencimento <span className="font-medium text-foreground">{formatDateDdMmYyyy(detail.statement.dueDate)}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status</span>
                <StatementStatusBadge status={toStatementStatus(detail.statement.status)} />
              </div>
              <p className="text-lg font-semibold text-foreground">
                Total pendente: <MoneyValue cents={detail.totalPendingCents} />
              </p>
              <p className="text-muted-foreground">
                Itens na fatura: <span className="font-medium text-foreground">{detail.installments.length}</span>
              </p>
              <Button asChild className="w-full">
                <Link href={`/statements/${sheetId}`}>Abrir detalhe completo</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
