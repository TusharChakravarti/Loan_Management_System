'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { CredoraSidebar } from '../../../components/CredoraSidebar';
import { OperationsNav } from '../../../components/OperationsNav';
import { PageHeader } from '../../../components/PageHeader';
import { FinancialMetricCard } from '../../../components/FinancialMetricCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { SkeletonTable } from '../../../components/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { useToast } from '../../../context/ToastContext';
import { operationsApi } from '../../../lib/api';
import { broadcastLoanUpdate, subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';
import { Payment } from '../../../types/operations';
import { UserRole } from '../../../types/auth';

export default function CollectionDashboardPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetchingPayments, setFetchingPayments] = useState<boolean>(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchLoans = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getCollectionLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Collection loans');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredLoans = loans.filter((l) => {
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      l.fullName.toLowerCase().includes(term) ||
      l.pan.toLowerCase().includes(term) ||
      l._id.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

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

  const openLoanDetails = async (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.outstandingBalance);
    setPaymentReference(`PAY-${Date.now().toString().slice(-8)}`);
    setRemarks('');
    setFetchingPayments(true);
    try {
      const res = await operationsApi.getLoanPayments(loan._id);
      setPayments(res.payments);
    } catch {
      setPayments([]);
    } finally {
      setFetchingPayments(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || paymentAmount <= 0 || !paymentReference.trim()) return;
    setSubmitting(true);
    try {
      const res = await operationsApi.recordPayment(selectedLoan._id, {
        amount: paymentAmount,
        paymentReference: paymentReference.trim(),
        remarks,
      });
      toastSuccess(res.message);

      broadcastLoanUpdate({ type: 'PAYMENT_RECORDED', loanId: selectedLoan._id });

      setSelectedLoan(null);
      await fetchLoans(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to record repayment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalCollected = loans.reduce((sum, l) => sum + l.totalPaid, 0);

  return (
    <ProtectedRoute allowedRoles={[UserRole.COLLECTION, UserRole.ADMIN]}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <OperationsNav
          title="Collection Servicing Module"
          subtitle="Repayment tracking, payment ledger & automated loan closure"
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex pt-16 min-h-screen">
          <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

          <div className="flex-1 md:pl-64 min-w-0">
            <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 space-y-6">
            <PageHeader
              title="Collection Servicing Desk"
              subtitle="Monitor active credit balances, record borrower UTR payments & manage portfolio servicing"
              badgeText="COLLECTION DESK"
            >
              <button
                onClick={() => fetchLoans(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                🔄 Live Refresh
              </button>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FinancialMetricCard
                title="Active Credit Accounts"
                value={loans.length}
                subtitle="Total disbursed accounts in servicing"
                icon="🏦"
                variant="primary"
              />
              <FinancialMetricCard
                title="Outstanding Balance"
                value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
                subtitle="Remaining portfolio credit balance"
                icon="⚠️"
                variant="danger"
              />
              <FinancialMetricCard
                title="Total Recovered Capital"
                value={`₹${totalCollected.toLocaleString('en-IN')}`}
                subtitle="Total repayments credited to date"
                icon="✓"
                variant="success"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Active Portfolio Servicing</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-credora-100 dark:bg-credora-900/80 text-credora-700 dark:text-credora-300">
                      {filteredLoans.length} of {loans.length}
                    </span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Record borrower payment entries and audit real-time repayment ledger history
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="🔍 Search name, PAN, ref..."
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
                    <option value="ACTIVE">Active / Disbursed</option>
                    <option value="CLOSED">Closed Accounts</option>
                  </select>

                  {(filterStatus !== 'ALL' || searchTerm) && (
                    <button
                      onClick={() => {
                        setFilterStatus('ALL');
                        setSearchTerm('');
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Clear Filters ✕
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <SkeletonTable rows={4} cols={7} />
              ) : error ? (
                <div className="p-6">
                  <ErrorState message={error} onRetry={() => fetchLoans(true)} />
                </div>
              ) : filteredLoans.length === 0 ? (
                <EmptyState
                  title={searchTerm || filterStatus !== 'ALL' ? 'No Matching Accounts' : 'No Accounts In Servicing'}
                  description={
                    searchTerm || filterStatus !== 'ALL'
                      ? 'No collection accounts matched your filter criteria. Try clearing your filters.'
                      : 'There are currently no active or disbursed loan accounts in collection servicing.'
                  }
                  icon="🏦"
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
                    ) : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Borrower Name</th>
                        <th className="px-6 py-4">PAN Card</th>
                        <th className="px-6 py-4">Total Obligation</th>
                        <th className="px-6 py-4">Total Paid</th>
                        <th className="px-6 py-4">Outstanding Balance</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                      {filteredLoans.map((loan) => (
                        <tr
                          key={loan._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {loan.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              #{loan._id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-extrabold uppercase text-slate-900 dark:text-slate-200">
                            {loan.pan}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                            ₹{loan.totalRepayment.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{loan.totalPaid.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 font-black text-rose-600 dark:text-rose-400">
                            ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openLoanDetails(loan)}
                              disabled={loan.status === 'CLOSED'}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Record Payment →
                            </button>
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

        {/* Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 space-y-6 my-8 transition-colors">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Collection Servicing #{selectedLoan._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Record credit repayments for {selectedLoan.fullName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="text-xs text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-800 dark:text-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block">Total Obligation</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block">Total Paid So Far</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{selectedLoan.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block">Remaining Balance</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">₹{selectedLoan.outstandingBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 border-t border-b border-slate-100 dark:border-slate-800 py-4">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Record Repayment Transaction
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Payment Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedLoan.outstandingBalance}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-extrabold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Unique UTR / Payment Reference *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Collection Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received via NEFT / UPI transfer."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || paymentAmount <= 0 || !paymentReference.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Recording Payment...' : 'Record Payment & Credit Ledger →'}
                  </button>
                </div>
              </form>

              {/* Payment History */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Payment History Ledger ({payments.length})
                </h4>

                {fetchingPayments ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-semibold animate-pulse">
                    Loading ledger...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-slate-400 text-xs font-medium">
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {payments.map((pmt) => (
                      <div
                        key={pmt._id}
                        className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs text-slate-800 dark:text-slate-200"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            ₹{pmt.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">Ref: {pmt.paymentReference}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            {new Date(pmt.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Recorded</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
