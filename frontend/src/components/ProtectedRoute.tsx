'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && allowedRoles.length > 0) {
        // ADMIN has access across all operations
        const hasAccess = user.role === 'ADMIN' || allowedRoles.includes(user.role);
        if (!hasAccess) {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = user.role === 'ADMIN' || allowedRoles.includes(user.role);
    if (!hasAccess) return null;
  }

  return <>{children}</>;
};
