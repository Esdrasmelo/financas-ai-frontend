# Minha Conta e Histórico de Logins

## Visão geral

Página `/account` com configurações de aparência e histórico de acessos para auditoria de segurança.

**Arquivo:** `src/app/(app)/account/page.tsx`

## Acesso

- Link "Minha conta" no dropdown do usuário no header (ícone Shield)
- Rota protegida (requer autenticação)

## Seções

### Aparência

Ver documentação de [Temas e Personalização](./05-Temas-Personalizacao.md).

### Histórico de logins

Lista os últimos 50 acessos do usuário com:

| Informação | Ícone | Exemplo |
|------------|-------|---------|
| Status | CheckCircle2 / XCircle | Sucesso / Falhou |
| Data/hora | Clock | 10/04/2026, 21:43 |
| Navegador, OS, device | Monitor/Smartphone/Tablet | Chrome · Windows · Desktop |
| Localização | MapPin | São Paulo, SP, Brazil |
| IP | Globe | 189.xx.xx.xx |
| Provedor | Wifi | Vivo Fibra |

Cada entry tem:
- Ícone verde (sucesso) ou vermelho (falha) à esquerda
- Badge "Sucesso" ou "Falhou"
- Metadados em linha com ícones

### Empty state

"Nenhum registro — O histórico aparecerá aqui após o próximo acesso."

## Dados

Carregados via `GET /auth/login-history?limit=50`.

Campos retornados: `id`, `success`, `ip`, `browser`, `os`, `device`, `city`, `region`, `country`, `countryCode`, `isp`, `timezone`, `createdAt`.

Campos sensíveis omitidos: `userId`, `userAgent` (bruto), `latitude`, `longitude`.
