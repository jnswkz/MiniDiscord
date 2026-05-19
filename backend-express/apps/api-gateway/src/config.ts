export const config = {
  port: parseInt(process.env.PORT || '9080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:9081',
    groupChannel: process.env.GROUP_SERVICE_URL || 'http://localhost:9082',
    chatHistory: process.env.CHAT_HISTORY_SERVICE_URL || 'http://localhost:9083',
    messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:9084',
    file: process.env.FILE_SERVICE_URL || 'http://localhost:9085',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: process.env.CORS_ALLOW_CREDENTIALS !== 'false',
  },
  rateLimit: {
    maxRequests: parseInt(process.env.GATEWAY_RATE_LIMIT_MAX_REQUESTS || '20', 10),
    windowSeconds: parseInt(process.env.GATEWAY_RATE_LIMIT_WINDOW_SECONDS || '10', 10),
  },
};
