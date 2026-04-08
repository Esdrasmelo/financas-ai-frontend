"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getApiBase } from "@/lib/api";
import { currentCompetencyMonth, formatBRLFromCents } from "@/lib/money";

type Fixed = {
  id: string;
  name: string;
  amountCents: number;
  isActive: boolean;
};

type CardRow = { id: string; name: string };

type StatementRow = {
  id: string;
  creditCardId: string;
  referenceMonth: string;
};

type StatementDetailJson = {
  totalInvoiceCents: number;
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function PlanningCalculatorDataPanel({ onAddCents }: { onAddCents: (cents: number) => void }) {
  const [fixedList, setFixedList] = useState<Fixed[]>([]);
  const [showInactiveFixed, setShowInactiveFixed] = useState(false);
  const [selectedFixedIds, setSelectedFixedIds] = useState<Set<string>>(new Set());

  const [cards, setCards] = useState<CardRow[]>([]);
  const [stmtCardId, setStmtCardId] = useState("");
  const [stmtRefMonth, setStmtRefMonth] = useState(currentCompetencyMonth());
  const [statementsForCard, setStatementsForCard] = useState<StatementRow[]>([]);

  const [allStmtMonth, setAllStmtMonth] = useState(currentCompetencyMonth());

  const base = getApiBase();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [fx, cr] = await Promise.all([fetch(`${base}/fixed-expenses`), fetch(`${base}/credit-cards`)]);
      if (cancelled) return;
      if (fx.ok) setFixedList((await fx.json()) as Fixed[]);
      if (cr.ok) {
        const list = (await cr.json()) as CardRow[];
        setCards(list);
        setStmtCardId((prev) => prev || list[0]?.id || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base]);

  useEffect(() => {
    if (!stmtCardId) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`${base}/credit-cards/${stmtCardId}/statements`);
      if (cancelled || !res.ok) return;
      setStatementsForCard((await res.json()) as StatementRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [base, stmtCardId]);

  const visibleFixed = useMemo(() => {
    if (showInactiveFixed) return fixedList;
    return fixedList.filter((f) => f.isActive);
  }, [fixedList, showInactiveFixed]);

  const toggleFixed = useCallback((id: string) => {
    setSelectedFixedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const applySelectedFixedTotal = useCallback(() => {
    const sum = fixedList
      .filter((f) => selectedFixedIds.has(f.id))
      .reduce((acc, f) => acc + f.amountCents, 0);
    if (sum <= 0) {
      toast.error("Selecione ao menos uma conta com valor");
      return;
    }
    onAddCents(sum);
    toast.success(`Somado ao visor: ${formatBRLFromCents(sum)}`);
  }, [fixedList, selectedFixedIds, onAddCents]);

  const applySingleStatement = useCallback(async () => {
    if (!MONTH_RE.test(stmtRefMonth.trim())) {
      toast.error("Mês de referência inválido (use YYYY-MM)");
      return;
    }
    const month = stmtRefMonth.trim();
    const row = statementsForCard.find((s) => s.referenceMonth === month);
    if (!row) {
      toast.error("Não há fatura para esse cartão e mês");
      return;
    }
    const res = await fetch(`${base}/statements/${row.id}`);
    if (!res.ok) {
      toast.error("Erro ao carregar fatura");
      return;
    }
    const detail = (await res.json()) as StatementDetailJson;
    const cents = detail.totalInvoiceCents;
    if (!Number.isFinite(cents)) {
      toast.error("Resposta inválida da API");
      return;
    }
    onAddCents(cents);
    toast.success(`Somado ao visor: ${formatBRLFromCents(cents)}`);
  }, [base, statementsForCard, stmtRefMonth, onAddCents]);

  const applyAllStatementsMonth = useCallback(async () => {
    if (!MONTH_RE.test(allStmtMonth.trim())) {
      toast.error("Mês inválido (use YYYY-MM)");
      return;
    }
    const month = allStmtMonth.trim();
    const res = await fetch(`${base}/statements`);
    if (!res.ok) {
      toast.error("Erro ao listar faturas");
      return;
    }
    const all = (await res.json()) as StatementRow[];
    const ids = all.filter((s) => s.referenceMonth === month).map((s) => s.id);
    if (ids.length === 0) {
      toast.error("Nenhuma fatura nesse mês para os cartões cadastrados");
      return;
    }
    const details = await Promise.all(
      ids.map(async (id) => {
        const r = await fetch(`${base}/statements/${id}`);
        if (!r.ok) return null;
        return (await r.json()) as StatementDetailJson;
      }),
    );
    const ok = details.filter((d): d is StatementDetailJson => d != null && Number.isFinite(d.totalInvoiceCents));
    const sum = ok.reduce((acc, d) => acc + d.totalInvoiceCents, 0);
    onAddCents(sum);
    toast.success(`Somado ao visor (${ids.length} fatura(s)): ${formatBRLFromCents(sum)}`);
  }, [base, allStmtMonth, onAddCents]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Contas fixas</h3>
        <p className="text-xs text-muted-foreground">
          Marque as contas e some o total ao valor já exibido na calculadora.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch id="show-inactive-fixed" checked={showInactiveFixed} onCheckedChange={setShowInactiveFixed} />
            <Label htmlFor="show-inactive-fixed" className="text-sm font-normal">
              Mostrar inativas
            </Label>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={() => void applySelectedFixedTotal()}>
            Usar total selecionado
          </Button>
        </div>
        {visibleFixed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta fixa listada.</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/80 bg-muted/15 p-3 text-sm">
            {visibleFixed.map((f) => (
              <li key={f.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-border"
                  checked={selectedFixedIds.has(f.id)}
                  onChange={() => toggleFixed(f.id)}
                  id={`fx-${f.id}`}
                />
                <label htmlFor={`fx-${f.id}`} className="flex flex-1 cursor-pointer flex-wrap justify-between gap-1">
                  <span className={!f.isActive ? "text-muted-foreground" : ""}>
                    {f.name}
                    {!f.isActive ? " (inativa)" : ""}
                  </span>
                  <span className="tabular-nums font-medium">{formatBRLFromCents(f.amountCents)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Uma fatura (cartão + mês)</h3>
        <p className="text-xs text-muted-foreground">Inclui o valor cheio da fatura (total de parcelas no período).</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[200px]">
            <Label>Cartão</Label>
            <Select value={stmtCardId} onValueChange={setStmtCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stmt-ref-month">Mês referência (YYYY-MM)</Label>
            <Input id="stmt-ref-month" value={stmtRefMonth} onChange={(e) => setStmtRefMonth(e.target.value)} className="w-40" />
          </div>
          <Button type="button" variant="secondary" onClick={() => void applySingleStatement()}>
            Incluir fatura
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Todas as faturas de um mês</h3>
        <p className="text-xs text-muted-foreground">Soma o valor cheio de cada fatura daquele mês em todos os cartões.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="all-stmt-month">Mês (YYYY-MM)</Label>
            <Input id="all-stmt-month" value={allStmtMonth} onChange={(e) => setAllStmtMonth(e.target.value)} className="w-40" />
          </div>
          <Button type="button" variant="secondary" onClick={() => void applyAllStatementsMonth()}>
            Incluir soma das faturas
          </Button>
        </div>
      </section>
    </div>
  );
}
