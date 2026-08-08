'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi } from '../../../lib/api';
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

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getCollectionLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Collection loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
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
      setSelectedLoan(null);
      await fetchLoans();
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

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Loans</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {loans.filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED').length}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Repayments Collected</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Balance</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fully Closed Loans</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">
                {loans.filter((l) => l.status === 'CLOSED').length}
              </span>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Repayment Collection Desk</h2>
              <button
                onClick={fetchLoans}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading loans...</div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No active or disbursed loans found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Loan ID</th>
                      <th className="p-3">Borrower</th>
                      <th className="p-3">Total Repayment</th>
                      <th className="p-3">Total Paid</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Payment</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">#{loan._id.slice(-6)}</td>
                        <td className="p-3 font-bold text-slate-800">{loan.fullName}</td>
                        <td className="p-3 font-bold text-slate-800">₹{loan.totalRepayment.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-emerald-600 font-bold">₹{loan.totalPaid.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-black text-amber-600">₹{loan.outstandingBalance.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              loan.status === 'CLOSED'
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {loan.lastPaymentAt ? new Date(loan.lastPaymentAt).toLocaleDateString() : 'None'}
                        </td>
                        <td className="p-3">
                          {loan.status === 'CLOSED' ? (
                            <button
                              onClick={() => openLoanDetails(loan)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors"
                            >
                              View History
                            </button>
                          ) : (
                            <button
                              onClick={() => openLoanDetails(loan)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal / Record Payment & History Overlay */}
          {selectedLoan && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Collection & Repayment Desk</h3>
                    <p className="text-xs text-slate-500 font-mono">Loan ID: {selectedLoan._id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Repayment</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-700 block mt-0.5">₹{selectedLoan.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-700 font-bold uppercase block">Outstanding Balance</span>
                    <span className="text-sm font-black text-amber-700 block mt-0.5">₹{selectedLoan.outstandingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Form to Record Payment if loan is not closed */}
                {selectedLoan.status !== 'CLOSED' && (
                  <form onSubmit={handleRecordPayment} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Record New Repayment</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Payment Amount (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min={0.01}
                          max={selectedLoan.outstandingBalance}
                          step={0.01}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Payment Reference / Txn ID
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g. PAY-123456"
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Remarks (Optional)</label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Monthly EMI repayment via UPI"
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submitting || paymentAmount <= 0 || paymentAmount > selectedLoan.outstandingBalance}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Recording...' : 'Submit Repayment →'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Repayment History Ledger */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment History Ledger</h4>
                  {fetchingPayments ? (
                    <div className="text-center text-xs text-slate-500 p-4">Loading ledger...</div>
                  ) : payments.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 p-4 bg-slate-50 rounded-lg">No payments recorded yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Reference</th>
                            <th className="p-2">Recorded By</th>
                            <th className="p-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.map((p) => (
                            <tr key={p._id}>
                              <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
                              <td className="p-2 font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                              <td className="p-2 font-mono font-semibold">{p.paymentReference}</td>
                              <td className="p-2">{p.recordedBy?.fullName || 'Collection Officer'}</td>
                              <td className="p-2 text-slate-500">{p.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
