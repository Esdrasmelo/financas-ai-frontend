"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CARD_NETWORK_VALUES, CARD_NETWORK_LABELS, CARD_THEME_PRESETS } from "@/lib/credit-card-display";
import { cn } from "@/lib/utils";

interface CreditCardStepProps {
  onNext: () => void;
}

export function CreditCardStep({ onNext }: CreditCardStepProps) {
  const [cardName, setCardName] = React.useState("");
  const [brand, setBrand] = React.useState<string>("visa");
  const [closingDay, setClosingDay] = React.useState("");
  const [dueDay, setDueDay] = React.useState("");
  const [themeColor, setThemeColor] = React.useState(CARD_THEME_PRESETS[0].hex);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    if (!cardName.trim()) {
      toast.error("Informe o nome do cartão.");
      return;
    }
    const closingDayNum = parseInt(closingDay, 10);
    const dueDayNum = parseInt(dueDay, 10);

    if (isNaN(closingDayNum) || closingDayNum < 1 || closingDayNum > 31) {
      toast.error("Informe um dia de fechamento válido (1-31).");
      return;
    }
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      toast.error("Informe um dia de vencimento válido (1-31).");
      return;
    }

    setIsSaving(true);
    try {
      await apiSend("/credit-cards", "POST", {
        name: cardName.trim(),
        brand,
        closingDay: closingDayNum,
        dueDay: dueDayNum,
        themeColor,
      });
      onNext();
    } catch {
      toast.error("Erro ao salvar cartão. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Adicione um cartão de crédito</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre seus cartões para acompanhar faturas, parcelamentos e limites
          disponíveis. Você pode adicionar mais depois.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-name">Nome do cartão</Label>
          <Input
            id="card-name"
            placeholder="Ex: Nubank, Itaú Platinum..."
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-brand">Bandeira</Label>
          <select
            id="card-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="flex h-10 w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {CARD_NETWORK_VALUES.map((value) => (
              <option key={value} value={value}>
                {CARD_NETWORK_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="card-closing">Dia de fechamento</Label>
            <Input
              id="card-closing"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              placeholder="Ex: 25"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-due">Dia de vencimento</Label>
            <Input
              id="card-due"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              placeholder="Ex: 5"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor do cartão</Label>
          <div className="flex flex-wrap gap-2">
            {CARD_THEME_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                title={preset.label}
                onClick={() => setThemeColor(preset.hex)}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  themeColor === preset.hex && "ring-2 ring-primary ring-offset-2 scale-110",
                )}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      <Button onClick={() => void handleSave()} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Adicionar cartão e continuar"
        )}
      </Button>
    </div>
  );
}
