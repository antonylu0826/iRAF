FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/mcp/package.json ./packages/mcp/
COPY plugins/system/package.json ./plugins/system/
COPY modules/system/package.json ./modules/system/
COPY modules/sample/package.json ./modules/sample/
COPY app/package.json ./app/

RUN npm install

# Source is mounted at runtime via volume.
# Container only needs node + npm available.
# The dist files are built on the host and shared via volume.

EXPOSE 3001

# Run the pre-built server bundle
# dist-server/ is built by: npm run build:server --workspace=app
CMD ["node", "/app/app/dist-server/index.js"]
