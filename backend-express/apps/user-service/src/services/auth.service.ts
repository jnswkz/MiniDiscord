import { db, User } from '../models/inMemoryDb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AppError } from '@minidiscord/common';

export class AuthService {
  static async register(email: string, passwordHash: string, name: string): Promise<User> {
    if (db.usersByEmail.has(email)) {
      throw new AppError('Email already in use', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordHash, salt);

    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashed,
      name,
      role: 'USER',
      status: 'ONLINE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.users.set(user.id, user);
    db.usersByEmail.set(user.email, user.id);
    return user;
  }

  static async login(email: string, passwordPlain: string): Promise<User> {
    const userId = db.usersByEmail.get(email);
    if (!userId) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = db.users.get(userId);
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    return user;
  }
}
