# Assistente IA (Chat)

## Visão geral

Componente de chat integrado na home que permite ao usuário fazer perguntas sobre suas finanças. As conversas são persistidas no banco.

**Arquivo:** `src/components/ai/ai-chat.tsx`

## Interface

### Header do chat

- Ícone Sparkles + título "Assistente financeiro"
- Subtítulo "IA integrada aos seus dados"
- Botão History (toggle histórico de conversas)
- Botão MessageSquarePlus (nova conversa)

### Estado vazio

- Ícone Bot centralizado
- "Como posso ajudar?"
- 4 sugestões clicáveis:
  - "Quanto gastei este mês?"
  - "Qual minha maior categoria de gasto?"
  - "Como estão meus cartões?"
  - "Tenho faturas pra vencer?"

### Mensagens

- Usuário: bolha primária à direita com avatar User
- Assistente: bolha cinza à esquerda com avatar Bot
- Loading: spinner "Analisando..."
- Auto-scroll em novas mensagens

### Markdown inline

Função `formatInline()` converte:
- `**texto**` → `<strong>`
- `*texto*` → `<em>`
- `` `código` `` → `<code>` com estilo
- HTML escapado para segurança

### Histórico de conversas

Toggle via botão History no header:
- Lista de conversas anteriores com título e contagem de mensagens
- Conversa ativa destacada
- Botão de excluir (visível no hover)
- Clicar carrega mensagens do banco

### Persistência

- `conversationId` mantido em state
- Primeira mensagem cria nova conversa
- Mensagens subsequentes continuam na mesma conversa
- Lista de conversas atualizada após cada envio

## Integração com API

- `POST /ai/chat` → `{ message, conversationId? }` → `{ reply, model, conversationId }`
- `GET /ai/conversations` → lista de conversas
- `GET /ai/conversations/:id` → conversa com mensagens
- `DELETE /ai/conversations/:id` → exclui conversa

## Dimensões

- Altura fixa: 480px
- Área de mensagens: overflow-y-auto
- Input na parte inferior com botão Send
