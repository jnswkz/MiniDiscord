import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, sendSuccess, AppError } from '@minidiscord/common';
import { db, Message, ReadReceipt } from '../models/inMemoryDb';
import axios from 'axios';
import crypto from 'crypto';

const GROUP_CHANNEL_SERVICE_URL = process.env.GROUP_CHANNEL_SERVICE_URL || 'http://localhost:9082';

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1),
    fileUrl: z.string().url().optional(),
  }),
});

export const updateReadReceiptSchema = z.object({
  body: z.object({
    lastReadMessageId: z.string(),
  }),
});

export class MessageController {
  static async verifyMembership(roomId: string, userId: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'test') return true;
      const res = await axios.get(`${GROUP_CHANNEL_SERVICE_URL}/api/rooms/${roomId}/members/${userId}`, {
        headers: { 'x-user-id': userId }
      });
      return res.status === 200;
    } catch (err) {
      return false;
    }
  }

  // Actually, messages are created internally by messaging-service via events, but we can expose a direct API for testing or legacy purposes.
  // We will expose a fetch messages endpoint: GET /api/messages/:roomId/:channelId
  static getMessages = asyncHandler(async (req: Request, res: Response) => {
    const { roomId, channelId } = req.params;
    const userId = (req as any).user.sub;

    const isMember = await MessageController.verifyMembership(roomId, userId);
    if (!isMember) {
      throw new AppError('Not a member of this room', 403);
    }

    const messages: Message[] = [];
    for (const msg of db.messages.values()) {
      if (msg.channelId === channelId && !msg.isDeleted) {
        messages.push(msg);
      }
    }

    // Sort by createdAt ascending
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    sendSuccess(res, messages);
  });

  // POST /api/messages/:roomId/:channelId - for internal use by messaging-service, or direct API
  static createMessage = asyncHandler(async (req: Request, res: Response) => {
    const { roomId, channelId } = req.params;
    const userId = (req as any).user.sub;
    const { content, fileUrl } = req.body;

    // We can assume messaging-service already verified membership, but we verify again for safety
    const isMember = await MessageController.verifyMembership(roomId, userId);
    if (!isMember) {
      throw new AppError('Not a member of this room', 403);
    }

    const message: Message = {
      id: crypto.randomUUID(),
      roomId,
      channelId,
      senderId: userId,
      content,
      isDeleted: false,
      fileUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.messages.set(message.id, message);
    sendSuccess(res, message, 201);
  });

  static deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = (req as any).user.sub;

    const message = db.messages.get(messageId);
    if (!message) throw new AppError('Message not found', 404);

    if (message.senderId !== userId) {
      throw new AppError('Can only delete your own messages', 403);
    }

    message.isDeleted = true;
    message.updatedAt = new Date();

    sendSuccess(res, { message: 'Message deleted' });
  });

  static searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const query = (req.query.q as string)?.toLowerCase();
    const userId = (req as any).user.sub;

    if (!query) return sendSuccess(res, []);

    const isMember = await MessageController.verifyMembership(roomId, userId);
    if (!isMember) throw new AppError('Not a member of this room', 403);

    const results: Message[] = [];
    for (const msg of db.messages.values()) {
      if (msg.roomId === roomId && !msg.isDeleted && msg.content.toLowerCase().includes(query)) {
        results.push(msg);
      }
    }

    sendSuccess(res, results);
  });

  static updateReadReceipt = asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const { lastReadMessageId } = req.body;
    const userId = (req as any).user.sub;

    const receiptKey = `${channelId}:${userId}`;
    db.readReceipts.set(receiptKey, {
      channelId,
      userId,
      lastReadMessageId,
      updatedAt: new Date()
    });

    sendSuccess(res, { message: 'Read receipt updated' });
  });
}
