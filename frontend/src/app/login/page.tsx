'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CredoraLogo } from '../../components/CredoraLogo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { UserRole } from '../../types/auth';
import { authApi } from '../../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      case UserRole.SALES:
        router.push('/operations/sales');
        break;
      case UserRole.SANCTION:
        router.push('/operations/sanction');
        break;
      case UserRole.DISBURSEMENT:
        router.push('/operations/disbursement');
        break;
      case UserRole.COLLECTION:
        router.push('/operations/collection');
        break;
      case UserRole.BORROWER:
      default:
        router.push('/borrower/loans');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('lms_auth_token')}` },
      });
      const meData = await meRes.json();
      if (meData.user?.role) {
        redirectByRole(meData.user.role);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-slate-50 dark:bg-navy-950 transition-colors duration-200 selection:bg-credora-600 selection:text-white">
      {/* Top Header Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <CredoraLogo variant="full" size="md" showTagline />
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Secure Member Sign In
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Access your Credora digital banking & loan management account
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold leading-normal flex items-start gap-2.5">
            <span className="text-sm shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 focus:border-credora-500 outline-none text-xs font-medium transition-all"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Account Password
              </label>
              <Link
                href="/forgot-password"
                className="text-credora-600 dark:text-credora-400 font-extrabold hover:underline text-xs"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 focus:border-credora-500 outline-none text-xs font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-black rounded-xl transition-all text-xs shadow-md disabled:opacity-50 cursor-pointer tracking-wider uppercase mt-2"
          >
            {loading ? 'Authenticating Credentials...' : 'Sign In To Dashboard'}
          </button>
        </form>

        <div className="relative my-2 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = authApi.getGoogleAuthUrl();
          }}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          New applicant?{' '}
          <Link href="/register" className="text-credora-600 dark:text-credora-400 font-extrabold hover:underline">
            Create Borrower Account
          </Link>
        </div>
      </div>

      {/* Footer Security Notice */}
      <div className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-600 space-y-1">
        <p>© {new Date().getFullYear()} Credora Financial Technologies Inc. All Rights Reserved.</p>
        <p className="font-mono">Authorized access only. All activities are audited and monitored.</p>
      </div>
    </div>
  );
}
