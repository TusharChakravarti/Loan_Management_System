'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CredoraLogo } from '../../components/CredoraLogo';
import { authApi } from '../../lib/api';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing password reset token. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsPending(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password. The link may be expired.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-slate-50 dark:bg-navy-950 transition-colors duration-200 selection:bg-credora-600 selection:text-white">
      <div className="max-w-md w-full mx-auto flex justify-end">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto my-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl backdrop-blur-xl flex flex-col space-y-6">
        <div className="flex justify-center mb-2">
          <CredoraLogo showTagline={false} size="lg" />
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Password Reset Complete!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Your Credora account password has been updated successfully.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3 text-center bg-gradient-to-r from-credora-700 to-credora-600 hover:from-credora-800 hover:to-credora-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Sign In with New Password →
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Please enter your new password below to secure your Credora account.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl p-3.5 text-rose-800 dark:text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-credora-500 focus:ring-1 focus:ring-credora-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-credora-500 focus:ring-1 focus:ring-credora-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-gradient-to-r from-credora-700 to-credora-600 hover:from-credora-800 hover:to-credora-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center mt-2"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Resetting Password...
                  </span>
                ) : (
                  'Reset Password & Secure Account'
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-credora-400 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-credora-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
