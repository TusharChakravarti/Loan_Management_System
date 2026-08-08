'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../components/BorrowerNav';
import { useAuth } from '../../../context/AuthContext';
import { loanApi } from '../../../lib/api';
import { Loan } from '../../../types/loan';
import Link from 'next/link';

export default function BorrowerLoansPage() {
  const { user } = useAuth();
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
      setError(err.message || 'Failed to fetch loan applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
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

  // Metrics Calculation
  const totalApplications = loans.length;
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const closedLoans = loans.filter((l) => l.status === 'CLOSED').length;

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-50/80 pb-12">
        <BorrowerNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {user?.fullName || 'Valued Customer'}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Track your loan applications, approval status and repayments.
              </p>
            </div>
            <button
              onClick={fetchLoans}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors self-end sm:self-auto"
            >
              🔄 Refresh List
            </button>
          </div>

          {/* Quick Portfolio Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Applications
              </span>
              <span className="text-2xl font-black text-slate-900 block">{totalApplications}</span>
              <span className="text-[11px] text-slate-500 font-medium">Submitted across account</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active Outstanding Balance
              </span>
              <span className="text-2xl font-black text-blue-600 block">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{activeLoans.length} active loan account(s)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Completed Loans
              </span>
              <span className="text-2xl font-black text-emerald-600 block">{closedLoans}</span>
              <span className="text-[11px] text-slate-500 font-medium">Fully paid & closed</span>
            </div>
          </div>

          {/* Applications Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Your Loan Applications</h2>
                <p className="text-xs text-slate-500 font-medium">Recent loan requests and account history</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm font-semibold animate-pulse">
                Retrieving your applications...
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-slate-400 text-4xl">📄</div>
                <p className="text-slate-600 font-bold text-sm">No loan applications found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the "+ Apply for a Loan" button in the header bar above to start your application.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs text-slate-700 min-w-[768px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 rounded-l-xl">Application ID</th>
                      <th className="py-3.5 px-4">Loan Amount</th>
                      <th className="py-3.5 px-4">Tenure</th>
                      <th className="py-3.5 px-4">Total Repayment</th>
                      <th className="py-3.5 px-4">Outstanding Balance</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Application Date</th>
                      <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          #{loan._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          ₹{loan.loanAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-semibold">{loan.tenureDays} Days</td>
                        <td className="py-4 px-4 font-bold text-blue-700">
                          ₹{loan.totalRepayment.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadge(
                              loan.status
                            )}`}
                          >
                            {loan.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/borrower/loans/${loan._id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <span>View Details</span>
                            <span>→</span>
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
