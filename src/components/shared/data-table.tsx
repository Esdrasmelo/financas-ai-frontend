import { cn } from "@/lib/utils";

/** Container opcional para tabelas com cantos alinhados ao design system. */
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>{children}</div>;
}
