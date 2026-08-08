import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.js';

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[JWT Warning] JWT_SECRET not set in environment. Using default dev secret.');
    return 'super_secret_jwt_key_loan_management_2026';
  }
  return secret;
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getJwtSecret()) as JWTPayload;
};
