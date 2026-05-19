import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AppError } from '@minidiscord/common';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // First check if Gateway injected headers
  const gatewayUserId = req.headers['x-user-id'] as string;
  const gatewayEmail = req.headers['x-user-email'] as string;
  const gatewayRole = req.headers['x-user-role'] as string;

  if (gatewayUserId && gatewayEmail && gatewayRole) {
    (req as any).user = {
      sub: gatewayUserId,
      email: gatewayEmail,
      role: gatewayRole
    };
    return next();
  }

  // Fallback to checking token directly (for /api/auth/* which bypasses gateway auth, or local testing)
  let token = req.cookies?.access_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return next(new AppError('MISSING_TOKEN', 401));
  }

  try {
    const payload = await verifyAccessToken(token);
    (req as any).user = payload;
    next();
  } catch (err) {
    next(err);
  }
};
