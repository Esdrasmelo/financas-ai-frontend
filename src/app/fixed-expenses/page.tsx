"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categorySavingId, setCategorySavingId] = useState<string | null>(null);

  async function refreshFixed() {
    const base = getApiBase();
    const [fixedResponse, categoriesResponse] = await Promise.all([
      fetch(`${base}/fixed-expenses`),
      fetch(`${base}/categories`),
    ]);
    if (fixedResponse.ok) setList((await fixedResponse.json()) as Fixed[]);
    if (categoriesResponse.ok) {
      const categoriesJson = (await categoriesResponse.json()) as Category[];
      setCats(categoriesJson);
      setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
    }
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [fixedResponse, categoriesResponse] = await Promise.all([
        fetch(`${base}/fixed-expenses`),
        fetch(`${base}/categories`),
      ]);
      if (cancelled) return;
      if (fixedResponse.ok) setList((await fixedResponse.json()) as Fixed[]);
      if (categoriesResponse.ok) {
        const categoriesJson = (await categoriesResponse.json()) as Category[];
        setCats(categoriesJson);
        setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = list;
    if (statusFilter === "active") rows = rows.filter((row) => row.isActive);
    if (statusFilter === "inactive") rows = rows.filter((row) => !row.isActive);
    const query = search.trim().toLowerCase();
    if (query) rows = rows.filter((row) => row.name.toLowerCase().includes(query));
    return rows;
  }, [list, search, statusFilter]);

  const totalFilteredCents = useMemo(
    () => filtered.reduce((sum, row) => sum + row.amountCents, 0),
    [filtered],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Valor inválido");
      return;
    }
    const base = getApiBase();
    const response = await fetch(`${base}/fixed-expenses`, {
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
    if (!response.ok) {
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
    const response = await fetch(`${base}/fixed-expenses/${id}/disable`, { method: "PATCH" });
    if (!response.ok) {
      toast.error("Erro");
      return;
    }
    toast.success("Desativada");
    void refreshFixed();
  }

  async function changeFixedCategory(fixedId: string, newCategoryId: string) {
    const base = getApiBase();
    setCategorySavingId(fixedId);
    try {
      const response = await fetch(`${base}/fixed-expenses/${fixedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: newCategoryId }),
      });
      if (!response.ok) {
        toast.error("Erro ao atualizar categoria");
        return;
      }
      toast.success("Categoria atualizada");
      await refreshFixed();
    } finally {
      setCategorySavingId(null);
    }
  }

  async function generate() {
    const base = getApiBase();
    const response = await fetch(`${base}/fixed-expenses/generate-monthly-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencyMonth: genMonth }),
    });
    if (!response.ok) {
      toast.error("Erro na geração");
      return;
    }
    const generationResult = (await response.json()) as { createdCount: number; skippedCount: number };
    toast.success(`Gerados: ${generationResult.createdCount}, ignorados: ${generationResult.skippedCount}`);
    void refreshFixed();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Contas fixas"
        subtitle="Recorrência, valor fixo ou variável, e geração de lançamentos por competência"
      />

      <SectionCard title="Nova conta fixa" description="Dados principais e recorrência">
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-xs text-muted-foreground">
                {variableAmount
                  ? "No 1º mês sem histórico usa este valor; depois copia o lançamento do mês anterior."
                  : "Mesmo valor a cada geração."}
              </p>
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
                  {cats.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch id="var-amt" checked={variableAmount} onCheckedChange={setVariableAmount} />
              <Label htmlFor="var-amt" className="cursor-pointer font-normal leading-snug text-foreground">
                Valor variável todo mês (energia, água, condomínio variável…)
              </Label>
            </div>
            <Button type="submit">Salvar conta fixa</Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Gerar lançamentos do mês"
        description="Cria entradas mensais para contas ativas conforme as regras de cada uma"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Mês (YYYY-MM)</Label>
            <Input value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="w-40" />
          </div>
          <Button type="button" variant="secondary" onClick={() => void generate()}>
            Gerar lançamentos
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Contas cadastradas"
        description={`${filtered.length} exibida${filtered.length !== 1 ? "s" : ""} · Soma dos valores listados: ${formatBRLFromCents(totalFilteredCents)}`}
        action={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="pt-0"
      >
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor / ref.</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>{formatBRLFromCents(expense.amountCents)}</TableCell>
                  <TableCell>
                    {expense.isVariableAmount === true ? (
                      <Badge variant="warning">Variável</Badge>
                    ) : (
                      <Badge variant="secondary">Fixo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[12rem]">
                    {cats.length === 0 ? (
                      <Badge variant="outline">—</Badge>
                    ) : (
                      <Select
                        value={expense.categoryId}
                        disabled={categorySavingId === expense.id}
                        onValueChange={(newId) => {
                          if (newId === expense.categoryId) return;
                          void changeFixedCategory(expense.id, newId);
                        }}
                      >
                        <SelectTrigger className="h-9 w-full max-w-[220px]">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {cats.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>{expense.dueDay}</TableCell>
                  <TableCell>
                    {expense.isActive ? (
                      <StatusBadge variant="active">Ativa</StatusBadge>
                    ) : (
                      <StatusBadge variant="inactive">Inativa</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.isActive && (
                      <Button type="button" variant="outline" size="sm" onClick={() => void disable(expense.id)}>
                        Desativar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      </SectionCard>
    </div>
  );
}
