'use client';

import React from 'react';
import { CredoraLogo } from './CredoraLogo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface CredoraHeaderProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export const CredoraHeader: React.FC<CredoraHeaderProps> = ({
  title,
  subtitle,
  onMobileMenuToggle,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile Hamburger & Logo */}
        <div className="flex items-center gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="md:hidden">
            <CredoraLogo variant="compact" size="sm" />
          </div>

          {(title || subtitle) && (
            <div className="hidden sm:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-4 py-1">
              {title && (
                <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight tracking-tight">
                  {title}
                </span>
              )}
              {subtitle && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-extrabold uppercase text-credora-600 dark:text-credora-400 tracking-wider mt-0.5">
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
