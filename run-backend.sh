#!/usr/bin/env bash

# Terminate all background processes on exit (Ctrl+C)
trap "kill 0" EXIT

echo -e "\033[1;34m==================================================\033[0m"
echo -e "\033[1;34m   Starting MiniDiscord Express Backend Monorepo  \033[0m"
echo -e "\033[1;34m==================================================\033[0m"

cd backend-express

# 1. Build common package first (others depend on its typescript dist folder)
echo -e "\033[1;33m[1/3] Building common package...\033[0m"
npm run build --workspace=@minidiscord/common

if [ $? -ne 0 ]; then
  echo -e "\033[1;31mError building @minidiscord/common!\033[0m"
  exit 1
fi

echo -e "\033[1;32m[2/3] Common library compiled successfully.\033[0m"
echo -e "\033[1;33m[3/3] Launching microservices in development mode...\033[0m"

# 2. Run all microservices in background
npm run dev --workspace=@minidiscord/user-service &
npm run dev --workspace=@minidiscord/group-channel-service &
npm run dev --workspace=@minidiscord/chat-history-service &
npm run dev --workspace=@minidiscord/file-service &
npm run dev --workspace=@minidiscord/messaging-service &

# 3. Wait 2 seconds for services to initialize before starting the API Gateway
sleep 2
npm run dev --workspace=@minidiscord/api-gateway &

echo -e "\033[1;32m==================================================\033[0m"
echo -e "\033[1;32m   All services running! Press Ctrl+C to stop.   \033[0m"
echo -e "\033[1;32m==================================================\033[0m"

# Wait for all background jobs to finish
wait
