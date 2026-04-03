"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";

type CardRow = {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limitCents: number | null;
};

export default function CreditCardsPage() {
  const [list, setList] = useState<CardRow[]>([]);
  const [name, setName] = useState("");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("17");
  const [limit, setLimit] = useState("");

  async function refreshList() {
    const base = getApiBase();
    const r = await fetch(`${base}/credit-cards`);
    if (r.ok) setList((await r.json()) as CardRow[]);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const r = await fetch(`${base}/credit-cards`);
      if (cancelled || !r.ok) return;
      setList((await r.json()) as CardRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const limitCents = limit.trim() === "" ? null : Math.round(parseFloat(limit.replace(",", ".")) * 100);
    const base = getApiBase();
    const r = await fetch(`${base}/credit-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        closingDay: parseInt(closingDay, 10),
        dueDay: parseInt(dueDay, 10),
        limitCents: limitCents !== null && Number.isFinite(limitCents) ? limitCents : null,
        brand: null,
      }),
    });
    if (!r.ok) {
      toast.error("Erro ao salvar");
      return;
    }
    setName("");
    setLimit("");
    toast.success("Cartão criado");
    void refreshList();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Cartões de crédito</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo cartão</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fechamento (dia)</Label>
              <Input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento (dia)</Label>
              <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Limite R$ (opcional)</Label>
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="5000" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
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
                <TableHead>Nome</TableHead>
                <TableHead>Fech.</TableHead>
                <TableHead>Venc.</TableHead>
                <TableHead>Limite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.closingDay}</TableCell>
                  <TableCell>{c.dueDay}</TableCell>
                  <TableCell>{c.limitCents != null ? formatBRLFromCents(c.limitCents) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
