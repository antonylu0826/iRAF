# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests for layer caching
COPY package*.json tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/mcp/package.json ./packages/mcp/
COPY plugins/system/package.json ./plugins/system/
COPY app/package.json ./app/

# Copy source (includes all modules dynamically)
COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY modules/ ./modules/
COPY app/ ./app/

RUN npm install --include=dev

# Build framework packages
RUN npm run build --workspace=packages/core
RUN npm run build --workspace=packages/react
RUN npm run build --workspace=plugins/system

# Build all modules dynamically
RUN for dir in modules/*/; do \
      name=$(node -e "process.stdout.write(require('./${dir}package.json').name)"); \
      echo "Building $name..."; \
      npm run build --workspace="$name"; \
    done

# Build server bundle and frontend
RUN npm run build:server --workspace=app
RUN npm run build --workspace=app

# ─── Stage 2: Server ──────────────────────────────────────────────────────────
FROM node:20-alpine AS server

WORKDIR /app

COPY package*.json tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/mcp/package.json ./packages/mcp/
COPY plugins/system/package.json ./plugins/system/
COPY app/package.json ./app/

COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY modules/ ./modules/
COPY app/package.json ./app/

RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/react/dist ./packages/react/dist
COPY --from=builder /app/plugins/system/dist ./plugins/system/dist
COPY --from=builder /app/modules ./modules
COPY --from=builder /app/app/dist-server ./app/dist-server

EXPOSE 3001
CMD ["node", "/app/app/dist-server/index.js"]

# ─── Stage 3: Frontend (nginx serving Vite static build) ─────────────────────
FROM nginx:alpine AS frontend

COPY --from=builder /app/app/dist /usr/share/nginx/html
COPY --from=builder /app/app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
