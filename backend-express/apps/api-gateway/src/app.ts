import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { errorHandler, securityHeaders } from '@minidiscord/common';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';

const app = express();

app.use(securityHeaders);
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
}));
app.use(cookieParser());

// Health checks
app.use('/health', healthRouter);
app.use('/ready', healthRouter);

// Global Middlewares
app.use(authMiddleware);
app.use(rateLimitMiddleware);

// Proxy Routes
app.use(createProxyMiddleware({ pathFilter: '/api/auth', target: config.services.user, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/users', target: config.services.user, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/demo', target: config.services.user, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/rooms', target: config.services.groupChannel, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/channels', target: config.services.groupChannel, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/messages', target: config.services.chatHistory, changeOrigin: true }));
app.use(createProxyMiddleware({ pathFilter: '/api/files', target: config.services.file, changeOrigin: true }));

// WebSocket proxy
app.use(createProxyMiddleware({ pathFilter: '/ws', target: config.services.messaging, changeOrigin: true, ws: true }));

app.use(errorHandler);

export { app };
