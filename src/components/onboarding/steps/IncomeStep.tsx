"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function currentCompetencyMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseBRL(value: string): number | null {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100);
}

interface IncomeStepProps {
  onNext: () => void;
}

export function IncomeStep({ onNext }: IncomeStepProps) {
  const [value, setValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSave() {
    const salaryCents = parseBRL(value);
    if (salaryCents === null || salaryCents <= 0) {
      toast.error("Informe um valor válido para o salário.");
      return;
    }

    setIsLoading(true);
    try {
      await apiSend(`/budget/month/${currentCompetencyMonth()}`, "PUT", { salaryCents });
      onNext();
    } catch {
      toast.error("Erro ao salvar renda. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Qual é a sua renda mensal?</h2>
        <p className="text-sm text-muted-foreground">
          Informe seu salário líquido para que o dashboard possa calcular seu
          saldo e planejamento mensal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Salário líquido (R$)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id="salary"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="pl-9"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Mês atual: {currentCompetencyMonth()}
        </p>
      </div>

      <Button onClick={() => void handleSave()} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar e continuar"
        )}
      </Button>
    </div>
  );
}
