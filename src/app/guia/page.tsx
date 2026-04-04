import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  PieChart,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Guia de uso | Finanças AI",
  description: "Como usar o app e entender o dashboard, KPIs e telas principais.",
};

function GuideHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-accent/70 via-card to-card shadow-sm ring-1 ring-primary/5 dark:from-accent/25 dark:via-card dark:to-card dark:ring-primary/10">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner dark:bg-primary/20">
          <BookOpen className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">Documentação rápida</p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            Use este guia como referência: fluxo recomendado, diferença entre <strong className="font-medium text-foreground">ocorrência</strong> e{" "}
            <strong className="font-medium text-foreground">pagamento</strong>, e o significado de cada indicador do dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="group flex gap-4 rounded-xl border border-border/90 bg-card/80 p-4 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-card hover:shadow-md sm:p-5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold tabular-nums text-primary transition-colors group-hover:bg-primary/15 dark:bg-primary/20"
        aria-hidden
      >
        {step}
      </div>
      <div className="min-w-0 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">{title}</p>
        {children}
      </div>
    </div>
  );
}

function SectionIntro({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-dashed border-border-strong/80 bg-muted/40 px-4 py-3 dark:bg-muted/25">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function GuideBlock({
  title,
  icon: Icon,
  accent = "primary",
  children,
}: {
  title: string;
  icon?: LucideIcon;
  accent?: "primary" | "muted";
  children: React.ReactNode;
}) {
  const border =
    accent === "primary" ? "border-l-primary bg-primary/[0.04] dark:bg-primary/10" : "border-l-border-strong bg-muted/35 dark:bg-muted/20";
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 border-l-4 py-4 pl-4 pr-4 shadow-sm transition-shadow hover:shadow-md sm:pl-5 sm:pr-5",
        border,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-primary shadow-sm ring-1 ring-border/60 dark:bg-card/80">
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

function GuideGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export default function GuiaPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Guia de uso"
        subtitle="Como navegar no app e o que significa cada número do dashboard — em linguagem simples."
      />

      <GuideHero />

      <SectionCard title="Por onde começar" description="Ordem sugerida para preencher os dados com sentido">
        <SectionIntro icon={ListOrdered}>
          Siga os passos abaixo na ordem: cada um prepara o próximo e evita categorias ou cartões faltando nos lançamentos.
        </SectionIntro>
        <div className="space-y-3">
          <StepCard step={1} title="Categorias">
            <p>Crie grupos para classificar gastos (ex.: Alimentação, Transporte). Você usa essas categorias em lançamentos, compras e contas fixas.</p>
          </StepCard>
          <StepCard step={2} title="Cartões">
            <p>Cadastre cada cartão (vencimento e fechamento ajudam nas faturas).</p>
          </StepCard>
          <StepCard step={3} title="Compras">
            <p>Registre o que foi comprado no cartão (à vista ou parcelado). O app distribui parcelas nas faturas certas.</p>
          </StepCard>
          <StepCard step={4} title="Lançamentos">
            <p>Para gastos fora do cartão: PIX, débito, dinheiro etc., mês a mês.</p>
          </StepCard>
          <StepCard step={5} title="Contas fixas">
            <p>
              Aluguel, academia, streaming… Depois use <strong>Gerar lançamentos</strong> para criar as entradas do mês automaticamente.
            </p>
          </StepCard>
          <StepCard step={6} title="Dashboard">
            <p>Visão geral do mês escolhido.</p>
          </StepCard>
          <StepCard step={7} title="Planejamento">
            <p>Compare renda (salário + recebimentos) com os gastos do app e veja a sobra.</p>
          </StepCard>
          <StepCard step={8} title="Faturas">
            <p>Acompanhe cada fatura, valores pendentes e marque como paga quando quitar.</p>
          </StepCard>
        </div>
      </SectionCard>

      <SectionCard
        title="Mês e visão: Por ocorrência × Por pagamento"
        description="No dashboard (e em telas com o mesmo filtro), estes botões mudam como o cartão entra nos totais"
      >
        <SectionIntro icon={ArrowLeftRight}>
          O campo <strong className="text-foreground">Mês (YYYY-MM)</strong> é a competência analisada (ex.{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">2026-04</code>).
        </SectionIntro>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-accent/60 to-card p-5 shadow-sm ring-1 ring-primary/5 dark:from-accent/20 dark:to-card">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <CalendarRange className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              <span className="text-sm font-semibold text-foreground">Por ocorrência</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O cartão conta no mês em que a <strong className="text-foreground">compra foi feita</strong> (data no calendário). Ideal para ver “quanto gastei de fato naquele mês”.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-border/60 dark:bg-card/90">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              <span className="text-sm font-semibold text-foreground">Por pagamento</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O cartão conta no mês em que cada <strong className="text-foreground">parcela entra na fatura</strong>. Alinha com o que tende a sair do bolso naquele ciclo de fatura.
            </p>
          </div>
        </div>
        <p className="mt-5 rounded-xl border border-dashed border-border-strong/70 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground dark:bg-muted/15">
          Lançamentos normais (PIX, contas fixas geradas, variáveis) <strong className="text-foreground">não mudam</strong> com esse botão: já pertencem ao mês de competência em que foram lançados.
        </p>
      </SectionCard>

      <SectionCard
        title="Indicadores principais do dashboard"
        description="Os quatro cards no topo — todos respeitam o mês e a visão (ocorrência ou pagamento) selecionados"
      >
        <SectionIntro icon={LayoutDashboard}>
          Estes são os números em destaque no topo do dashboard; todos usam o mesmo mês e a mesma visão que você escolheu.
        </SectionIntro>
        <GuideGrid>
          <GuideBlock title="Total do mês" icon={BarChart3}>
            <p>
              Soma de <strong>tudo</strong> que o app considera gasto naquele mês: lançamentos (fixos + variáveis) mais a parte do cartão conforme a visão.
            </p>
            <p className="mt-2">
              A linha abaixo do valor mostra a diferença em relação ao <strong>mês anterior</strong> (em reais e, quando faz sentido, em percentual).
            </p>
          </GuideBlock>
          <GuideBlock title="Próxima fatura" icon={Wallet}>
            <p>
              Valor ainda <strong>pendente</strong> na próxima fatura com vencimento a partir de hoje (entre todas as contas). O rodapé mostra qual cartão é e a data de vencimento.
            </p>
            <p className="mt-2">Se não houver nada a vencer à frente, aparece “—”.</p>
          </GuideBlock>
          <GuideBlock title="Faturas em aberto" icon={LayoutDashboard}>
            <p>
              Soma do que ainda está <strong>pendente</strong> em todas as faturas não pagas (abertas, fechadas ou em atraso). É uma foto do quanto ainda “está no cartão” até quitar.
            </p>
          </GuideBlock>
          <GuideBlock title="Comprometido (aprox.)" icon={PieChart} accent="muted">
            <p>
              Percentual <strong>orientativo</strong>: compara o que você já somou no mês com <strong>parcelas futuras ainda pendentes</strong> (a partir da competência do mês selecionado).
            </p>
            <p className="mt-2">Não é previsão de caixa nem saldo bancário — ajuda a ver quanto do “gasto + parcelas pela frente” vem de compromissos no cartão.</p>
          </GuideBlock>
        </GuideGrid>
      </SectionCard>

      <SectionCard title="Outros indicadores do dashboard" description="Cards menores logo abaixo dos principais">
        <SectionIntro icon={LineChart}>Detalhamento do mesmo mês e visão — úteis para entender de onde veio o total.</SectionIntro>
        <GuideGrid>
          <GuideBlock title="Contas fixas">
            <p>Total em lançamentos do tipo <strong>conta fixa</strong> naquele mês (gerados ou registrados como fixos).</p>
          </GuideBlock>
          <GuideBlock title="Gastos variáveis">
            <p>Total de lançamentos <strong>variáveis</strong> no mês (PIX, dinheiro, débito etc., fora das contas fixas).</p>
          </GuideBlock>
          <GuideBlock title="Parcelas futuras">
            <p>Soma das parcelas com competência <strong>a partir do mês selecionado</strong> que ainda estão pendentes.</p>
          </GuideBlock>
          <GuideBlock title="Compras parceladas ativas">
            <p>Quantidade de compras no cartão <strong>parceladas</strong> (mais de uma parcela) ativas no cadastro.</p>
          </GuideBlock>
          <GuideBlock title="Média diária">
            <p>
              <strong>Total do mês</strong> dividido pelos dias daquele mês. Útil para ver ritmo de gasto (ex.: “por dia, em média, X”).
            </p>
          </GuideBlock>
          <GuideBlock title="Maior categoria">
            <p>Categoria em que você mais gastou no mês (lançamentos + cartão conforme a visão). O rodapé mostra o nome.</p>
          </GuideBlock>
        </GuideGrid>
      </SectionCard>

      <SectionCard title="Gráficos e blocos ao lado do dashboard" description="O que cada área mostra">
        <SectionIntro icon={PieChart}>Visualizações e resumos que complementam os números do topo.</SectionIntro>
        <div className="space-y-4">
          <GuideBlock title="Evolução mensal" icon={BarChart3}>
            <p>
              Barras com o <strong>total gasto</strong> nos últimos seis meses, com a <strong>mesma visão</strong> (ocorrência ou pagamento) selecionada.
            </p>
          </GuideBlock>
          <GuideBlock title="Gastos por categoria" icon={PieChart}>
            <p>Distribuição do gasto do mês entre categorias (legenda e percentuais). A parte de cartão segue a visão ocorrência/pagamento.</p>
          </GuideBlock>
          <GuideBlock title="Resumo executivo" icon={LayoutDashboard} accent="muted">
            <p>Leitura rápida: lançamentos no mês, maior categoria, cartão mais usado, próxima fatura e parcelas futuras.</p>
          </GuideBlock>
          <GuideBlock title="Próximos vencimentos" icon={CalendarRange}>
            <p>Próximas faturas por data de vencimento, com valor pendente e status. O atalho leva à tela de faturas.</p>
          </GuideBlock>
        </div>
      </SectionCard>

      <SectionCard title="Planejamento" description="Tela à parte do dashboard, mas ligada aos mesmos totais de gasto">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-accent/50 via-card to-card p-5 shadow-sm sm:p-6 dark:from-accent/15">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Wallet className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            <span className="text-sm font-semibold text-foreground">Renda × gastos</span>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Informe <strong className="text-foreground">salário</strong> e, se quiser, <strong className="text-foreground">outros recebimentos</strong> no mês. O app soma e compara com o gasto do período.
            </p>
            <p>
              O gasto usado é o mesmo conceito do <strong className="text-foreground">resumo mensal</strong> (fixo + variável + cartão), respeitando <strong>Pagamento</strong> ou <strong>Ocorrência</strong> na própria tela de planejamento.
            </p>
            <p>
              <strong className="text-foreground">Sobra</strong> = tudo que entrou (salário + recebimentos) menos esse gasto. Sem renda cadastrada, a sobra não aparece.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Dicas rápidas" description="Hábitos que deixam os números mais fiéis à sua vida real">
        <div className="rounded-2xl border border-success/20 bg-success-muted/60 p-1 dark:border-success/30 dark:bg-success-muted/25">
          <ul className="space-y-0 divide-y divide-border/60 dark:divide-border/80">
            <li className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Mantenha <strong className="text-foreground">categorias simples e estáveis</strong> para os gráficos fazerem sentido ao longo do tempo.
              </p>
            </li>
            <li className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Depois de criar contas fixas, use <strong className="text-foreground">Gerar lançamentos do mês</strong> antes de analisar o dashboard.
              </p>
            </li>
            <li className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Marque faturas como <strong className="text-foreground">pagas</strong> na tela Faturas para os totais “em aberto” refletirem a realidade.
              </p>
            </li>
            <li className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Se um número estranhar, confira o <strong className="text-foreground">mês</strong> e <strong className="text-foreground">Por ocorrência / Por pagamento</strong>.
              </p>
            </li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}
