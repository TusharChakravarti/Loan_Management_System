'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CredoraLogo } from './CredoraLogo';
import { ThemeToggle } from './ThemeToggle';

interface OperationsNavProps {
  title: string;
  subtitle: string;
  onMobileMenuToggle?: () => void;
}

export const OperationsNav: React.FC<OperationsNavProps> = ({ title, subtitle, onMobileMenuToggle }) => {
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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <CredoraLogo variant="full" size="sm" />

          <div className="hidden lg:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-3.5 py-0.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-none tracking-tight">
                {title}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-credora-50 dark:bg-credora-950/60 text-credora-700 dark:text-credora-300 border border-credora-200 dark:border-credora-800 uppercase tracking-widest">
                OPS PORTAL
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Center Role Module Links */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-credora-700 dark:bg-credora-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions & User Pill */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 px-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-right text-xs hidden sm:block">
                <div className="font-extrabold text-slate-900 dark:text-white leading-none">{user.fullName}</div>
                <div className="text-[9px] font-extrabold text-credora-600 dark:text-credora-400 uppercase mt-0.5 tracking-wider">
                  {user.role}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
