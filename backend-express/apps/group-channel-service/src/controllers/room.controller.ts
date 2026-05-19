import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, sendSuccess, AppError } from '@minidiscord/common';
import { db, Room, RoomMember } from '../models/inMemoryDb';
import crypto from 'crypto';

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string(),
  }),
});

export class RoomController {
  static createRoom = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.sub;
    const { name, description, isPrivate } = req.body;

    const room: Room = {
      id: crypto.randomUUID(),
      name,
      description,
      ownerId: userId,
      isPrivate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.rooms.set(room.id, room);

    // Add owner as a member
    const member: RoomMember = {
      roomId: room.id,
      userId,
      role: 'OWNER',
      joinedAt: new Date(),
    };
    db.roomMembers.set(`${room.id}:${userId}`, member);

    sendSuccess(res, room, 201);
  });

  static getMyRooms = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.sub;
    const myRooms: Room[] = [];

    for (const member of db.roomMembers.values()) {
      if (member.userId === userId) {
        const room = db.rooms.get(member.roomId);
        if (room) {
          myRooms.push(room);
        }
      }
    }

    sendSuccess(res, myRooms);
  });

  static getRoom = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const room = db.rooms.get(roomId);
    if (!room) throw new AppError('Room not found', 404);

    sendSuccess(res, room);
  });

  static getMembers = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const members: RoomMember[] = [];

    for (const member of db.roomMembers.values()) {
      if (member.roomId === roomId) {
        members.push(member);
      }
    }

    sendSuccess(res, members);
  });

  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    const currentUserId = (req as any).user.sub;

    const room = db.rooms.get(roomId);
    if (!room) throw new AppError('Room not found', 404);

    // Ensure requester is owner or admin
    const requesterMember = db.roomMembers.get(`${roomId}:${currentUserId}`);
    if (!requesterMember || (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')) {
      throw new AppError('Only admins can add members', 403);
    }

    const membershipKey = `${roomId}:${userId}`;
    if (db.roomMembers.has(membershipKey)) {
      throw new AppError('User is already a member', 400);
    }

    const newMember: RoomMember = {
      roomId,
      userId,
      role: 'MEMBER',
      joinedAt: new Date(),
    };

    db.roomMembers.set(membershipKey, newMember);
    sendSuccess(res, newMember, 201);
  });

  // Used by chat-history and messaging services to verify if a user is in a room
  static verifyMembership = asyncHandler(async (req: Request, res: Response) => {
    const { roomId, userId } = req.params;
    const membershipKey = `${roomId}:${userId}`;
    const member = db.roomMembers.get(membershipKey);

    if (!member) {
      return res.status(403).json({ success: false, message: 'Not a member' });
    }

    sendSuccess(res, member);
  });
}
