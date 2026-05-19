FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/file-service/package.json ./apps/file-service/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/file-service ./apps/file-service
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/file-service --workspace=@minidiscord/common
EXPOSE 9085
CMD ["npm", "run", "start", "--workspace=@minidiscord/file-service"]
