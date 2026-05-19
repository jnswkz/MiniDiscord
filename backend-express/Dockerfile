# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install all dependencies
RUN npm ci

# Build all packages and apps
# We first explicitly build common just in case topological sort misses it
RUN npm run build --workspace=@minidiscord/common && npm run build --workspaces --if-present

# Prune dev dependencies for a smaller image
RUN npm prune --production

# Stage 2: Runner
FROM node:22-alpine

WORKDIR /app
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy common package
COPY --from=builder /app/packages/common/package.json ./packages/common/
COPY --from=builder /app/packages/common/dist ./packages/common/dist

# Copy specific app
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist

EXPOSE 8080

CMD node apps/${APP_NAME}/dist/server.js
