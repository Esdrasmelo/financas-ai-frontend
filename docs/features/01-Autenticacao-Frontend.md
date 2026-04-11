# Autenticação no Frontend

## Visão geral

Sistema completo de autenticação com login, registro, esqueci minha senha, redefinição de senha, proteção de rotas e gerenciamento de sessão via cookie.

## Arquitetura

### Route Groups

```
src/app/
  page.tsx              → Landing page pública
  (auth)/
    layout.tsx          → Layout split-screen (imagem + formulário)
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  (app)/
    layout.tsx          → AppShell (header + nav)
    home/page.tsx
    dashboard/page.tsx
    account/page.tsx
    ... (demais páginas protegidas)
```

### Proxy (proteção de rotas)

**Arquivo:** `src/proxy.ts` (Next.js 16 — substitui middleware.ts)

Rotas públicas: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`

Comportamento:
- Sem cookie `financasai-token` em rota protegida → redirect `/login`
- Com cookie em `/login` ou `/register` → redirect `/home`

### Cookie

**Arquivo:** `src/lib/auth-cookie.ts`

- Nome: `financasai-token`
- Max-age: 7 dias
- SameSite: Lax
- Funções: `getToken()`, `setToken()`, `removeToken()`

### AuthProvider

**Arquivo:** `src/components/providers/auth-provider.tsx`

Context com:
- `user: { id, name, email, themeMode, themePrimary, themeAccent } | null`
- `isLoading: boolean`
- `login(email, password)` → salva cookie, redireciona para `/home`
- `register(name, email, password)` → salva cookie, redireciona para `/home`
- `logout()` → remove cookie, redireciona para `/login`

Hidratação: no mount, lê cookie e chama `GET /auth/me`.

### Cliente API

**Arquivo:** `src/lib/api.ts`

- `authHeaders()` — injeta `Authorization: Bearer <token>` automaticamente
- `authFetch()` — wrapper do fetch com auth header e tratamento de 401
- `handleUnauthorized()` — limpa cookie e redireciona para `/login` em 401

## Páginas

### Login (`/login`)

- Ícone do logo + título "Bem-vindo de volta"
- Inputs com ícones (Mail, Lock) e toggle de visibilidade da senha
- Link "Esqueci minha senha" com ícone KeyRound
- Separador "ou" + link para registro

### Registro (`/register`)

- Logo + título "Criar conta"
- Campos: nome, email, senha
- `PasswordStrength` — barra de progresso + 5 checks em tempo real
- `PasswordInput` — toggle de visibilidade (Eye/EyeOff)

### Esqueci minha senha (`/forgot-password`)

- Campo email + botão "Enviar link de redefinição"
- Após envio: tela de sucesso "Verifique seu email"
- Link "Voltar para o login"

### Redefinir senha (`/reset-password?token=xxx`)

- Lê token da query string
- Sem token: tela de "Link inválido"
- Com token: formulário nova senha + confirmação com PasswordStrength
- Após sucesso: tela "Senha redefinida!" com redirect automático (3s)

### Layout de auth (`(auth)/layout.tsx`)

Split-screen:
- **Esquerda:** carrossel de screenshots do sistema com auto-play (5s), gradiente overlay, logo e texto
- **Direita:** formulário centralizado

## Componentes reutilizáveis

### `PasswordInput`

**Arquivo:** `src/components/shared/password-input.tsx`

- Input com ícone Lock à esquerda
- Botão Eye/EyeOff à direita para toggle de visibilidade

### `PasswordStrength`

- Barra de 5 segmentos (vermelho → amarelo → verde)
- Grid 2 colunas com 5 critérios e ícones Check/X
- Oculto quando campo está vazio

### `FormAlert`

**Arquivo:** `src/components/shared/form-alert.tsx`

- 3 variantes: error (vermelho), success (verde), info (azul)
- Ícone + mensagem com padding e borda colorida

## Tratamento de erros

**Arquivo:** `src/lib/errors.ts`

`friendlyError(err)` traduz erros para mensagens em pt-BR:
- "Failed to fetch" → "Não foi possível conectar ao servidor"
- Status 401 → "Email ou senha inválidos"
- Status 429 → "Muitas tentativas. Aguarde..."
- Status 500+ → "Erro interno do servidor"
