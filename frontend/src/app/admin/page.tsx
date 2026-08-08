'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { OperationsNav } from '../../components/OperationsNav';
import { operationsApi } from '../../lib/api';
import { AdminOverview } from '../../types/operations';
import { Loan } from '../../types/loan';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <OperationsNav
          title="System Admin Dashboard"
          subtitle="Full-stack loan portfolio & operations overview"
        />

        <main className="max-w-7xl mx-auto p-6 space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 animate-pulse text-sm">
              Loading system metrics...
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-2xl border border-rose-200 text-rose-700 text-sm font-bold">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed Volume</span>
                  <span className="text-2xl font-black text-blue-600 block mt-1">
                    ₹{data.financials.totalDisbursedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collections Recorded</span>
                  <span className="text-2xl font-black text-emerald-600 block mt-1">
                    ₹{data.financials.totalCollectedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Portfolio Outstanding</span>
                  <span className="text-2xl font-black text-amber-600 block mt-1">
                    ₹{data.financials.totalOutstandingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'Pending', key: 'PENDING', color: 'bg-amber-100 text-amber-800' },
                  { label: 'Sanction Desk', key: 'SANCTION_PENDING', color: 'bg-blue-100 text-blue-800' },
                  { label: 'Disbursement', key: 'DISBURSEMENT_PENDING', color: 'bg-indigo-100 text-indigo-800' },
                  { label: 'Active', key: 'ACTIVE', color: 'bg-emerald-100 text-emerald-800' },
                  { label: 'Closed', key: 'CLOSED', color: 'bg-slate-200 text-slate-800' },
                  { label: 'Rejected', key: 'REJECTED', color: 'bg-rose-100 text-rose-800' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilterStatus(item.key)}
                    className={`p-3 rounded-xl border border-slate-200 text-left transition-all ${
                      filterStatus === item.key ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{item.label}</span>
                    <span className="text-lg font-extrabold text-slate-900 block mt-0.5">
                      {data.counts[item.key] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Master Portfolio Applications Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Master Portfolio Applications</h2>
                    <p className="text-xs text-slate-500">Filter: {filterStatus}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterStatus('ALL')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Show All ({data.counts.TOTAL})
                    </button>
                    <button
                      onClick={fetchOverview}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Loan ID</th>
                        <th className="p-3">Borrower</th>
                        <th className="p-3">PAN</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Tenure</th>
                        <th className="p-3">Total Repayment</th>
                        <th className="p-3">Outstanding</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredLoans.map((loan) => (
                        <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">#{loan._id.slice(-6)}</td>
                          <td className="p-3 font-bold text-slate-800">{loan.fullName}</td>
                          <td className="p-3 font-mono">{loan.pan}</td>
                          <td className="p-3 font-bold text-slate-800">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3">{loan.tenureDays} Days</td>
                          <td className="p-3 font-bold text-blue-700">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-black text-amber-600">₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                loan.status === 'CLOSED'
                                  ? 'bg-slate-200 text-slate-800'
                                  : loan.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : loan.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{new Date(loan.createdAt).toLocaleDateString()}</td>
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
    </ProtectedRoute>
  );
}
