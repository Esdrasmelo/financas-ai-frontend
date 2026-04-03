"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function PurchaseDatePicker({
  id,
  label = "Data da compra",
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => ymdToLocalDate(value), [value]);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-full justify-start gap-2 border-zinc-200 bg-white px-3 font-normal text-left hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Calendar className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            {selected ? (
              <span className="text-zinc-900 dark:text-zinc-100">{format(selected, "dd/MM/yyyy", { locale: ptBR })}</span>
            ) : (
              <span className="text-zinc-500">Selecionar data</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[min(100%,22rem)] gap-3 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base">Calendário</DialogTitle>
          </DialogHeader>
          <div className="purchase-calendar flex flex-col gap-3">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) {
                  onChange(localDateToYmd(d));
                  setOpen(false);
                }
              }}
              locale={ptBR}
              className="mx-auto rounded-lg"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-zinc-600 dark:text-zinc-400"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Limpar
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onChange(localDateToYmd(new Date()));
                  setOpen(false);
                }}
              >
                Hoje
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {value ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Exibição: {formatYmdInputToDdMmYyyy(value)}</p>
      ) : null}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Compras no dia de fechamento do cartão entram na próxima fatura.
      </p>
    </div>
  );
}
