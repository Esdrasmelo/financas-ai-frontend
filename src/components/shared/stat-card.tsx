import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  footer,
  highlight,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "transition-shadow duration-150",
        highlight && "border-primary/20 bg-accent/40 dark:bg-accent/20",
        className,
      )}
    >
      <CardContent className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center gap-3">
              {Icon ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                  <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                </span>
              ) : null}
              <span className="text-sm font-medium leading-snug text-muted-foreground">{label}</span>
            </div>
            <div className="text-[2rem] font-bold leading-none tracking-tight text-foreground">{value}</div>
            {footer ? <div className="pt-1 text-xs leading-relaxed text-muted-foreground">{footer}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardCompact({
  icon: Icon,
  label,
  value,
  footer,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col transition-shadow duration-150", className)}>
      <CardContent className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          {Icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary sm:mt-0.5">
              <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 sm:min-h-[4.5rem]">
            <p className="text-xs font-medium leading-snug text-muted-foreground sm:text-[0.8125rem]">{label}</p>
            <p className="text-xl font-semibold leading-tight tracking-tight text-foreground">{value}</p>
            {footer ? (
              <p className="text-xs leading-relaxed text-muted-foreground sm:mt-auto sm:pt-1">{footer}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
