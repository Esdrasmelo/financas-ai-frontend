"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {firstName}!
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Vamos configurar sua conta em poucos passos. Você poderá adicionar categorias,
          definir sua renda mensal e muito mais.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {[
          { emoji: "📊", label: "Dashboard com KPIs" },
          { emoji: "💳", label: "Cartões de crédito" },
          { emoji: "🤖", label: "Assistente IA" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <Button size="lg" className="w-full max-w-sm" onClick={onNext}>
        Começar configuração
      </Button>
    </div>
  );
}
