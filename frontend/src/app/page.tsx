'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CredoraLogo } from '../components/CredoraLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { UserRole } from '../types/auth';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case UserRole.ADMIN:
          router.push('/admin');
          break;
        case UserRole.SALES:
          router.push('/operations/sales');
          break;
        case UserRole.SANCTION:
          router.push('/operations/sanction');
          break;
        case UserRole.DISBURSEMENT:
          router.push('/operations/disbursement');
          break;
        case UserRole.COLLECTION:
          router.push('/operations/collection');
          break;
        case UserRole.BORROWER:
        default:
          router.push('/borrower/loans');
          break;
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-credora-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono tracking-widest text-slate-400">Loading Credora Digital Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between transition-colors duration-200 selection:bg-credora-600 selection:text-white">
      {/* Sticky Full-Width Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center">
          <CredoraLogo variant="full" size="md" showTagline />

          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-credora-700 hover:bg-credora-600 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full text-center space-y-8 px-4 sm:px-6 my-12 md:my-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-credora-50 dark:bg-credora-950/80 border border-credora-200 dark:border-credora-800/80 text-credora-700 dark:text-credora-300 text-xs font-extrabold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-credora-500 animate-pulse"></span>
          Institutional Digital Lending & Operations Infrastructure
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Smarter Lending. <span className="text-credora-600 dark:text-credora-400">Trusted Decisions.</span>
        </h2>

        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
          Production-grade digital banking platform engineered with real-time decision rules, secure document verification, multi-stage underwriting desks, and automated collection servicing.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-credora-700 hover:bg-credora-600 text-white font-extrabold rounded-xl shadow-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Apply for Credit →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Staff & Borrower Sign In
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-credora-600 dark:text-credora-400 uppercase font-extrabold">Borrower Desk</span>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">Apply & Track</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Instant BRE rules & salary slip upload</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-extrabold">Sales & Sanction</span>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">Underwriting Desk</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Document review & sanction approvals</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-extrabold">Disbursement</span>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">Fund Release</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Bank transaction UTR execution</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase font-extrabold">Collection</span>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">Repayment Ledger</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">EMI recording & auto loan closure</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-200 dark:border-slate-800/80 px-4">
        Credora Financial Technologies Inc. &copy; {new Date().getFullYear()} — Institutional Digital Banking Platform
      </footer>
    </div>
  );
}
