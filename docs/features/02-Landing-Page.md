# Landing Page

## Visão geral

Página pública (`/`) que apresenta o produto para visitantes não autenticados.

**Arquivo:** `src/app/page.tsx`

## Seções

### Header

- Logo PNG + nome "Prisma | Finanças"
- Botões "Entrar" e "Criar conta"
- Sticky com backdrop-blur

### Hero

- Badge "Gestão financeira pessoal"
- Título "Suas finanças sob controle total" (primária em destaque)
- Subtítulo descritivo
- CTAs: "Começar agora" (primário) + "Já tenho conta" (outline)

### Carrossel de screenshots

**Componente:** `src/components/landing/screenshot-carousel.tsx`

- 8 slides com screenshots reais do sistema
- Auto-play a cada 4s (reseta ao interagir)
- Setas de navegação esquerda/direita com blur
- Indicadores clicáveis + label do slide atual
- Aspect ratio 16:10 com object-cover

**Screenshots:**
1. Dashboard financeiro
2. Cartões de crédito
3. Planejamento mensal
4. Lançamentos
5. Contas fixas
6. Compras no cartão
7. Detalhe de fatura
8. Lista de faturas

### Features

6 cards com ícone + título + descrição:
- Dashboard inteligente
- Cartões de crédito
- Contas fixas e variáveis
- Planejamento mensal
- Análise por período
- Dados seguros

### CTA final

"Pronto para organizar suas finanças?" + botão "Criar conta grátis"

### Footer

Logo + nome + "Projeto pessoal de gestão financeira"
