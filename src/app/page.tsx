import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  BarChart3,
  Receipt,
  Shield,
  ArrowRight,
} from "lucide-react";
import { ScreenshotCarousel } from "@/components/landing/screenshot-carousel";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard inteligente",
    desc: "KPIs, evolução mensal e gastos por categoria em tempo real.",
  },
  {
    icon: CreditCard,
    title: "Cartões de crédito",
    desc: "Controle de limite, parcelas, ciclo de fatura e vencimentos.",
  },
  {
    icon: Receipt,
    title: "Contas fixas e variáveis",
    desc: "Geração automática de lançamentos a partir das suas contas recorrentes.",
  },
  {
    icon: PiggyBank,
    title: "Planejamento mensal",
    desc: "Renda, sobra estimada, simulação rápida e registro de poupança.",
  },
  {
    icon: TrendingUp,
    title: "Análise por período",
    desc: "Compare meses por ocorrência ou pagamento e identifique tendências.",
  },
  {
    icon: Shield,
    title: "Dados seguros",
    desc: "Autenticação JWT, senhas com Argon2 e dados isolados por usuário.",
  },
];


export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="text-base font-semibold tracking-tight">Prisma | Finanças</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Gestão financeira pessoal
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Suas finanças sob{" "}
            <span className="text-primary">controle total</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Acompanhe despesas, controle cartões de crédito, gerencie faturas
            e planeje seu orçamento mensal — tudo em um único lugar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="border-y border-border/60 bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScreenshotCarousel />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tudo que você precisa
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Funcionalidades pensadas para simplificar o dia a dia financeiro.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-lg text-center px-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Pronto para organizar suas finanças?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Crie sua conta gratuitamente e comece agora mesmo.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" />
            <span>Prisma | Finanças</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Projeto pessoal de gestão financeira
          </p>
        </div>
      </footer>
    </div>
  );
}
