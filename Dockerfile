# Vepari AI — Backend production image (PROMPT 225).
#
# Multi-stage build for the npm-workspace monorepo. The backend depends on the
# @vepari/types and @vepari/validation workspace packages, so we install and
# build from the repo root, then ship only the compiled output + production
# dependencies in a slim runtime image.
#
# Build:  docker build -t vepari-backend .
# Run:    docker run --env-file backend/.env -p 3000:3000 vepari-backend

# ── Stage 1: dependencies ─────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

# Prisma needs OpenSSL at build and runtime.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy only manifests first for better layer caching.
COPY package.json package-lock.json turbo.json ./
COPY packages/types/package.json packages/types/
COPY packages/validation/package.json packages/validation/
COPY backend/package.json backend/
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
# Generate the Prisma client, then compile the shared packages + backend.
RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npx turbo run build --filter=@vepari/backend...

# ── Stage 3: production dependencies only ─────────────────────────────────────
FROM deps AS prod-deps
WORKDIR /app
RUN npm prune --omit=dev

# ── Stage 4: runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Run as an unprivileged user.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs vepari

# Compiled output + pruned node_modules + generated Prisma client.
COPY --from=build --chown=vepari:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=vepari:nodejs /app/node_modules/.package-lock.json ./node_modules/.package-lock.json
COPY --from=build --chown=vepari:nodejs /app/backend/dist ./backend/dist
COPY --from=build --chown=vepari:nodejs /app/backend/package.json ./backend/package.json
COPY --from=build --chown=vepari:nodejs /app/backend/prisma ./backend/prisma
COPY --from=build --chown=vepari:nodejs /app/packages ./packages

USER vepari
WORKDIR /app/backend
EXPOSE 3000

# Liveness is validated by the platform hitting /health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# dumb-init reaps zombies and forwards signals for clean shutdown.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
