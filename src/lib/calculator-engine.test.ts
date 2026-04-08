import { describe, expect, it } from "vitest";
import Big from "big.js";
import { initialCalculatorModel, reduceCalculator } from "./calculator-engine";

function pressSequence(actions: Parameters<typeof reduceCalculator>[1][]) {
  let m = initialCalculatorModel();
  for (const a of actions) {
    m = reduceCalculator(m, a);
  }
  return m;
}

describe("reduceCalculator", () => {
  it("0.1 + 0.2 = 0.3", () => {
    const m = pressSequence([
      { type: "digit", digit: "0" },
      { type: "dot" },
      { type: "digit", digit: "1" },
      { type: "op", op: "+" },
      { type: "digit", digit: "0" },
      { type: "dot" },
      { type: "digit", digit: "2" },
      { type: "equals" },
    ]);
    expect(new Big(m.display).eq(0.3)).toBe(true);
  });

  it("divisão por zero define erro até limpar", () => {
    let m = pressSequence([
      { type: "digit", digit: "1" },
      { type: "op", op: "/" },
      { type: "digit", digit: "0" },
      { type: "equals" },
    ]);
    expect(m.error).toBeTruthy();
    m = reduceCalculator(m, { type: "digit", digit: "5" });
    expect(m.display).toBe("0");
    m = reduceCalculator(m, { type: "clear" });
    expect(m.error).toBeNull();
    expect(m.display).toBe("0");
  });

  it("5 + = → 10 (repete operando)", () => {
    const m = pressSequence([
      { type: "digit", digit: "5" },
      { type: "op", op: "+" },
      { type: "equals" },
    ]);
    expect(m.display).toBe("10");
  });

  it("repetir = aplica última operação", () => {
    const m = pressSequence([
      { type: "digit", digit: "3" },
      { type: "op", op: "+" },
      { type: "digit", digit: "2" },
      { type: "equals" },
      { type: "equals" },
    ]);
    expect(m.display).toBe("7");
  });

  it("addFromCents soma ao visor e pode encadear", () => {
    let m = reduceCalculator(initialCalculatorModel(), { type: "addFromCents", cents: 12345 });
    expect(m.display).toBe("123.45");
    m = reduceCalculator(m, { type: "addFromCents", cents: 100 });
    expect(m.display).toBe("124.45");
    m = reduceCalculator(m, { type: "addFromCents", cents: 50 });
    expect(m.display).toBe("124.95");
  });

  it("historyLine mostra operação pendente e resultado após =", () => {
    let m = pressSequence([
      { type: "digit", digit: "1" },
      { type: "digit", digit: "2" },
      { type: "op", op: "+" },
    ]);
    expect(m.historyLine).toBe("12 + ");
    m = reduceCalculator(m, { type: "digit", digit: "3" });
    expect(m.historyLine).toBe("12 + ");
    m = reduceCalculator(m, { type: "equals" });
    expect(m.historyLine).toBe("12 + 3 = 15");
    m = reduceCalculator(m, { type: "digit", digit: "9" });
    expect(m.historyLine).toBe("12 + 3 = 15");
    expect(m.display).toBe("9");
    m = reduceCalculator(m, { type: "op", op: "+" });
    expect(m.historyLine).toBe("12 + 3 = 15\n9 + ");
    m = reduceCalculator(m, { type: "digit", digit: "1" });
    m = reduceCalculator(m, { type: "equals" });
    expect(m.historyLine).toBe("12 + 3 = 15\n9 + 1 = 10");
  });

  it("addFromCents acumula linhas na fita", () => {
    let m = reduceCalculator(initialCalculatorModel(), { type: "addFromCents", cents: 10000 });
    expect(m.historyLine).toBe("");
    m = reduceCalculator(m, { type: "addFromCents", cents: 500 });
    expect(m.historyLine).toBe("100 + 5 = 105");
    m = reduceCalculator(m, { type: "addFromCents", cents: 50 });
    expect(m.historyLine).toBe("100 + 5 = 105\n105 + 0.5 = 105.5");
  });
});
