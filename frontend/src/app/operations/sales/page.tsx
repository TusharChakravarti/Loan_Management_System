'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { operationsApi, loanApi } from '../../../lib/api';
import { Loan } from '../../../types/loan';

export default function SalesDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getSalesLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Sales review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleProcessReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionSuccess(null);
    try {
      const res = await operationsApi.reviewSalesLoan(selectedLoan._id, {
        remarks,
        action,
      });
      setActionSuccess(res.message);
      setSelectedLoan(null);
      setRemarks('');
      await fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Failed to submit Sales review action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSalarySlip = async (loanId: string) => {
    setFetchingDoc(true);
    try {
      const res = await loanApi.getSalarySlipUrl(loanId);
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve salary slip document');
    } finally {
      setFetchingDoc(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SALES', 'ADMIN']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <OperationsNav
          title="Sales Desk Module"
          subtitle="Application verification & preliminary review"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                {loans.filter((l) => l.status === 'PENDING').length}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Sales Review</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">
                {loans.filter((l) => l.status === 'SALES_REVIEW').length}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sent to Sanction</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {loans.filter((l) => l.status === 'SANCTION_PENDING').length}
              </span>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Sales Application Queue</h2>
              <button
                onClick={fetchLoans}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
              >
                Refresh Queue
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading applications...</div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            ) : loans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No applications currently in Sales queue.</div>
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
                      <th className="p-3">Status</th>
                      <th className="p-3">Submitted</th>
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
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(loan.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRemarks(loan.salesRemarks || '');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors"
                          >
                            Review & Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal / Detailed Review Overlay */}
          {selectedLoan && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Sales Application Review</h3>
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
                    <p><strong>Employment Mode:</strong> {selectedLoan.employmentMode}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <p><strong>Loan Amount:</strong> ₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</p>
                    <p><strong>Tenure:</strong> {selectedLoan.tenureDays} Days</p>
                    <p><strong>Interest Rate:</strong> 12% p.a. (Fixed)</p>
                    <p><strong>Simple Interest:</strong> ₹{selectedLoan.simpleInterest.toLocaleString('en-IN')}</p>
                    <p className="font-bold text-blue-700">Total Repayment: ₹{selectedLoan.totalRepayment.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex justify-between items-center">
                  <span>BRE Verification: <strong>PASSED</strong></span>
                  <button
                    onClick={() => handleViewSalarySlip(selectedLoan._id)}
                    disabled={fetchingDoc}
                    className="font-bold text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                  >
                    {fetchingDoc ? 'Opening Document...' : 'View Salary Slip Document ↗'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Sales Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter preliminary verification notes or comments..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleProcessReview('REJECT')}
                    disabled={submitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Reject Application'}
                  </button>

                  <button
                    onClick={() => handleProcessReview('APPROVE')}
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Complete Sales Review & Send to Sanction →'}
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
