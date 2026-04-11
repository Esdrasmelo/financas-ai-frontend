# Home Interna

## Visão geral

Página inicial para usuários autenticados (`/home`). Apresenta resumo rápido das finanças do mês com KPIs, últimos lançamentos e próximos vencimentos.

**Arquivo:** `src/app/(app)/home/page.tsx`

## Seções

### Saudação

- Dinâmica por horário: "Bom dia", "Boa tarde", "Boa noite"
- Nome do usuário (primeiro nome)
- Subtítulo: "Resumo de {mês} de {ano}"

### KPIs (grid 4 colunas)

Cards com ícones coloridos:
1. **Total gasto** — com variação % vs mês anterior (verde/vermelho)
2. **Faturas em aberto** — ícone âmbar
3. **Parcelas futuras** — ícone roxo
4. **Dashboard** — card CTA com link para `/dashboard`

Dados carregados via `GET /dashboard/kpis?competencyMonth=YYYY-MM`.

### Últimos lançamentos

- 8 lançamentos mais recentes do mês
- Descrição, data, tipo (variável/conta fixa) e valor
- Link "Ver todos" → `/entries`
- Empty state se sem dados

Dados via `GET /entries?competencyMonth=YYYY-MM`.

### Próximos vencimentos

- Até 4 faturas por vencer
- Ícone do cartão, nome, data de vencimento, valor pendente
- Badge de status (Aberta, Fechada, Paga, Vencida)
- Cada item clicável → `/statements/:id`
- Link "Ver todas" → `/statements`

Dados via `GET /dashboard/upcoming-statements?limit=4`.

### Assistente IA

Componente `AiChat` integrado na parte inferior (ver doc específica).

## Navegação

- Link "Início" no nav do header
- Logo no header aponta para `/home`
- Login/registro redirecionam para `/home` após sucesso
