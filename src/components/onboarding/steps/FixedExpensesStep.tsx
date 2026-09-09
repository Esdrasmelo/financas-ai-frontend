"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiSend } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
}

function parseBRL(value: string): number | null {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100);
}

interface FixedExpensesStepProps {
  onNext: () => void;
}

export function FixedExpensesStep({ onNext }: FixedExpensesStepProps) {
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDay, setDueDay] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<Category[]>("/categories")
      .then((data) => {
        const expenseCategories = data.filter((c) => c.type === "expense");
        setCategories(expenseCategories);
        if (expenseCategories.length > 0) {
          setCategoryId(expenseCategories[0].id);
        }
      })
      .catch(() => toast.error("Erro ao carregar categorias."))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  async function handleSave() {
    const amountCents = parseBRL(amount);
    const dueDayNum = parseInt(dueDay, 10);

    if (!name.trim()) {
      toast.error("Informe o nome da despesa.");
      return;
    }
    if (amountCents === null || amountCents <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      toast.error("Informe um dia de vencimento válido (1-31).");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    setIsSaving(true);
    try {
      await apiSend("/fixed-expenses", "POST", {
        name: name.trim(),
        amountCents,
        dueDay: dueDayNum,
        categoryId,
      });
      onNext();
    } catch {
      toast.error("Erro ao salvar despesa fixa. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Adicione uma despesa fixa</h2>
        <p className="text-sm text-muted-foreground">
          Despesas fixas são cobranças recorrentes todo mês, como aluguel,
          internet ou academia. Você pode adicionar mais depois.
        </p>
      </div>

      {isLoadingCategories ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Nome da despesa</Label>
            <Input
              id="expense-name"
              placeholder="Ex: Aluguel, Internet, Academia..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Valor mensal (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="expense-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-9"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-due">Dia do vencimento</Label>
              <Input
                id="expense-due"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                placeholder="Ex: 10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoria</Label>
              <select
                id="expense-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={() => void handleSave()}
        disabled={isSaving || isLoadingCategories}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Adicionar despesa e continuar"
        )}
      </Button>
    </div>
  );
}
