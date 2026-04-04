"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { MoneyValue } from "@/components/shared/money-value";
import { CreditCardFace } from "@/components/credit-cards/credit-card-face";
import {
  CARD_NETWORK_LABELS,
  CARD_NETWORK_VALUES,
  CARD_THEME_PRESETS,
  type CardNetworkValue,
} from "@/lib/credit-card-display";

type CardRow = {
  id: string;
  name: string;
  brand: string | null;
  themeColor: string | null;
  closingDay: number;
  dueDay: number;
  limitCents: number | null;
};

type Overview = {
  creditCardId: string;
  name: string;
  brand: string | null;
  themeColor: string | null;
  limitCents: number | null;
  usedCents: number;
  utilizationPercent: number | null;
  nextStatementCents: number | null;
};

function networkLabel(brand: string | null) {
  if (!brand) return "—";
  const key = brand as CardNetworkValue;
  return CARD_NETWORK_LABELS[key] ?? brand;
}

export default function CreditCardsPage() {
  const router = useRouter();
  const [list, setList] = useState<CardRow[]>([]);
  const [overview, setOverview] = useState<Overview[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("17");
  const [limit, setLimit] = useState("");
  const [brand, setBrand] = useState<string>("none");
  const [themeColor, setThemeColor] = useState<string>("auto");

  async function refresh() {
    const base = getApiBase();
    const [cardsListResponse, overviewResponse] = await Promise.all([
      fetch(`${base}/credit-cards`),
      fetch(`${base}/dashboard/credit-cards-overview`),
    ]);
    if (cardsListResponse.ok) setList((await cardsListResponse.json()) as CardRow[]);
    if (overviewResponse.ok) setOverview((await overviewResponse.json()) as Overview[]);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [cardsListResponse, overviewResponse] = await Promise.all([
        fetch(`${base}/credit-cards`),
        fetch(`${base}/dashboard/credit-cards-overview`),
      ]);
      if (cancelled) return;
      if (cardsListResponse.ok) setList((await cardsListResponse.json()) as CardRow[]);
      if (overviewResponse.ok) setOverview((await overviewResponse.json()) as Overview[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetDialog() {
    setName("");
    setClosingDay("10");
    setDueDay("17");
    setLimit("");
    setBrand("none");
    setThemeColor("auto");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const limitCents = limit.trim() === "" ? null : Math.round(parseFloat(limit.replace(",", ".")) * 100);
    const base = getApiBase();
    const body: Record<string, unknown> = {
      name,
      closingDay: parseInt(closingDay, 10),
      dueDay: parseInt(dueDay, 10),
      limitCents: limitCents !== null && Number.isFinite(limitCents) ? limitCents : null,
      brand: brand === "none" ? null : brand,
      themeColor: themeColor.trim() === "" || themeColor === "auto" ? null : themeColor.trim(),
    };
    if (body.themeColor && typeof body.themeColor === "string" && !/^#[0-9A-Fa-f]{6}$/.test(body.themeColor)) {
      toast.error("Cor inválida: use #RRGGBB ou escolha um padrão");
      return;
    }
    const response = await fetch(`${base}/credit-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      toast.error("Erro ao salvar");
      return;
    }
    resetDialog();
    toast.success("Cartão criado");
    setDialogOpen(false);
    void refresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Cartões de crédito" subtitle="Limite, ciclo de fatura e uso consolidado">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button>Novo cartão</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar cartão</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 pt-2" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <CreditCardFace
                  variant="compact"
                  name={name || "Nome do cartão"}
                  brand={brand === "none" ? null : brand}
                  themeColor={themeColor === "auto" ? null : themeColor}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Nubank Roxinho" />
              </div>
              <div className="space-y-2">
                <Label>Bandeira</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-2">
                <Label>Cor do cartão</Label>
                <div className="flex flex-wrap gap-2">
                  {CARD_THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.label}
                      className="h-9 w-9 rounded-full border-2 border-border shadow-sm ring-offset-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{ backgroundColor: preset.hex, ...(themeColor === preset.hex ? { boxShadow: "0 0 0 2px var(--ring)" } : {}) }}
                      onClick={() => setThemeColor(preset.hex)}
                    />
                  ))}
                  <button
                    type="button"
                    title="Automático"
                    className={`flex h-9 min-w-[4.5rem] items-center justify-center rounded-full border-2 border-dashed px-2 text-xs font-medium ${themeColor === "auto" ? "border-primary bg-primary/10" : "border-border"}`}
                    onClick={() => setThemeColor("auto")}
                  >
                    Auto
                  </button>
                </div>
                {themeColor === "auto" ? (
                  <p className="text-xs text-muted-foreground">
                    Escolha um padrão ou clique em “Cor própria” para abrir o seletor (evita conflito com “Auto” no navegador).
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded-md border p-1"
                      value={/^#[0-9A-Fa-f]{6}$/.test(themeColor) ? themeColor : CARD_THEME_PRESETS[0]!.hex}
                      onChange={(e) => setThemeColor(e.target.value)}
                      aria-label="Escolher cor personalizada"
                    />
                    <Input
                      className="max-w-[7.5rem] font-mono text-sm"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#RRGGBB"
                      maxLength={7}
                    />
                  </div>
                )}
                {themeColor === "auto" ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setThemeColor(CARD_THEME_PRESETS[0]!.hex)}
                  >
                    Usar cor própria
                  </button>
                ) : null}
                <p className="text-xs text-muted-foreground">“Auto” usa o estilo padrão do app na listagem.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fechamento (dia)</Label>
                  <Input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento (dia)</Label>
                  <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite R$ (opcional)</Label>
                <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="5000" />
              </div>
              <Button type="submit">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="cadastro">Dados cadastrais</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo" className="space-y-3 outline-none">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Visão por cartão</h2>
          {overview.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre um cartão para ver uso e limite.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {overview.map((cardOverview) => (
                <Link
                  key={cardOverview.creditCardId}
                  href={`/credit-cards/${cardOverview.creditCardId}`}
                  className="block max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="mx-auto w-fit max-w-full">
                    <CreditCardFace
                      variant="compact"
                      name={cardOverview.name}
                      brand={cardOverview.brand}
                      themeColor={cardOverview.themeColor}
                      className="rounded-none rounded-t-2xl"
                    />
                  </div>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    {cardOverview.limitCents != null &&
                    cardOverview.limitCents > 0 &&
                    cardOverview.utilizationPercent != null ? (
                      <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-3">
                        <div className="flex justify-between gap-3 text-sm text-muted-foreground">
                          <span>Uso do limite</span>
                          <span className="tabular-nums font-semibold text-foreground">
                            {cardOverview.utilizationPercent.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={Math.min(cardOverview.utilizationPercent, 100)} className="h-2" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Em aberto:{" "}
                          <MoneyValue cents={cardOverview.usedCents} className="text-sm font-semibold text-foreground" />
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/80 bg-muted/30 px-3 py-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Pendências:{" "}
                          <MoneyValue cents={cardOverview.usedCents} className="font-semibold text-foreground" />
                        </p>
                      </div>
                    )}
                    {cardOverview.nextStatementCents != null && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Próxima fatura (pendente):{" "}
                        <MoneyValue cents={cardOverview.nextStatementCents} className="text-sm font-medium text-foreground" />
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Limite{" "}
                      {cardOverview.limitCents != null ? formatBRLFromCents(cardOverview.limitCents) : "não informado"}
                    </p>
                  </CardContent>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="cadastro" className="outline-none">
          <SectionCard title="Dados cadastrais" description="Fechamento, vencimento, bandeira e cor">
            <DataTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Bandeira</TableHead>
                    <TableHead>Fech.</TableHead>
                    <TableHead>Venc.</TableHead>
                    <TableHead className="text-right">Limite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((card) => (
                    <TableRow
                      key={card.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/credit-cards/${card.id}`)}
                    >
                      <TableCell className="font-medium">{card.name}</TableCell>
                      <TableCell>
                        {card.themeColor && /^#[0-9A-Fa-f]{6}$/.test(card.themeColor) ? (
                          <span
                            className="inline-block h-6 w-6 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: card.themeColor }}
                            title={card.themeColor}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{networkLabel(card.brand)}</TableCell>
                      <TableCell>{card.closingDay}</TableCell>
                      <TableCell>{card.dueDay}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {card.limitCents != null ? formatBRLFromCents(card.limitCents) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTable>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
