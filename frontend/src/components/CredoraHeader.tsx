'use client';

import React from 'react';
import { CredoraLogo } from './CredoraLogo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '../types/auth';

interface CredoraHeaderProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
  showOpsNav?: boolean;
}

export const CredoraHeader: React.FC<CredoraHeaderProps> = ({
  title,
  subtitle,
  onMobileMenuToggle,
  showOpsNav = false,
}) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const opsLinks = [
    { href: '/operations/sales', label: 'Sales Desk', roles: [UserRole.SALES, UserRole.ADMIN] },
    { href: '/operations/sanction', label: 'Sanction Desk', roles: [UserRole.SANCTION, UserRole.ADMIN] },
    { href: '/operations/disbursement', label: 'Disbursement', roles: [UserRole.DISBURSEMENT, UserRole.ADMIN] },
    { href: '/operations/collection', label: 'Collection', roles: [UserRole.COLLECTION, UserRole.ADMIN] },
    { href: '/admin', label: 'Admin Overview', roles: [UserRole.ADMIN] },
  ];

  const isOpsUser = user && user.role !== UserRole.BORROWER;
  const shouldShowOpsNav = showOpsNav || isOpsUser;

  const visibleOpsLinks = opsLinks.filter(
    (l) => user && (user.role === UserRole.ADMIN || l.roles.includes(user.role as any))
  );

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200 shadow-2xs">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Button + Main CREDORA Logo + Title */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* CREDORA Logo - Main Full-Width Header Branding */}
          <Link
            href={
              user?.role === UserRole.BORROWER
                ? '/borrower/loans'
                : user?.role === UserRole.ADMIN
                ? '/admin'
                : '/operations/sales'
            }
            className="flex items-center"
          >
            <CredoraLogo variant="full" size="md" showTagline={false} />
          </Link>

          {(title || subtitle) && (
            <div className="hidden xl:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-3.5 py-0.5">
              {title && (
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight tracking-tight">
                  {title}
                </span>
              )}
              {subtitle && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center Section: Ops Desk Quick Switcher Pills (For Ops/Admin Users) */}
        {shouldShowOpsNav && visibleOpsLinks.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {visibleOpsLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-credora-700 dark:bg-credora-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Section: Theme Toggle & User Info & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
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
