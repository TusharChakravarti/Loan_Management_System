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

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const totalRequested = loans.reduce((acc, curr) => acc + curr.loanAmount, 0);
  const totalOutstanding = loans.reduce((acc, curr) => acc + (curr.outstandingBalance || 0), 0);
  const activeCount = loans.filter((l) => ['ACTIVE', 'DISBURSED'].includes(l.status)).length;

  const filteredLoans = loans.filter((l) => {
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      l.loanAmount.toString().includes(term) ||
      l.status.toLowerCase().includes(term) ||
      l._id.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

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
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Submitted Applications</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-credora-100 dark:bg-credora-900/80 text-credora-700 dark:text-credora-300">
                      {filteredLoans.length} of {loans.length}
                    </span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Real-time status synced with Credora Decision Engine
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-56">
                    <input
                      type="text"
                      placeholder="🔍 Search amount or ref..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-credora-500 transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-credora-500 cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="SANCTION_PENDING">Sanction Risk Desk</option>
                    <option value="DISBURSEMENT_PENDING">Disbursement Pending</option>
                    <option value="ACTIVE">Active / Disbursed</option>
                    <option value="CLOSED">Closed Accounts</option>
                    <option value="REJECTED">Declined Files</option>
                  </select>

                  {(filterStatus !== 'ALL' || searchTerm) && (
                    <button
                      onClick={() => {
                        setFilterStatus('ALL');
                        setSearchTerm('');
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Clear ✕
                    </button>
                  )}

                  <button
                    onClick={() => fetchLoans(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <SkeletonTable rows={4} cols={6} />
              ) : error ? (
                <div className="p-6">
                  <ErrorState message={error} onRetry={() => fetchLoans(true)} />
                </div>
              ) : filteredLoans.length === 0 ? (
                <EmptyState
                  title={searchTerm || filterStatus !== 'ALL' ? 'No Matching Applications' : 'No Active Applications Found'}
                  description={
                    searchTerm || filterStatus !== 'ALL'
                      ? 'No applications matched your search or status filter. Try clearing your filters.'
                      : 'You currently have no active loan applications. Click below to start your quick instant loan application.'
                  }
                  action={
                    searchTerm || filterStatus !== 'ALL' ? (
                      <button
                        onClick={() => {
                          setFilterStatus('ALL');
                          setSearchTerm('');
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <Link
                        href="/borrower/apply"
                        className="px-5 py-2.5 bg-credora-700 hover:bg-credora-800 text-white font-bold text-xs rounded-xl shadow-xs inline-block"
                      >
                        Start Application →
                      </Link>
                    )
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
                      {filteredLoans.map((loan) => (
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
