"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy, formatYmdInputToDdMmYyyy } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { MoneyValue } from "@/components/shared/money-value";
import { StatCardCompact } from "@/components/shared/stat-card";
type Entry = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  paymentMethod: string;
  sourceType: string;
  categoryId: string;
};
type Category = { id: string; name: string };

type MonthlySummary = {
  competencyMonth: string;
  totalCents: number;
  variableCents: number;
  fixedCents: number;
  entryCount: number;
};

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
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function refreshEntries() {
    const base = getApiBase();
    const [e, c, s] = await Promise.all([
      fetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
      fetch(`${base}/categories`),
      fetch(`${base}/entries/monthly-summary?competencyMonth=${encodeURIComponent(month)}`),
    ]);
    if (e.ok) setList((await e.json()) as Entry[]);
    if (c.ok) {
      const cl = (await c.json()) as Category[];
      setCats(cl);
      setCategoryId((prev) => prev || (cl[0]?.id ?? ""));
    }
    if (s.ok) setSummary((await s.json()) as MonthlySummary);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [e, c, s] = await Promise.all([
        fetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
        fetch(`${base}/categories`),
        fetch(`${base}/entries/monthly-summary?competencyMonth=${encodeURIComponent(month)}`),
      ]);
      if (cancelled) return;
      if (e.ok) setList((await e.json()) as Entry[]);
      if (c.ok) {
        const cl = (await c.json()) as Category[];
        setCats(cl);
        setCategoryId((prev) => prev || (cl[0]?.id ?? ""));
      }
      if (s.ok) setSummary((await s.json()) as MonthlySummary);
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const topVariableCategory = useMemo(() => {
    const vars = list.filter((x) => x.sourceType === "variable");
    const map = new Map<string, number>();
    for (const e of vars) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amountCents);
    }
    let best: { id: string; cents: number } | null = null;
    for (const [id, cents] of map) {
      if (!best || cents > best.cents) best = { id, cents };
    }
    if (!best) return null;
    return { name: cats.find((c) => c.id === best!.id)?.name ?? "—", cents: best.cents };
  }, [list, cats]);

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
    setSheetOpen(false);
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
    setDeleteId(null);
    void refreshEntries();
  }

  const variableList = list.filter((x) => x.sourceType === "variable");

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Lançamentos"
        subtitle="Gastos variáveis e entradas manuais por competência"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="m" className="text-xs uppercase tracking-wide text-muted-foreground">
              Mês
            </Label>
            <Input id="m" className="w-36" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo gasto
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <StatCardCompact
          icon={Receipt}
          label="Total do mês"
          value={summary ? <MoneyValue cents={summary.totalCents} /> : "—"}
        />
        <StatCardCompact
          icon={Receipt}
          label="Lançamentos"
          value={summary?.entryCount ?? "—"}
          footer="Inclui fixos gerados e variáveis"
        />
        <StatCardCompact
          icon={PieChart}
          label="Variáveis no mês"
          value={summary ? <MoneyValue cents={summary.variableCents} /> : "—"}
        />
        <StatCardCompact
          icon={PieChart}
          label="Categoria mais usada (variável)"
          value={topVariableCategory ? formatBRLFromCents(topVariableCategory.cents) : "—"}
          footer={topVariableCategory?.name}
        />
      </div>

      <SectionCard title={`Movimentação — ${month}`} contentClassName="pt-0">
        {variableList.length === 0 && list.filter((x) => x.sourceType !== "variable").length === 0 ? (
          <EmptyState
            title="Nada neste mês"
            description="Adicione um gasto variável ou gere contas fixas."
            action={
              <Button onClick={() => setSheetOpen(true)} variant="secondary">
                Novo gasto
              </Button>
            }
          />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="font-medium">{x.description}</TableCell>
                    <TableCell>{formatDateDdMmYyyy(x.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <MoneyValue cents={x.amountCents} />
                    </TableCell>
                    <TableCell>{x.sourceType}</TableCell>
                    <TableCell>{x.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      {x.sourceType === "variable" && (
                        <Button type="button" size="sm" variant="outline" onClick={() => setDeleteId(x.id)}>
                          Excluir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        )}
      </SectionCard>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Novo gasto variável</SheetTitle>
          </SheetHeader>
          <form className="mt-6 flex flex-1 flex-col gap-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Valor R$</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} required inputMode="decimal" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date ? <p className="text-xs text-muted-foreground">Exibição: {formatYmdInputToDdMmYyyy(date)}</p> : null}
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
            <div className="mt-auto flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && void remove(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
