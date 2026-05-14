import { create } from "zustand";
import type { Message, ReplyReference } from "@/types";
import { useAuthStore } from "./authStore";

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

export interface ReplyTarget {
  messageId: string;
  senderName: string;
  content: string;
}

interface ChatState {
  channelMessages: Record<string, Message[]>;
  dmMessages: Record<string, DmMessage[]>;

  replyingTo: ReplyTarget | null;

  getChannelMessages: (channelId: string) => Message[];
  getDmMessages: (userId: string) => DmMessage[];

  sendChannelMessage: (channelId: string, roomId: string, content: string) => void;
  sendDmMessage: (recipientId: string, content: string) => void;

  setReplyingTo: (target: ReplyTarget) => void;
  clearReplyingTo: () => void;
  addReaction: (channelId: string, messageId: string, emoji: string) => void;
  addDmReaction: (recipientId: string, messageId: string, emoji: string) => void;

  /* WebSocket: receive message from /topic/room.{roomId} */
  receiveMessage: (channelId: string, message: Message) => void;
}

let nextId = 1;
function generateId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channelMessages: {},
  dmMessages: {},
  replyingTo: null,

  getChannelMessages: (channelId) => get().channelMessages[channelId] ?? [],

  getDmMessages: (userId) => get().dmMessages[userId] ?? [],

  setReplyingTo: (target) => set({ replyingTo: target }),
  clearReplyingTo: () => set({ replyingTo: null }),

  sendChannelMessage: (channelId, roomId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const { replyingTo } = get();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const newMessage: Message = {
      id: generateId(),
      roomId,
      channelId,
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.avatarUrl,
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
        [channelId]: [...(state.channelMessages[channelId] ?? []), newMessage],
      },
    }));
  },

  addReaction: (channelId, messageId, emoji) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => {
      const msgs = state.channelMessages[channelId];
      if (!msgs) return state;

      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
        let newReactions = [...msg.reactions];

        if (existingIdx >= 0) {
          const existing = newReactions[existingIdx];
          const hasReacted = existing.userIds.includes(user.id);

          if (hasReacted) {
            const newUserIds = existing.userIds.filter((id) => id !== user.id);
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
              userIds: [...existing.userIds, user.id],
              count: existing.count + 1,
            };
          }
        } else {
          newReactions.push({
            emoji,
            userIds: [user.id],
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
    const user = useAuthStore.getState().user;
    if (!user) return;

    const newMessage: DmMessage = {
      id: generateId(),
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.avatarUrl,
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
        [recipientId]: [...(state.dmMessages[recipientId] ?? []), newMessage],
      },
    }));
  },

  addDmReaction: (recipientId, messageId, emoji) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => {
      const msgs = state.dmMessages[recipientId];
      if (!msgs) return state;

      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
        let newReactions = [...msg.reactions];

        if (existingIdx >= 0) {
          const existing = newReactions[existingIdx];
          const hasReacted = existing.userIds.includes(user.id);

          if (hasReacted) {
            const newUserIds = existing.userIds.filter((id) => id !== user.id);
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
              userIds: [...existing.userIds, user.id],
              count: existing.count + 1,
            };
          }
        } else {
          newReactions.push({
            emoji,
            userIds: [user.id],
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

  receiveMessage: (channelId, message) => {
    set((state) => ({
      channelMessages: {
        ...state.channelMessages,
        [channelId]: [...(state.channelMessages[channelId] ?? []), message],
      },
    }));
  },
}));
