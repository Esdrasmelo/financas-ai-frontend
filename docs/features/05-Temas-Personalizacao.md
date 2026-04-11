# Temas e Personalização

## Visão geral

O usuário pode personalizar o modo (claro/escuro), a cor primária e a cor de destaque. Mudanças são aplicadas instantaneamente e sincronizadas com o banco.

## ThemeProvider

**Arquivo:** `src/components/providers/theme-provider.tsx`

### Context

```typescript
interface ThemeContextValue {
  mode: "light" | "dark";
  primary: string;    // hex
  accent: string;     // hex
  setTheme: (mode, primary, accent) => void;
}
```

### Funcionamento

1. Lê preferências do `user` via AuthProvider
2. Gera paleta completa de CSS variables via `generatePalette()`
3. Aplica/remove classe `dark` no `<html>`
4. Sobrescreve CSS variables inline no `:root`
5. `setTheme()` atualiza UI instantaneamente + salva no backend com debounce de 600ms

### Geração de paleta

A partir de uma cor primária hex, gera automaticamente:
- `--primary`, `--primary-foreground`
- `--accent`, `--accent-foreground`
- `--ring`, `--success`, `--success-muted`
- Todas as cores de surface, card, muted, border (fixas por modo)

Conversão via funções `hexToHsl()` e `hslToHex()`.

## Página de configuração

**Arquivo:** `src/app/(app)/account/page.tsx`

### Modo

Botões Claro (Sun) e Escuro (Moon) com checkmark no ativo.

### Presets de cor

8 temas prontos:

| Nome | Primária | Accent |
|------|----------|--------|
| Verde | #1f4b46 | #dceae7 |
| Azul | #1e3a5f | #dbeafe |
| Roxo | #4c1d95 | #ede9fe |
| Índigo | #312e81 | #e0e7ff |
| Rosa | #831843 | #fce7f3 |
| Laranja | #7c2d12 | #ffedd5 |
| Grafite | #1f2937 | #e5e7eb |
| Ciano | #164e63 | #cffafe |

Cada preset é um botão com bolinha de cor + label + checkmark.

### Cor personalizada

Color picker nativo (`<input type="color">`) com preview do hex.

## Impacto nos gráficos

**Arquivo:** `src/lib/chart-theme.ts`

- `getChartPrimaryColor()` — lê `--primary` do CSS em tempo real
- `getChartSeriesColors()` — gera 6 variações para donut/pie charts

Dashboard e trend chart usam cores dinâmicas do tema.

## CSS base

**Arquivo:** `src/app/globals.css`

Define variáveis padrão para modo light e dark. O ThemeProvider sobrescreve em runtime.

## Persistência

- Salvo nos campos `themeMode`, `themePrimary`, `themeAccent` do model User
- Endpoint: `PUT /auth/theme`
- Debounce de 600ms no frontend para evitar excesso de requests
- Sincroniza entre dispositivos via `GET /auth/me`
