'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../components/BorrowerNav';
import { loanApi } from '../../../lib/api';
import { Loan } from '../../../types/loan';
import Link from 'next/link';

export default function BorrowerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loanApi.getMyLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <BorrowerNav title="My Applications Portal" subtitle="Track loan status and repayment details" />

        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900">My Loan Applications</h1>
              <p className="text-slate-500 text-xs mt-1">Track status and repayments for your loans</p>
            </div>
            <Link
              href="/borrower/apply"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              + Apply for New Loan
            </Link>
          </div>

          {/* Loan List Table / Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading applications...</div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-500 font-medium text-sm">You have not submitted any loan applications yet.</p>
                <Link
                  href="/borrower/apply"
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Start Your First Application
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Application ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Tenure</th>
                      <th className="p-3">Total Repayment</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">#{loan._id.slice(-6)}</td>
                        <td className="p-3 font-bold text-slate-800">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3">{loan.tenureDays} Days</td>
                        <td className="p-3 font-bold text-blue-700">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                        <td className="p-3">₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              loan.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : loan.status === 'SANCTIONED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : loan.status === 'DISBURSED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(loan.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <Link
                            href={`/borrower/loans/${loan._id}`}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
