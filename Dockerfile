# ========================================
# Multi-stage Dockerfile for Next.js 16
# ========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

# Copy package files and Prisma schema (needed for postinstall)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL dependencies (including Prisma for migrations)
RUN npm install && npm cache clean --force

# Stage 2: Development
FROM node:20-alpine AS dev
WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

# Install PostgreSQL client tools for migrations
RUN apk add --no-cache postgresql16-client curl

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Copy Prisma schema
COPY prisma ./prisma

# Expose port
EXPOSE 3000

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all dependencies from deps stage (including Prisma)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy package files
COPY package.json package-lock.json* ./

# Generate Prisma Client (Prisma is already installed)
RUN npx prisma generate

# Build Next.js application
# This will create an optimized production build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

# Install PostgreSQL client tools for backup/restore
RUN apk add --no-cache postgresql16-client

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy all production dependencies (including Prisma)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create directories for logs and backups
RUN mkdir -p /app/logs /app/backups/database && \
    chown -R nextjs:nodejs /app/logs /app/backups

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/auth/session', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
