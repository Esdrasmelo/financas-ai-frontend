"use client";

import { useReducer, type ComponentProps, type Dispatch } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  initialCalculatorModel,
  reduceCalculator,
  type CalculatorAction,
  type CalculatorModel,
} from "@/lib/calculator-engine";

function displayForLocale(model: CalculatorModel): string {
  if (model.error) return model.error;
  const d = model.display;
  if (d.includes("e") || d.includes("E")) return d;
  return d.replace(".", ",");
}

/** Converte separador decimal na fita (números com ponto → vírgula PT-BR), linha a linha. */
function tapeForLocale(tape: string): string {
  if (!tape) return "";
  return tape
    .split("\n")
    .map((line) => line.replace(/-?\d+\.\d+/g, (m) => m.replace(".", ",")))
    .join("\n");
}

function CalcButton({
  className,
  variant = "secondary",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant={variant}
      className={cn("h-12 min-w-0 flex-1 text-base font-semibold sm:h-14", className)}
      {...props}
    />
  );
}

export function PlanningCalculator({
  model,
  dispatch,
}: {
  model: CalculatorModel;
  dispatch: Dispatch<CalculatorAction>;
}) {
  const show = displayForLocale(model);
  const tape = tapeForLocale(model.historyLine);

  const digit = (d: string) => () => dispatch({ type: "digit", digit: d });
  const op = (o: "+" | "-" | "*" | "/") => () => dispatch({ type: "op", op: o });

  return (
    <div className="mx-auto w-full max-w-xs space-y-3 sm:max-w-sm">
      <div
        className={cn(
          "flex min-h-[4.25rem] flex-col justify-center gap-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-right tabular-nums tracking-tight",
          model.error && "text-destructive",
        )}
        aria-live="polite"
      >
        <span
          className={cn(
            "max-h-36 min-h-[1.25rem] w-full overflow-y-auto whitespace-pre-line break-all text-xs font-medium sm:max-h-40 sm:text-sm",
            tape ? "text-muted-foreground" : "select-none text-transparent",
          )}
          aria-hidden={!tape}
        >
          {tape || "\u00a0"}
        </span>
        <span className={cn("break-all text-2xl font-semibold text-foreground", model.error && "text-destructive")}>
          {show}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <CalcButton variant="outline" className="text-destructive" onClick={() => dispatch({ type: "clear" })}>
          AC
        </CalcButton>
        <CalcButton variant="outline" onClick={() => dispatch({ type: "backspace" })}>
          ⌫
        </CalcButton>
        <CalcButton variant="outline" onClick={() => dispatch({ type: "negate" })}>
          ±
        </CalcButton>
        <CalcButton onClick={op("/")}>÷</CalcButton>

        <CalcButton onClick={digit("7")}>7</CalcButton>
        <CalcButton onClick={digit("8")}>8</CalcButton>
        <CalcButton onClick={digit("9")}>9</CalcButton>
        <CalcButton onClick={op("*")}>×</CalcButton>

        <CalcButton onClick={digit("4")}>4</CalcButton>
        <CalcButton onClick={digit("5")}>5</CalcButton>
        <CalcButton onClick={digit("6")}>6</CalcButton>
        <CalcButton onClick={op("-")}>−</CalcButton>

        <CalcButton onClick={digit("1")}>1</CalcButton>
        <CalcButton onClick={digit("2")}>2</CalcButton>
        <CalcButton onClick={digit("3")}>3</CalcButton>
        <CalcButton onClick={op("+")}>+</CalcButton>

        <CalcButton className="col-span-2" onClick={digit("0")}>
          0
        </CalcButton>
        <CalcButton onClick={() => dispatch({ type: "dot" })}>,</CalcButton>
        <CalcButton className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => dispatch({ type: "equals" })}>
          =
        </CalcButton>
      </div>
    </div>
  );
}

export function usePlanningCalculatorState(): [CalculatorModel, Dispatch<CalculatorAction>] {
  return useReducer(reduceCalculator, undefined, initialCalculatorModel);
}
