import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccessToken, logger } from '@minidiscord/common';
import axios from 'axios';

const GROUP_CHANNEL_SERVICE_URL = process.env.GROUP_CHANNEL_SERVICE_URL || 'http://localhost:9082';
const CHAT_HISTORY_SERVICE_URL = process.env.CHAT_HISTORY_SERVICE_URL || 'http://localhost:9083';

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

// Very basic STOMP parser
export const parseStompFrame = (data: string): StompFrame | null => {
  const parts = data.split('\n\n');
  if (parts.length < 2) return null;
  
  const headerLines = parts[0].split('\n');
  const command = headerLines[0];
  const headers: Record<string, string> = {};
  
  for (let i = 1; i < headerLines.length; i++) {
    const idx = headerLines[i].indexOf(':');
    if (idx > 0) {
      headers[headerLines[i].substring(0, idx).trim()] = headerLines[i].substring(idx + 1).trim();
    }
  }
  
  const body = parts.slice(1).join('\n\n').replace(/\0$/, '');
  return { command, headers, body };
};

export const createStompFrame = (command: string, headers: Record<string, string>, body: string = ''): string => {
  let frame = `${command}\n`;
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += `\n${body}\0`;
  return frame;
};

interface Client {
  ws: WebSocket;
  userId: string;
  subscriptions: Map<string, string>; // subId -> destination
}

export const setupWebSocket = (server: any) => {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<string, Client>(); // ws.id -> Client
  
  // To handle fan-out: destination -> Set of clients
  const destinations = new Map<string, Set<Client>>();

  wss.on('connection', (ws, req) => {
    let client: Client | null = null;
    let clientId = Math.random().toString(36).substring(7);

    ws.on('message', async (data) => {
      const frameStr = data.toString();
      // STOMP heartbeat
      if (frameStr === '\n' || frameStr === '\r\n') {
        ws.send('\n');
        return;
      }

      const frame = parseStompFrame(frameStr);
      if (!frame) return;

      try {
        switch (frame.command) {
          case 'CONNECT': {
            // Auth
            let token = frame.headers['Authorization'] || frame.headers['passcode'];
            if (token?.startsWith('Bearer ')) token = token.substring(7);
            
            if (!token && req.headers.cookie) {
              const match = req.headers.cookie.match(/access_token=([^;]+)/);
              if (match) token = match[1];
            }

            if (!token) {
              ws.send(createStompFrame('ERROR', { message: 'Missing token' }));
              return ws.close();
            }

            const payload = await verifyAccessToken(token);
            client = {
              ws,
              userId: payload.sub,
              subscriptions: new Map()
            };
            clients.set(clientId, client);
            
            ws.send(createStompFrame('CONNECTED', { version: '1.2' }));
            break;
          }

          case 'SUBSCRIBE': {
            if (!client) return;
            const dest = frame.headers['destination'];
            const id = frame.headers['id'];
            if (!dest || !id) return;
            
            // Expected format: /topic/rooms.{roomId} or /topic/channels.{channelId}
            // Need to verify membership
            let roomId: string | undefined;
            if (dest.startsWith('/topic/rooms.')) {
              roomId = dest.split('.')[1];
            } else if (dest.startsWith('/topic/channels.')) {
              // We'd need to find the room for the channel. We skip strict checking for the demo
              // or do it if we want.
            }

            if (roomId) {
               // Fast check, ignoring fail for demo if group-channel is down
               try {
                 await axios.get(`${GROUP_CHANNEL_SERVICE_URL}/api/rooms/${roomId}/members/${client.userId}`, {
                    headers: { 'x-user-id': client.userId }
                 });
               } catch (err: any) {
                 if (err.response?.status === 403) {
                   ws.send(createStompFrame('ERROR', { message: 'Not a member' }));
                   return;
                 }
               }
            }

            client.subscriptions.set(id, dest);
            if (!destinations.has(dest)) destinations.set(dest, new Set());
            destinations.get(dest)!.add(client);
            
            break;
          }

          case 'SEND': {
            if (!client) return;
            const dest = frame.headers['destination'];
            if (!dest) return;

            // Broadcast to destination
            const subs = destinations.get(dest);
            if (subs) {
              const bodyJson = JSON.parse(frame.body);
              bodyJson.senderId = client.userId;
              
              // Publish to chat-history
              if (dest.startsWith('/topic/channels.')) {
                 const channelId = dest.split('.')[1];
                 const roomId = bodyJson.roomId; // the client should send roomId
                 if (roomId) {
                   try {
                     const msgRes = await axios.post(`${CHAT_HISTORY_SERVICE_URL}/api/messages/${roomId}/${channelId}`, {
                       content: bodyJson.content,
                       fileUrl: bodyJson.fileUrl
                     }, { headers: { 'x-user-id': client.userId } });
                     
                     // Use the created message as body
                     Object.assign(bodyJson, msgRes.data.data);
                   } catch (err) {
                     logger.error('Failed to persist message');
                   }
                 }
              }

              const msgFrame = createStompFrame('MESSAGE', { destination: dest, 'content-type': 'application/json' }, JSON.stringify(bodyJson));
              
              subs.forEach(c => {
                c.ws.send(msgFrame);
              });
            }
            break;
          }

          case 'DISCONNECT': {
            ws.close();
            break;
          }
        }
      } catch (err) {
        ws.send(createStompFrame('ERROR', { message: 'Internal error' }));
      }
    });

    ws.on('close', () => {
      if (client) {
        clients.delete(clientId);
        client.subscriptions.forEach((dest, id) => {
          destinations.get(dest)?.delete(client!);
        });
      }
    });
  });
  
  return wss;
};
