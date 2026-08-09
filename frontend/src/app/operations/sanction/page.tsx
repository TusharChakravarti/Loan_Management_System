'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { OperationsNav } from '../../../components/OperationsNav';
import { DocumentPreviewModal } from '../../../components/DocumentPreviewModal';
import { operationsApi, loanApi } from '../../../lib/api';
import { broadcastLoanUpdate, subscribeToLoanUpdates } from '../../../lib/events';
import { Loan } from '../../../types/loan';

export default function SanctionDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  // Document Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewIsImage, setPreviewIsImage] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const fetchLoans = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await operationsApi.getSanctionLoans();
      setLoans(res.loans);
    } catch (err: any) {
      setError(err.message || 'Failed to load Sanction queue');
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

  const handleSanctionAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionSuccess(null);
    try {
      let res;
      if (action === 'APPROVE') {
        res = await operationsApi.approveSanctionLoan(selectedLoan._id, { remarks });
        broadcastLoanUpdate({ type: 'SANCTION_APPROVED', loanId: selectedLoan._id });
      } else {
        res = await operationsApi.rejectSanctionLoan(selectedLoan._id, { remarks });
        broadcastLoanUpdate({ type: 'SANCTION_REJECTED', loanId: selectedLoan._id });
      }
      setActionSuccess(res.message);
      setSelectedLoan(null);
      setRemarks('');
      await fetchLoans(false);
    } catch (err: any) {
      alert(err.message || 'Failed to execute Sanction action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSalarySlip = async (loanId: string, defaultName: string) => {
    setFetchingDoc(true);
    setPreviewLoading(true);
    setPreviewFileName(defaultName || 'SalarySlip.pdf');
    setPreviewModalOpen(true);

    try {
      const res = await loanApi.fetchSalarySlipBlob(loanId);
      if (res && res.blob) {
        const url = URL.createObjectURL(res.blob);
        setPreviewBlobUrl(url);
        setPreviewFileName(res.fileName);
        setPreviewIsImage(res.isImage);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve salary slip document');
      setPreviewModalOpen(false);
    } finally {
      setFetchingDoc(false);
      setPreviewLoading(false);
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

          {/* Queue Statistics Header */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Awaiting Sanction Approval
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

          {/* Sanction Queue Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Sanction Review Queue</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Review verified applications passed by Sales Team and make final credit approval decisions.
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Loading Sanction review applications...
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-50 text-rose-700 text-xs font-bold">{error}</div>
            ) : loans.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                No pending loan applications awaiting Sanction approval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4">PAN</th>
                      <th className="px-6 py-4">Salary</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Sales Remarks</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">{loan.fullName}</span>
                          <button
                            onClick={() => handleViewSalarySlip(loan._id, loan.salarySlipOriginalName)}
                            className="text-[10px] text-blue-600 font-bold hover:underline block mt-0.5 cursor-pointer"
                          >
                            📄 View Salary Slip ↗
                          </button>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold uppercase">{loan.pan}</td>
                        <td className="px-6 py-4 font-bold">₹{loan.monthlySalary.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-black text-blue-600">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-600 font-normal italic">
                          "{loan.salesRemarks || 'Verified by Sales Team'}"
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRemarks('');
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Assess & Sanction →
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

        {/* Sanction Decision Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  Sanction Assessment #{selectedLoan._id.slice(-6).toUpperCase()}
                </h3>
                <button onClick={() => setSelectedLoan(null)} className="text-xs text-slate-400 font-bold hover:text-slate-600 cursor-pointer">
                  ✕ Close
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                <p><strong className="text-slate-500 font-semibold">Applicant:</strong> {selectedLoan.fullName} ({selectedLoan.pan})</p>
                <p><strong className="text-slate-500 font-semibold">Requested Amount:</strong> ₹{selectedLoan.loanAmount.toLocaleString('en-IN')} for {selectedLoan.tenureDays} Days</p>
                <p><strong className="text-slate-500 font-semibold">Sales Notes:</strong> "{selectedLoan.salesRemarks || 'N/A'}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Sanction Remarks / Credit Approval Justification
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Credit score and debt-to-income ratio meet risk criteria. Approved."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  disabled={submitting}
                  onClick={() => handleSanctionAction('REJECT')}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Reject & Decline
                </button>

                <button
                  disabled={submitting}
                  onClick={() => handleSanctionAction('APPROVE')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? 'Processing...' : 'Sanction & Send to Disbursement →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal Overlay */}
        <DocumentPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          fileName={previewFileName}
          blobUrl={previewBlobUrl}
          isImage={previewIsImage}
          isLoading={previewLoading}
        />
      </div>
    </ProtectedRoute>
  );
}
