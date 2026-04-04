"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getApiBase } from "@/lib/api";
import { CreditCardFace } from "@/components/credit-cards/credit-card-face";
import {
  CARD_NETWORK_LABELS,
  CARD_NETWORK_VALUES,
  CARD_THEME_PRESETS,
  brandToSelectValue,
} from "@/lib/credit-card-display";

type CardDetail = {
  id: string;
  name: string;
  brand: string | null;
  themeColor: string | null;
  limitCents: number | null;
  closingDay: number;
  dueDay: number;
};

export default function CreditCardPersonalizarPage() {
  const params = useParams();
  const id = String(params.id);
  const [card, setCard] = useState<CardDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editClosing, setEditClosing] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editBrand, setEditBrand] = useState("none");
  const [editTheme, setEditTheme] = useState<string>("auto");
  const [savingCard, setSavingCard] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      setLoading(true);
      const response = await fetch(`${base}/credit-cards/${id}`);
      if (cancelled) return;
      if (!response.ok) {
        setErr("Cartão não encontrado");
        setCard(null);
        setLoading(false);
        return;
      }
      const loaded = (await response.json()) as CardDetail;
      setCard(loaded);
      setEditName(loaded.name);
      setEditClosing(String(loaded.closingDay));
      setEditDue(String(loaded.dueDay));
      setEditLimit(loaded.limitCents != null ? (loaded.limitCents / 100).toFixed(2).replace(".", ",") : "");
      setEditBrand(brandToSelectValue(loaded.brand));
      setEditTheme(
        loaded.themeColor && /^#[0-9A-Fa-f]{6}$/.test(loaded.themeColor) ? loaded.themeColor : "auto",
      );
      setErr(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveCardEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!card) return;
    const limitCents =
      editLimit.trim() === "" ? null : Math.round(parseFloat(editLimit.replace(",", ".")) * 100);
    const themePayload =
      editTheme === "auto" || editTheme.trim() === "" ? null : editTheme.trim();
    if (themePayload && !/^#[0-9A-Fa-f]{6}$/.test(themePayload)) {
      toast.error("Cor inválida: use #RRGGBB");
      return;
    }
    setSavingCard(true);
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/credit-cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          closingDay: parseInt(editClosing, 10),
          dueDay: parseInt(editDue, 10),
          limitCents: limitCents !== null && Number.isFinite(limitCents) ? limitCents : null,
          brand: editBrand === "none" ? null : editBrand,
          themeColor: themePayload,
        }),
      });
      if (!response.ok) {
        toast.error("Erro ao atualizar cartão");
        return;
      }
      const updated = (await response.json()) as CardDetail;
      setCard(updated);
      setEditName(updated.name);
      setEditClosing(String(updated.closingDay));
      setEditDue(String(updated.dueDay));
      setEditLimit(updated.limitCents != null ? (updated.limitCents / 100).toFixed(2).replace(".", ",") : "");
      setEditBrand(brandToSelectValue(updated.brand));
      setEditTheme(
        updated.themeColor && /^#[0-9A-Fa-f]{6}$/.test(updated.themeColor) ? updated.themeColor : "auto",
      );
      toast.success("Cartão atualizado");
    } finally {
      setSavingCard(false);
    }
  }

  const presetHex = CARD_THEME_PRESETS[0]!.hex;
  const colorInputValue =
    editTheme !== "auto" && /^#[0-9A-Fa-f]{6}$/.test(editTheme) ? editTheme : presetHex;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (err || !card) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/credit-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cartões
          </Link>
        </Button>
        <p className="text-sm text-destructive">{err ?? "Erro"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/credit-cards/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao cartão
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Personalizar cartão"
        subtitle={`Aparência e dados de “${card.name}” — usados na listagem e nas faturas.`}
      />

      <SectionCard title="Pré-visualização e dados" description="Cor, bandeira, nome, ciclo e limite">
        <form className="space-y-5" onSubmit={saveCardEdits}>
          <CreditCardFace
            name={editName || card.name}
            brand={editBrand === "none" ? null : editBrand}
            themeColor={editTheme === "auto" ? null : editTheme}
            className="max-w-sm"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pc-name">Nome</Label>
              <Input id="pc-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bandeira</Label>
              <Select value={editBrand} onValueChange={setEditBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informar</SelectItem>
                  {CARD_NETWORK_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {CARD_NETWORK_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Cor do cartão</Label>
              <div className="flex flex-wrap gap-2">
                {CARD_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    className="h-9 w-9 rounded-full border-2 border-border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      backgroundColor: preset.hex,
                      ...(editTheme === preset.hex ? { boxShadow: "0 0 0 2px var(--ring)" } : {}),
                    }}
                    onClick={() => setEditTheme(preset.hex)}
                  />
                ))}
                <button
                  type="button"
                  className={`flex h-9 min-w-[4.5rem] items-center justify-center rounded-full border-2 border-dashed px-2 text-xs font-medium ${editTheme === "auto" ? "border-primary bg-primary/10" : "border-border"}`}
                  onClick={() => setEditTheme("auto")}
                >
                  Auto
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editTheme !== "auto" ? (
                  <Input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-md border p-1"
                    value={colorInputValue}
                    onChange={(e) => setEditTheme(e.target.value)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Escolha um padrão ou uma cor para habilitar o seletor nativo.
                  </p>
                )}
                <Input
                  className="max-w-[7.5rem] font-mono text-sm"
                  value={editTheme === "auto" ? "" : editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  placeholder="#RRGGBB"
                  disabled={editTheme === "auto"}
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-close">Fechamento (dia)</Label>
              <Input
                id="pc-close"
                type="number"
                min={1}
                max={31}
                value={editClosing}
                onChange={(e) => setEditClosing(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-due">Vencimento (dia)</Label>
              <Input id="pc-due" type="number" min={1} max={31} value={editDue} onChange={(e) => setEditDue(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pc-limit">Limite R$ (opcional)</Label>
              <Input id="pc-limit" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <Button type="submit" disabled={savingCard}>
            {savingCard ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
