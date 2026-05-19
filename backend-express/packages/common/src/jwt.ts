import { SignJWT, jwtVerify } from 'jose';
import { AppError } from './appError';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  [key: string]: any;
}

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'default-secret-key-for-local-dev-only';
  return new TextEncoder().encode(secret);
};

export const signAccessToken = async (payload: JwtPayload): Promise<string> => {
  const secretKey = getSecretKey();
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('minidiscord-auth')
    .setAudience('minidiscord-client')
    .setExpirationTime(process.env.JWT_EXPIRATION || '24h')
    .sign(secretKey);
};

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  try {
    const secretKey = getSecretKey();
    
    const { payload, protectedHeader } = await jwtVerify(token, secretKey, {
      issuer: 'minidiscord-auth',
      audience: 'minidiscord-client',
      algorithms: ['HS256'] // Explicitly enforce HS256, rejecting "none" or asymmetric algs
    });

    if (protectedHeader.alg !== 'HS256') {
      throw new AppError('Invalid token algorithm', 401);
    }

    return payload as unknown as JwtPayload;
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new AppError('TOKEN_EXPIRED', 401);
    }
    throw new AppError('INVALID_TOKEN', 401);
  }
};
