"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/shared/form-alert";
import { friendlyError } from "@/lib/errors";
import { getApiBase } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? "Erro ao enviar");
      }
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[380px] space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verifique seu email</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Se o email <strong>{email}</strong> estiver cadastrado, você receberá
          um link para redefinir sua senha. Verifique também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] space-y-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Esqueceu sua senha?</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Informe seu email e enviaremos um link para redefinir a senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>
        <FormAlert message={error} />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
