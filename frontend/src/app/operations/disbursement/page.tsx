'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi } from '../../../lib/api';
import { broadcastLoanUpdate, subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';

export default function DisbursementDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [disbursementReference, setDisbursementReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLoans = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getDisbursementLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Disbursement queue');
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

  const handleDisburseLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !disbursementReference.trim()) return;
    setSubmitting(true);
    setActionSuccess(null);
    try {
      const res = await operationsApi.disburseLoan(selectedLoan._id, {
        disbursementReference: disbursementReference.trim(),
        remarks,
      });
      setActionSuccess(res.message);

      // Broadcast live event across all tabs/windows
      broadcastLoanUpdate({ type: 'LOAN_DISBURSED', loanId: selectedLoan._id });

      setSelectedLoan(null);
      setDisbursementReference('');
      setRemarks('');
      await fetchLoans(false);
    } catch (err: any) {
      alert(err.message || 'Failed to disburse loan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DISBURSEMENT', 'ADMIN']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <OperationsNav
          title="Disbursement Desk Module"
          subtitle="Fund release execution & banking reference management"
        />

        <main className="max-w-7xl mx-auto p-6 space-y-6">
          {actionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl flex justify-between items-center">
              <span>✓ {actionSuccess}</span>
              <button onClick={() => setActionSuccess(null)} className="text-xs text-emerald-600 font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* Queue Statistics Header */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Awaiting Fund Disbursement
              </span>
              <span className="text-3xl font-black text-slate-900">{loans.length}</span>
            </div>
            <button
              onClick={() => fetchLoans(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span>
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Disbursement Queue Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Disbursement Execution Queue</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Process sanctioned loan payouts and enter bank transaction references to activate loans.
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Loading Disbursement queue applications...
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 text-rose-700 text-xs font-bold">{error}</div>
            ) : loans.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                No pending sanctioned applications awaiting disbursement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4">PAN</th>
                      <th className="px-6 py-4">Sanctioned Amount</th>
                      <th className="px-6 py-4">Tenure</th>
                      <th className="px-6 py-4">Sanction Remarks</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{loan.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{loan._id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold uppercase">{loan.pan}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold">{loan.tenureDays} Days</td>
                        <td className="px-6 py-4 text-slate-600 font-normal italic">
                          "{loan.sanctionRemarks || 'Approved by Sanction Team'}"
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setDisbursementReference('');
                              setRemarks('');
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Disburse Funds →
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

        {/* Disbursement Execution Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <form onSubmit={handleDisburseLoan} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  Disburse Loan #{selectedLoan._id.slice(-6).toUpperCase()}
                </h3>
                <button type="button" onClick={() => setSelectedLoan(null)} className="text-xs text-slate-400 font-bold hover:text-slate-600 cursor-pointer">
                  ✕ Close
                </button>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl space-y-2 text-xs border border-purple-100 text-purple-900">
                <p><strong className="font-semibold">Borrower Name:</strong> {selectedLoan.fullName}</p>
                <p><strong className="font-semibold">Sanctioned Amount:</strong> ₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</p>
                <p><strong className="font-semibold">Total Repayment Balance:</strong> ₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Banking Transaction Reference / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR192837465012"
                  value={disbursementReference}
                  onChange={(e) => setDisbursementReference(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Disbursement Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transferred via NEFT/RTGS to borrower bank account."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !disbursementReference.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Executing Payout...' : 'Confirm Disburse & Activate Loan →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
