'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi } from '../../../lib/api';
import { Loan } from '../../../types/loan';

export default function SanctionDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getSanctionLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Sanction queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleSanctionAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionSuccess(null);
    try {
      let res;
      if (action === 'APPROVE') {
        res = await operationsApi.approveSanctionLoan(selectedLoan._id, { remarks });
      } else {
        res = await operationsApi.rejectSanctionLoan(selectedLoan._id, { remarks });
      }
      setActionSuccess(res.message);
      setSelectedLoan(null);
      setRemarks('');
      await fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Failed to execute Sanction action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SANCTION', 'ADMIN']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <OperationsNav
          title="Sanction Desk Module"
          subtitle="Credit risk assessment & sanction approvals"
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
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Sanction Approval</span>
              <span className="text-3xl font-black text-amber-600 block mt-1">{loans.length}</span>
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
            <h2 className="text-lg font-bold text-slate-900">Sanction Review Queue</h2>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading sanction queue...</div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No applications currently awaiting Sanction decision.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Loan ID</th>
                      <th className="p-3">Borrower</th>
                      <th className="p-3">PAN</th>
                      <th className="p-3">Salary</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Sales Remarks</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">#{loan._id.slice(-6)}</td>
                        <td className="p-3 font-bold text-slate-800">{loan.fullName}</td>
                        <td className="p-3 font-mono">{loan.pan}</td>
                        <td className="p-3">₹{loan.monthlySalary.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-blue-600">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">{loan.salesRemarks || 'Reviewed'}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRemarks('');
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-colors"
                          >
                            Assess & Sanction
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal / Detailed Sanction Assessment Overlay */}
          {selectedLoan && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Sanction Decision Desk</h3>
                    <p className="text-xs text-slate-500 font-mono">Loan ID: {selectedLoan._id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <p><strong>Applicant Name:</strong> {selectedLoan.fullName}</p>
                    <p><strong>PAN:</strong> {selectedLoan.pan}</p>
                    <p><strong>DOB:</strong> {new Date(selectedLoan.dateOfBirth).toLocaleDateString()}</p>
                    <p><strong>Monthly Salary:</strong> ₹{selectedLoan.monthlySalary.toLocaleString('en-IN')}</p>
                    <p><strong>Sales Notes:</strong> <em>{selectedLoan.salesRemarks || 'N/A'}</em></p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <p><strong>Requested Amount:</strong> ₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</p>
                    <p><strong>Tenure:</strong> {selectedLoan.tenureDays} Days</p>
                    <p><strong>Interest Rate:</strong> 12% p.a.</p>
                    <p><strong>Simple Interest:</strong> ₹{selectedLoan.simpleInterest.toLocaleString('en-IN')}</p>
                    <p className="font-bold text-blue-700">Total Repayment: ₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex justify-between items-center">
                  <span>BRE Status: <strong>PASSED</strong></span>
                  <a
                    href={`http://localhost:5000${selectedLoan.salarySlipUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 underline"
                  >
                    Inspect Salary Slip ↗
                  </a>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Sanction Decision Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter sanction approval notes or rejection rationale..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleSanctionAction('REJECT')}
                    disabled={submitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'REJECT Loan'}
                  </button>

                  <button
                    onClick={() => handleSanctionAction('APPROVE')}
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'APPROVE Sanction & Forward to Disbursement →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
