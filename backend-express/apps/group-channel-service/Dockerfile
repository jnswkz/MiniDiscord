FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/group-channel-service/package.json ./apps/group-channel-service/
COPY packages/common/package.json ./packages/common/
RUN npm ci
COPY apps/group-channel-service ./apps/group-channel-service
COPY packages/common ./packages/common
COPY tsconfig.base.json ./
RUN npm run build --workspace=@minidiscord/group-channel-service --workspace=@minidiscord/common
EXPOSE 9082
CMD ["npm", "run", "start", "--workspace=@minidiscord/group-channel-service"]
