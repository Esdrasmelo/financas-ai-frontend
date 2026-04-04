"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lightbulb, ListOrdered, Sparkles } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { PurchaseDatePicker } from "@/components/purchase-date-picker";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";

type Category = { id: string; name: string };
type CardRow = { id: string; name: string };

type PurchaseRow = {
  id: string;
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

type PreviewRow = { referenceMonth: string; amountCents: number; installmentNumber: number; dueDate?: string };

function isoDateToYmd(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

/** Data sugerida: não ultrapassa hoje nem o fim do período da fatura (UTC). */
function suggestedPurchaseYmdFromStatement(periodEndIso: string): string {
  const end = new Date(periodEndIso);
  const now = new Date();
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const chosen = Math.min(endUtc, nowUtc);
  return new Date(chosen).toISOString().slice(0, 10);
}

function PurchasesPageInner() {
  const searchParams = useSearchParams();
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseTab, setPurchaseTab] = useState<"all" | "cash" | "installment">("all");
  const [statementHint, setStatementHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [categoriesResponse, cardsResponse] = await Promise.all([
        fetch(`${base}/categories`),
        fetch(`${base}/credit-cards`),
      ]);
      if (cancelled) return;
      if (categoriesResponse.ok) {
        const categoriesJson = (await categoriesResponse.json()) as Category[];
        setCats(categoriesJson);
        setCategoryId((prev) => prev || (categoriesJson[0]?.id ?? ""));
      }
      if (cardsResponse.ok) {
        const cardsJson = (await cardsResponse.json()) as CardRow[];
        setCards(cardsJson);
        setCreditCardId((prev) => prev || (cardsJson[0]?.id ?? ""));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cc = searchParams.get("creditCardId");
    if (!cc || editingId || cards.length === 0) return;
    if (cards.some((card) => card.id === cc)) setCreditCardId(cc);
  }, [searchParams, editingId, cards]);

  useEffect(() => {
    const statementId = searchParams.get("statementId");
    if (!statementId || editingId) return;
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const response = await fetch(`${base}/statements/${statementId}`);
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
  }, [searchParams, editingId]);

  useEffect(() => {
    if (!creditCardId) return;
    let cancelled = false;
    const base = getApiBase();
    void fetch(`${base}/credit-card-purchases?creditCardId=${encodeURIComponent(creditCardId)}`).then(
      async (response) => {
        if (cancelled || !response.ok) return;
        setPurchases((await response.json()) as PurchaseRow[]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [creditCardId]);

  async function refreshPurchasesList(cardId: string) {
    if (!cardId) return;
    const base = getApiBase();
    const response = await fetch(`${base}/credit-card-purchases?creditCardId=${encodeURIComponent(cardId)}`);
    if (!response.ok) return;
    setPurchases((await response.json()) as PurchaseRow[]);
  }

  const computedInstallmentTotalCents = useMemo(() => {
    if (!installment) return null;
    const installmentCount = parseInt(totalInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    if (!Number.isFinite(installmentCount) || installmentCount < 1 || !Number.isFinite(parcelCents) || parcelCents <= 0)
      return null;
    return parcelCents * installmentCount;
  }, [installment, totalInst, parcelValue]);

  const filteredPurchases = useMemo(() => {
    if (purchaseTab === "cash") return purchases.filter((purchase) => !purchase.isInstallmentPurchase);
    if (purchaseTab === "installment") return purchases.filter((purchase) => purchase.isInstallmentPurchase);
    return purchases;
  }, [purchases, purchaseTab]);

  function resetNewPurchaseForm() {
    setEditingId(null);
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
  }

  function cancelEdit() {
    resetNewPurchaseForm();
  }

  async function beginEdit(id: string) {
    const base = getApiBase();
    const response = await fetch(`${base}/credit-card-purchases/${id}`);
    if (!response.ok) {
      toast.error("Não foi possível carregar a compra");
      return;
    }
    const purchase = (await response.json()) as PurchaseRow;
    setEditingId(purchase.id);
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
  }

  async function runPreview() {
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const totalInstallments = parseInt(totalInst, 10);
    const currentInstallmentNum = parseInt(currentInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    const totalCents = Math.round(parseFloat(total.replace(",", ".")) * 100);
    const response = await fetch(`${base}/credit-card-purchases/preview`, {
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
      toast.error("Falha no preview");
      return;
    }
    const previewPayload = (await response.json()) as { preview: PreviewRow[] };
    setPreview(previewPayload.preview);
  }

  async function runEstimate() {
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const instNum = installment ? parseInt(currentInst, 10) || 1 : 1;
    const response = await fetch(`${base}/credit-cards/estimate-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditCardId, purchaseDate: iso, installmentNumber: instNum }),
    });
    if (!response.ok) {
      toast.error("Falha no ciclo");
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

    if (editingId) {
      const patchResponse = await fetch(`${base}/credit-card-purchases/${editingId}`, {
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
      void refreshPurchasesList(creditCardId);
      return;
    }

    const createResponse = await fetch(`${base}/credit-card-purchases`, {
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
    const defaultCardId = cards[0]?.id ?? "";
    setCreditCardId(defaultCardId);
    setCategoryId(cats[0]?.id ?? "");
    void refreshPurchasesList(defaultCardId);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Compras no cartão" subtitle="Cadastro, preview de parcelas e ciclo de fatura" />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SectionCard title={editingId ? "Editar compra" : "Nova compra"} contentClassName="pt-0">
          <form className="space-y-6" onSubmit={submit}>
            {statementHint && !editingId ? (
              <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">{statementHint}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Cartão</Label>
                <Select value={creditCardId} onValueChange={setCreditCardId} disabled={!!editingId}>
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
                {editingId ? <p className="text-xs text-muted-foreground">O cartão não pode ser alterado na edição.</p> : null}
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
              <PurchaseDatePicker id="purchase-date" value={purchaseDate} onChange={setPurchaseDate} />
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
              <Button type="button" variant="secondary" onClick={() => void runEstimate()}>
                Em qual fatura cai?
              </Button>
              <Button type="button" variant="outline" onClick={() => void runPreview()}>
                Preview parcelas
              </Button>
              <Button type="submit">{editingId ? "Salvar alterações" : "Registrar"}</Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
        </SectionCard>

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
                    Clique em <span className="font-medium text-foreground">Em qual fatura cai?</span> para ver referência de
                    mês, data de fechamento e vencimento estimado.
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
                    Use <span className="font-medium text-foreground">Preview parcelas</span> para simular como o valor se
                    distribui nas competências seguintes.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Compras deste cartão" contentClassName="pt-0">
        {!creditCardId ? (
          <EmptyState title="Selecione um cartão" description="Escolha o cartão no formulário acima." />
        ) : (
          <Tabs value={purchaseTab} onValueChange={(v) => setPurchaseTab(v as typeof purchaseTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="cash">À vista</TabsTrigger>
              <TabsTrigger value="installment">Parceladas</TabsTrigger>
            </TabsList>
            <TabsContent value={purchaseTab} className="mt-0">
              {filteredPurchases.length === 0 ? (
                <EmptyState title="Nenhuma compra" description="Nada neste filtro para o cartão selecionado." />
              ) : (
                <DataTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDateDdMmYyyy(purchase.purchaseDate)}</TableCell>
                          <TableCell className="font-medium">{purchase.description}</TableCell>
                          <TableCell>
                            {cats.find((category) => category.id === purchase.categoryId)?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatBRLFromCents(purchase.totalAmountCents)}</TableCell>
                          <TableCell>
                            {purchase.isInstallmentPurchase ? (
                              <Badge variant="secondary">
                                {purchase.currentInstallment}/{purchase.totalInstallments}
                              </Badge>
                            ) : (
                              <Badge variant="outline">À vista</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="outline" size="sm" onClick={() => void beginEdit(purchase.id)}>
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTable>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SectionCard>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 sm:space-y-8">
          <PageHeader title="Compras no cartão" subtitle="Cadastro, preview de parcelas e ciclo de fatura" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      }
    >
      <PurchasesPageInner />
    </Suspense>
  );
}
