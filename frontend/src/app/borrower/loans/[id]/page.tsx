'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { CredoraSidebar } from '../../../../components/CredoraSidebar';
import { CredoraHeader } from '../../../../components/CredoraHeader';
import { PageHeader } from '../../../../components/PageHeader';
import { StatusBadge } from '../../../../components/StatusBadge';
import { DocumentPreviewModal } from '../../../../components/DocumentPreviewModal';
import { SkeletonCard } from '../../../../components/SkeletonLoader';
import { ErrorState } from '../../../../components/ErrorState';
import { useToast } from '../../../../context/ToastContext';
import { loanApi } from '../../../../lib/api';
import { subscribeToLoanUpdates } from '../../../../lib/events';
import { Loan } from '../../../../types/loan';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SingleLoanDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { error: toastError } = useToast();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewIsImage, setPreviewIsImage] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const fetchLoan = async (showLoading = false) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    try {
      const res = await loanApi.getLoanById(id);
      setLoan(res.loan);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve loan application details');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan(true);

    const interval = setInterval(() => {
      fetchLoan(false);
    }, 3000);

    const unsubscribe = subscribeToLoanUpdates(() => {
      fetchLoan(false);
    });

    const handleFocus = () => fetchLoan(false);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [id]);

  const handleViewSalarySlip = async (loanId: string) => {
    setFetchingDoc(true);
    setPreviewLoading(true);
    setPreviewFileName(loan?.salarySlipOriginalName || 'SalarySlip.pdf');
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

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'SALES_REVIEW':
        return 2;
      case 'SANCTION_PENDING':
        return 3;
      case 'SANCTIONED':
      case 'DISBURSEMENT_PENDING':
        return 4;
      case 'ACTIVE':
        return 5;
      case 'CLOSED':
        return 6;
      case 'REJECTED':
      default:
        return 0;
    }
  };

  const stages = [
    { num: 1, label: 'Application Submitted' },
    { num: 2, label: 'Sales Review' },
    { num: 3, label: 'Sanction Assessment' },
    { num: 4, label: 'Disbursement' },
    { num: 5, label: 'Repayment' },
    { num: 6, label: 'Closed' },
  ];

  const currentStageIndex = loan ? getStageIndex(loan.status) : 1;

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <CredoraHeader
            title="Loan Tracking"
            subtitle="Real-time lifecycle & servicing status"
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <PageHeader
              title={`Loan #${loan ? loan._id.slice(-6).toUpperCase() : id}`}
              subtitle="Institutional Credit Lifecycle & Repayment Ledger"
              badgeText="CREDIT TRACKING"
            >
              <Link
                href="/borrower/loans"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ← Back to Portfolio
              </Link>
            </PageHeader>

            {loading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchLoan(true)} />
            ) : loan ? (
              <div className="space-y-6">
                {/* Progress Tracker Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Lifecycle Progress Bar
                    </h3>
                    <StatusBadge status={loan.status} />
                  </div>

                  {loan.status === 'REJECTED' ? (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 space-y-1 text-xs">
                      <span className="font-extrabold text-sm block text-rose-900 dark:text-rose-100">
                        Application Declined
                      </span>
                      <p className="font-medium">
                        This application was declined during risk evaluation.{' '}
                        {loan.sanctionRemarks && (
                          <span>
                            Sanction Remarks: <em>"{loan.sanctionRemarks}"</em>
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {stages.map((stg) => {
                        const isDone = currentStageIndex > stg.num;
                        const isCurrent = currentStageIndex === stg.num;
                        return (
                          <div
                            key={stg.num}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                : isCurrent
                                ? 'bg-credora-700 dark:bg-credora-600 border-credora-700 text-white shadow-xs font-bold'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full mx-auto flex items-center justify-center text-[10px] font-black mb-1 ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-white text-credora-700'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isDone ? '✓' : stg.num}
                            </div>
                            <div className="text-[11px] font-extrabold leading-tight">{stg.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financial Overview */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-200">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                      Financial Structure
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Requested Principal</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          ₹{loan.loanAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Tenure Duration</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{loan.tenureDays} Days</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Interest Rate</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{loan.interestRate}% p.a.</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Simple Interest</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          ₹{loan.simpleInterest.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-black">Total Repayment Amount</span>
                        <span className="font-black text-credora-600 dark:text-credora-400 text-sm">
                          ₹{loan.totalRepayment.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Paid</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{loan.totalPaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 dark:text-slate-400 font-black">Outstanding Balance</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Profile */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-200">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                      Applicant & Document Profile
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Full Name</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{loan.fullName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">PAN Card</span>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">{loan.pan}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Monthly Income</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          ₹{loan.monthlySalary.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Employment Mode</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{loan.employmentMode}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Salary Slip</span>
                        <button
                          onClick={() => handleViewSalarySlip(loan._id)}
                          disabled={fetchingDoc}
                          className="font-extrabold text-credora-600 dark:text-credora-400 hover:underline disabled:opacity-50 text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{fetchingDoc ? 'Opening Document...' : loan.salarySlipOriginalName}</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        fileName={previewFileName}
        blobUrl={previewBlobUrl}
        isImage={previewIsImage}
        isLoading={previewLoading}
      />
    </ProtectedRoute>
  );
}
