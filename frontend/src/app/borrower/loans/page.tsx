'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../components/BorrowerNav';
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

    // 1. Silent Auto-Polling Heartbeat (3s)
    const interval = setInterval(() => {
      fetchLoans(false);
    }, 3000);

    // 2. Live Cross-Tab Event Subscription
    const unsubscribe = subscribeToLoanUpdates(() => {
      fetchLoans(false);
    });

    // 3. Window Focus & Visibility Change Listeners
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
        <BorrowerNav title="Your Loan Applications" subtitle="Track real-time status and loan lifecycle" />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Header Action Bar */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Loan Portfolio</h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Welcome back, {user?.fullName}. Track your loan requests below.
              </p>
            </div>

            <Link
              href="/borrower/apply"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors"
            >
              + Apply for New Loan
            </Link>
          </div>

          {/* Loans Grid / Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-900">Your Submitted Applications ({loans.length})</h2>
              <button
                onClick={() => fetchLoans(true)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Fetching your loan applications...
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 text-rose-700 text-xs font-bold">{error}</div>
            ) : loans.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-700">No active loan applications found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven't submitted any loan requests yet. Click below to start a quick application.
                </p>
                <div className="pt-2">
                  <Link
                    href="/borrower/apply"
                    className="inline-block px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Start Loan Application →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Application ID</th>
                      <th className="px-6 py-4">Requested Amount</th>
                      <th className="px-6 py-4">Tenure</th>
                      <th className="px-6 py-4">Total Repayment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          #{loan._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">
                          ₹{loan.loanAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-semibold">{loan.tenureDays} Days</td>
                        <td className="px-6 py-4 font-bold text-blue-700">
                          ₹{loan.totalRepayment.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadge(
                              loan.status
                            )}`}
                          >
                            {loan.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/borrower/loans/${loan._id}`}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors inline-block"
                          >
                            View Track →
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
    </ProtectedRoute>
  );
}
