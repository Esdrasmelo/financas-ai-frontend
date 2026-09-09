"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface CompletedStepProps {
  onFinish: () => void;
  isLoading: boolean;
}

export function CompletedStep({ onFinish, isLoading }: CompletedStepProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Tudo pronto!</h2>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Sua conta está configurada. Agora você pode explorar o dashboard,
          registrar lançamentos, acompanhar seus cartões e muito mais.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
        {[
          { emoji: "📊", title: "Dashboard", desc: "Visão geral das suas finanças" },
          { emoji: "📝", title: "Lançamentos", desc: "Registre despesas e receitas" },
          { emoji: "💳", title: "Cartões", desc: "Faturas e parcelamentos" },
          { emoji: "🤖", title: "Assistente IA", desc: "Pergunte sobre seus gastos" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full max-w-sm"
        onClick={onFinish}
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar no app →"}
      </Button>
    </div>
  );
}
