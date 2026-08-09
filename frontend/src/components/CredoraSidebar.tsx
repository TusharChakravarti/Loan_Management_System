'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { CredoraLogo } from './CredoraLogo';
import { ThemeToggle } from './ThemeToggle';
import { UserRole } from '../types/auth';

interface CredoraSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const CredoraSidebar: React.FC<CredoraSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavItems = (role?: UserRole) => {
    switch (role) {
      case UserRole.BORROWER:
        return [
          { label: 'Loan Portfolio', href: '/borrower/loans', icon: '📊' },
          { label: 'Apply for Loan', href: '/borrower/apply', icon: '➕' },
        ];
      case UserRole.SALES:
        return [{ label: 'Sales Review Queue', href: '/operations/sales', icon: '📋' }];
      case UserRole.SANCTION:
        return [{ label: 'Sanction Risk Desk', href: '/operations/sanction', icon: '⚖️' }];
      case UserRole.DISBURSEMENT:
        return [{ label: 'Disbursement Queue', href: '/operations/disbursement', icon: '💸' }];
      case UserRole.COLLECTION:
        return [{ label: 'Collection Servicing', href: '/operations/collection', icon: '🏦' }];
      case UserRole.ADMIN:
        return [
          { label: 'Executive Overview', href: '/admin', icon: '📈' },
          { label: 'Sales Desk', href: '/operations/sales', icon: '📋' },
          { label: 'Sanction Desk', href: '/operations/sanction', icon: '⚖️' },
          { label: 'Disbursement Desk', href: '/operations/disbursement', icon: '💸' },
          { label: 'Collection Servicing', href: '/operations/collection', icon: '🏦' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(user?.role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 selection:bg-credora-600 selection:text-white transition-colors duration-200">
  

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">
          Banking Navigation
        </span>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-credora-700 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col truncate pr-2">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{user?.fullName}</span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">{user?.email}</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-200 dark:border-slate-800/60">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-credora-100 dark:bg-credora-900/80 text-credora-700 dark:text-credora-300 border border-credora-300 dark:border-credora-700/60">
            {user?.role}
          </span>
          <button
            onClick={logout}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
          >
            Sign Out →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed on left below top header) */}
      <aside className="hidden md:block fixed top-16 left-0 bottom-0 w-64 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};