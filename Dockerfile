# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG PNPM_VERSION=9.15.0

# ---------------------------------------------------------------------------
# Base: Node + pnpm
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependências
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Build
# NEXT_PUBLIC_* é embutido no bundle em tempo de build: precisa ser a URL que o
# NAVEGADOR usa para falar com a API (não o hostname interno do Docker).
# ---------------------------------------------------------------------------
FROM base AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Runtime (output standalone do Next)
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
