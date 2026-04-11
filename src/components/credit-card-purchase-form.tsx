"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar, Lightbulb, ListOrdered, Sparkles } from "lucide-react";
import { getApiBase, authFetch } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { PurchaseDatePicker } from "@/components/purchase-date-picker";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";
import { SectionCard } from "@/components/shared/section-card";

type Category = { id: string; name: string };
type CardRow = { id: string; name: string };

type PreviewRow = { referenceMonth: string; amountCents: number; installmentNumber: number; dueDate?: string };

function isoDateToYmd(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function suggestedPurchaseYmdFromStatement(periodEndIso: string): string {
  const end = new Date(periodEndIso);
  const now = new Date();
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const chosen = Math.min(endUtc, nowUtc);
  return new Date(chosen).toISOString().slice(0, 10);
}

export type CreditCardPurchaseFormProps = {
  variant?: "page" | "modal";
  /** Cartão inicial (ex.: query string) — ignorado se `statementId` preencher o ciclo. */
  initialCreditCardId?: string | null;
  statementId?: string | null;
  editingPurchaseId: string | null;
  onCancelEdit?: () => void;
  /** Chamado após criar ou atualizar com sucesso (para atualizar listas). */
  onSaved?: (creditCardId: string) => void;
  /** Notifica o cartão ativo no formulário (para listas na mesma página). */
  onCreditCardIdChange?: (creditCardId: string) => void;
};

export function CreditCardPurchaseForm({
  variant = "page",
  initialCreditCardId,
  statementId,
  editingPurchaseId,
  onCancelEdit,
  onSaved,
  onCreditCardIdChange,
}: CreditCardPurchaseFormProps) {
  const [cats, setCats] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [creditCardId, setCreditCardId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [parcelValue, setParcelValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [installment, setInstallment] = useState(false);
  const [totalInst, setTotalInst] = useState("12");
  const [currentInst, setCurrentInst] = useState("1");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [cycle, setCycle] = useState<string | null>(null);
  const [statementHint, setStatementHint] = useState<string | null>(null);
  /** Evita sobrescrever cartão/categoria ao editar: o GET da compra define os IDs. */
  const editingRef = useRef(editingPurchaseId);
  editingRef.current = editingPurchaseId;

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [categoriesResponse, cardsResponse] = await Promise.all([
        authFetch(`${base}/categories`),
        authFetch(`${base}/credit-cards`),
      ]);
      if (cancelled) return;
      if (categoriesResponse.ok) {
        const categoriesJson = (await categoriesResponse.json()) as Category[];
        setCats(categoriesJson);
        if (!editingRef.current) {
          setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
        }
      }
      if (cardsResponse.ok) {
        const cardsJson = (await cardsResponse.json()) as CardRow[];
        setCards(cardsJson);
        if (!editingRef.current) {
          setCreditCardId((prev) => prev || (cardsJson[0]?.id ?? ""));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (creditCardId) onCreditCardIdChange?.(creditCardId);
  }, [creditCardId, onCreditCardIdChange]);

  useEffect(() => {
    if (editingPurchaseId || statementId) return;
    const cc = initialCreditCardId;
    if (!cc || !cards.some((card) => card.id === cc)) return;
    setCreditCardId(cc);
  }, [initialCreditCardId, editingPurchaseId, statementId, cards]);

  useEffect(() => {
    if (!statementId || editingPurchaseId) return;
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await authFetch(`${base}/statements/${statementId}`);
      if (cancelled || !response.ok) return;
      const detail = (await response.json()) as {
        statement: { creditCardId: string; periodEnd: string; referenceMonth: string };
      };
      setCreditCardId(detail.statement.creditCardId);
      setPurchaseDate(suggestedPurchaseYmdFromStatement(detail.statement.periodEnd));
      setStatementHint(
        `Compra sugerida para a fatura ${formatStatementRefDisplay(detail.statement.referenceMonth)}. A data segue o ciclo do cartão.`,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [statementId, editingPurchaseId]);

  useEffect(() => {
    if (!editingPurchaseId) return;
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await authFetch(`${base}/credit-card-purchases/${editingPurchaseId}`);
      if (cancelled || !response.ok) {
        if (!cancelled && !response.ok) toast.error("Não foi possível carregar a compra");
        return;
      }
      const purchase = (await response.json()) as {
        creditCardId: string;
        categoryId: string;
        description: string;
        purchaseDate: string;
        totalAmountCents: number;
        isInstallmentPurchase: boolean;
        totalInstallments: number;
        currentInstallment: number;
        installmentAmountCents: number | null;
      };
      if (cancelled) return;
      setCreditCardId(purchase.creditCardId);
      setCategoryId(purchase.categoryId);
      setDescription(purchase.description);
      if (purchase.isInstallmentPurchase) {
        const parcelAmountCents =
          purchase.installmentAmountCents != null
            ? purchase.installmentAmountCents
            : Math.round(purchase.totalAmountCents / Math.max(1, purchase.totalInstallments));
        setParcelValue((parcelAmountCents / 100).toFixed(2).replace(".", ","));
        setTotal("");
      } else {
        setParcelValue("");
        setTotal((purchase.totalAmountCents / 100).toFixed(2).replace(".", ","));
      }
      setPurchaseDate(isoDateToYmd(purchase.purchaseDate));
      setInstallment(purchase.isInstallmentPurchase);
      setTotalInst(String(purchase.totalInstallments));
      setCurrentInst(String(purchase.currentInstallment));
      setPreview([]);
      setCycle(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [editingPurchaseId]);

  const computedInstallmentTotalCents = useMemo(() => {
    if (!installment) return null;
    const installmentCount = parseInt(totalInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    if (!Number.isFinite(installmentCount) || installmentCount < 1 || !Number.isFinite(parcelCents) || parcelCents <= 0)
      return null;
    return parcelCents * installmentCount;
  }, [installment, totalInst, parcelValue]);

  function resetNewPurchaseForm() {
    setDescription("");
    setTotal("");
    setParcelValue("");
    setPreview([]);
    setCycle(null);
    setInstallment(false);
    setTotalInst("12");
    setCurrentInst("1");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setCategoryId(cats[0]?.id ?? "");
    setStatementHint(null);
  }

  function cancelEdit() {
    resetNewPurchaseForm();
    onCancelEdit?.();
  }

  async function runPreview() {
    if (!creditCardId) {
      toast.error("Aguarde o cartão carregar ou selecione um cartão.");
      return;
    }
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const totalInstallments = parseInt(totalInst, 10);
    const currentInstallmentNum = parseInt(currentInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    const totalCents = Math.round(parseFloat(total.replace(",", ".")) * 100);
    if (installment && (!Number.isFinite(parcelCents) || parcelCents <= 0)) {
      toast.error("Informe o valor da parcela");
      return;
    }
    if (!installment && (!Number.isFinite(totalCents) || totalCents <= 0)) {
      toast.error("Informe o valor total");
      return;
    }
    const response = await authFetch(`${base}/credit-card-purchases/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creditCardId,
        purchaseDate: iso,
        totalAmountCents: installment ? 0 : totalCents,
        installmentAmountCents: installment && parcelCents > 0 ? parcelCents : undefined,
        isInstallmentPurchase: installment,
        totalInstallments,
        currentInstallment: currentInstallmentNum,
      }),
    });
    if (!response.ok) {
      try {
        const errJson = (await response.json()) as { message?: string };
        toast.error(errJson.message?.trim() ? errJson.message : "Falha no preview");
      } catch {
        toast.error("Falha no preview");
      }
      return;
    }
    const previewPayload = (await response.json()) as { preview: PreviewRow[] };
    setPreview(previewPayload.preview);
  }

  async function runEstimate() {
    if (!creditCardId) {
      toast.error("Aguarde o cartão carregar ou selecione um cartão.");
      return;
    }
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const instNum = installment ? parseInt(currentInst, 10) || 1 : 1;
    const response = await authFetch(`${base}/credit-cards/estimate-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditCardId, purchaseDate: iso, installmentNumber: instNum }),
    });
    if (!response.ok) {
      try {
        const errJson = (await response.json()) as { message?: string };
        toast.error(errJson.message?.trim() ? errJson.message : "Falha no ciclo");
      } catch {
        toast.error("Falha no ciclo");
      }
      return;
    }
    const cyclePayload = (await response.json()) as {
      referenceMonth: string;
      closingDate: string;
      dueDate: string;
      installmentNumber: number;
    };
    setCycle(
      `${formatStatementRefDisplay(cyclePayload.referenceMonth)} | Fecha ${formatDateDdMmYyyy(cyclePayload.closingDate)} | Vence ${formatDateDdMmYyyy(cyclePayload.dueDate)}`,
    );
    toast.success(`Parcela ${cyclePayload.installmentNumber}: vence ${formatDateDdMmYyyy(cyclePayload.dueDate)}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const base = getApiBase();
    const totalInstallments = parseInt(totalInst, 10);
    const currentInstallmentNum = parseInt(currentInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    const totalCents = Math.round(parseFloat(total.replace(",", ".")) * 100);
    if (installment && (!Number.isFinite(parcelCents) || parcelCents <= 0)) {
      toast.error("Informe o valor da parcela");
      return;
    }
    if (!installment && (!Number.isFinite(totalCents) || totalCents <= 0)) {
      toast.error("Informe o valor total");
      return;
    }
    const body = {
      categoryId,
      description,
      purchaseDate: iso,
      totalAmountCents: installment ? 0 : totalCents,
      installmentAmountCents: installment && parcelCents > 0 ? parcelCents : undefined,
      isInstallmentPurchase: installment,
      totalInstallments,
      currentInstallment: currentInstallmentNum,
    };

    if (editingPurchaseId) {
      const patchResponse = await authFetch(`${base}/credit-card-purchases/${editingPurchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!patchResponse.ok) {
        try {
          const errorBody = (await patchResponse.json()) as { message?: string };
          toast.error(errorBody.message ?? "Erro ao atualizar compra");
        } catch {
          toast.error("Erro ao atualizar compra");
        }
        return;
      }
      toast.success("Compra atualizada");
      resetNewPurchaseForm();
      onCancelEdit?.();
      onSaved?.(creditCardId);
      return;
    }

    const createResponse = await authFetch(`${base}/credit-card-purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditCardId, ...body }),
    });
    if (!createResponse.ok) {
      toast.error("Erro ao registrar compra");
      return;
    }
    toast.success("Compra registrada");
    resetNewPurchaseForm();
    let cardForList = creditCardId;
    if (variant === "page") {
      const defaultCardId = cards[0]?.id ?? "";
      setCreditCardId(defaultCardId);
      setCategoryId(cats[0]?.id ?? "");
      cardForList = defaultCardId;
    }
    onSaved?.(cardForList);
  }

  const formCard = (
    <SectionCard title={editingPurchaseId ? "Editar compra" : "Nova compra"} contentClassName="pt-0">
      <form className="space-y-6" onSubmit={submit}>
        {statementHint && !editingPurchaseId ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">{statementHint}</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Cartão</Label>
            <Select value={creditCardId} onValueChange={setCreditCardId} disabled={!!editingPurchaseId}>
              <SelectTrigger>
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
            {editingPurchaseId ? <p className="text-xs text-muted-foreground">O cartão não pode ser alterado na edição.</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
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
          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          {installment ? (
            <div className="space-y-2">
              <Label>Valor da parcela R$</Label>
              <Input value={parcelValue} onChange={(e) => setParcelValue(e.target.value)} required inputMode="decimal" />
              {computedInstallmentTotalCents != null && (
                <p className="text-xs text-muted-foreground">
                  Total da compra: <span className="font-medium text-foreground">{formatBRLFromCents(computedInstallmentTotalCents)}</span>{" "}
                  ({totalInst}× parcela)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Valor total R$</Label>
              <Input value={total} onChange={(e) => setTotal(e.target.value)} required inputMode="decimal" />
            </div>
          )}
          <PurchaseDatePicker
            id={variant === "modal" ? "purchase-date-modal" : "purchase-date"}
            disablePopperPortal={variant === "modal"}
            value={purchaseDate}
            onChange={setPurchaseDate}
          />
        </div>
        <Separator />
        <div className="flex items-center gap-3">
          <Switch id="inst" checked={installment} onCheckedChange={setInstallment} />
          <Label htmlFor="inst" className="cursor-pointer font-normal">
            Compra parcelada
          </Label>
        </div>
        {installment && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Total parcelas</Label>
              <Input value={totalInst} onChange={(e) => setTotalInst(e.target.value)} type="number" min={1} />
            </div>
            <div className="space-y-2">
              <Label>Parcela atual</Label>
              <Input value={currentInst} onChange={(e) => setCurrentInst(e.target.value)} type="number" min={1} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!creditCardId}
            onClick={() => void runEstimate()}
          >
            Em qual fatura cai?
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!creditCardId}
            onClick={() => void runPreview()}
          >
            Preview parcelas
          </Button>
          <Button type="submit">{editingPurchaseId ? "Salvar alterações" : "Registrar"}</Button>
          {editingPurchaseId && (
            <Button type="button" variant="ghost" onClick={cancelEdit}>
              Cancelar edição
            </Button>
          )}
        </div>
      </form>
    </SectionCard>
  );

  const previewCard = (
    <Card className="border-primary/15 bg-gradient-to-b from-card to-muted/25 shadow-sm">
      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold tracking-tight text-foreground">Preview</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Confira o ciclo da fatura e o calendário de parcelas antes de confirmar a compra.
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Ciclo da fatura
          </div>
          {cycle ? (
            <p className="rounded-xl border border-border bg-card px-4 py-3.5 text-sm leading-relaxed text-foreground shadow-sm">
              {cycle}
            </p>
          ) : (
            <div className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                Clique em <span className="font-medium text-foreground">Em qual fatura cai?</span> para ver referência de mês,
                data de fechamento e vencimento estimado.
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListOrdered className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Parcelas previstas
          </div>
          {preview.length > 0 ? (
            <ul className="space-y-2.5">
              {preview.map((row) => (
                <li
                  key={`${row.installmentNumber}-${row.referenceMonth}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
                >
                  <span className="text-muted-foreground">
                    Parcela {row.installmentNumber}
                    <span className="mx-1.5 text-muted-foreground/60">·</span>
                    {row.dueDate ? formatDateDdMmYyyy(row.dueDate) : formatStatementRefDisplay(row.referenceMonth)}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{formatBRLFromCents(row.amountCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
              <ListOrdered className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                Use <span className="font-medium text-foreground">Preview parcelas</span> para simular como o valor se distribui
                nas competências seguintes.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {formCard}
      {previewCard}
    </div>
  );
}
