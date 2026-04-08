"use client";

import * as React from "react";
import { startOfMonth } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatYmdInputToDdMmYyyy } from "@/lib/date";

function ymdToLocalDate(ymd: string): Date | undefined {
  const p = ymd.trim().split("-");
  if (p.length !== 3) return undefined;
  const y = Number(p[0]);
  const m = Number(p[1]);
  const d = Number(p[2]);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function localDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const MIN_DATE = new Date(2000, 0, 1);
const MAX_DATE = new Date(2045, 11, 31);

export function PurchaseDatePicker({
  id,
  label = "Data da compra",
  value,
  onChange,
  disabled,
  className,
  /** Dentro de modal Radix (focus trap): evita fechar o calendário ao clicar — o popper fica na mesma árvore do diálogo. */
  disablePopperPortal = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
  className?: string;
  disablePopperPortal?: boolean;
}) {
  const selected = React.useMemo(() => ymdToLocalDate(value), [value]);

  const [calendarMonth, setCalendarMonth] = React.useState(() => startOfMonth(selected ?? new Date()));

  const prevValueRef = React.useRef(value);
  React.useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;
    const d = ymdToLocalDate(value);
    if (d) setCalendarMonth(startOfMonth(d));
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <DatePicker
        value={selected ?? null}
        onChange={(d) => onChange(d ? localDateToYmd(d) : "")}
        format="dd/MM/yyyy"
        disabled={disabled}
        referenceDate={calendarMonth}
        onMonthChange={(d) => setCalendarMonth(startOfMonth(d))}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
        slotProps={{
          textField: {
            id,
            fullWidth: true,
            size: "small",
            placeholder: "Selecionar data",
          },
          actionBar: {
            actions: ["clear", "today", "cancel"],
          },
          popper: {
            disablePortal: disablePopperPortal,
            placement: "bottom-start",
            sx: { zIndex: disablePopperPortal ? 1350 : 1400 },
          },
        }}
        sx={{ width: "100%", "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
      />
      <div className="mt-3 space-y-2.5">
        {value ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Exibição: {formatYmdInputToDdMmYyyy(value)}
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Compras no dia de fechamento do cartão entram na próxima fatura.
        </p>
      </div>
    </div>
  );
}
