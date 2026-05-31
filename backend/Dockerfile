# Strapi v5 Production Dockerfile
# Pre-built: dist/ is committed to git (avoids 30min server compile)
# Uses node:22-slim (Debian/glibc) so better-sqlite3 uses prebuilt binary (no C++ compile)
# Build context: repo root (backend/ + payments/ needed)

# syntax=docker/dockerfile:1
FROM node:22-slim AS runtime

# No build tools needed: better-sqlite3 v12.4.1 has prebuilt linux-x64 binaries
# node-pre-gyp downloads the prebuilt binary during npm ci (no C++ compilation)

WORKDIR /app

# Copy local billing package and install its deps
COPY payments/ /app/payments/
WORKDIR /app/payments
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

WORKDIR /app/backend

# Install production deps only (better-sqlite3 downloads prebuilt linux-x64 binary)
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy pre-built artifacts (dist/ includes admin panel at dist/build/)
COPY backend/dist ./dist
COPY backend/public ./public
# Copy TypeScript config sources for compilation
COPY backend/config ./config-src
# Use compiled JS configs from dist/config (strapi start can't load .ts source files)
COPY backend/dist/config ./config
# plans.js is plain JS (not TypeScript), so TypeScript compiler skips it — copy manually
COPY backend/config/plans.js ./config/plans.js
COPY backend/src ./src
COPY backend/types ./types

# Compile src/index.ts → dist/src/index.js at build time
# Compile config-src/database.ts → config/database.js at build time
# Delete old pre-built copies first to ensure fresh compile always wins
RUN rm -f dist/src/index.js dist/config/database.js config/database.js && \
    node_modules/.bin/tsc --outDir config --rootDir config-src --target ES2020 --module commonjs \
      --esModuleInterop true --allowSyntheticDefaultImports true --skipLibCheck true \
      config-src/database.ts && \
    node_modules/.bin/tsc --outDir dist --rootDir . --target ES2020 --module commonjs \
      --esModuleInterop true --allowSyntheticDefaultImports true --skipLibCheck true \
      src/index.ts && \
    echo "✅ Compiled config/database.js from TypeScript source" && \
    echo "✅ Compiled dist/src/index.js ($(wc -l < dist/src/index.js) lines, FACEBOOK=$(grep -c FACEBOOK dist/src/index.js || echo 0) refs)"

RUN mkdir -p /app/backend/.tmp

EXPOSE 1337
ENV NODE_ENV=production

# strapi start: loads from pre-built dist/ - no webpack, minimal RAM
CMD ["node_modules/.bin/strapi", "start"]
