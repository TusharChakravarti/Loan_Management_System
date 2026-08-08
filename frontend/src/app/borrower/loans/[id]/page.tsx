'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
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

  useEffect(() => {
    if (id) {
      loanApi
        .getLoanById(id)
        .then((res) => setLoan(res.loan))
        .catch((err) => setError(err.message || 'Failed to retrieve loan application details'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Bar */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <Link href="/borrower/loans" className="text-xs font-bold text-blue-600 hover:underline block mb-1">
                ← Back to All Applications
              </Link>
              <h1 className="text-2xl font-black text-slate-900">
                Loan Application #{loan ? loan._id.slice(-6) : id}
              </h1>
            </div>
            {loan && (
              <span
                className={`px-3 py-1 rounded.full text-xs font-mono font-bold uppercase tracking-wider ${
                  loan.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                Status: {loan.status}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 animate-pulse text-sm">
              Retrieving loan records...
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 text-rose-700 text-sm font-bold space-y-2">
              <p className="text-base">Access / Data Error:</p>
              <p>{error}</p>
            </div>
          ) : loan ? (
            <div className="space-y-6">
              {/* Application Progress Bar */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifecycle Tracking</h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                    1. Application Submitted
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                    2. BRE Passed
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-bold">
                    3. Pending Underwriting (Sanction)
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl font-semibold">
                    4. Disbursement
                  </div>
                </div>
              </div>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    Financial Summary
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Requested Principal</span>
                      <span className="font-bold text-slate-800">₹{loan.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Tenure</span>
                      <span className="font-bold text-slate-800">{loan.tenureDays} Days</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Interest Rate</span>
                      <span className="font-bold text-slate-800">{loan.interestRate}% p.a. (Fixed)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Simple Interest (SI)</span>
                      <span className="font-bold text-slate-800">₹{loan.simpleInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-bold">Total Repayment Amount</span>
                      <span className="font-black text-blue-700 text-sm">₹{loan.totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Total Amount Paid</span>
                      <span className="font-bold text-emerald-600">₹{loan.totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Outstanding Balance</span>
                      <span className="font-bold text-slate-900">₹{loan.outstandingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Applicant & Document Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    Applicant Information
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Full Name</span>
                      <span className="font-bold text-slate-800">{loan.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">PAN</span>
                      <span className="font-mono font-bold text-slate-800">{loan.pan}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-bold text-slate-800">{new Date(loan.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Monthly Salary</span>
                      <span className="font-bold text-slate-800">₹{loan.monthlySalary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Employment Mode</span>
                      <span className="font-bold text-slate-800">{loan.employmentMode}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Salary Slip Document</span>
                      <a
                        href={`http://localhost:5000${loan.salarySlipUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {loan.salarySlipOriginalName}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
