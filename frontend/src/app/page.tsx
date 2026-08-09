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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-credora-600 selection:text-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-800/80">
        <CredoraLogo variant="full" size="md" showTagline />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-xs font-bold text-white bg-credora-700 hover:bg-credora-600 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Apply Now
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full text-center space-y-8 px-4 sm:px-6 my-12 md:my-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-credora-950/80 border border-credora-800/80 text-credora-300 text-xs font-extrabold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-credora-400 animate-pulse"></span>
          Institutional Digital Lending & Operations Infrastructure
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Smarter Lending. <span className="text-credora-400">Trusted Decisions.</span>
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
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
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Staff & Borrower Sign In
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono text-credora-400 uppercase font-extrabold">Borrower Desk</span>
            <h3 className="text-xs font-black text-white">Apply & Track</h3>
            <p className="text-[11px] text-slate-400 font-medium">Instant BRE rules & salary slip upload</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-extrabold">Sales & Sanction</span>
            <h3 className="text-xs font-black text-white">Underwriting Desk</h3>
            <p className="text-[11px] text-slate-400 font-medium">Document review & sanction approvals</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-extrabold">Disbursement</span>
            <h3 className="text-xs font-black text-white">Fund Release</h3>
            <p className="text-[11px] text-slate-400 font-medium">Bank transaction UTR execution</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-extrabold">Collection</span>
            <h3 className="text-xs font-black text-white">Repayment Ledger</h3>
            <p className="text-[11px] text-slate-400 font-medium">EMI recording & auto loan closure</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800/80">
        Credora Financial Technologies Inc. &copy; {new Date().getFullYear()} — Institutional Digital Banking Platform
      </footer>
    </div>
  );
}
