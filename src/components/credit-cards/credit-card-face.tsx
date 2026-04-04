import { cn } from "@/lib/utils";
import type { CardNetworkValue } from "@/lib/credit-card-display";
import { cardFaceGradient } from "@/lib/credit-card-display";

function NetworkMark({ brand, compact }: { brand: string | null; compact?: boolean }) {
  const b = brand as CardNetworkValue | null;
  if (!b || b === "other") {
    return (
      <span
        className={cn(
          "font-semibold uppercase tracking-[0.2em] text-white/75",
          compact ? "text-[8px]" : "text-[10px]",
        )}
        aria-hidden
      >
        Crédito
      </span>
    );
  }
  if (b === "visa") {
    return (
      <span
        className={cn(
          "select-none font-bold italic leading-none tracking-tight text-white",
          compact ? "text-sm" : "text-lg",
        )}
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        aria-hidden
      >
        VISA
      </span>
    );
  }
  if (b === "mastercard") {
    return (
      <div className={cn("relative shrink-0", compact ? "h-6 w-10" : "h-9 w-[3.25rem]")} aria-hidden>
        <span
          className={cn(
            "absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#eb001b] shadow-sm ring-2 ring-white/20",
            compact ? "h-5 w-5" : "h-8 w-8",
          )}
        />
        <span
          className={cn(
            "absolute top-1/2 z-0 -translate-y-1/2 rounded-full bg-[#f79e1b] shadow-sm ring-2 ring-white/20",
            compact ? "left-3.5 h-5 w-5" : "left-[1.15rem] h-8 w-8",
          )}
        />
      </div>
    );
  }
  if (b === "elo") {
    return (
      <span
        className={cn(
          "rounded bg-white/95 font-black tracking-wide text-[#001c7c]",
          compact ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-xs",
        )}
        aria-hidden
      >
        elo
      </span>
    );
  }
  if (b === "amex") {
    return (
      <span
        className={cn(
          "rounded-sm bg-[#006fcf] font-bold uppercase tracking-wide text-white",
          compact ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[10px]",
        )}
        aria-hidden
      >
        AMEX
      </span>
    );
  }
  if (b === "hipercard") {
    return (
      <span className={cn("font-bold uppercase tracking-wide text-white", compact ? "text-[9px]" : "text-xs")} aria-hidden>
        Hiper
      </span>
    );
  }
  return null;
}

export function CreditCardFace({
  name,
  brand,
  themeColor,
  className,
  variant = "default",
}: {
  name: string;
  brand: string | null;
  themeColor: string | null;
  className?: string;
  variant?: "default" | "compact";
}) {
  const compact = variant === "compact";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10",
        compact
          ? "aspect-[1.586/1] w-full max-w-[12.5rem] rounded-xl shadow-md"
          : "aspect-[1.586/1] w-full min-h-[148px]",
        className,
      )}
      style={{ background: cardFaceGradient(themeColor) }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/25" />
      <div className={cn("relative flex h-full flex-col justify-between", compact ? "p-2.5 sm:p-3" : "p-4 sm:p-5")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "rounded-md bg-gradient-to-br from-amber-200/90 to-amber-500/80 shadow-inner ring-1 ring-white/30",
                compact ? "h-5 w-7" : "h-9 w-11",
              )}
            />
            <div className={cn("rounded-full bg-white/25", compact ? "h-1.5 w-6" : "h-2 w-8")} />
          </div>
          <NetworkMark brand={brand} compact={compact} />
        </div>
        <div className={cn("space-y-0.5", compact && "min-w-0")}>
          <p
            className={cn(
              "truncate font-medium uppercase tracking-[0.25em] text-white/60",
              compact ? "text-[8px]" : "text-[10px]",
            )}
          >
            Titular
          </p>
          <p
            className={cn(
              "truncate font-semibold tracking-wide text-white drop-shadow-sm",
              compact ? "text-xs leading-tight" : "text-base sm:text-lg",
            )}
          >
            {name}
          </p>
        </div>
      </div>
    </div>
  );
}
