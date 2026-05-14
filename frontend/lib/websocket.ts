import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/chat";
const IS_DEV = process.env.NODE_ENV === "development";

let client: Client | null = null;

/**
 * Get or create a singleton STOMP client.
 * JWT is passed via STOMP CONNECT `connectHeaders` (not HTTP headers —
 * browsers don't allow custom headers on WebSocket upgrade requests).
 */
export function getStompClient(token: string): Client {
  if (client) return client;

  client = new Client({
    brokerURL: WS_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: IS_DEV ? (str) => console.log("[STOMP]", str) : () => {},
  });

  return client;
}

/** Activate the current client (connect). No-op if already active. */
export function activateClient(): void {
  if (client && !client.active) {
    client.activate();
  }
}

/** Deactivate and dispose the singleton. */
export function deactivateClient(): void {
  if (client) {
    client.deactivate();
    client = null;
  }
}

/** Check if client is currently connected. */
export function isConnected(): boolean {
  return client?.connected ?? false;
}

export type { IMessage, StompSubscription };
