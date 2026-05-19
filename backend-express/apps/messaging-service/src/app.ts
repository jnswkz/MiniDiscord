import express from 'express';
import { healthRouter } from './routes/health.routes';

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/ready', healthRouter);

export { app };
