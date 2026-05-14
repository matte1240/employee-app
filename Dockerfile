# ========================================
# Multi-stage Dockerfile for Next.js 16
# ========================================

# Stage 1: Production-only dependencies (no devDependencies)
FROM node:25-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install only production dependencies; skip postinstall (prisma generate runs in builder).
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

# Stage 2: Builder
FROM node:25-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install ALL dependencies (needed to compile)
RUN npm ci --no-audit --no-fund && npm cache clean --force

COPY . .

# Generate Prisma Client (Prisma is already installed)
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Prisma CLI — isolated install of just the `prisma` package + its
# transitive deps (valibot, @prisma/studio-core, hono, …) needed by
# `npx prisma migrate deploy` at container start. Far lighter than copying
# the full prod-deps node_modules.
FROM node:25-alpine AS prisma-cli
WORKDIR /pcli
RUN npm init -y > /dev/null && \
    npm install --omit=optional --no-audit --no-fund prisma@7 && \
    npm cache clean --force

# Stage 4: Runner
FROM node:25-alpine AS runner
WORKDIR /app

# Install PostgreSQL client tools for backup/restore
RUN apk add --no-cache postgresql16-client openssl libc6-compat su-exec

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output ships server.js + minimal node_modules with traced
# deps (Prisma client, @prisma/adapter-pg, sharp, exceljs, aws-sdk, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Layer the isolated Prisma CLI tree on top of standalone's node_modules.
COPY --from=prisma-cli --chown=nextjs:nodejs /pcli/node_modules ./node_modules

# Recreate .bin/prisma symlink (Docker COPY may dereference it).
RUN ln -sf ../prisma/build/index.js /app/node_modules/.bin/prisma && \
    chmod +x /app/node_modules/prisma/build/index.js

# Prune dead weight that file tracing / prisma-cli tree drag in but the
# runtime never uses on Alpine x64:
#  - wrong-arch native binaries (we are linux-musl-x64)
#  - source maps inside node_modules
#  - non-PostgreSQL wasm query compilers (we only use Postgres via PrismaPg)
#  - markdown / license / changelog files
RUN set -e; \
    rm -rf /app/node_modules/@next/swc-linux-x64-gnu \
           /app/node_modules/@next/swc-darwin-x64 \
           /app/node_modules/@next/swc-darwin-arm64 \
           /app/node_modules/@next/swc-win32-x64-msvc \
           /app/node_modules/@next/swc-win32-arm64-msvc \
           /app/node_modules/@next/swc-linux-arm64-gnu \
           /app/node_modules/@next/swc-linux-arm64-musl \
           /app/node_modules/@img/sharp-libvips-linux-x64 \
           /app/node_modules/@img/sharp-linux-x64 \
           /app/node_modules/@img/sharp-darwin-x64 \
           /app/node_modules/@img/sharp-darwin-arm64 \
           /app/node_modules/@img/sharp-win32-x64 \
           /app/node_modules/@img/sharp-linux-arm64 \
           /app/node_modules/@img/sharp-libvips-darwin-x64 \
           /app/node_modules/@img/sharp-libvips-darwin-arm64 \
           /app/node_modules/@img/sharp-libvips-linux-arm64 \
           /app/node_modules/typescript \
           /app/node_modules/@esbuild /app/node_modules/esbuild \
           /app/node_modules/@types /app/node_modules/tsx; \
    rm -rf /app/node_modules/@swc/core-* 2>/dev/null || true; \
    find /app/node_modules/@prisma/client/runtime -type f \
        \( -name 'query_compiler_*_bg.cockroachdb.*' \
        -o -name 'query_compiler_*_bg.mysql.*' \
        -o -name 'query_compiler_*_bg.sqlite.*' \
        -o -name 'query_compiler_*_bg.sqlserver.*' \) -delete 2>/dev/null || true; \
    find /app/node_modules -type f \
        \( -name '*.map' -o -name 'README*' -o -name 'CHANGELOG*' \
        -o -name 'LICENSE*' -o -name 'license' -o -name '*.md' -o -name '*.markdown' \) \
        -delete 2>/dev/null || true; \
    find /app/node_modules -type d \
        \( -name 'test' -o -name 'tests' -o -name '__tests__' -o -name 'docs' \) \
        -prune -exec rm -rf {} + 2>/dev/null || true; \
    chown -R nextjs:nodejs /app/node_modules

# Copy Prisma schema, migrations, and config (needed by `prisma migrate deploy`)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Schema engine binary (downloaded by builder's postinstall on musl)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines/schema-engine-linux-musl-openssl-3.0.x /app/node_modules/@prisma/engines/schema-engine-linux-musl-openssl-3.0.x

RUN mkdir -p /app/logs /app/backups/database && \
    chown -R nextjs:nodejs /app/logs /app/backups

EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "import('http').then(h => h.default.get('http://localhost:3000/api/auth/session', r => {process.exit(r.statusCode === 200 ? 0 : 1)}))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
