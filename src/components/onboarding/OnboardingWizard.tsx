"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { apiGet, apiSend } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";

import { WelcomeStep } from "./steps/WelcomeStep";
import { CategoriesStep } from "./steps/CategoriesStep";
import { IncomeStep } from "./steps/IncomeStep";
import { FixedExpensesStep } from "./steps/FixedExpensesStep";
import { CreditCardStep } from "./steps/CreditCardStep";
import { CompletedStep } from "./steps/CompletedStep";

// ONBOARDING STEPS — para adicionar uma nova etapa quando uma nova funcionalidade for criada:
// 1. Crie o componente em src/components/onboarding/steps/NovaFuncionalidadeStep.tsx
// 2. Adicione uma entrada no array STEPS abaixo com optional: true se for etapa pulável
// 3. O total de etapas e a barra de progresso se ajustam automaticamente
const STEPS = [
  { id: "welcome",        optional: false },
  { id: "categories",     optional: false },
  { id: "income",         optional: true  },
  { id: "fixed-expenses", optional: true  },
  { id: "credit-card",    optional: true  },
  { id: "completed",      optional: false },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface OnboardingWizardProps {
  userName: string;
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isLoadingStep, setIsLoadingStep] = React.useState(true);
  const [isFinishing, setIsFinishing] = React.useState(false);

  // Retoma do passo salvo no backend
  React.useEffect(() => {
    apiGet<{ step: number; completedAt: string | null }>("/onboarding")
      .then(({ step }) => {
        const clamped = Math.min(step, STEPS.length - 1);
        setCurrentStepIndex(clamped);
      })
      .catch(() => {
        // em caso de erro, começa do início
      })
      .finally(() => setIsLoadingStep(false));
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const isOptional = currentStep.optional;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const progressValue = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  async function advance() {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= STEPS.length) return;

    try {
      await apiSend("/onboarding/step", "PUT", { step: nextIndex });
    } catch {
      // falha silenciosa — não bloqueia o avanço
    }
    setCurrentStepIndex(nextIndex);
  }

  async function handleFinish() {
    setIsFinishing(true);
    try {
      await apiSend("/onboarding/complete", "POST");
      router.push("/home");
    } catch {
      toast.error("Erro ao finalizar onboarding. Tente novamente.");
      setIsFinishing(false);
    }
  }

  function renderStep(stepId: StepId) {
    switch (stepId) {
      case "welcome":
        return <WelcomeStep userName={userName} onNext={() => void advance()} />;
      case "categories":
        return <CategoriesStep onNext={() => void advance()} />;
      case "income":
        return <IncomeStep onNext={() => void advance()} />;
      case "fixed-expenses":
        return <FixedExpensesStep onNext={() => void advance()} />;
      case "credit-card":
        return <CreditCardStep onNext={() => void advance()} />;
      case "completed":
        return <CompletedStep onFinish={() => void handleFinish()} isLoading={isFinishing} />;
    }
  }

  if (isLoadingStep) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-sm">Prisma | Finanças</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Etapa {currentStepIndex + 1} de {STEPS.length}
        </span>
      </header>

      {/* Progress */}
      <Progress value={progressValue} className="h-1 rounded-none" />

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">
          {/* Skip button for optional steps */}
          {isOptional && !isLastStep && (
            <div className="mb-6 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => void advance()}
              >
                Pular etapa →
              </Button>
            </div>
          )}

          {renderStep(currentStep.id)}
        </div>
      </main>
    </div>
  );
}
