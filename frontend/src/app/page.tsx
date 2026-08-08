'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'SALES':
          router.push('/operations/sales');
          break;
        case 'SANCTION':
          router.push('/operations/sanction');
          break;
        case 'DISBURSEMENT':
          router.push('/operations/disbursement');
          break;
        case 'COLLECTION':
          router.push('/operations/collection');
          break;
        case 'BORROWER':
        default:
          router.push('/borrower/loans');
          break;
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono tracking-wider text-slate-400">Loading Loan Management Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
            L
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">LMS Platform</h1>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">Loan Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 transition-all"
          >
            Apply Now
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto w-full text-center space-y-8 my-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Enterprise Digital Lending & Operations Engine
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Instant Loans, Seamless <span className="text-blue-500">Lifecycle Management</span>
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium">
          Full-stack automated lending platform powered by instant Business Rules Engine (BRE), salary-slip verification, multi-stage operations workflow, and collection tracking.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/40 text-sm transition-all"
          >
            Apply for a Loan →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all"
          >
            Staff & Borrower Sign In
          </Link>
        </div>

        {/* Portal Shortcuts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Borrower Portal</span>
            <h3 className="text-sm font-bold text-white">Apply & Track</h3>
            <p className="text-xs text-slate-400">Instant BRE evaluation & salary slip upload</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Sales & Sanction</span>
            <h3 className="text-sm font-bold text-white">Underwriting Desk</h3>
            <p className="text-xs text-slate-400">Document review & sanction approvals</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Disbursement</span>
            <h3 className="text-sm font-bold text-white">Fund Release</h3>
            <p className="text-xs text-slate-400">UTR bank transfer execution</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Collection</span>
            <h3 className="text-sm font-bold text-white">Repayment Ledger</h3>
            <p className="text-xs text-slate-400">EMI recording & loan auto-closure</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800">
        Loan Management System &copy; {new Date().getFullYear()} — Full-Stack Lending Platform
      </footer>
    </div>
  );
}
