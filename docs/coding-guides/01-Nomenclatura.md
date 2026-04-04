# Nomenclatura (DDD e alinhamento ao back-end)

Este guia aplica-se ao código TypeScript/React em `src/`.

## Linguagem ubíqua

Use os mesmos conceitos do domínio expostos pela API: `competencyMonth`, `creditCard`, `statement`, `purchase`, `category`, etc. Evite abreviações opacas em variáveis que vivem além de uma linha (`r`, `j`, `n` para “qualquer coisa”).

## Chamadas HTTP (`fetch`)

- **`response`**: resultado de `await fetch(...)`.
- **Corpo JSON**: `await response.json()` atribuído a um nome tipado ou `payload` / `body` conforme o contexto (`const budgetMonth = (await response.json()) as BudgetMonthResponse`).
- **Centavos**: prefira `amountCents`, `totalCents`, etc., quando o valor for monetário inteiro.

## React

- **Componentes**: PascalCase; arquivos de UI em kebab-case (padrão atual do projeto).
- **Handlers**: em funções longas, `event` em vez de `e`; em handlers de uma linha, `e` é aceitável.
- **Listas**: `.map((item) =>` ou nome do domínio (`row`, `category`, `link` no menu).

## O que não alterar

- Props e chaves de API vindas do servidor (nomes JSON).
- APIs públicas de componentes de biblioteca (Radix, etc.).

## Back-end

Ver `financas-ai-backend/docs/coding-guides/01-Nomenclatura.md` para convenções nas camadas domain/application/infrastructure.

## Ferramentas

- `pnpm lint` (Next/ESLint). Regras adicionais de nomenclatura podem ser introduzidas de forma gradual no `eslint.config.mjs`.
