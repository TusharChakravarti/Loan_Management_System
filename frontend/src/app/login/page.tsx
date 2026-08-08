'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SEED_ACCOUNTS = [
  { label: 'Admin', email: 'admin@lms.local', pass: 'Admin@12345', role: 'ADMIN' },
  { label: 'Sales Officer', email: 'sales@lms.local', pass: 'Sales@12345', role: 'SALES' },
  { label: 'Sanction Officer', email: 'sanction@lms.local', pass: 'Sanction@12345', role: 'SANCTION' },
  { label: 'Disbursement Mgr', email: 'disbursement@lms.local', pass: 'Disburse@12345', role: 'DISBURSEMENT' },
  { label: 'Collection Officer', email: 'collection@lms.local', pass: 'Collection@12345', role: 'COLLECTION' },
  { label: 'Borrower', email: 'borrower@lms.local', pass: 'Borrower@12345', role: 'BORROWER' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'ADMIN':
        router.push('/admin');
        break;
      case 'SALES':
        router.push('/operations/sales');
        break;
      case 'SANCTION':
        router.push('/operations/sanction');
        break;
      case 'DISBURSEMENT':
        router.push('/operations/disbursement');
        break;
      case 'COLLECTION':
        router.push('/operations/collection');
        break;
      case 'BORROWER':
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
      // Fetch user role from auth API token/response
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Sign In</h1>
          <p className="text-sm text-slate-500 mt-1">Loan Management Platform Authentication</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@lms.local"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Fill Seed Credentials */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Available Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc.email, acc.pass)}
                className="p-2 text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md transition-colors font-mono"
              >
                <div className="font-semibold text-slate-800">{acc.label}</div>
                <div className="text-[10px] text-slate-500">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Need a new account?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
