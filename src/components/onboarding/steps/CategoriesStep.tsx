"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { apiSend } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CategoryPreset {
  name: string;
  type: "expense" | "income";
  emoji: string;
}

const EXPENSE_PRESETS: CategoryPreset[] = [
  { name: "Alimentação", type: "expense", emoji: "🍽️" },
  { name: "Moradia", type: "expense", emoji: "🏠" },
  { name: "Transporte", type: "expense", emoji: "🚗" },
  { name: "Saúde", type: "expense", emoji: "💊" },
  { name: "Lazer", type: "expense", emoji: "🎮" },
  { name: "Educação", type: "expense", emoji: "📚" },
  { name: "Assinaturas", type: "expense", emoji: "📱" },
  { name: "Roupas", type: "expense", emoji: "👕" },
];

const INCOME_PRESETS: CategoryPreset[] = [
  { name: "Salário", type: "income", emoji: "💼" },
  { name: "Freelance", type: "income", emoji: "💻" },
  { name: "Investimentos", type: "income", emoji: "📈" },
];

interface CategoriesStepProps {
  onNext: () => void;
}

export function CategoriesStep({ onNext }: CategoriesStepProps) {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(["Alimentação", "Moradia", "Transporte", "Salário"]),
  );
  const [isLoading, setIsLoading] = React.useState(false);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleNext() {
    const allPresets = [...EXPENSE_PRESETS, ...INCOME_PRESETS];
    const toCreate = allPresets.filter((preset) => selected.has(preset.name));

    if (toCreate.length === 0) {
      onNext();
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        toCreate.map((preset) =>
          apiSend("/categories", "POST", {
            name: preset.name,
            type: preset.type,
          }),
        ),
      );
      onNext();
    } catch {
      toast.error("Erro ao criar categorias. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Escolha suas categorias</h2>
        <p className="text-sm text-muted-foreground">
          Selecione as categorias que melhor representam seu perfil financeiro.
          Você poderá criar mais depois.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Despesas
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXPENSE_PRESETS.map((preset) => (
            <CategoryChip
              key={preset.name}
              preset={preset}
              isSelected={selected.has(preset.name)}
              onToggle={() => toggle(preset.name)}
            />
          ))}
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Receitas
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INCOME_PRESETS.map((preset) => (
            <CategoryChip
              key={preset.name}
              preset={preset}
              isSelected={selected.has(preset.name)}
              onToggle={() => toggle(preset.name)}
            />
          ))}
        </div>
      </div>

      <Button onClick={handleNext} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando categorias...
          </>
        ) : (
          `Continuar com ${selected.size} categoria${selected.size !== 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
}

function CategoryChip({
  preset,
  isSelected,
  onToggle,
}: {
  preset: CategoryPreset;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        isSelected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      <span className="text-base">{preset.emoji}</span>
      <span className="truncate">{preset.name}</span>
    </button>
  );
}
