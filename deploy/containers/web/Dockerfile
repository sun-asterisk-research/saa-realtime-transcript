# syntax=docker/dockerfile:1

# =============================================================================
# Builder stage - Install dependencies and build the Next.js application
# =============================================================================
FROM node:24-alpine AS builder

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY turbo.json ./
COPY packages/web ./packages/web

ARG NEXT_PUBLIC_REALTIME_TRANSCRIBE_ENDPOINT
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_REALTIME_TRANSCRIBE_ENDPOINT=${NEXT_PUBLIC_REALTIME_TRANSCRIBE_ENDPOINT}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Build the application
RUN pnpm build:web

# =============================================================================
# Runner stage - Production image
# =============================================================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application (public must be alongside server.js in standalone mode)
COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/web/server.js"]
