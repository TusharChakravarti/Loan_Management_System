'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CredoraLogo } from '../../components/CredoraLogo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { UserRole } from '../../types/auth';

const ROLES: { role: UserRole; label: string }[] = [
  { role: UserRole.BORROWER, label: 'Borrower (Application Portal)' },
  { role: UserRole.SALES, label: 'Sales Officer (Operations)' },
  { role: UserRole.SANCTION, label: 'Sanction Officer (Operations)' },
  { role: UserRole.DISBURSEMENT, label: 'Disbursement Manager (Operations)' },
  { role: UserRole.COLLECTION, label: 'Collection Officer (Operations)' },
  { role: UserRole.ADMIN, label: 'System Administrator (Full Access)' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.BORROWER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ fullName, email, password, role });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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

      {/* Main Register Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-6">
        <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create User Account
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Register for Credora Digital Banking Services
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
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 focus:border-credora-500 outline-none text-xs font-medium transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 focus:border-credora-500 outline-none text-xs font-medium transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 focus:border-credora-500 outline-none text-xs font-bold transition-all"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-black rounded-xl transition-all text-xs shadow-md disabled:opacity-50 cursor-pointer tracking-wider uppercase mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
          Already registered?{' '}
          <Link href="/login" className="text-credora-600 dark:text-credora-400 font-extrabold hover:underline">
            Sign in to existing account
          </Link>
        </div>
      </div>

      {/* Footer Security Notice */}
      <div className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-600 space-y-1">
        <p>© {new Date().getFullYear()} Credora Financial Technologies Inc. All Rights Reserved.</p>
        <p className="font-mono">Authorized banking portal enrollment.</p>
      </div>
    </div>
  );
}
