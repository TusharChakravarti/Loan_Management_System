'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CredoraLogo } from '../../components/CredoraLogo';
import { authApi } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col space-y-6">
        <div className="flex justify-center mb-2">
          <CredoraLogo showTagline={false} size="lg" />
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-credora-500/10 border border-credora-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-credora-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M3 8l9 6 9-6" />
                <rect x="3" y="6" width="18" height="13" rx="2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Reset link sent!
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                We sent a password reset link to<br />
                <span className="text-credora-400 font-bold">{email}</span>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Link expires in 1 hour. Didn't get it?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-credora-400 font-bold hover:underline cursor-pointer"
              >
                Try again
              </button>
            </p>
            <Link
              href="/login"
              className="mt-2 w-full py-3 text-center bg-gradient-to-r from-credora-700 to-credora-600 hover:from-credora-800 hover:to-credora-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No worries! Enter your email and we'll send you a secure password reset link.
              </p>
            </div>

            {error && (
              <div className="bg-rose-950/60 border border-rose-900/80 rounded-xl p-3.5 text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs font-medium outline-none focus:border-credora-500 focus:ring-1 focus:ring-credora-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-gradient-to-r from-credora-700 to-credora-600 hover:from-credora-800 hover:to-credora-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending reset link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-credora-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
