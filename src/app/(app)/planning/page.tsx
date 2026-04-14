"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanningCalculatorTab } from "@/components/planning/planning-calculator-tab";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/shared/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBase, authFetch, downloadPdf } from "@/lib/api";
import { currentCompetencyMonth, formatBRLFromCents } from "@/lib/money";
import { MoneyValue } from "@/components/shared/money-value";
import { CompetencyViewTip } from "@/components/shared/competency-view-tip";

type SavingsDeposit = {
  id: string;
  competencyMonth: string;
  amountCents: number;
  note: string | null;
  createdAt: string;
};

type IncomeReceipt = {
  id: string;
  competencyMonth: string;
  amountCents: number;
  note: string | null;
  createdAt: string;
};

type BudgetMonthResponse = {
  competencyMonth: string;
  view: string;
  salaryCents: number | null;
  incomeReceipts: IncomeReceipt[];
  incomeReceiptsTotalCents: number;
  totalReceivedCents: number;
  hasIncomeConfigured: boolean;
  savingsDeposits: SavingsDeposit[];
  savingsTotalCents: number;
  monthlySummary: {
    totalSpentCents: number;
    fixedExpensesCents: number;
    variableExpensesCents: number;
    creditCardPortionCents: number;
    entryCount: number;
  };
  surplusCents: number | null;
};

function parseMoneyToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const cents = Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

export default function PlanningPage() {
  const [mainTab, setMainTab] = useState<"planning" | "calculator">("planning");
  const [month, setMonth] = useState(currentCompetencyMonth());
  const [view, setView] = useState<"payment" | "occurrence">("payment");
  const [data, setData] = useState<BudgetMonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [salaryInput, setSalaryInput] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("");
  const [savingAmount, setSavingAmount] = useState("");
  const [savingNote, setSavingNote] = useState("");

  const [simAmount, setSimAmount] = useState("");
  const [simMode, setSimMode] = useState<"deduct_surplus" | "add_expense">("deduct_surplus");
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
    const base = getApiBase();
    setLoading(true);
    const response = await authFetch(`${base}/budget/month/${encodeURIComponent(month)}?view=${view}`);
    if (!response.ok) {
      toast.error("Erro ao carregar planejamento");
      setData(null);
      setLoading(false);
      return;
    }
    const budgetMonth = (await response.json()) as BudgetMonthResponse;
    setData(budgetMonth);
    setSalaryInput(
      budgetMonth.salaryCents != null ? (budgetMonth.salaryCents / 100).toFixed(2).replace(".", ",") : "",
    );
    setLoading(false);
  }, [month, view]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSimAmount("");
    setSimMode("deduct_surplus");
  }, [month, view]);

  async function saveSalary() {
    const trimmed = salaryInput.trim();
    let salaryCents: number | null = null;
    if (trimmed !== "") {
      const parsedCents = Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
      if (!Number.isFinite(parsedCents) || parsedCents < 0) {
        toast.error("Salário inválido");
        return;
      }
      salaryCents = parsedCents;
    }
    const base = getApiBase();
    const response = await authFetch(`${base}/budget/month/${encodeURIComponent(month)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryCents }),
    });
    if (!response.ok) {
      toast.error("Erro ao salvar salário");
      return;
    }
    toast.success("Salário atualizado");
    void load();
  }

  async function addIncomeReceipt() {
    const cents = parseMoneyToCents(incomeAmount);
    if (cents == null || cents <= 0) {
      toast.error("Informe um valor positivo");
      return;
    }
    const base = getApiBase();
    const response = await authFetch(`${base}/budget/income-receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competencyMonth: month,
        amountCents: cents,
        note: incomeNote.trim() || null,
      }),
    });
    if (!response.ok) {
      toast.error("Erro ao registrar recebimento");
      return;
    }
    toast.success("Recebimento registrado");
    setIncomeAmount("");
    setIncomeNote("");
    void load();
  }

  async function removeIncomeReceipt(id: string) {
    const base = getApiBase();
    const response = await authFetch(`${base}/budget/income-receipts/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Removido");
    void load();
  }

  async function addSaving() {
    const cents = parseMoneyToCents(savingAmount);
    if (cents == null || cents <= 0) {
      toast.error("Informe um valor positivo");
      return;
    }
    const base = getApiBase();
    const response = await authFetch(`${base}/budget/savings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competencyMonth: month,
        amountCents: cents,
        note: savingNote.trim() || null,
      }),
    });
    if (!response.ok) {
      toast.error("Erro ao registrar poupança");
      return;
    }
    toast.success("Valor guardado registrado");
    setSavingAmount("");
    setSavingNote("");
    void load();
  }

  async function removeSaving(id: string) {
    const base = getApiBase();
    const response = await authFetch(`${base}/budget/savings/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Removido");
    void load();
  }

  const simCents = parseMoneyToCents(simAmount) ?? 0;
  const simActive = simCents > 0;

  const simulation = useMemo(() => {
    if (!data) return null;
    const baseSpent = data.monthlySummary.totalSpentCents;
    const baseSurplus = data.surplusCents;
    const totalRecv = data.totalReceivedCents;

    if (!simActive) {
      return {
        displaySpent: baseSpent,
        displaySurplus: baseSurplus,
        showSimLines: false,
      };
    }

    if (simMode === "add_expense") {
      const displaySpent = baseSpent + simCents;
      const displaySurplus = data.hasIncomeConfigured ? totalRecv - displaySpent : null;
      return {
        displaySpent,
        displaySurplus,
        showSimLines: true,
        baseSpent,
        baseSurplus,
      };
    }

    const displaySurplus =
      baseSurplus != null ? baseSurplus - simCents : data.hasIncomeConfigured ? totalRecv - baseSpent - simCents : null;
    return {
      displaySpent: baseSpent,
      displaySurplus,
      showSimLines: true,
      baseSpent,
      baseSurplus,
    };
  }, [data, simActive, simMode, simCents]);

  const viewLabel = view === "payment" ? "por pagamento (competência)" : "por ocorrência";

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Planejamento mensal"
        subtitle="Orçamento do mês na primeira aba; calculadora com inclusão opcional de contas fixas e faturas na segunda."
      />

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "planning" | "calculator")} className="w-full">
        <TabsList className="h-auto min-h-10 w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="planning">Planejamento</TabsTrigger>
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="mt-6 space-y-6 sm:space-y-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-month">Mês (YYYY-MM)</Label>
                <Input id="plan-month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
              </div>
              <Tabs value={view} onValueChange={(v) => setView(v as "payment" | "occurrence")}>
                <TabsList>
                  <TabsTrigger value="payment">Pagamento</TabsTrigger>
                  <TabsTrigger value="occurrence">Ocorrência</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                disabled={pdfLoading || loading}
                onClick={() => {
                  setPdfLoading(true);
                  downloadPdf(
                    `/reports/budget?competencyMonth=${encodeURIComponent(month)}&view=${view}`,
                    `orcamento-${month}.pdf`,
                  ).catch(() => toast.error("Falha ao gerar PDF")).finally(() => setPdfLoading(false));
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {pdfLoading ? "Gerando…" : "Exportar PDF"}
              </Button>
            </div>
            <CompetencyViewTip />
          </div>

          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : data ? (
            <>
          <SectionCard
            title="Renda do mês"
            description="Salário principal (opcional) + outros recebimentos que você quiser registrar ao longo do mês"
            contentClassName="space-y-6"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="salary">Salário / renda principal (R$)</Label>
                <Input
                  id="salary"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="0,00"
                  className="w-44"
                />
              </div>
              <Button type="button" onClick={() => void saveSalary()}>
                Salvar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total recebido (salvo): <span className="font-semibold text-foreground">{formatBRLFromCents(data.totalReceivedCents)}</span>
              {data.incomeReceipts.length > 0 || data.salaryCents != null ? (
                <span className="ml-2 text-xs">
                  (salário {data.salaryCents != null ? formatBRLFromCents(data.salaryCents) : "—"} + outros{" "}
                  {formatBRLFromCents(data.incomeReceiptsTotalCents)})
                </span>
              ) : null}
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Registrar outro recebimento</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="income-amt">Valor (R$)</Label>
                  <Input
                    id="income-amt"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-36"
                  />
                </div>
                <div className="min-w-[200px] flex-1 space-y-2">
                  <Label htmlFor="income-note">Descrição (opcional)</Label>
                  <Input id="income-note" value={incomeNote} onChange={(e) => setIncomeNote(e.target.value)} placeholder="Ex.: freelance, 13º" />
                </div>
                <Button type="button" variant="secondary" onClick={() => void addIncomeReceipt()}>
                  Adicionar
                </Button>
              </div>
            </div>

            {data.incomeReceipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum recebimento extra neste mês.</p>
            ) : (
              <DataTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.incomeReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium tabular-nums">{formatBRLFromCents(receipt.amountCents)}</TableCell>
                        <TableCell className="text-muted-foreground">{receipt.note ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void removeIncomeReceipt(receipt.id)}
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            )}
          </SectionCard>

          <SectionCard
            title="Simulação rápida"
            description="Ajuste um valor só para ver o efeito na sobra ou no total de gastos. Nada aqui é gravado no servidor."
            contentClassName="space-y-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="sim-amt">Valor (R$)</Label>
                <Input
                  id="sim-amt"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-36"
                />
              </div>
              <div className="min-w-[min(100%,280px)] space-y-2">
                <Label>Como aplicar</Label>
                <Select value={simMode} onValueChange={(v) => setSimMode(v as "deduct_surplus" | "add_expense")}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deduct_surplus">Descontar da sobra (ex.: gasto já previsto)</SelectItem>
                    <SelectItem value="add_expense">Somar aos gastos do mês (extra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {simActive && simulation?.showSimLines ? (
              <ul className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm space-y-2">
                {simMode === "add_expense" ? (
                  <>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Total gasto (app)</span>
                      <MoneyValue cents={simulation.baseSpent!} />
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted-foreground">+ extra simulado</span>
                      <span className="tabular-nums font-medium">{formatBRLFromCents(simCents)}</span>
                    </li>
                    <li className="flex justify-between gap-2 border-t border-border pt-2 font-semibold">
                      <span>Total gasto simulado</span>
                      <MoneyValue cents={simulation.displaySpent} />
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Sobra base</span>
                      <span className="tabular-nums">
                        {simulation.baseSurplus != null ? formatBRLFromCents(simulation.baseSurplus) : "—"}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted-foreground">− valor simulado</span>
                      <span className="tabular-nums font-medium">{formatBRLFromCents(simCents)}</span>
                    </li>
                  </>
                )}
                <li className="flex justify-between gap-2 border-t border-border pt-2 text-base font-bold">
                  <span>Sobra simulada</span>
                  <span className="tabular-nums text-foreground">
                    {simulation.displaySurplus != null ? formatBRLFromCents(simulation.displaySurplus) : "Configure a renda do mês acima"}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Digite um valor acima para ver o resultado simulado.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Resumo de gastos no app"
            description={`Totais do mês ${data.competencyMonth} (${viewLabel}). Lançamentos de contas fixas entram após “Gerar lançamentos” em Contas fixas.`}
            contentClassName="space-y-4"
          >
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex justify-between gap-2 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
                <span className="text-muted-foreground">Total gasto{simActive && simMode === "add_expense" ? " (simulado)" : ""}</span>
                <MoneyValue cents={simulation?.displaySpent ?? data.monthlySummary.totalSpentCents} className="font-semibold" />
              </li>
              <li className="flex justify-between gap-2 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
                <span className="text-muted-foreground">Contas fixas</span>
                <MoneyValue cents={data.monthlySummary.fixedExpensesCents} />
              </li>
              <li className="flex justify-between gap-2 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
                <span className="text-muted-foreground">Variáveis</span>
                <MoneyValue cents={data.monthlySummary.variableExpensesCents} />
              </li>
              <li className="flex justify-between gap-2 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
                <span className="text-muted-foreground">Cartão (parcelas no mês)</span>
                <MoneyValue cents={data.monthlySummary.creditCardPortionCents} />
              </li>
            </ul>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Sobra estimada (total recebido salvo − total gasto{simActive && simMode === "add_expense" ? " simulado" : ""})
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {simulation?.displaySurplus != null ? formatBRLFromCents(simulation.displaySurplus) : "Informe salário e/ou recebimentos para calcular"}
              </p>
              {simActive && simMode === "deduct_surplus" && simulation?.baseSurplus != null ? (
                <p className="text-xs text-muted-foreground">Base: {formatBRLFromCents(simulation.baseSurplus)} → após simulação: {formatBRLFromCents(simulation.displaySurplus!)}</p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Valores que guardei"
            description={`Total registrado: ${formatBRLFromCents(data.savingsTotalCents)}`}
            contentClassName="space-y-6"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="save-amt">Valor (R$)</Label>
                <Input
                  id="save-amt"
                  value={savingAmount}
                  onChange={(e) => setSavingAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-36"
                />
              </div>
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="save-note">Observação (opcional)</Label>
                <Input id="save-note" value={savingNote} onChange={(e) => setSavingNote(e.target.value)} />
              </div>
              <Button type="button" variant="secondary" onClick={() => void addSaving()}>
                Registrar
              </Button>
            </div>

            {data.savingsDeposits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro neste mês.</p>
            ) : (
              <DataTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valor</TableHead>
                      <TableHead>Obs.</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.savingsDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium tabular-nums">{formatBRLFromCents(deposit.amountCents)}</TableCell>
                        <TableCell className="text-muted-foreground">{deposit.note ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void removeSaving(deposit.id)}
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            )}
          </SectionCard>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <PlanningCalculatorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
