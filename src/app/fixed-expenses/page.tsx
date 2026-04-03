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
import { Badge } from "@/components/ui/badge";

type Fixed = {
  id: string;
  name: string;
  amountCents: number;
  isVariableAmount?: boolean;
  dueDay: number;
  isActive: boolean;
  categoryId: string;
};
type Category = { id: string; name: string };

export default function FixedExpensesPage() {
  const [list, setList] = useState<Fixed[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [variableAmount, setVariableAmount] = useState(false);
  const [genMonth, setGenMonth] = useState(currentCompetencyMonth());

  async function refreshFixed() {
    const base = getApiBase();
    const [f, c] = await Promise.all([fetch(`${base}/fixed-expenses`), fetch(`${base}/categories`)]);
    if (f.ok) setList((await f.json()) as Fixed[]);
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
      const [f, c] = await Promise.all([fetch(`${base}/fixed-expenses`), fetch(`${base}/categories`)]);
      if (cancelled) return;
      if (f.ok) setList((await f.json()) as Fixed[]);
      if (c.ok) {
        const cl = (await c.json()) as Category[];
        setCats(cl);
        setCategoryId((prev) => prev || (cl[0]?.id ?? ""));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Valor inválido");
      return;
    }
    const base = getApiBase();
    const r = await fetch(`${base}/fixed-expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amountCents: cents,
        isVariableAmount: variableAmount,
        categoryId,
        dueDay: parseInt(dueDay, 10),
        description: null,
      }),
    });
    if (!r.ok) {
      toast.error("Erro ao salvar");
      return;
    }
    setName("");
    setAmount("");
    setVariableAmount(false);
    toast.success("Conta fixa criada");
    void refreshFixed();
  }

  async function disable(id: string) {
    const base = getApiBase();
    const r = await fetch(`${base}/fixed-expenses/${id}/disable`, { method: "PATCH" });
    if (!r.ok) {
      toast.error("Erro");
      return;
    }
    toast.success("Desativada");
    void refreshFixed();
  }

  async function generate() {
    const base = getApiBase();
    const r = await fetch(`${base}/fixed-expenses/generate-monthly-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencyMonth: genMonth }),
    });
    if (!r.ok) {
      toast.error("Erro na geração");
      return;
    }
    const j = (await r.json()) as { createdCount: number; skippedCount: number };
    toast.success(`Gerados: ${j.createdCount}, ignorados: ${j.skippedCount}`);
    void refreshFixed();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Contas fixas</h1>
        <p className="text-sm text-zinc-500">
          Recorrência e geração de lançamentos. Marque &quot;valor variável&quot; para energia, água etc.: na geração, o
          valor copia o mês anterior (ou a referência informada no primeiro mês).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova conta fixa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{variableAmount ? "Referência (R$)" : "Valor (R$)"}</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={variableAmount ? "Última conta ou estimativa" : "199,90"}
                required
              />
              <p className="text-xs text-zinc-500">
                {variableAmount
                  ? "Usado no 1º mês sem histórico; depois a geração usa o valor do lançamento do mês anterior."
                  : "Mesmo valor a cada geração."}
              </p>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <input
                id="var-amt"
                type="checkbox"
                checked={variableAmount}
                onChange={(e) => setVariableAmount(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-zinc-300"
              />
              <Label htmlFor="var-amt" className="cursor-pointer font-normal leading-snug">
                Valor variável todo mês (energia, água, condomínio variável…)
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Dia vencimento</Label>
              <Input value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" min={1} max={31} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-2">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerar lançamentos do mês</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Mês YYYY-MM</Label>
            <Input value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="w-40" />
          </div>
          <Button type="button" variant="secondary" onClick={() => void generate()}>
            Gerar
          </Button>
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
                <TableHead>Valor / ref.</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.name}</TableCell>
                  <TableCell>{formatBRLFromCents(x.amountCents)}</TableCell>
                  <TableCell>
                    {x.isVariableAmount === true ? (
                      <Badge variant="secondary">Variável</Badge>
                    ) : (
                      <Badge variant="outline">Fixo</Badge>
                    )}
                  </TableCell>
                  <TableCell>{x.dueDay}</TableCell>
                  <TableCell>
                    {x.isActive ? <Badge>Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}
                  </TableCell>
                  <TableCell>
                    {x.isActive && (
                      <Button type="button" variant="outline" size="sm" onClick={() => void disable(x.id)}>
                        Desativar
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
