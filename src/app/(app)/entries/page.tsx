"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Plus, Receipt, PieChart } from "lucide-react";
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
import { getApiBase, authFetch, downloadPdf } from "@/lib/api";
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  /** Origem do lançamento em edição (para título e aviso no painel) */
  const [editingSourceType, setEditingSourceType] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  function openNewEntrySheet() {
    setEditingEntryId(null);
    setEditingSourceType(null);
    setDesc("");
    setAmount("");
    setPaymentMethod("pix");
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryId(cats[0]?.id ?? "");
    setSheetOpen(true);
  }

  function openEditEntry(entry: Entry) {
    setEditingEntryId(entry.id);
    setEditingSourceType(entry.sourceType);
    setDesc(entry.description);
    setAmount((entry.amountCents / 100).toFixed(2).replace(".", ","));
    const d = new Date(entry.date);
    setDate(Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10));
    setCategoryId(entry.categoryId);
    setPaymentMethod(entry.paymentMethod);
    setSheetOpen(true);
  }

  async function refreshEntries() {
    const base = getApiBase();
    const [entriesResponse, categoriesResponse, summaryResponse] = await Promise.all([
      authFetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
      authFetch(`${base}/categories`),
      authFetch(`${base}/entries/monthly-summary?competencyMonth=${encodeURIComponent(month)}`),
    ]);
    if (entriesResponse.ok) setList((await entriesResponse.json()) as Entry[]);
    if (categoriesResponse.ok) {
      const categoriesJson = (await categoriesResponse.json()) as Category[];
      setCats(categoriesJson);
      setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
    }
    if (summaryResponse.ok) setSummary((await summaryResponse.json()) as MonthlySummary);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [entriesResponse, categoriesResponse, summaryResponse] = await Promise.all([
        authFetch(`${base}/entries?competencyMonth=${encodeURIComponent(month)}`),
        authFetch(`${base}/categories`),
        authFetch(`${base}/entries/monthly-summary?competencyMonth=${encodeURIComponent(month)}`),
      ]);
      if (cancelled) return;
      if (entriesResponse.ok) setList((await entriesResponse.json()) as Entry[]);
      if (categoriesResponse.ok) {
        const categoriesJson = (await categoriesResponse.json()) as Category[];
        setCats(categoriesJson);
        setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
      }
      if (summaryResponse.ok) setSummary((await summaryResponse.json()) as MonthlySummary);
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const topVariableCategory = useMemo(() => {
    const vars = list.filter((entry) => entry.sourceType === "variable");
    const map = new Map<string, number>();
    for (const variableEntry of vars) {
      map.set(
        variableEntry.categoryId,
        (map.get(variableEntry.categoryId) ?? 0) + variableEntry.amountCents,
      );
    }
    let best: { id: string; cents: number } | null = null;
    for (const [id, cents] of map) {
      if (!best || cents > best.cents) best = { id, cents };
    }
    if (!best) return null;
    return { name: cats.find((category) => category.id === best!.id)?.name ?? "—", cents: best.cents };
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
    const body = {
      description: desc,
      amountCents: cents,
      date: iso,
      categoryId,
      paymentMethod,
      competencyMonth: month,
    };
    const response = editingEntryId
      ? await authFetch(`${base}/entries/${editingEntryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await authFetch(`${base}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    if (!response.ok) {
      toast.error(editingEntryId ? "Erro ao atualizar" : "Erro ao salvar");
      return;
    }
    const wasEdit = editingEntryId !== null;
    setDesc("");
    setAmount("");
    setEditingEntryId(null);
    setEditingSourceType(null);
    toast.success(wasEdit ? "Lançamento atualizado" : "Lançamento criado");
    setSheetOpen(false);
    void refreshEntries();
  }

  async function remove(id: string) {
    const base = getApiBase();
    const response = await authFetch(`${base}/entries/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Removido");
    setDeleteId(null);
    void refreshEntries();
  }

  const variableList = list.filter((entry) => entry.sourceType === "variable");

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
          <Button onClick={() => openNewEntrySheet()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo gasto
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pdfLoading}
            onClick={() => {
              setPdfLoading(true);
              downloadPdf(
                `/reports/entries?competencyMonth=${encodeURIComponent(month)}`,
                `extrato-lancamentos-${month}.pdf`,
              ).catch(() => toast.error("Falha ao gerar PDF")).finally(() => setPdfLoading(false));
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {pdfLoading ? "Gerando…" : "Exportar PDF"}
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
        {variableList.length === 0 && list.filter((entry) => entry.sourceType !== "variable").length === 0 ? (
          <EmptyState
            title="Nada neste mês"
            description="Adicione um gasto variável ou gere contas fixas."
            action={
              <Button onClick={() => openNewEntrySheet()} variant="secondary">
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
                {list.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell>{formatDateDdMmYyyy(entry.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <MoneyValue cents={entry.amountCents} />
                    </TableCell>
                    <TableCell>
                      {entry.sourceType === "variable"
                        ? "Variável"
                        : entry.sourceType === "fixed_expense"
                          ? "Conta fixa"
                          : entry.sourceType}
                    </TableCell>
                    <TableCell>
                      {methods.find((method) => method.v === entry.paymentMethod)?.l ?? entry.paymentMethod}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditEntry(entry)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setDeleteId(entry.id)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        )}
      </SectionCard>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingEntryId(null);
            setEditingSourceType(null);
          }
        }}
      >
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingEntryId
                ? editingSourceType === "fixed_expense"
                  ? "Editar lançamento (conta fixa)"
                  : "Editar gasto variável"
                : "Novo gasto variável"}
            </SheetTitle>
            {editingEntryId && editingSourceType === "fixed_expense" ? (
              <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                As alterações valem só para <strong className="font-medium text-foreground">este mês</strong>. O cadastro da conta fixa em{" "}
                <strong className="font-medium text-foreground">Contas fixas</strong> não muda; na próxima geração o valor pode voltar ao padrão da conta.
              </p>
            ) : null}
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
                  {cats.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
                  {methods.map((method) => (
                    <SelectItem key={method.v} value={method.v}>
                      {method.l}
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
                {editingEntryId ? "Atualizar" : "Salvar"}
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
