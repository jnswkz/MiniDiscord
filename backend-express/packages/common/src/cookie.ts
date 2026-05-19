import { Response } from 'express';
import { serialize } from 'cookie';

export const setAccessTokenCookie = (res: Response, token: string) => {
  const secure = process.env.COOKIE_SECURE === 'true';
  const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined;

  const cookieStr = serialize('access_token', token, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });

  res.setHeader('Set-Cookie', cookieStr);
};

export const clearAccessTokenCookie = (res: Response) => {
  const secure = process.env.COOKIE_SECURE === 'true';
  const sameSite = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined;

  const cookieStr = serialize('access_token', '', {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', cookieStr);
};
