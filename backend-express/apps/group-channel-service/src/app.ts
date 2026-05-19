import express from 'express';
import { errorHandler } from '@minidiscord/common';
import { healthRouter } from './routes/health.routes';
import { roomRouter } from './routes/room.routes';
import { channelRouter } from './routes/channel.routes';

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/ready', healthRouter);

app.use('/api/rooms', roomRouter);
app.use('/api/rooms/:roomId/channels', channelRouter);

app.use(errorHandler);

export { app };
