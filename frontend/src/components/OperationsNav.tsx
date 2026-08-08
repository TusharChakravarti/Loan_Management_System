'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface OperationsNavProps {
  title: string;
  subtitle: string;
}

export const OperationsNav: React.FC<OperationsNavProps> = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: '/operations/sales', label: 'Sales Review', roles: ['SALES', 'ADMIN'] },
    { href: '/operations/sanction', label: 'Sanction Desk', roles: ['SANCTION', 'ADMIN'] },
    { href: '/operations/disbursement', label: 'Disbursement', roles: ['DISBURSEMENT', 'ADMIN'] },
    { href: '/operations/collection', label: 'Collection', roles: ['COLLECTION', 'ADMIN'] },
    { href: '/admin', label: 'Admin Overview', roles: ['ADMIN'] },
  ];

  const visibleLinks = links.filter((l) => user && (user.role === 'ADMIN' || l.roles.includes(user.role)));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-100 text-blue-800 uppercase font-mono">
              Ops Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Links Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {visibleLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User Session Info */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-right text-xs">
              <div className="font-bold text-slate-800">{user.fullName}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                user.role === 'ADMIN'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
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
    </header>
  );
};
