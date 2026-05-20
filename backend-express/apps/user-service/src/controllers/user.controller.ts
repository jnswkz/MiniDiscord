import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, sendSuccess, AppError } from '@minidiscord/common';
import { db, User, Friendship, FriendshipStatus } from '../models/inMemoryDb';
import crypto from 'crypto';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ONLINE', 'OFFLINE', 'IDLE', 'DND']),
  }),
});

export const addFriendSchema = z.object({
  body: z.object({
    addresseeId: z.string().uuid(),
  }),
});

export class UserController {
  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const user = db.users.get(userId);
    if (!user) throw new AppError('User not found', 404);

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { ...safeUser, username: user.name });
  });

  static updateMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const user = db.users.get(userId);
    if (!user) throw new AppError('User not found', 404);

    const { name, avatarUrl } = req.body;
    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    user.updatedAt = new Date();

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { ...safeUser, username: user.name });
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const user = db.users.get(userId);
    if (!user) throw new AppError('User not found', 404);

    const { status } = req.body;
    user.status = status;
    user.updatedAt = new Date();

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { ...safeUser, username: user.name });
  });

  static searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string)?.toLowerCase();
    if (!query) {
      return sendSuccess(res, []);
    }

    const currentUserId = (req as any).user?.sub;
    const results: any[] = [];

    for (const user of db.users.values()) {
      if (user.id !== currentUserId && 
         (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))) {
        const { passwordHash, ...safeUser } = user;
        results.push({ ...safeUser, username: user.name });
      }
    }

    sendSuccess(res, results);
  });

  static getFriends = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const friends: any[] = [];

    for (const friendship of db.friendships.values()) {
      if (friendship.requesterId === userId || friendship.addresseeId === userId) {
        const otherId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
        const otherUser = db.users.get(otherId);
        if (otherUser) {
          const { passwordHash, ...safeUser } = otherUser;
          friends.push({
            friendshipId: friendship.id,
            status: friendship.status,
            createdAt: friendship.createdAt,
            user: { ...safeUser, username: otherUser.name }
          });
        }
      }
    }

    sendSuccess(res, friends);
  });

  static addFriend = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const { addresseeId } = req.body;

    if (userId === addresseeId) throw new AppError('Cannot add yourself', 400);
    const addressee = db.users.get(addresseeId);
    if (!addressee) throw new AppError('User not found', 404);

    // Check if friendship exists
    for (const f of db.friendships.values()) {
      if ((f.requesterId === userId && f.addresseeId === addresseeId) ||
          (f.requesterId === addresseeId && f.addresseeId === userId)) {
        throw new AppError('Friendship already exists', 400);
      }
    }

    const friendship: Friendship = {
      id: crypto.randomUUID(),
      requesterId: userId,
      addresseeId: addresseeId,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.friendships.set(friendship.id, friendship);
    sendSuccess(res, friendship, 201);
  });

  static updateFriendship = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'BLOCKED'
    
    const friendship = db.friendships.get(id);
    if (!friendship) throw new AppError('Friendship not found', 404);

    if (friendship.addresseeId !== userId && status === 'ACCEPTED') {
      throw new AppError('Only addressee can accept', 403);
    }

    friendship.status = status;
    friendship.updatedAt = new Date();

    sendSuccess(res, friendship);
  });

  static removeFriend = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    const { id } = req.params;
    
    const friendship = db.friendships.get(id);
    if (!friendship) throw new AppError('Friendship not found', 404);

    if (friendship.addresseeId !== userId && friendship.requesterId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    db.friendships.delete(id);
    sendSuccess(res, { message: 'Friendship removed' });
  });

  // Bulk fetch users for caching/sync in clients
  static bulkUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) throw new AppError('userIds must be an array', 400);

    const results: any[] = [];
    for (const id of userIds) {
      const user = db.users.get(id);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        results.push({ ...safeUser, username: user.name });
      }
    }

    sendSuccess(res, results);
  });
}
