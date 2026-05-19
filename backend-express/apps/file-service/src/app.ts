import express from 'express';
import { errorHandler } from '@minidiscord/common';
import { healthRouter } from './routes/health.routes';
import { fileRouter } from './routes/file.routes';

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/ready', healthRouter);

app.use('/api/files', fileRouter);

app.use(errorHandler);

export { app };
