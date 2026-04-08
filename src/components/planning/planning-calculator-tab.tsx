"use client";

import { SectionCard } from "@/components/shared/section-card";
import { PlanningCalculator, usePlanningCalculatorState } from "@/components/planning/planning-calculator";
import { PlanningCalculatorDataPanel } from "@/components/planning/planning-calculator-data-panel";

export function PlanningCalculatorTab() {
  const [model, dispatch] = usePlanningCalculatorState();

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <SectionCard
        title="Calculadora"
        description="Operações básicas com precisão decimal. A linha acima do visor mostra a operação em andamento e o resultado após =. AC limpa tudo; botões do painel ao lado somam ao visor."
        contentClassName="flex justify-center pt-2"
      >
        <PlanningCalculator model={model} dispatch={dispatch} />
      </SectionCard>
      <SectionCard
        title="Dados do app (opcional)"
        description="Contas fixas e totais de faturas. Cada ação soma o valor ao que já está no visor."
        contentClassName="space-y-0"
      >
        <PlanningCalculatorDataPanel onAddCents={(cents) => dispatch({ type: "addFromCents", cents })} />
      </SectionCard>
    </div>
  );
}
