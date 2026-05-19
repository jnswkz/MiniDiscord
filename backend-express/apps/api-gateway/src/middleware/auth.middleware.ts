import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AppError, logger } from '@minidiscord/common';

const OPEN_PATHS = [
  /^\/api\/auth\/.*/,
  /^\/api\/demo\/public$/,
  /^\/health$/,
  /^\/ready$/,
  /^\/ws\/.*/, // HTTP upgrade for websockets is open, auth happens on STOMP CONNECT
];

const isPathOpen = (path: string): boolean => {
  return OPEN_PATHS.some((regex) => regex.test(path));
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (isPathOpen(req.path)) {
    return next();
  }

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
    
    // Inject proxy headers for backend services
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role'] = payload.role;
    
    // Attach to request if needed by gateway (e.g. rate limit by user id)
    (req as any).user = payload;
    
    next();
  } catch (err) {
    // verifyAccessToken will throw an AppError (TOKEN_EXPIRED or INVALID_TOKEN)
    next(err);
  }
};
