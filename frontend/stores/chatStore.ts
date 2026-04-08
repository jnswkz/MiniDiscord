import { create } from "zustand";
import type { Message, ReplyReference } from "@/types";
import {
  MOCK_MESSAGES,
  MOCK_USERS,
  CURRENT_USER,
  MOCK_DIRECT_MESSAGES,
} from "@/lib/mock-data";

/* ─── DM message type (lighter than full Message) ──────────────────── */
export interface DmMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  replyTo?: ReplyReference | null;
  reactions: { emoji: string; userIds: string[]; count: number }[];
}

/* ─── Reply target info ────────────────────────────────────────────── */
export interface ReplyTarget {
  messageId: string;
  senderName: string;
  content: string;
}

/* ─── Generate initial DM messages per recipient ───────────────────── */
function buildInitialDmMessages(): Record<string, DmMessage[]> {
  const map: Record<string, DmMessage[]> = {};

  for (const dm of MOCK_DIRECT_MESSAGES) {
    const user = MOCK_USERS.find((u) => u.id === dm.recipientId);
    if (!user) continue;

    map[dm.recipientId] = [
      {
        id: `dm-init-${dm.recipientId}-1`,
        senderId: dm.recipientId,
        senderName: user.username,
        senderAvatar: user.avatarUrl,
        content: `Chào ${CURRENT_USER.username}! 👋`,
        createdAt: "2026-03-26T07:00:00Z",
        reactions: [],
      },
      {
        id: `dm-init-${dm.recipientId}-2`,
        senderId: CURRENT_USER.id,
        senderName: CURRENT_USER.username,
        senderAvatar: CURRENT_USER.avatarUrl,
        content: `Hey ${user.username}! Có gì mới không?`,
        createdAt: "2026-03-26T07:05:00Z",
        reactions: [],
      },
      {
        id: `dm-init-${dm.recipientId}-3`,
        senderId: dm.recipientId,
        senderName: user.username,
        senderAvatar: user.avatarUrl,
        content: dm.lastMessage,
        createdAt: "2026-03-26T08:00:00Z",
        reactions: [],
      },
    ];
  }

  return map;
}

let nextId = 1;
function generateId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

/* ─── Store interface ──────────────────────────────────────────────── */
interface ChatState {
  channelMessages: Record<string, Message[]>;
  dmMessages: Record<string, DmMessage[]>;

  /** Currently replying to this message (null = not replying) */
  replyingTo: ReplyTarget | null;

  getChannelMessages: (channelId: string) => Message[];
  getDmMessages: (userId: string) => DmMessage[];

  sendChannelMessage: (channelId: string, roomId: string, content: string) => void;
  sendDmMessage: (recipientId: string, content: string) => void;

  /** Set the message being replied to */
  setReplyingTo: (target: ReplyTarget) => void;
  /** Cancel reply mode */
  clearReplyingTo: () => void;
  /** Add or toggle a reaction on a channel message */
  addReaction: (channelId: string, messageId: string, emoji: string) => void;
  /** Add or toggle a reaction on a DM message */
  addDmReaction: (recipientId: string, messageId: string, emoji: string) => void;
}

/* ─── Build initial channel messages grouped by channelId ──────────── */
function groupByChannel(messages: Message[]): Record<string, Message[]> {
  const map: Record<string, Message[]> = {};
  for (const msg of messages) {
    if (!map[msg.channelId]) map[msg.channelId] = [];
    map[msg.channelId].push(msg);
  }
  return map;
}

const EMPTY_CHANNEL: Message[] = [];
const EMPTY_DM: DmMessage[] = [];

export const useChatStore = create<ChatState>((set, get) => ({
  channelMessages: groupByChannel([...MOCK_MESSAGES]),
  dmMessages: buildInitialDmMessages(),
  replyingTo: null,

  getChannelMessages: (channelId) =>
    get().channelMessages[channelId] ?? EMPTY_CHANNEL,

  getDmMessages: (userId) =>
    get().dmMessages[userId] ?? EMPTY_DM,

  setReplyingTo: (target) => set({ replyingTo: target }),
  clearReplyingTo: () => set({ replyingTo: null }),

  sendChannelMessage: (channelId, roomId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const { replyingTo } = get();

    const newMessage: Message = {
      id: generateId(),
      roomId,
      channelId,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.username,
      senderAvatar: CURRENT_USER.avatarUrl,
      type: "TEXT",
      content: trimmed,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      reactions: [],
      isEdited: false,
      isDeleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      replyTo: replyingTo
        ? {
            messageId: replyingTo.messageId,
            content: replyingTo.content.slice(0, 100),
            senderName: replyingTo.senderName,
          }
        : null,
    };

    set((state) => ({
      replyingTo: null,
      channelMessages: {
        ...state.channelMessages,
        [channelId]: [
          ...(state.channelMessages[channelId] ?? []),
          newMessage,
        ],
      },
    }));
  },

  addReaction: (channelId, messageId, emoji) => {
    set((state) => {
      const msgs = state.channelMessages[channelId];
      if (!msgs) return state;

      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
        let newReactions = [...msg.reactions];

        if (existingIdx >= 0) {
          const existing = newReactions[existingIdx];
          const hasReacted = existing.userIds.includes(CURRENT_USER.id);

          if (hasReacted) {
            // Remove user's reaction
            const newUserIds = existing.userIds.filter((id) => id !== CURRENT_USER.id);
            if (newUserIds.length === 0) {
              newReactions.splice(existingIdx, 1);
            } else {
              newReactions[existingIdx] = {
                ...existing,
                userIds: newUserIds,
                count: newUserIds.length,
              };
            }
          } else {
            // Add user to existing reaction
            newReactions[existingIdx] = {
              ...existing,
              userIds: [...existing.userIds, CURRENT_USER.id],
              count: existing.count + 1,
            };
          }
        } else {
          // New reaction
          newReactions.push({
            emoji,
            userIds: [CURRENT_USER.id],
            count: 1,
          });
        }

        return { ...msg, reactions: newReactions };
      });

      return {
        channelMessages: {
          ...state.channelMessages,
          [channelId]: updated,
        },
      };
    });
  },

  sendDmMessage: (recipientId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const { replyingTo } = get();

    const newMessage: DmMessage = {
      id: generateId(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.username,
      senderAvatar: CURRENT_USER.avatarUrl,
      content: trimmed,
      createdAt: new Date().toISOString(),
      reactions: [],
      replyTo: replyingTo
        ? {
            messageId: replyingTo.messageId,
            content: replyingTo.content.slice(0, 100),
            senderName: replyingTo.senderName,
          }
        : null,
    };

    set((state) => ({
      replyingTo: null,
      dmMessages: {
        ...state.dmMessages,
        [recipientId]: [
          ...(state.dmMessages[recipientId] ?? []),
          newMessage,
        ],
      },
    }));
  },

  addDmReaction: (recipientId, messageId, emoji) => {
    set((state) => {
      const msgs = state.dmMessages[recipientId];
      if (!msgs) return state;

      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
        let newReactions = [...msg.reactions];

        if (existingIdx >= 0) {
          const existing = newReactions[existingIdx];
          const hasReacted = existing.userIds.includes(CURRENT_USER.id);

          if (hasReacted) {
            const newUserIds = existing.userIds.filter((id) => id !== CURRENT_USER.id);
            if (newUserIds.length === 0) {
              newReactions.splice(existingIdx, 1);
            } else {
              newReactions[existingIdx] = {
                ...existing,
                userIds: newUserIds,
                count: newUserIds.length,
              };
            }
          } else {
            newReactions[existingIdx] = {
              ...existing,
              userIds: [...existing.userIds, CURRENT_USER.id],
              count: existing.count + 1,
            };
          }
        } else {
          newReactions.push({
            emoji,
            userIds: [CURRENT_USER.id],
            count: 1,
          });
        }

        return { ...msg, reactions: newReactions };
      });

      return {
        dmMessages: {
          ...state.dmMessages,
          [recipientId]: updated,
        },
      };
    });
  },
}));
