"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, CreditCard, Layers } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getApiBase, authFetch } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AiChat } from "@/components/ai/ai-chat";

type Kpis = {
  totalSpentCents: number;
  entriesTotalCents: number;
  creditCardPortionCents: number;
  previousMonthTotalCents: number;
  monthOverMonthDiffCents: number;
  monthOverMonthDiffPercent: number | null;
};

type Entry = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  sourceType: string;
  paymentMethod: string;
};

export default function HomePage() {
  const { user } = useAuth();
  const month = currentCompetencyMonth();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const base = getApiBase();
    authFetch(`${base}/dashboard/kpis?competencyMonth=${month}`)
      .then(async (r) => {
        if (r.ok) setKpis((await r.json()) as Kpis);
      })
      .catch(() => {});
    authFetch(`${base}/entries?competencyMonth=${month}`)
      .then(async (r) => {
        if (r.ok) setEntries((await r.json()) as Entry[]);
      })
      .catch(() => {});
  }, [month]);

  const greeting = getGreeting();
  const firstName = user?.name.split(" ")[0] ?? "";
  const recentEntries = entries.slice(0, 8);
  const diffPercent = kpis?.monthOverMonthDiffPercent;
  const diffUp = (kpis?.monthOverMonthDiffCents ?? 0) > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumo de {formatMonth(month)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total gasto</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {kpis ? formatBRLFromCents(kpis.totalSpentCents) : "—"}
            </p>
            {diffPercent != null && (
              <p
                className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${diffUp ? "text-destructive" : "text-emerald-600"}`}
              >
                {diffUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {diffUp ? "+" : ""}
                {diffPercent}% vs anterior
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <Layers className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Valor total lançamentos</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {kpis ? formatBRLFromCents(kpis.entriesTotalCents) : "—"}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Fixos + variáveis no mês</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Faturas na competência</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {kpis ? formatBRLFromCents(kpis.creditCardPortionCents) : "—"}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Parte cartão (visão padrão)</p>
          </div>
        </div>

        <Link href="/dashboard" className="block">
          <div className="flex h-full items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Dashboard</p>
              <p className="mt-0.5 text-xs text-primary/70">Gráficos e detalhes</p>
            </div>
          </div>
        </Link>
      </div>

      <SectionCard
        title="Últimos lançamentos"
        description={`${formatMonth(month)}`}
        action={
          <Link href="/entries" className="text-xs font-medium text-primary hover:underline">
            Ver todos
          </Link>
        }
        contentClassName="pt-0"
      >
        {recentEntries.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Sem lançamentos"
            description="Nenhum lançamento registrado neste mês."
          />
        ) : (
          <div className="divide-y divide-border">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateDdMmYyyy(entry.date)}
                    <span className="mx-1.5">·</span>
                    {entry.sourceType === "variable" ? "Variável" : "Conta fixa"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                  {formatBRLFromCents(entry.amountCents)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <AiChat />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${months[Number(m) - 1]} de ${y}`;
}
