import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { db, User } from '../models/inMemoryDb';
import { AppError } from '@minidiscord/common';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:9080/api/auth/oauth2/google/callback';

export const googleClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export class GoogleAuthService {
  static getAuthUrl(state: string, nonce: string) {
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile', 'openid'],
      state,
      nonce,
      prompt: 'consent'
    });
  }

  static async verifyIdToken(idToken: string, expectedNonce?: string): Promise<User> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token', 400);
    }
    
    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new AppError('Nonce mismatch', 400);
    }
    
    let userId = db.usersByEmail.get(payload.email);
    let user: User;
    
    if (userId) {
      user = db.users.get(userId)!;
      // Update avatar if provided
      if (payload.picture && user.avatarUrl !== payload.picture) {
        user.avatarUrl = payload.picture;
        user.updatedAt = new Date();
      }
    } else {
      user = {
        id: crypto.randomUUID(),
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
        role: 'USER',
        status: 'ONLINE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      db.users.set(user.id, user);
      db.usersByEmail.set(user.email, user.id);
    }
    
    return user;
  }
  
  static async handleCallback(code: string, expectedNonce: string): Promise<User> {
    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) {
      throw new AppError('No ID token from Google', 400);
    }
    return this.verifyIdToken(tokens.id_token, expectedNonce);
  }
}
