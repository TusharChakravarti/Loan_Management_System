'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi } from '../../../lib/api';
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

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getDisbursementLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Disbursement queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
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
      setSelectedLoan(null);
      setDisbursementReference('');
      setRemarks('');
      await fetchLoans();
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
          subtitle="Bank transfer execution & fund release"
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

          {/* Queue Metrics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sanctioned Loans Awaiting Disbursement</span>
              <span className="text-3xl font-black text-emerald-600 block mt-1">{loans.length}</span>
            </div>
            <button
              onClick={fetchLoans}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
            >
              Refresh Queue
            </button>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Disbursement Execution Queue</h2>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading disbursement queue...</div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No sanctioned loans currently awaiting disbursement.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Loan ID</th>
                      <th className="p-3">Borrower</th>
                      <th className="p-3">PAN</th>
                      <th className="p-3">Sanctioned Principal</th>
                      <th className="p-3">Tenure</th>
                      <th className="p-3">Sanction Remarks</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">#{loan._id.slice(-6)}</td>
                        <td className="p-3 font-bold text-slate-800">{loan.fullName}</td>
                        <td className="p-3 font-mono">{loan.pan}</td>
                        <td className="p-3 font-bold text-emerald-600">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3">{loan.tenureDays} Days</td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">{loan.sanctionRemarks || 'Sanctioned'}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setDisbursementReference(`UTR-${Date.now().toString().slice(-8)}`);
                              setRemarks('');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors"
                          >
                            Disburse Funds
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal / Disbursement Confirmation Form */}
          {selectedLoan && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handleDisburseLoan}
                className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Confirm Fund Disbursement</h3>
                    <p className="text-xs text-slate-500 font-mono">Loan ID: {selectedLoan._id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <p><strong>Borrower:</strong> {selectedLoan.fullName} ({selectedLoan.pan})</p>
                  <p><strong>Disbursement Amount:</strong> <span className="font-extrabold text-emerald-600 text-sm">₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</span></p>
                  <p><strong>Tenure:</strong> {selectedLoan.tenureDays} Days</p>
                  <p><strong>Sanction Notes:</strong> <em>{selectedLoan.sanctionRemarks || 'Approved'}</em></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bank Transfer Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    required
                    value={disbursementReference}
                    onChange={(e) => setDisbursementReference(e.target.value)}
                    placeholder="e.g. UTR987654321"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Disbursement Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter transfer details or confirmation notes..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !disbursementReference.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Processing Disbursement...' : 'Execute Disbursement & Activate Loan →'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
