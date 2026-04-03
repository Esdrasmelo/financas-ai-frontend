"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getApiBase } from "@/lib/api";
import { formatBRLFromCents } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { DataTable } from "@/components/shared/data-table";
import { MoneyValue } from "@/components/shared/money-value";

type CardRow = {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limitCents: number | null;
};

type Overview = {
  creditCardId: string;
  name: string;
  limitCents: number | null;
  usedCents: number;
  utilizationPercent: number | null;
  nextStatementCents: number | null;
};

export default function CreditCardsPage() {
  const [list, setList] = useState<CardRow[]>([]);
  const [overview, setOverview] = useState<Overview[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("17");
  const [limit, setLimit] = useState("");

  async function refresh() {
    const base = getApiBase();
    const [r1, r2] = await Promise.all([
      fetch(`${base}/credit-cards`),
      fetch(`${base}/dashboard/credit-cards-overview`),
    ]);
    if (r1.ok) setList((await r1.json()) as CardRow[]);
    if (r2.ok) setOverview((await r2.json()) as Overview[]);
  }

  useEffect(() => {
    let cancelled = false;
    const base = getApiBase();
    void (async () => {
      const [r1, r2] = await Promise.all([
        fetch(`${base}/credit-cards`),
        fetch(`${base}/dashboard/credit-cards-overview`),
      ]);
      if (cancelled) return;
      if (r1.ok) setList((await r1.json()) as CardRow[]);
      if (r2.ok) setOverview((await r2.json()) as Overview[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const limitCents = limit.trim() === "" ? null : Math.round(parseFloat(limit.replace(",", ".")) * 100);
    const base = getApiBase();
    const r = await fetch(`${base}/credit-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        closingDay: parseInt(closingDay, 10),
        dueDay: parseInt(dueDay, 10),
        limitCents: limitCents !== null && Number.isFinite(limitCents) ? limitCents : null,
        brand: null,
      }),
    });
    if (!r.ok) {
      toast.error("Erro ao salvar");
      return;
    }
    setName("");
    setLimit("");
    toast.success("Cartão criado");
    setDialogOpen(false);
    void refresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Cartões de crédito" subtitle="Limite, ciclo de fatura e uso consolidado">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Novo cartão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar cartão</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 pt-2" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Visão por cartão</h2>
        {overview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cadastre um cartão para ver uso e limite.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
            {overview.map((c) => (
              <Card key={c.creditCardId}>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CreditCard className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-lg font-semibold leading-snug text-foreground">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Limite {c.limitCents != null ? formatBRLFromCents(c.limitCents) : "não informado"}
                      </p>
                    </div>
                  </div>
                  {c.limitCents != null && c.limitCents > 0 && c.utilizationPercent != null ? (
                    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-4">
                      <div className="flex justify-between gap-3 text-sm text-muted-foreground">
                        <span>Uso do limite</span>
                        <span className="tabular-nums font-semibold text-foreground">{c.utilizationPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={c.utilizationPercent} className="h-2.5" />
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Em aberto: <MoneyValue cents={c.usedCents} className="text-sm font-semibold text-foreground" />
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Pendências: <MoneyValue cents={c.usedCents} className="font-semibold text-foreground" />
                      </p>
                    </div>
                  )}
                  {c.nextStatementCents != null && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Próxima fatura (pendente):{" "}
                      <MoneyValue cents={c.nextStatementCents} className="text-sm font-medium text-foreground" />
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <SectionCard title="Dados cadastrais" description="Fechamento e vencimento para conferência">
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Fech.</TableHead>
                <TableHead>Venc.</TableHead>
                <TableHead className="text-right">Limite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.closingDay}</TableCell>
                  <TableCell>{c.dueDay}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.limitCents != null ? formatBRLFromCents(c.limitCents) : "—"}
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
