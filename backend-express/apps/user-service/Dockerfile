FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/user-service/package.json ./apps/user-service/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/user-service ./apps/user-service
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/user-service --workspace=@minidiscord/common
EXPOSE 9081
CMD ["npm", "run", "start", "--workspace=@minidiscord/user-service"]
