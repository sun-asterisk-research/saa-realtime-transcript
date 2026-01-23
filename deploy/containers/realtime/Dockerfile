# syntax=docker/dockerfile:1

# =============================================================================
# Builder stage - Install dependencies and build the TypeScript application
# =============================================================================
FROM node:24-alpine AS builder

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/realtime/package.json ./packages/realtime/

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY turbo.json ./
COPY packages/realtime ./packages/realtime

# Build the application
RUN pnpm build:realtime

# =============================================================================
# Runner stage - Production image
# =============================================================================
FROM node:24-alpine AS runner

# Install pnpm for production dependency installation
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/realtime/package.json ./packages/realtime/

RUN pnpm install --frozen-lockfile --prod

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 realtime

# Copy built application
COPY --from=builder /app/packages/realtime/dist ./packages/realtime/dist

USER realtime

EXPOSE 3001

ENV PORT=3001

CMD ["node", "packages/realtime/dist/server.js"]
