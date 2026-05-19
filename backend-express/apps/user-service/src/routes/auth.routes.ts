import { Router } from 'express';
import { AuthController, registerSchema, loginSchema, googleLoginSchema } from '../controllers/auth.controller';
import { validate } from '@minidiscord/common';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), AuthController.register);
authRouter.post('/login', validate(loginSchema), AuthController.login);
authRouter.post('/google', validate(googleLoginSchema), AuthController.googleLogin);
authRouter.get('/oauth2/google/start', AuthController.oauthStart);
authRouter.get('/oauth2/google/callback', AuthController.oauthCallback);

authRouter.get('/me', requireAuth, AuthController.me);
authRouter.post('/logout', requireAuth, AuthController.logout);
