export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  recipientStatus: "ONLINE" | "OFFLINE" | "IDLE" | "DND";
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
