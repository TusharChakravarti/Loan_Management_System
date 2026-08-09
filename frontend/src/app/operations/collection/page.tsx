'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi } from '../../../lib/api';
import { broadcastLoanUpdate, subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';
import { Payment } from '../../../types/operations';

export default function CollectionDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Loan for Repayment Recording or History View
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetchingPayments, setFetchingPayments] = useState<boolean>(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
    setActionSuccess(null);
    try {
      const res = await operationsApi.recordPayment(selectedLoan._id, {
        amount: paymentAmount,
        paymentReference: paymentReference.trim(),
        remarks,
      });
      setActionSuccess(res.message);

      // Broadcast live event across all tabs/windows
      broadcastLoanUpdate({ type: 'PAYMENT_RECORDED', loanId: selectedLoan._id });

      setSelectedLoan(null);
      await fetchLoans(false);
    } catch (err: any) {
      alert(err.message || 'Failed to record repayment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalCollected = loans.reduce((sum, l) => sum + l.totalPaid, 0);

  return (
    <ProtectedRoute allowedRoles={['COLLECTION', 'ADMIN']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <OperationsNav
          title="Collection Desk Module"
          subtitle="Repayment tracking, EMI recording & loan closure"
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

          {/* Portfolio Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Active Loan Portfolio
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{loans.length}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Total Outstanding Balance
              </span>
              <span className="text-3xl font-black text-rose-600 mt-1 block">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Total Collected Funds
              </span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Active Loans Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Active Repayment Accounts</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Record borrower EMI payments, view transaction ledger history, and process automatic loan closures.
                </p>
              </div>

              <button
                onClick={() => fetchLoans(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔄</span>
                <span>Refresh Queue</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Loading Active loan accounts...
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 text-rose-700 text-xs font-bold">{error}</div>
            ) : loans.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                No active loans requiring collection servicing.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4">PAN</th>
                      <th className="px-6 py-4">Total Repayment</th>
                      <th className="px-6 py-4">Total Paid</th>
                      <th className="px-6 py-4">Outstanding</th>
                      <th className="px-6 py-4">Status</th>
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
                        <td className="px-6 py-4 font-bold">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">₹{loan.totalPaid.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-black text-rose-600">
                          ₹{loan.outstandingBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              loan.status === 'CLOSED'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openLoanDetails(loan)}
                            disabled={loan.status === 'CLOSED'}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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

        {/* Record Repayment Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl p-6 space-y-6 my-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Collection Servicing #{selectedLoan._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Record payment credits for {selectedLoan.fullName}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedLoan(null)} className="text-xs text-slate-400 font-bold hover:text-slate-600 cursor-pointer">
                  ✕ Close
                </button>
              </div>

              {/* Financial Balance Overview Card */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Repayment</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Paid So Far</span>
                  <span className="font-extrabold text-emerald-600 text-sm">₹{selectedLoan.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Balance</span>
                  <span className="font-black text-rose-600 text-sm">₹{selectedLoan.outstandingBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Entry Form */}
              <form onSubmit={handleRecordPayment} className="space-y-4 border-t border-b border-slate-100 py-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Record New Repayment Entry
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Payment Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedLoan.outstandingBalance}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Payment Reference / UTR *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Collection Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received via UPI / IMPS from borrower account"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || paymentAmount <= 0 || !paymentReference.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Recording Payment...' : 'Record Payment & Credit Ledger →'}
                  </button>
                </div>
              </form>

              {/* Payment Ledger Audit History */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Payment History Ledger ({payments.length})
                </h4>

                {fetchingPayments ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-semibold animate-pulse">
                    Retrieving payment ledger...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs font-medium">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {payments.map((pmt) => (
                      <div key={pmt._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">₹{pmt.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">Ref: {pmt.paymentReference}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            {new Date(pmt.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Recorded</span>
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
