import crypto from 'crypto';

export interface Message {
  id: string;
  roomId: string;
  channelId: string;
  senderId: string;
  content: string;
  isDeleted: boolean;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadReceipt {
  channelId: string;
  userId: string;
  lastReadMessageId: string;
  updatedAt: Date;
}

class InMemoryDb {
  public messages: Map<string, Message> = new Map();
  // Key: channelId:userId
  public readReceipts: Map<string, ReadReceipt> = new Map();

  constructor() {
    // Seed some messages if needed
  }
}

export const db = new InMemoryDb();
