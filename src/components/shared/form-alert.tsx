import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info";

const config: Record<Variant, { icon: typeof AlertTriangle; container: string; text: string }> = {
  error: {
    icon: AlertTriangle,
    container: "border-destructive/20 bg-destructive/5",
    text: "text-destructive",
  },
  success: {
    icon: CheckCircle2,
    container: "border-emerald-500/20 bg-emerald-500/5",
    text: "text-emerald-700",
  },
  info: {
    icon: Info,
    container: "border-blue-500/20 bg-blue-500/5",
    text: "text-blue-700",
  },
};

export function FormAlert({
  message,
  variant = "error",
  className,
}: {
  message: string;
  variant?: Variant;
  className?: string;
}) {
  if (!message) return null;
  const { icon: Icon, container, text } = config[variant];

  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-3", container, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", text)} />
      <p className={cn("text-sm leading-relaxed", text)}>{message}</p>
    </div>
  );
}
