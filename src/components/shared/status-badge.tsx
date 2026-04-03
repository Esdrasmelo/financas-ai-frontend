import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        open: "border-transparent bg-muted text-foreground",
        closed: "border-transparent bg-secondary text-secondary-foreground",
        paid: "border-transparent bg-success-muted text-success",
        overdue: "border-transparent bg-destructive/15 text-destructive",
        active: "border-transparent bg-success-muted text-success",
        inactive: "border-transparent bg-muted text-muted-foreground",
        default: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type StatementStatus = "open" | "closed" | "paid" | "overdue";

export function StatusBadge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof statusBadgeVariants>) {
  return <span className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}

const statementLabels: Record<StatementStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Vencida",
};

export function StatementStatusBadge({
  status,
  className,
}: {
  status: StatementStatus;
  className?: string;
}) {
  return (
    <StatusBadge variant={status} className={className}>
      {statementLabels[status]}
    </StatusBadge>
  );
}
