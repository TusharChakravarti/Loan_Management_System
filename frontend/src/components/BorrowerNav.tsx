'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface BorrowerNavProps {
  title?: string;
  subtitle?: string;
}

export const BorrowerNav: React.FC<BorrowerNavProps> = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'BORROWER':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'ADMIN':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'SALES':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'SANCTION':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'DISBURSEMENT':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'COLLECTION':
      default:
        return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/borrower/loans" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              L
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block leading-none">
                LMS Banking
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                Borrower Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions & User Profile Pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/borrower/apply"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Apply for a Loan</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">{user.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${getRoleBadgeStyle(
                  user.role
                )}`}
              >
                {user.role}
              </span>
              <button
                onClick={() => logout()}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
