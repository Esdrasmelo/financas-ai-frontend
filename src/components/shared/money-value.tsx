import { cn } from "@/lib/utils";
import { formatBRLFromCents } from "@/lib/money";

export function MoneyValue({
  cents,
  className,
  tabular = true,
}: {
  cents: number;
  className?: string;
  tabular?: boolean;
}) {
  return (
    <span className={cn("font-semibold text-foreground", tabular && "tabular-nums", className)}>
      {formatBRLFromCents(cents)}
    </span>
  );
}
