import Big from "big.js";

Big.DP = 20;
Big.RM = Big.roundHalfUp;

export type CalcOp = "+" | "-" | "*" | "/";

export function calcOpSymbol(op: CalcOp): string {
  switch (op) {
    case "*":
      return "×";
    case "/":
      return "÷";
    case "-":
      return "−";
    case "+":
      return "+";
    default:
      return op;
  }
}

export type CalculatorAction =
  | { type: "digit"; digit: string }
  | { type: "dot" }
  | { type: "op"; op: CalcOp }
  | { type: "equals" }
  | { type: "clear" }
  | { type: "backspace" }
  | { type: "negate" }
  /** Soma centavos/100 ao valor atual do visor (ex.: inclusões do painel do app). */
  | { type: "addFromCents"; cents: number };

export interface CalculatorModel {
  /** Texto exibido (usa `.` como separador decimal internamente) */
  display: string;
  /** Fita de histórico; várias linhas separadas por `\n` (equações completas e linhas pendentes `… + `). */
  historyLine: string;
  stored: Big | null;
  pendingOp: CalcOp | null;
  /** Próximo dígito substitui o display (após op ou =) */
  newEntry: boolean;
  lastOp: CalcOp | null;
  lastOperand: Big | null;
  error: string | null;
}

const MAX_DISPLAY_LEN = 16;
const DIV_ZERO_MSG = "Divisão por zero";

function normalizeDisplay(raw: string): string {
  return raw.replace(",", ".").trim();
}

function parseDisplay(display: string): Big {
  let n = normalizeDisplay(display);
  if (n === "" || n === "-" || n === ".") return new Big(0);
  if (n.endsWith(".")) n = n.slice(0, -1);
  if (n === "" || n === "-") return new Big(0);
  try {
    return new Big(n);
  } catch {
    return new Big(0);
  }
}

function formatForDisplay(v: Big): string {
  let s = v.toString();
  if (s.length > MAX_DISPLAY_LEN) {
    s = v.toExponential(6);
  }
  return s;
}

function applyBinOp(left: Big, right: Big, op: CalcOp): { value: Big } | { error: string } {
  try {
    switch (op) {
      case "+":
        return { value: left.plus(right) };
      case "-":
        return { value: left.minus(right) };
      case "*":
        return { value: left.times(right) };
      case "/":
        if (right.eq(0)) return { error: DIV_ZERO_MSG };
        return { value: left.div(right) };
      default:
        return { value: right };
    }
  } catch {
    return { error: "Erro de cálculo" };
  }
}

function pendingHistoryLine(stored: Big, pendingOp: CalcOp): string {
  return `${formatForDisplay(stored)} ${calcOpSymbol(pendingOp)} `;
}

/** Última linha é operação aberta (termina em + − × ÷), sem "=". */
function isPendingOperatorLine(line: string): boolean {
  const t = line.trimEnd();
  if (!t || t.includes("=")) return false;
  return /[+\-×÷]\s*$/.test(t);
}

function trimIncompleteTrailingLine(s: string): string {
  if (!s) return "";
  const lines = s.split("\n");
  const last = lines[lines.length - 1] ?? "";
  if (lines.length > 0 && isPendingOperatorLine(last)) {
    return lines.slice(0, -1).join("\n");
  }
  return s;
}

/** Nova linha pendente (valor + operador) após fita existente. */
function appendPendingTape(existing: string, pendingLine: string): string {
  const base = trimIncompleteTrailingLine(existing);
  if (!base) return pendingLine;
  return `${base}\n${pendingLine}`;
}

/** Nova linha com equação completa (… = resultado). */
function appendCompleteTape(existing: string, completeLine: string): string {
  const base = trimIncompleteTrailingLine(existing);
  if (!base) return completeLine;
  return `${base}\n${completeLine}`;
}

export function initialCalculatorModel(): CalculatorModel {
  return {
    display: "0",
    historyLine: "",
    stored: null,
    pendingOp: null,
    newEntry: true,
    lastOp: null,
    lastOperand: null,
    error: null,
  };
}

function truncateDisplay(s: string): string {
  if (s.length <= MAX_DISPLAY_LEN) return s;
  return s.slice(0, MAX_DISPLAY_LEN);
}

export function reduceCalculator(model: CalculatorModel, action: CalculatorAction): CalculatorModel {
  if (model.error && action.type !== "clear" && action.type !== "addFromCents") {
    return model;
  }

  switch (action.type) {
    case "clear":
      return initialCalculatorModel();

    case "addFromCents": {
      const cents = action.cents;
      if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
        return { ...model, error: "Valor inválido" };
      }
      const addend = new Big(cents).div(100);
      if (model.error) {
        return {
          ...initialCalculatorModel(),
          display: formatForDisplay(addend),
          historyLine: "",
          newEntry: true,
          lastOp: null,
          lastOperand: null,
          error: null,
        };
      }
      const current = parseDisplay(model.display);
      const sum = current.plus(addend);
      const curStr = formatForDisplay(current);
      const addStr = formatForDisplay(addend);
      const sumStr = formatForDisplay(sum);
      const historyLine = current.eq(0)
        ? model.historyLine
        : appendCompleteTape(model.historyLine, `${curStr} + ${addStr} = ${sumStr}`);
      return {
        ...model,
        display: sumStr,
        historyLine,
        stored: null,
        pendingOp: null,
        newEntry: true,
        lastOp: null,
        lastOperand: null,
        error: null,
      };
    }

    case "negate": {
      if (model.newEntry && model.display === "0") return model;
      const d = normalizeDisplay(model.display);
      if (d === "0" || d === "0.") return model;
      if (d.startsWith("-")) {
        return { ...model, display: d.slice(1) };
      }
      return { ...model, display: `-${d}` };
    }

    case "backspace": {
      if (model.newEntry) return model;
      let d = normalizeDisplay(model.display);
      if (d.length <= 1 || (d.startsWith("-") && d.length <= 2)) {
        return { ...model, display: "0", newEntry: true };
      }
      d = d.slice(0, -1);
      if (d === "-" || d === "") d = "0";
      return { ...model, display: d };
    }

    case "digit": {
      const dig = action.digit;
      if (!/^\d$/.test(dig)) return model;

      if (model.newEntry) {
        return { ...model, display: dig, newEntry: false };
      }

      let d = normalizeDisplay(model.display);
      const isZeroLike = d === "0" || d === "-0";
      if (isZeroLike && dig !== "0") {
        const sign = d.startsWith("-") ? "-" : "";
        d = `${sign}${dig}`;
      } else {
        const next = d + dig;
        if (next.replace(/[.-]/g, "").length > MAX_DISPLAY_LEN) return model;
        d = truncateDisplay(next);
      }
      return { ...model, display: d };
    }

    case "dot": {
      if (model.newEntry) {
        return { ...model, display: "0.", newEntry: false };
      }
      const d = normalizeDisplay(model.display);
      if (d.includes(".")) return model;
      const next = truncateDisplay(`${d}.`);
      return { ...model, display: next };
    }

    case "op": {
      const op = action.op;
      const current = parseDisplay(model.display);

      let nextStored: Big;
      let nextDisplay: string;
      let tapeBase = model.historyLine;

      if (model.pendingOp) {
        const left = model.stored ?? current;
        const right = model.newEntry ? left : current;
        const out = applyBinOp(left, right, model.pendingOp);
        if ("error" in out) {
          const partial = `${formatForDisplay(left)} ${calcOpSymbol(model.pendingOp)} ${formatForDisplay(right)} =`;
          return {
            ...model,
            error: out.error,
            historyLine: appendCompleteTape(model.historyLine, partial),
          };
        }
        nextStored = out.value;
        nextDisplay = formatForDisplay(out.value);
        const completeLine = `${formatForDisplay(left)} ${calcOpSymbol(model.pendingOp)} ${formatForDisplay(right)} = ${formatForDisplay(out.value)}`;
        tapeBase = appendCompleteTape(model.historyLine, completeLine);
      } else {
        nextStored = current;
        nextDisplay = model.display;
      }

      const pending = pendingHistoryLine(nextStored, op);
      return {
        ...model,
        display: nextDisplay,
        stored: nextStored,
        pendingOp: op,
        newEntry: true,
        lastOp: null,
        lastOperand: null,
        error: null,
        historyLine: appendPendingTape(tapeBase, pending),
      };
    }

    case "equals": {
      const current = parseDisplay(model.display);

      if (model.pendingOp) {
        const left = model.stored ?? current;
        const right = model.newEntry ? left : current;
        const out = applyBinOp(left, right, model.pendingOp);
        if ("error" in out) {
          const partial = `${formatForDisplay(left)} ${calcOpSymbol(model.pendingOp)} ${formatForDisplay(right)} =`;
          return {
            ...model,
            error: out.error,
            historyLine: appendCompleteTape(model.historyLine, partial),
          };
        }
        const resStr = formatForDisplay(out.value);
        const completeLine = `${formatForDisplay(left)} ${calcOpSymbol(model.pendingOp)} ${formatForDisplay(right)} = ${resStr}`;
        return {
          ...model,
          display: resStr,
          stored: null,
          pendingOp: null,
          newEntry: true,
          lastOp: model.pendingOp,
          lastOperand: right,
          error: null,
          historyLine: appendCompleteTape(model.historyLine, completeLine),
        };
      }

      if (model.lastOp && model.lastOperand != null) {
        const out = applyBinOp(current, model.lastOperand, model.lastOp);
        if ("error" in out) {
          const partial = `${formatForDisplay(current)} ${calcOpSymbol(model.lastOp)} ${formatForDisplay(model.lastOperand)} =`;
          return {
            ...model,
            error: out.error,
            historyLine: appendCompleteTape(model.historyLine, partial),
          };
        }
        const resStr = formatForDisplay(out.value);
        const completeLine = `${formatForDisplay(current)} ${calcOpSymbol(model.lastOp)} ${formatForDisplay(model.lastOperand)} = ${resStr}`;
        return {
          ...model,
          display: resStr,
          newEntry: true,
          error: null,
          historyLine: appendCompleteTape(model.historyLine, completeLine),
        };
      }

      return model;
    }

    default:
      return model;
  }
}
