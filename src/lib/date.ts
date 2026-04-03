/** Formata ISO/Date (UTC do servidor) para exibição dd-mm-yyyy */
export function formatDateDdMmYyyy(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * A API guarda `referenceMonth` como mês de **fechamento** (`YYYY-MM`).
 * Na UI, a “ref.” da fatura segue o costume brasileiro: mês de **competência** (MM-YYYY),
 * correspondente ao mês civil anterior ao fechamento (ex.: fecha em 2026-04 → `03-2026`).
 */
export function formatStatementRefDisplay(closingReferenceMonthYyyyMm: string): string {
  const parts = closingReferenceMonthYyyyMm.trim().split("-");
  if (parts.length !== 2) return closingReferenceMonthYyyyMm;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return closingReferenceMonthYyyyMm;
  const d = new Date(Date.UTC(y, m - 1 - 1, 1));
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${mm}-${yyyy}`;
}

/** Converte valor de `<input type="date">` (yyyy-mm-dd) para dd-mm-yyyy */
export function formatYmdInputToDdMmYyyy(ymd: string): string {
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  if (!y || !m || !d) return ymd;
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
}
