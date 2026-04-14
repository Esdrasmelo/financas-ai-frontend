"use client";

import { formatBRLFromCents } from "@/lib/money";
import { formatDateDdMmYyyy } from "@/lib/date";

export type EntryAuditRow = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  sourceType: "fixed_expense" | "variable";
  categoryName: string;
};

export type CreditCardAuditRow = {
  id: string;
  description: string;
  amountCents: number;
  purchaseDate: string;
  creditCardName: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
};

function AuditPanelShell({
  title,
  total,
  loading,
  empty,
  children,
}: {
  title: string;
  total: number;
  loading: boolean;
  empty: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[540px] max-w-[680px] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/40 px-4 py-2.5">
        <p className="text-[0.8125rem] font-semibold text-foreground">{title}</p>
        <p className="text-[0.8125rem] font-semibold tabular-nums text-foreground">
          Total: {formatBRLFromCents(total)}
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto px-4 py-2">
        {loading ? (
          <p className="py-5 text-center text-xs text-muted-foreground">Carregando…</p>
        ) : empty ? (
          <p className="py-5 text-center text-xs text-muted-foreground">
            Nenhum item para este período.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function EntriesAuditPanel({
  loading,
  rows,
}: {
  loading: boolean;
  rows: EntryAuditRow[] | null;
}) {
  const total = rows?.reduce((sum, row) => sum + row.amountCents, 0) ?? 0;

  return (
    <AuditPanelShell
      title="Lançamentos incluídos"
      total={total}
      loading={loading}
      empty={!loading && rows !== null && rows.length === 0}
    >
      {rows && rows.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-1.5 pt-2 text-left font-medium">Descrição</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Categoria</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Tipo</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Data</th>
              <th className="pb-1.5 pt-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-1.5 pr-3 font-medium text-foreground">{row.description}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{row.categoryName}</td>
                <td className="py-1.5 pr-3">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      row.sourceType === "fixed_expense"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                    }`}
                  >
                    {row.sourceType === "fixed_expense" ? "Fixo" : "Variável"}
                  </span>
                </td>
                <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                  {formatDateDdMmYyyy(row.date)}
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-foreground">
                  {formatBRLFromCents(row.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AuditPanelShell>
  );
}

export function CreditCardAuditPanel({
  loading,
  rows,
  view,
}: {
  loading: boolean;
  rows: CreditCardAuditRow[] | null;
  view: "occurrence" | "payment";
}) {
  const total = rows?.reduce((sum, row) => sum + row.amountCents, 0) ?? 0;
  const title =
    view === "occurrence"
      ? "Compras no mês (por ocorrência)"
      : "Parcelas na competência (por pagamento)";

  return (
    <AuditPanelShell
      title={title}
      total={total}
      loading={loading}
      empty={!loading && rows !== null && rows.length === 0}
    >
      {rows && rows.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-1.5 pt-2 text-left font-medium">Descrição</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Cartão</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Data</th>
              <th className="pb-1.5 pt-2 text-left font-medium">Parcela</th>
              <th className="pb-1.5 pt-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-1.5 pr-3 font-medium text-foreground">{row.description}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{row.creditCardName}</td>
                <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                  {formatDateDdMmYyyy(row.purchaseDate)}
                </td>
                <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                  {row.totalInstallments && row.totalInstallments > 1
                    ? row.installmentNumber != null
                      ? `${row.installmentNumber}/${row.totalInstallments}`
                      : `x${row.totalInstallments}`
                    : "—"}
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-foreground">
                  {formatBRLFromCents(row.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AuditPanelShell>
  );
}
