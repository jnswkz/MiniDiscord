FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/chat-history-service/package.json ./apps/chat-history-service/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/chat-history-service ./apps/chat-history-service
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/chat-history-service --workspace=@minidiscord/common
EXPOSE 9083
CMD ["npm", "run", "start", "--workspace=@minidiscord/chat-history-service"]
