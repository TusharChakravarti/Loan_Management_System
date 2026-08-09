'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { CredoraSidebar } from '../../../components/CredoraSidebar';
import { CredoraHeader } from '../../../components/CredoraHeader';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { FinancialMetricCard } from '../../../components/FinancialMetricCard';
import { SkeletonTable, SkeletonCard } from '../../../components/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { useAuth } from '../../../context/AuthContext';
import { loanApi } from '../../../lib/api';
import { subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';
import Link from 'next/link';

export default function BorrowerLoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchLoans = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await loanApi.getMyLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan applications');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(true);

    const interval = setInterval(() => {
      fetchLoans(false);
    }, 3000);

    const unsubscribe = subscribeToLoanUpdates(() => {
      fetchLoans(false);
    });

    const handleFocus = () => fetchLoans(false);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const totalRequested = loans.reduce((acc, curr) => acc + curr.loanAmount, 0);
  const totalOutstanding = loans.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);
  const activeCount = loans.filter((l) => ['ACTIVE', 'DISBURSED'].includes(l.status)).length;

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <CredoraHeader
          title="Borrower Portfolio"
          subtitle="Manage applications & track repayments"
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex pt-16 min-h-screen">
          <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

          <div className="flex-1 md:pl-64 min-w-0">
            <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 space-y-6">
            <PageHeader
              title={`Welcome back, ${user?.fullName || 'Valued Customer'}`}
              subtitle="Track live status, repayment schedules, and loan lifecycle"
              badgeText="BORROWER PORTAL"
            >
              <Link
                href="/borrower/apply"
                className="px-5 py-2.5 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>+</span>
                <span>Apply For Loan</span>
              </Link>
            </PageHeader>

            {/* Financial Summary Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinancialMetricCard
                  title="Total Loan Portfolio"
                  value={`₹${totalRequested.toLocaleString('en-IN')}`}
                  subtitle={`${loans.length} Total Submitted Requests`}
                  icon="💳"
                  variant="primary"
                />
                <FinancialMetricCard
                  title="Outstanding Repayment"
                  value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
                  subtitle="Current active balance due"
                  icon="🏦"
                  variant="warning"
                />
                <FinancialMetricCard
                  title="Active Credit Lines"
                  value={activeCount}
                  subtitle="Loans in Active servicing"
                  icon="⚡"
                  variant="success"
                />
              </div>
            )}

            {/* Applications Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Submitted Applications ({loans.length})
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Real-time status synced with Credora Decision Engine
                  </p>
                </div>
                <button
                  onClick={() => fetchLoans(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  🔄 Live Refresh
                </button>
              </div>

              {loading ? (
                <SkeletonTable rows={4} cols={6} />
              ) : error ? (
                <div className="p-6">
                  <ErrorState message={error} onRetry={() => fetchLoans(true)} />
                </div>
              ) : loans.length === 0 ? (
                <EmptyState
                  title="No Active Applications Found"
                  description="You currently have no active loan applications. Click below to start your quick instant loan application."
                  action={
                    <Link
                      href="/borrower/apply"
                      className="px-5 py-2.5 bg-credora-700 hover:bg-credora-800 text-white font-bold text-xs rounded-xl shadow-xs inline-block"
                    >
                      Start Application →
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Loan Reference</th>
                        <th className="px-6 py-4">Loan Amount</th>
                        <th className="px-6 py-4">Tenure</th>
                        <th className="px-6 py-4">Total Repayment</th>
                        <th className="px-6 py-4">Lifecycle Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                      {loans.map((loan) => (
                        <tr
                          key={loan._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                            #{loan._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                            ₹{loan.loanAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                            {loan.tenureDays} Days
                          </td>
                          <td className="px-6 py-4 font-extrabold text-credora-700 dark:text-credora-400">
                            ₹{loan.totalRepayment.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/borrower/loans/${loan._id}`}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors inline-block"
                            >
                              Track Progress →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
