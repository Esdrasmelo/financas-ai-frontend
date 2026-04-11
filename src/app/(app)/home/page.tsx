"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  CalendarClock,
  Layers,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { getApiBase, authFetch } from "@/lib/api";
import { formatBRLFromCents, currentCompetencyMonth } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatementStatusBadge, type StatementStatus } from "@/components/shared/status-badge";
import { AiChat } from "@/components/ai/ai-chat";

type Kpis = {
  totalSpentCents: number;
  previousMonthTotalCents: number;
  monthOverMonthDiffCents: number;
  monthOverMonthDiffPercent: number | null;
  openStatementsPendingCents: number;
  futureInstallmentsCents: number;
};

type Entry = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  sourceType: string;
  paymentMethod: string;
};

type UpcomingStatement = {
  statementId: string;
  creditCardName: string;
  referenceMonth: string;
  dueDate: string;
  status: string;
  totalPendingCents: number;
};

export default function HomePage() {
  const { user } = useAuth();
  const month = currentCompetencyMonth();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [statements, setStatements] = useState<UpcomingStatement[]>([]);

  useEffect(() => {
    const base = getApiBase();
    authFetch(`${base}/dashboard/kpis?competencyMonth=${month}`)
      .then(async (r) => { if (r.ok) setKpis(await r.json() as Kpis); })
      .catch(() => {});
    authFetch(`${base}/entries?competencyMonth=${month}`)
      .then(async (r) => { if (r.ok) setEntries(await r.json() as Entry[]); })
      .catch(() => {});
    authFetch(`${base}/dashboard/upcoming-statements?limit=4`)
      .then(async (r) => { if (r.ok) setStatements(await r.json() as UpcomingStatement[]); })
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
        <p className="mt-1 text-sm text-muted-foreground">
          Resumo de {formatMonth(month)}
        </p>
      </div>

      {/* KPIs */}
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
              <p className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${diffUp ? "text-destructive" : "text-emerald-600"}`}>
                {diffUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {diffUp ? "+" : ""}{diffPercent}% vs anterior
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Faturas em aberto</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {kpis ? formatBRLFromCents(kpis.openStatementsPendingCents) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <CalendarClock className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Parcelas futuras</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {kpis ? formatBRLFromCents(kpis.futureInstallmentsCents) : "—"}
            </p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos lançamentos */}
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

        {/* Próximos vencimentos */}
        <SectionCard
          title="Próximos vencimentos"
          description="Faturas por vencer"
          action={
            <Link href="/statements" className="text-xs font-medium text-primary hover:underline">
              Ver todas
            </Link>
          }
          contentClassName="pt-0"
        >
          {statements.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nenhuma fatura"
              description="Nenhuma fatura pendente no momento."
            />
          ) : (
            <div className="divide-y divide-border">
              {statements.map((s) => (
                <Link
                  key={s.statementId}
                  href={`/statements/${s.statementId}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/30 first:pt-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.creditCardName}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence {formatDateDdMmYyyy(s.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatBRLFromCents(s.totalPendingCents)}
                    </p>
                    <StatementStatusBadge status={s.status as StatementStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Assistente IA */}
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
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${months[Number(m) - 1]} de ${y}`;
}
