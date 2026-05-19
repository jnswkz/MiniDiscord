import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { asyncHandler, sendSuccess, signAccessToken, setAccessTokenCookie, clearAccessTokenCookie } from '@minidiscord/common';
import { db } from '../models/inMemoryDb';

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

import { GoogleAuthService } from '../services/googleAuth.service';
import crypto from 'crypto';

// Legacy google login schema
export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string()
  })
});

export class AuthController {
  // ... previous methods remain the same ...
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    const user = await AuthService.register(email, password, name);
    
    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    setAccessTokenCookie(res, token);

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, token }, 201);
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const user = await AuthService.login(email, password);
    
    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    setAccessTokenCookie(res, token);

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, token });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    clearAccessTokenCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = db.users.get(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, safeUser);
  });

  // OAUTH: Start Code Flow
  static oauthStart = asyncHandler(async (req: Request, res: Response) => {
    const clientApp = req.query.client === 'portal' ? 'portal' : 'discord';
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Save state, nonce, and client in a temporary cookie (Valid for 15 mins)
    res.cookie('oauth_state', JSON.stringify({ state, nonce, clientApp }), {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 15 * 60 * 1000,
      path: '/'
    });

    const url = GoogleAuthService.getAuthUrl(state, nonce);
    res.redirect(url);
  });

  // OAUTH: Callback
  static oauthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    // Read state from cookie
    const stateCookieStr = req.cookies?.oauth_state;
    if (!stateCookieStr) {
      return res.status(400).send('OAuth state cookie missing or expired');
    }

    const savedStateObj = JSON.parse(stateCookieStr);

    if (state !== savedStateObj.state) {
      return res.status(400).send('State mismatch. Possible CSRF attack.');
    }

    // Clear state cookie
    res.clearCookie('oauth_state');

    // Exchange code and verify nonce
    const user = await GoogleAuthService.handleCallback(code as string, savedStateObj.nonce);

    // Issue internal token
    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    setAccessTokenCookie(res, token);

    // Redirect to frontend based on clientApp
    const frontendUrl = savedStateObj.clientApp === 'portal'
      ? process.env.PORTAL_FRONTEND_URL || 'http://localhost:3001/profile'
      : process.env.DISCORD_FRONTEND_URL || 'http://localhost:3000/dashboard';

    res.redirect(frontendUrl);
  });

  // LEGACY: Fallback Google Login (frontend sends ID token)
  static googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    
    // We don't check nonce for legacy flow
    const user = await GoogleAuthService.verifyIdToken(idToken);
    
    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    setAccessTokenCookie(res, token);

    const { passwordHash, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, token });
  });
}
