export type UserRole = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

export const UserRole = {
  ADMIN: 'ADMIN' as const,
  SALES: 'SALES' as const,
  SANCTION: 'SANCTION' as const,
  DISBURSEMENT: 'DISBURSEMENT' as const,
  COLLECTION: 'COLLECTION' as const,
  BORROWER: 'BORROWER' as const,
};

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}
