import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from '@minidiscord/common';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { demoRouter } from './routes/demo.routes';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/ready', healthRouter);

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/demo', demoRouter);

app.use(errorHandler);

export { app };
