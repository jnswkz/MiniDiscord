import { app } from './app';
import { config } from './config';
import { setupWebSocket } from './wsServer';
import http from 'http';

const server = http.createServer(app);

setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`[messaging-service] Server is running at http://localhost:${config.port}`);
});
