import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Explica a diferença entre visão por pagamento (competência da fatura) e por ocorrência (data da compra).
 * Usar em todas as telas que oferecem o alternador Pagamento / Ocorrência.
 */
export function CompetencyViewTip({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/20 bg-accent/50 shadow-sm ring-1 ring-primary/5 dark:border-primary/25 dark:bg-accent/35 dark:ring-primary/10",
        className,
      )}
      role="note"
      aria-label="Dica: diferença entre Pagamento e Ocorrência"
    >
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
          aria-hidden
        >
          <Lightbulb className="h-5 w-5 stroke-[1.75]" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-foreground">
            Como ler os dados
          </p>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="border-l-2 border-primary/25 pl-3 dark:border-primary/35">
              <span className="font-semibold text-foreground">Pagamento</span>
              <p className="mt-1">
                Valores no <strong className="font-semibold text-foreground">mês em que entram na fatura</strong>{" "}
                (competência da parcela ou do cartão).
              </p>
            </li>
            <li className="border-l-2 border-primary/25 pl-3 dark:border-primary/35">
              <span className="font-semibold text-foreground">Ocorrência</span>
              <p className="mt-1">
                Valores no <strong className="font-semibold text-foreground">mês em que a compra ou o gasto aconteceu</strong>
                , pelo calendário.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
