'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { CredoraSidebar } from '../../components/CredoraSidebar';
import { OperationsNav } from '../../components/OperationsNav';
import { PageHeader } from '../../components/PageHeader';
import { FinancialMetricCard } from '../../components/FinancialMetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { SkeletonCard, SkeletonTable } from '../../components/SkeletonLoader';
import { ErrorState } from '../../components/ErrorState';
import { operationsApi } from '../../lib/api';
import { AdminOverview } from '../../types/operations';
import { UserRole } from '../../types/auth';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getAdminOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Admin system overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filteredLoans = data
    ? filterStatus === 'ALL'
      ? data.loans
      : data.loans.filter((l) => l.status === filterStatus)
    : [];

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <OperationsNav
          title="System Admin Dashboard"
          subtitle="Executive operations portfolio & financial audit"
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex pt-16 min-h-screen">
          <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

          <div className="flex-1 md:pl-64 min-w-0">
            <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 space-y-6">
            <PageHeader
              title="Executive Operations Overview"
              subtitle="Full-stack credit portfolio metrics, status breakdown & master application ledger"
              badgeText="EXECUTIVE ADMIN"
            >
              <button
                onClick={fetchOverview}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                🔄 Live Refresh
              </button>
            </PageHeader>

            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
                <SkeletonTable rows={5} cols={9} />
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={fetchOverview} />
            ) : data ? (
              <>
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FinancialMetricCard
                    title="Total Disbursed Volume"
                    value={`₹${data.financials.totalDisbursedAmount.toLocaleString('en-IN')}`}
                    subtitle="Aggregate principal disbursed to date"
                    icon="💸"
                    variant="primary"
                  />
                  <FinancialMetricCard
                    title="Total Recovered Capital"
                    value={`₹${data.financials.totalCollectedAmount.toLocaleString('en-IN')}`}
                    subtitle="Aggregate borrower repayments collected"
                    icon="✓"
                    variant="success"
                  />
                  <FinancialMetricCard
                    title="Portfolio Outstanding Balance"
                    value={`₹${data.financials.totalOutstandingAmount.toLocaleString('en-IN')}`}
                    subtitle="Current net active debt balance"
                    icon="🏦"
                    variant="warning"
                  />
                </div>

                {/* Status Distribution Grid */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors duration-200">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Status Distribution Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                      { label: 'Pending', key: 'PENDING' },
                      { label: 'Sanction Desk', key: 'SANCTION_PENDING' },
                      { label: 'Disbursement', key: 'DISBURSEMENT_PENDING' },
                      { label: 'Active Servicing', key: 'ACTIVE' },
                      { label: 'Closed Account', key: 'CLOSED' },
                      { label: 'Declined File', key: 'REJECTED' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setFilterStatus(item.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          filterStatus === item.key
                            ? 'ring-2 ring-credora-500 bg-credora-50 dark:bg-credora-950/60 border-credora-300 dark:border-credora-800'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                          {data.counts[item.key] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Portfolio Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors duration-200">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Master Portfolio Ledger
                      </h2>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Filter: <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{filterStatus}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                          filterStatus === 'ALL'
                            ? 'bg-credora-700 dark:bg-credora-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        All Applications ({data.counts.TOTAL})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-4">Reference</th>
                          <th className="px-5 py-4">Borrower</th>
                          <th className="px-5 py-4">PAN Card</th>
                          <th className="px-5 py-4">Principal</th>
                          <th className="px-5 py-4">Tenure</th>
                          <th className="px-5 py-4">Repayment</th>
                          <th className="px-5 py-4">Outstanding</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Created Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                        {filteredLoans.map((loan) => (
                          <tr
                            key={loan._id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-5 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                              #{loan._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                              {loan.fullName}
                            </td>
                            <td className="px-5 py-4 font-mono font-extrabold uppercase text-slate-900 dark:text-slate-200">
                              {loan.pan}
                            </td>
                            <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                              ₹{loan.loanAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-400">
                              {loan.tenureDays} Days
                            </td>
                            <td className="px-5 py-4 font-extrabold text-credora-600 dark:text-credora-400">
                              ₹{loan.totalRepayment.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4 font-black text-rose-600 dark:text-rose-400">
                              ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={loan.status} />
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
