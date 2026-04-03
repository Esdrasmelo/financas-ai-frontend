"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy, formatYmdInputToDdMmYyyy } from "@/lib/date";

type Entry = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  paymentMethod: string;
  sourceType: string;
};
type Category = { id: string; name: string };

const methods = [
  { v: "cash", l: "Dinheiro" },
  { v: "debit", l: "Débito" },
  { v: "pix", l: "PIX" },
  { v: "credit_card", l: "Cartão" },
];

export default function EntriesPage() {
  const [month, setMonth] = useState(currentCompetencyMonth());
  const [list, setList] = useState<Entry[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function refreshEntries() {
    const base = getApiBase();
    const [e, c] = await Promise.all([
      fetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
      fetch(`${base}/categories`),
    ]);
    if (e.ok) setList((await e.json()) as Entry[]);
    if (c.ok) {
      const cl = (await c.json()) as Category[];
      setCats(cl);
      setCategoryId((prev) => prev || (cl[0]?.id ?? ""));
    }
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [e, c] = await Promise.all([
        fetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
        fetch(`${base}/categories`),
      ]);
      if (cancelled) return;
      if (e.ok) setList((await e.json()) as Entry[]);
      if (c.ok) {
        const cl = (await c.json()) as Category[];
        setCats(cl);
        setCategoryId((prev) => prev || (cl[0]?.id ?? ""));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents)) {
      toast.error("Valor inválido");
      return;
    }
    const base = getApiBase();
    const iso = new Date(`${date}T12:00:00.000Z`).toISOString();
    const r = await fetch(`${base}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        amountCents: cents,
        date: iso,
        categoryId,
        paymentMethod,
        competencyMonth: month,
      }),
    });
    if (!r.ok) {
      toast.error("Erro ao salvar");
      return;
    }
    setDesc("");
    setAmount("");
    toast.success("Lançamento criado");
    void refreshEntries();
  }

  async function remove(id: string) {
    const base = getApiBase();
    const r = await fetch(`${base}/entries/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Removido");
    void refreshEntries();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Lançamentos / gastos variáveis</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Mês</Label>
          <Input className="w-40" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Valor R$</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date && <p className="text-xs text-zinc-500">Exibição: {formatYmdInputToDdMmYyyy(date)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.v} value={m.v}>
                      {m.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista do mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.description}</TableCell>
                  <TableCell>{formatDateDdMmYyyy(x.date)}</TableCell>
                  <TableCell>{formatBRLFromCents(x.amountCents)}</TableCell>
                  <TableCell>{x.sourceType}</TableCell>
                  <TableCell>{x.paymentMethod}</TableCell>
                  <TableCell>
                    {x.sourceType === "variable" && (
                      <Button type="button" size="sm" variant="outline" onClick={() => void remove(x.id)}>
                        Excluir
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
