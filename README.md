# Finanças AI — Frontend

Interface web em **Next.js 16** (App Router), **React 19** e **Tailwind CSS 4** para acompanhar despesas, cartões, faturas, planejamento e dashboard. Consome a API do projeto **financas-ai-backend**.

---

## Pré-requisitos

- Node.js ≥ 20  
- [pnpm](https://pnpm.io/) 9.x (recomendado)  
- API backend a correr (por defeito `http://localhost:3001`)

---

## Configuração

1. Instalar dependências:

   ```bash
   pnpm install
   ```

2. Variáveis de ambiente — copia o exemplo e ajusta se a API não estiver na porta 3001:

   ```bash
   cp .env.local.example .env.local
   ```

   | Variável               | Descrição                          |
   | ---------------------- | ---------------------------------- |
   | `NEXT_PUBLIC_API_URL`  | URL base da API (ex.: `http://localhost:3001`) |

   O cliente usa `getApiBase()` em `src/lib/api.ts`; se a variável não existir, o fallback é `http://localhost:3001`.

3. Arrancar em desenvolvimento:

   ```bash
   pnpm dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) (porta padrão do Next.js).

---

## Scripts

| Comando        | Descrição                 |
| -------------- | ------------------------- |
| `pnpm dev`     | Servidor de desenvolvimento |
| `pnpm build`   | Build de produção         |
| `pnpm start`   | Serve o build             |
| `pnpm lint`    | ESLint (config Next.js)   |
| `pnpm test`    | Vitest — motor da calculadora em `src/lib/calculator-engine.test.ts` |

---

## O que a app cobre (visão geral)

- **Dashboard** — KPIs, gráficos de evolução e categorias, cartões, próximos vencimentos; filtros por mês (`YYYY-MM`) e visão **por ocorrência** vs **por pagamento**.
- **Planejamento** — renda, recebimentos, gastos (mesma lógica de totais que o dashboard), sobra e poupança; segunda aba **Calculadora** (operações com big.js, fita de histórico, soma opcional de contas fixas e totais de faturas via API). Ver [docs/features/02-Planejamento.md](./docs/features/02-Planejamento.md).
- **Categorias**, **Contas fixas**, **Lançamentos**, **Cartões**, **Compras**, **Faturas** — CRUD e fluxos associados à API.

Componentes partilhados ficam em `src/components/` (UI em `components/ui/`, padrão alinhado a shadcn). Estilos globais e tokens em `src/app/globals.css`.

---

## Estrutura útil

```
src/
  app/           # Rotas App Router (páginas por pasta)
  components/    # Layout, shared, dashboard, planning, ui
  lib/           # API client, calculadora (motor), dinheiro, datas, competência, tema de gráficos
```

---

## Documentação da API e dos cálculos

Regras de agregação do dashboard (totais por competência, visão pagamento vs ocorrência, KPIs, faturas, etc.) estão descritas no **`README.md` do backend**, secção *Dashboard: como os números são calculados*.

Repositório backend: [financas-ai-backend](../financas-ai-backend) (ajusta o caminho relativo se os clones estiverem noutro sítio).

---

## Licença

Projeto privado / uso pessoal — ajustar conforme a tua política de repositório.
