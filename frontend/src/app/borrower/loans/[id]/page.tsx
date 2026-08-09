'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../../components/BorrowerNav';
import { loanApi } from '../../../../lib/api';
import { Loan } from '../../../../types/loan';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SingleLoanDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  // Real-time backend re-validation on mount & window focus
  const fetchLoan = async () => {
    if (!id) return;
    try {
      const res = await loanApi.getLoanById(id);
      setLoan(res.loan);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve loan application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();

    const handleFocus = () => {
      fetchLoan();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [id]);

  // Same-tab document viewing handler using authorized signed document URL
  const handleViewSalarySlip = async (loanId: string) => {
    setFetchingDoc(true);
    try {
      const res = await loanApi.getSalarySlipUrl(loanId);
      if (res && res.url) {
        // Same-tab navigation allowing browser Back button to naturally return to loan details page
        window.location.href = res.url;
      } else {
        alert('Unable to retrieve authorized document URL. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve salary slip document');
    } finally {
      setFetchingDoc(false);
    }
  };

  const getStageIndex = (status: string, outstanding: number, totalRepayment: number) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'SALES_REVIEW':
      case 'SANCTION_PENDING':
        return 2;
      case 'SANCTIONED':
      case 'DISBURSEMENT_PENDING':
        return 3;
      case 'ACTIVE':
        return outstanding < totalRepayment ? 5 : 4;
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

  const currentStageIndex = loan ? getStageIndex(loan.status, loan.outstandingBalance, loan.totalRepayment) : 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SALES_REVIEW':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SANCTION_PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SANCTIONED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'DISBURSEMENT_PENDING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CLOSED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-50/80 pb-12">
        <BorrowerNav />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <div>
              <Link
                href="/borrower/loans"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 mb-1"
              >
                <span>←</span>
                <span>Back to Your Loan Applications</span>
              </Link>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Loan Application #{loan ? loan._id.slice(-6).toUpperCase() : id}
              </h1>
            </div>
            {loan && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                  loan.status
                )}`}
              >
                {loan.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-xs border border-slate-200 text-center text-slate-400 font-semibold animate-pulse text-sm">
              Retrieving loan records...
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-2xl shadow-xs border border-rose-200 text-rose-700 text-xs font-bold space-y-2">
              <p className="text-sm font-extrabold">Error Loading Application:</p>
              <p>{error}</p>
            </div>
          ) : loan ? (
            <div className="space-y-6">
              {/* Lifecycle Progress Tracker */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Application Lifecycle Progress
                </h3>

                {loan.status === 'REJECTED' ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1 text-xs">
                    <span className="font-extrabold text-sm block text-rose-900">Application Declined</span>
                    <p>
                      This application was declined during risk evaluation.{' '}
                      {loan.sanctionRemarks && (
                        <span>
                          Sanction Officer Remarks: <em>"{loan.sanctionRemarks}"</em>
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
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : isCurrent
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full mx-auto flex items-center justify-center text-[10px] font-black mb-1 ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-white text-blue-600'
                                : 'bg-slate-200 text-slate-500'
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

              {/* Financial & Applicant Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                    Financial Summary
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Requested Principal</span>
                      <span className="font-bold text-slate-900">₹{loan.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Tenure Duration</span>
                      <span className="font-bold text-slate-900">{loan.tenureDays} Days</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Interest Rate</span>
                      <span className="font-bold text-slate-900">{loan.interestRate}% p.a. (Fixed)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Simple Interest (SI)</span>
                      <span className="font-bold text-slate-900">₹{loan.simpleInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-extrabold">Total Repayment Amount</span>
                      <span className="font-black text-blue-700 text-sm">₹{loan.totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Total Amount Paid</span>
                      <span className="font-bold text-emerald-600">₹{loan.totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-extrabold">Outstanding Balance</span>
                      <span className="font-black text-slate-900 text-sm">₹{loan.outstandingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Applicant & Document Information */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                    Applicant Profile & Documents
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Full Name</span>
                      <span className="font-bold text-slate-900">{loan.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">PAN</span>
                      <span className="font-mono font-bold text-slate-900">{loan.pan}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Date of Birth</span>
                      <span className="font-bold text-slate-900">
                        {new Date(loan.dateOfBirth).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Monthly Salary</span>
                      <span className="font-bold text-slate-900">₹{loan.monthlySalary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Employment Mode</span>
                      <span className="font-bold text-slate-900">{loan.employmentMode}</span>
                    </div>
                    <div className="flex justify-between py-1.5 items-center">
                      <span className="text-slate-500 font-medium">Salary Slip Document</span>
                      <button
                        onClick={() => handleViewSalarySlip(loan._id)}
                        disabled={fetchingDoc}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 text-xs inline-flex items-center gap-1"
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
    </ProtectedRoute>
  );
}
