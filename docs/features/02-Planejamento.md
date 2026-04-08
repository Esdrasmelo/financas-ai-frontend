# Planejamento (`/planning`)

A rota agrupa **orçamento mensal** e **calculadora** em duas abas de nível superior.

## Aba Planejamento

- Mês de competência (`YYYY-MM`) e visão **Pagamento** vs **Ocorrência** (igual ao resto da app).
- Renda (salário + recebimentos), simulação rápida, resumo de gastos no app e registos de poupança.
- Consome `GET/PUT /budget/month/...`, recebimentos e poupança conforme a API.

## Aba Calculadora

- Teclado básico: `+ − × ÷`, decimal, `AC`, `⌫`, `±`, `=`.
- Motor em [`src/lib/calculator-engine.ts`](../../src/lib/calculator-engine.ts) com **big.js** (evita erro de ponto flutuante).
- **Fita de histórico** acima do visor: várias linhas (`\n`); equações completas e linhas pendentes (`… + `) acumulam; novas operações e `=` acrescentam linhas sem apagar o que já estava.
- Testes: `pnpm test` (Vitest) — [`src/lib/calculator-engine.test.ts`](../../src/lib/calculator-engine.test.ts).

### Painel “Dados do app”

Integrações opcionais (somam ao **valor atual do visor**, em centavos → reais):

| Ação | API |
|------|-----|
| Contas fixas selecionadas | `GET /fixed-expenses` |
| Uma fatura (cartão + mês referência) | `GET /credit-cards/:id/statements` + `GET /statements/:id` (`totalInvoiceCents`) |
| Todas as faturas de um mês | `GET /statements` + detalhe por id |

Componentes: [`planning-calculator-tab.tsx`](../../src/components/planning/planning-calculator-tab.tsx), [`planning-calculator.tsx`](../../src/components/planning/planning-calculator.tsx), [`planning-calculator-data-panel.tsx`](../../src/components/planning/planning-calculator-data-panel.tsx).

## Ficheiros principais

| Ficheiro | Função |
|----------|--------|
| `src/app/planning/page.tsx` | Abas e conteúdo da página |
| `src/lib/calculator-engine.ts` | Redutor da calculadora e fita |
| `src/components/planning/*` | UI calculadora + painel |
| `vitest.config.mts` | Configuração dos testes do motor |
