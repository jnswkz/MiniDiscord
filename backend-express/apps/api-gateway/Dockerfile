FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/api-gateway ./apps/api-gateway
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/api-gateway --workspace=@minidiscord/common
EXPOSE 9080
CMD ["npm", "run", "start", "--workspace=@minidiscord/api-gateway"]
