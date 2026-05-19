import express from 'express';
import { errorHandler } from '@minidiscord/common';
import { healthRouter } from './routes/health.routes';
import { messageRouter } from './routes/message.routes';

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/ready', healthRouter);

app.use('/api/messages', messageRouter);

app.use(errorHandler);

export { app };
