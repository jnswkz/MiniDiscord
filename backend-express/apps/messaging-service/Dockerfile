FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/messaging-service/package.json ./apps/messaging-service/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/messaging-service ./apps/messaging-service
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/messaging-service --workspace=@minidiscord/common
EXPOSE 9084
CMD ["npm", "run", "start", "--workspace=@minidiscord/messaging-service"]
