import { Request, Response, NextFunction } from 'express';
import { AppError } from '@minidiscord/common';

export const requireGatewayAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;
  const role = req.headers['x-user-role'] as string;

  // In test environment, we might want a bypass or just set headers
  if (process.env.NODE_ENV === 'test' && !userId) {
    (req as any).user = { sub: 'test-user', email: 'test@test.com', role: 'USER' };
    return next();
  }

  if (!userId) {
    return next(new AppError('Unauthorized: Missing Gateway Headers', 401));
  }

  (req as any).user = {
    sub: userId,
    email,
    role
  };

  next();
};
