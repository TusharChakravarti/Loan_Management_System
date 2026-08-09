'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { CredoraSidebar } from '../../../components/CredoraSidebar';
import { OperationsNav } from '../../../components/OperationsNav';
import { PageHeader } from '../../../components/PageHeader';
import { FinancialMetricCard } from '../../../components/FinancialMetricCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { DocumentPreviewModal } from '../../../components/DocumentPreviewModal';
import { SkeletonTable } from '../../../components/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';
import { useToast } from '../../../context/ToastContext';
import { operationsApi, loanApi } from '../../../lib/api';
import { broadcastLoanUpdate, subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';
import { UserRole } from '../../../types/auth';

export default function SalesDashboardPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  // Document Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewIsImage, setPreviewIsImage] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchLoans = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getSalesLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Sales review queue');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredLoans = loans.filter((l) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      l.fullName.toLowerCase().includes(term) ||
      l.pan.toLowerCase().includes(term) ||
      l._id.toLowerCase().includes(term)
    );
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

  const handleProcessReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      const res = await operationsApi.reviewSalesLoan(selectedLoan._id, {
        remarks,
        action,
      });
      toastSuccess(res.message);
      
      broadcastLoanUpdate({ type: 'SALES_APPROVED', loanId: selectedLoan._id });

      setSelectedLoan(null);
      setRemarks('');
      await fetchLoans(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to submit Sales review action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSalarySlip = async (loanId: string, defaultName: string) => {
    setFetchingDoc(true);
    setPreviewLoading(true);
    setPreviewFileName(defaultName || 'SalarySlip.pdf');
    setPreviewModalOpen(true);

    try {
      const res = await loanApi.fetchSalarySlipBlob(loanId);
      if (res && res.blob) {
        const url = URL.createObjectURL(res.blob);
        setPreviewBlobUrl(url);
        setPreviewFileName(res.fileName);
        setPreviewIsImage(res.isImage);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to retrieve salary slip document');
      setPreviewModalOpen(false);
    } finally {
      setFetchingDoc(false);
      setPreviewLoading(false);
    }
  };

  const totalVolume = loans.reduce((acc, curr) => acc + curr.loanAmount, 0);

  return (
    <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN]}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <OperationsNav
          title="Sales Desk Module"
          subtitle="Preliminary verification & document review"
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex pt-16 min-h-screen">
          <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

          <div className="flex-1 md:pl-64 min-w-0">
            <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 space-y-6">
            <PageHeader
              title="Sales Review Queue"
              subtitle="Verify salary slip uploads, income credentials & route to Sanction Desk"
              badgeText="SALES PORTAL"
            >
              <button
                onClick={() => fetchLoans(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                🔄 Live Refresh
              </button>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinancialMetricCard
                title="Awaiting Sales Review"
                value={loans.length}
                subtitle="Applications pending preliminary check"
                icon="📋"
                variant="primary"
              />
              <FinancialMetricCard
                title="Queue Requested Capital"
                value={`₹${totalVolume.toLocaleString('en-IN')}`}
                subtitle="Total principal volume in Sales Desk"
                icon="💼"
                variant="default"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Pending Application Queue</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-credora-100 dark:bg-credora-900/80 text-credora-700 dark:text-credora-300">
                      {filteredLoans.length} of {loans.length}
                    </span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Verify salary documentation and forward eligible files to Sanction Desk
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
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
              </div>

              {loading ? (
                <SkeletonTable rows={4} cols={6} />
              ) : error ? (
                <div className="p-6">
                  <ErrorState message={error} onRetry={() => fetchLoans(true)} />
                </div>
              ) : filteredLoans.length === 0 ? (
                <EmptyState
                  title={searchTerm ? 'No Matching Applications' : 'Sales Queue Empty'}
                  description={
                    searchTerm
                      ? `No applications matched "${searchTerm}". Try clearing your search filter.`
                      : 'There are currently no pending loan applications awaiting preliminary Sales review.'
                  }
                  icon="✨"
                  action={
                    searchTerm ? (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Clear Search Filter
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
                        <th className="px-6 py-4">Monthly Income</th>
                        <th className="px-6 py-4">Requested Amount</th>
                        <th className="px-6 py-4">Salary Slip</th>
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
                            ₹{loan.monthlySalary.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 font-black text-credora-600 dark:text-credora-400">
                            ₹{loan.loanAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewSalarySlip(loan._id, loan.salarySlipOriginalName)}
                              disabled={fetchingDoc}
                              className="font-extrabold text-credora-600 dark:text-credora-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>📄 Salary Slip</span>
                              <span>↗</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setRemarks('');
                              }}
                              className="px-4 py-2 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                            >
                              Review Application →
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-5 transition-colors">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Review Loan #{selectedLoan._id.slice(-6).toUpperCase()}
                </h3>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-xs text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2 text-xs text-slate-800 dark:text-slate-200">
                <p><strong className="text-slate-500 dark:text-slate-400">Applicant:</strong> {selectedLoan.fullName} ({selectedLoan.pan})</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Monthly Income:</strong> ₹{selectedLoan.monthlySalary.toLocaleString('en-IN')}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Loan Amount:</strong> ₹{selectedLoan.loanAmount.toLocaleString('en-IN')} for {selectedLoan.tenureDays} Days</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sales Remarks / Internal Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Salary slip verified with bank credit statements."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-credora-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={submitting}
                  onClick={() => handleProcessReview('REJECT')}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Reject File
                </button>

                <button
                  disabled={submitting}
                  onClick={() => handleProcessReview('APPROVE')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Approve & Route to Sanction →'}
                </button>
              </div>
            </div>
          </div>
        )}

        <DocumentPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          fileName={previewFileName}
          blobUrl={previewBlobUrl}
          isImage={previewIsImage}
          isLoading={previewLoading}
        />
      </div>
    </ProtectedRoute>
  );
}
