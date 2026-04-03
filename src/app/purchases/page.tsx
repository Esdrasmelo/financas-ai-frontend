"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { PurchaseDatePicker } from "@/components/purchase-date-picker";
import { formatDateDdMmYyyy, formatStatementRefDisplay } from "@/lib/date";

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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function PurchasesPage() {
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

  const loadPurchases = useCallback(async () => {
    if (!creditCardId) return;
    const base = getApiBase();
    const r = await fetch(`${base}/credit-card-purchases?creditCardId=${encodeURIComponent(creditCardId)}`);
    if (!r.ok) return;
    setPurchases((await r.json()) as PurchaseRow[]);
  }, [creditCardId]);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [c, k] = await Promise.all([fetch(`${base}/categories`), fetch(`${base}/credit-cards`)]);
      if (cancelled) return;
      if (c.ok) {
        const cl = (await c.json()) as Category[];
        setCats(cl);
        setCategoryId((p) => p || (cl[0]?.id ?? ""));
      }
      if (k.ok) {
        const kl = (await k.json()) as CardRow[];
        setCards(kl);
        setCreditCardId((p) => p || (kl[0]?.id ?? ""));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  const computedInstallmentTotalCents = useMemo(() => {
    if (!installment) return null;
    const n = parseInt(totalInst, 10);
    const pc = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    if (!Number.isFinite(n) || n < 1 || !Number.isFinite(pc) || pc <= 0) return null;
    return pc * n;
  }, [installment, totalInst, parcelValue]);

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
    const r = await fetch(`${base}/credit-card-purchases/${id}`);
    if (!r.ok) {
      toast.error("Não foi possível carregar a compra");
      return;
    }
    const p = (await r.json()) as PurchaseRow;
    setEditingId(p.id);
    setCreditCardId(p.creditCardId);
    setCategoryId(p.categoryId);
    setDescription(p.description);
    if (p.isInstallmentPurchase) {
      const per =
        p.installmentAmountCents != null
          ? p.installmentAmountCents
          : Math.round(p.totalAmountCents / Math.max(1, p.totalInstallments));
      setParcelValue((per / 100).toFixed(2).replace(".", ","));
      setTotal("");
    } else {
      setParcelValue("");
      setTotal((p.totalAmountCents / 100).toFixed(2).replace(".", ","));
    }
    setPurchaseDate(isoDateToYmd(p.purchaseDate));
    setInstallment(p.isInstallmentPurchase);
    setTotalInst(String(p.totalInstallments));
    setCurrentInst(String(p.currentInstallment));
    setPreview([]);
    setCycle(null);
  }

  async function runPreview() {
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const n = parseInt(totalInst, 10);
    const cur = parseInt(currentInst, 10);
    const parcelCents = Math.round(parseFloat(parcelValue.replace(",", ".")) * 100);
    const totalCents = Math.round(parseFloat(total.replace(",", ".")) * 100);
    const r = await fetch(`${base}/credit-card-purchases/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creditCardId,
        purchaseDate: iso,
        totalAmountCents: installment ? 0 : totalCents,
        installmentAmountCents: installment && parcelCents > 0 ? parcelCents : undefined,
        isInstallmentPurchase: installment,
        totalInstallments: n,
        currentInstallment: cur,
      }),
    });
    if (!r.ok) {
      toast.error("Falha no preview");
      return;
    }
    const j = (await r.json()) as { preview: PreviewRow[] };
    setPreview(j.preview);
  }

  async function runEstimate() {
    const base = getApiBase();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const instNum = installment ? parseInt(currentInst, 10) || 1 : 1;
    const r = await fetch(`${base}/credit-cards/estimate-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditCardId, purchaseDate: iso, installmentNumber: instNum }),
    });
    if (!r.ok) {
      toast.error("Falha no ciclo");
      return;
    }
    const j = (await r.json()) as {
      referenceMonth: string;
      closingDate: string;
      dueDate: string;
      installmentNumber: number;
    };
    setCycle(
      `${formatStatementRefDisplay(j.referenceMonth)} | Fecha ${formatDateDdMmYyyy(j.closingDate)} | Vence ${formatDateDdMmYyyy(j.dueDate)}`,
    );
    toast.success(`Parcela ${j.installmentNumber}: vence ${formatDateDdMmYyyy(j.dueDate)}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const iso = new Date(`${purchaseDate}T12:00:00.000Z`).toISOString();
    const base = getApiBase();
    const n = parseInt(totalInst, 10);
    const cur = parseInt(currentInst, 10);
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
      totalInstallments: n,
      currentInstallment: cur,
    };

    if (editingId) {
      const r = await fetch(`${base}/credit-card-purchases/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        try {
          const j = (await r.json()) as { message?: string };
          toast.error(j.message ?? "Erro ao atualizar compra");
        } catch {
          toast.error("Erro ao atualizar compra");
        }
        return;
      }
      toast.success("Compra atualizada");
      resetNewPurchaseForm();
      void loadPurchases();
      return;
    }

    const r = await fetch(`${base}/credit-card-purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditCardId, ...body }),
    });
    if (!r.ok) {
      toast.error("Erro ao registrar compra");
      return;
    }
    toast.success("Compra registrada");
    setDescription("");
    setTotal("");
    setParcelValue("");
    setPreview([]);
    setCycle(null);
    setInstallment(false);
    setTotalInst("12");
    setCurrentInst("1");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setCreditCardId(cards[0]?.id ?? "");
    setCategoryId(cats[0]?.id ?? "");
    void loadPurchases();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Compras no cartão</h1>
        <p className="text-sm text-zinc-500">Preview de faturas e parcelas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar compra" : "Nova compra"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cartão</Label>
                <Select value={creditCardId} onValueChange={setCreditCardId} disabled={!!editingId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingId && (
                  <p className="text-xs text-zinc-500">O cartão não pode ser alterado na edição.</p>
                )}
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              {installment ? (
                <div className="space-y-2">
                  <Label>Valor da parcela R$</Label>
                  <Input
                    value={parcelValue}
                    onChange={(e) => setParcelValue(e.target.value)}
                    required
                    inputMode="decimal"
                  />
                  {computedInstallmentTotalCents != null && (
                    <p className="text-xs text-zinc-600">
                      Total da compra:{" "}
                      <span className="font-medium">{formatBRLFromCents(computedInstallmentTotalCents)}</span>{" "}
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
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="inst"
                  type="checkbox"
                  checked={installment}
                  onChange={(e) => setInstallment(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                <Label htmlFor="inst">Parcelada</Label>
              </div>
              {installment && (
                <>
                  <div className="space-y-2">
                    <Label>Total parcelas</Label>
                    <Input value={totalInst} onChange={(e) => setTotalInst(e.target.value)} type="number" min={1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcela atual</Label>
                    <Input value={currentInst} onChange={(e) => setCurrentInst(e.target.value)} type="number" min={1} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void runEstimate()}>
                Em qual fatura cai?
              </Button>
              <Button type="button" variant="outline" onClick={() => void runPreview()}>
                Preview parcelas
              </Button>
              <Button type="submit">{editingId ? "Salvar alterações" : "Registrar"}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
          {cycle && <p className="mt-4 text-sm text-zinc-600">Fatura (ref. / fechamento / vencimento): {cycle}</p>}
          {preview.length > 0 && (
            <ul className="mt-4 list-inside list-disc text-sm space-y-1">
              {preview.map((p) => (
                <li key={`${p.installmentNumber}-${p.referenceMonth}`}>
                  Parc. {p.installmentNumber}: vence{" "}
                  <span className="font-medium">
                    {p.dueDate ? formatDateDdMmYyyy(p.dueDate) : formatStatementRefDisplay(p.referenceMonth)}
                  </span>{" "}
                  — {formatBRLFromCents(p.amountCents)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compras deste cartão</CardTitle>
        </CardHeader>
        <CardContent>
          {!creditCardId ? (
            <p className="text-sm text-zinc-500">Selecione um cartão acima.</p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma compra neste cartão.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateDdMmYyyy(p.purchaseDate)}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell>{cats.find((c) => c.id === p.categoryId)?.name ?? "—"}</TableCell>
                    <TableCell>{formatBRLFromCents(p.totalAmountCents)}</TableCell>
                    <TableCell>
                      {p.isInstallmentPurchase
                        ? `${p.currentInstallment}/${p.totalInstallments}`
                        : "À vista"}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" onClick={() => void beginEdit(p.id)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
