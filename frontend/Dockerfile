FROM node:22-alpine
WORKDIR /app

# Layer 1: Install dependencies (cached nếu package.json không đổi)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Layer 2: Copy source code
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
