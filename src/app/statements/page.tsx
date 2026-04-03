"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getApiBase } from "@/lib/api";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";
import { Badge } from "@/components/ui/badge";

type Statement = {
  id: string;
  creditCardId: string;
  referenceMonth: string;
  dueDate: string;
  status: string;
};
type CardRow = { id: string; name: string };

export default function StatementsPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [cardId, setCardId] = useState("");
  const [list, setList] = useState<Statement[]>([]);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const r = await fetch(`${base}/credit-cards`);
      if (cancelled || !r.ok) return;
      const kl = (await r.json()) as CardRow[];
      setCards(kl);
      setCardId((p) => p || (kl[0]?.id ?? ""));
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
      const r = await fetch(`${base}/credit-cards/${cardId}/statements`);
      if (cancelled || !r.ok) return;
      setList((await r.json()) as Statement[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  async function markPaid(id: string) {
    const base = getApiBase();
    const r = await fetch(`${base}/statements/${id}/pay`, { method: "PATCH" });
    if (!r.ok) {
      toast.error("Erro");
      return;
    }
    toast.success("Marcada como paga");
    const r2 = await fetch(`${base}/credit-cards/${cardId}/statements`);
    if (r2.ok) setList((await r2.json()) as Statement[]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Faturas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar por cartão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Cartão</Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cards.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref.</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{formatStatementRefDisplay(s.referenceMonth)}</TableCell>
                  <TableCell>{formatDateDdMmYyyy(s.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.status}</Badge>
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/statements/${s.id}`}>Detalhe</Link>
                    </Button>
                    {s.status !== "paid" && (
                      <Button size="sm" onClick={() => void markPaid(s.id)}>
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
