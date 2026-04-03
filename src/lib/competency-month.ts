/** Competência no formato YYYY-MM (UTC). */
const RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseCompetencyMonth(value: string): string {
  if (!RE.test(value)) throw new Error("competencyMonth deve estar no formato YYYY-MM");
  return value;
}

export function competencyMonthFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function addMonthsToCompetencyMonth(ym: string, delta: number): string {
  const [ys, ms] = ym.split("-").map(Number);
  const base = new Date(Date.UTC(ys, ms - 1 + delta, 1));
  return competencyMonthFromDate(base);
}

/** Últimos `count` meses terminando em `endMonth` (inclusive), do mais antigo ao mais recente. */
export function competencyMonthsEndingAt(endMonth: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(addMonthsToCompetencyMonth(endMonth, -i));
  }
  return out;
}

export function daysInCompetencyMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
