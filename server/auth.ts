import jwt from 'jsonwebtoken';
import type { User } from '../shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret-key-change-in-production';

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function generateRefreshToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh',
    },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as any;
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch (error) {
    return null;
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}
