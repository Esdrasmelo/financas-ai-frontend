"use client";

import * as React from "react";
import { Eye, EyeOff, Lock, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  showToggle?: boolean;
}

export function PasswordInput({ className, showToggle = true, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type={visible ? "text" : "password"}
        className={cn("pl-10", showToggle && "pr-10", className)}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

const rules = [
  { test: (v: string) => v.length >= 8, label: "Mínimo 8 caracteres" },
  { test: (v: string) => /[A-Z]/.test(v), label: "Letra maiúscula" },
  { test: (v: string) => /[a-z]/.test(v), label: "Letra minúscula" },
  { test: (v: string) => /[0-9]/.test(v), label: "Número" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: "Caractere especial" },
];

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const passed = rules.filter((r) => r.test(value)).length;
  const percent = Math.round((passed / rules.length) * 100);

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex gap-1">
        {rules.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i < passed
                ? passed <= 2 ? "bg-destructive" : passed <= 4 ? "bg-amber-500" : "bg-emerald-500"
                : "bg-border",
            )}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
        {rules.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {ok ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
              ) : (
                <X className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              )}
              <span className={cn(ok ? "text-emerald-600" : "text-muted-foreground")}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
