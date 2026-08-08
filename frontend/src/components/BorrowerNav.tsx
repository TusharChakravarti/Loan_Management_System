'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface BorrowerNavProps {
  title?: string;
  subtitle?: string;
}

export const BorrowerNav: React.FC<BorrowerNavProps> = ({
  title = 'Borrower Portal',
  subtitle = 'Manage your loan applications & track status',
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-purple-100 text-purple-800 uppercase font-mono">
              Borrower
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/borrower/loans"
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            My Applications
          </Link>
          <Link
            href="/borrower/apply"
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            + Apply for Loan
          </Link>
        </div>

        {/* User Session Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-right text-xs">
              <div className="font-bold text-slate-800">{user.fullName}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase bg-purple-100 text-purple-700 border border-purple-200">
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
    </header>
  );
};
