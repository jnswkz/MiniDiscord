import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, sendSuccess, AppError } from '@minidiscord/common';
import { db, Channel } from '../models/inMemoryDb';
import crypto from 'crypto';

export const createChannelSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(['TEXT', 'VOICE']).default('TEXT'),
  }),
});

export class ChannelController {
  static createChannel = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { name, type } = req.body;
    const userId = (req as any).user.sub;

    const room = db.rooms.get(roomId);
    if (!room) throw new AppError('Room not found', 404);

    // Verify membership & permissions
    const membershipKey = `${roomId}:${userId}`;
    const member = db.roomMembers.get(membershipKey);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('Only admins can create channels', 403);
    }

    const channel: Channel = {
      id: crypto.randomUUID(),
      roomId,
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.channels.set(channel.id, channel);
    sendSuccess(res, channel, 201);
  });

  static getChannels = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const userId = (req as any).user.sub;

    // Verify membership
    const membershipKey = `${roomId}:${userId}`;
    if (!db.roomMembers.has(membershipKey)) {
      throw new AppError('Access denied', 403);
    }

    const channels: Channel[] = [];
    for (const channel of db.channels.values()) {
      if (channel.roomId === roomId) {
        channels.push(channel);
      }
    }

    sendSuccess(res, channels);
  });

  static deleteChannel = asyncHandler(async (req: Request, res: Response) => {
    const { roomId, channelId } = req.params;
    const userId = (req as any).user.sub;

    const channel = db.channels.get(channelId);
    if (!channel || channel.roomId !== roomId) {
      throw new AppError('Channel not found in this room', 404);
    }

    // Verify permissions
    const membershipKey = `${roomId}:${userId}`;
    const member = db.roomMembers.get(membershipKey);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('Only admins can delete channels', 403);
    }

    db.channels.delete(channelId);
    sendSuccess(res, { message: 'Channel deleted' });
  });
}
