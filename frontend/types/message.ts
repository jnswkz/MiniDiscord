export interface Message {
  id: string;
  roomId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  reactions: Reaction[];
  isEdited: boolean;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  replyTo: ReplyReference | null;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ReplyReference {
  messageId: string;
  content: string;
  senderName: string;
}

export interface ChatMessage {
  roomId: string;
  channelId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE";
  fileUrl?: string;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  username: string;
}
