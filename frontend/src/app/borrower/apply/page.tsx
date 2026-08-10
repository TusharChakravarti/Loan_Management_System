'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { CredoraSidebar } from '../../../components/CredoraSidebar';
import { CredoraHeader } from '../../../components/CredoraHeader';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { DocumentPreviewModal } from '../../../components/DocumentPreviewModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { loanApi } from '../../../lib/api';
import { BREResult, EmploymentMode, Loan } from '../../../types/loan';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplyLoanPage() {
  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [pan, setPan] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode>('SALARIED');

  // BRE State
  const [breLoading, setBreLoading] = useState<boolean>(false);
  const [breResult, setBreResult] = useState<BREResult | null>(null);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadedPublicId, setUploadedPublicId] = useState<string>('');
  const [uploadedResourceType, setUploadedResourceType] = useState<string>('');
  const [uploadedFormat, setUploadedFormat] = useState<string>('');
  const [uploadedName, setUploadedName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Loan Configuration State
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [tenureDays, setTenureDays] = useState<number>(180);
  const [interestMonthly, setInterestMonthly] = useState<number>(1);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLoan, setSubmittedLoan] = useState<Loan | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  // Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewIsImage, setPreviewIsImage] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const goToStep = (targetStep: number, pushHistory = true) => {
    setStep(targetStep);
    if (pushHistory && typeof window !== 'undefined') {
      window.history.pushState({ step: targetStep }, '', `/borrower/apply?step=${targetStep}`);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const stepParam = searchParams.get('step');
      if (stepParam) {
        const parsed = Number(stepParam);
        if (parsed >= 1 && parsed <= 6) {
          setStep(parsed);
        }
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.step === 'number') {
        setStep(e.state.step);
      } else if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const stepParam = searchParams.get('step');
        if (stepParam) {
          const parsed = Number(stepParam);
          if (parsed >= 1 && parsed <= 6) {
            setStep(parsed);
            return;
          }
        }
        setStep(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const interestAnnual = (interestMonthly || 1) * 12;
  const numericSalary = typeof monthlySalary === 'number' ? monthlySalary : 0;
  const simpleInterest = Math.round(((loanAmount * interestAnnual * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((loanAmount + simpleInterest) * 100) / 100;
  const tenureMonths = Math.max(1, tenureDays / 30);
  const emi = Math.round((totalRepayment / tenureMonths) * 100) / 100;

  const handleRunBRE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !pan || !dateOfBirth || !monthlySalary) {
      toastError('Please complete all required applicant fields.');
      return;
    }

    setBreLoading(true);
    setBreResult(null);
    try {
      const res = await loanApi.checkBRE({
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        pan,
        employmentMode,
      });
      setBreResult(res);
      if (res.passed) {
        toastSuccess('BRE Eligibility passed successfully!');
      } else {
        toastError('BRE Eligibility check failed.');
      }
      goToStep(2);
    } catch (err: any) {
      toastError(err.message || 'BRE evaluation failed');
    } finally {
      setBreLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await loanApi.uploadSalarySlip(selectedFile);
      setUploadedUrl(res.salarySlipUrl);
      setUploadedPublicId(res.salarySlipPublicId || '');
      setUploadedResourceType(res.salarySlipResourceType || '');
      setUploadedFormat(res.salarySlipFormat || '');
      setUploadedName(res.originalName || selectedFile.name);
      toastSuccess('Salary slip uploaded successfully!');
      goToStep(4);
    } catch (err: any) {
      const msg = err.message || 'Unable to upload salary slip file. Please try again.';
      setUploadError(msg);
      toastError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewDocument = () => {
    if (!selectedFile) {
      toastError('No document file selected for preview.');
      return;
    }

    const docBlobUrl = URL.createObjectURL(selectedFile);
    const fileName = selectedFile.name;
    const isImg = selectedFile.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(fileName);

    setPreviewFileName(fileName);
    setPreviewBlobUrl(docBlobUrl);
    setPreviewIsImage(isImg);
    setPreviewLoading(false);
    setPreviewModalOpen(true);
  };

  const handlePreviewSubmittedDocument = async (loanId: string) => {
    setFetchingDoc(true);
    setPreviewLoading(true);
    setPreviewFileName(submittedLoan?.salarySlipOriginalName || 'SalarySlip.pdf');
    setPreviewModalOpen(true);

    try {
      const docRes = await loanApi.fetchSalarySlipBlob(loanId);
      if (docRes && docRes.blob) {
        const url = URL.createObjectURL(docRes.blob);
        setPreviewBlobUrl(url);
        setPreviewFileName(docRes.fileName);
        setPreviewIsImage(docRes.isImage);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to preview salary slip document');
      setPreviewModalOpen(false);
    } finally {
      setFetchingDoc(false);
      setPreviewLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await loanApi.createLoan({
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth,
        monthlySalary: numericSalary,
        employmentMode,
        salarySlipUrl: uploadedUrl,
        salarySlipPublicId: uploadedPublicId,
        salarySlipResourceType: uploadedResourceType,
        salarySlipFormat: uploadedFormat,
        salarySlipOriginalName: uploadedName || selectedFile?.name || 'SalarySlip.pdf',
        loanAmount,
        tenureDays,
      });
      setSubmittedLoan(res.loan);
      toastSuccess('Loan application submitted successfully!');
      goToStep(6);
    } catch (err: any) {
      const msg = err.message || 'Loan submission failed. Please try again.';
      setSubmitError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-200">
        <CredoraHeader
          title="Loan Application Wizard"
          subtitle="Credora Digital Credit Application"
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex pt-16 min-h-screen">
          <CredoraSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

          <div className="flex-1 md:pl-64 min-w-0">
            <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 space-y-6">
            <PageHeader
              title="Apply for Personal Loan"
              subtitle="Instant verification & automated decision engine"
              badgeText="CREDIT WIZARD"
            >
              <Link
                href="/borrower/loans"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ← My Portfolio
              </Link>
            </PageHeader>

            {/* Stepper Progress Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex justify-between items-center text-xs font-bold overflow-x-auto gap-2">
              {['1. Details', '2. BRE Rules', '3. Salary Slip', '4. Calculator', '5. Review', '6. Receipt'].map(
                (label, idx) => {
                  const stepNum = idx + 1;
                  const active = step === stepNum;
                  const completed = step > stepNum;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (completed || active) goToStep(stepNum);
                      }}
                      className={`flex items-center gap-2 whitespace-nowrap ${
                        completed ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-black text-[10px] ${
                          completed
                            ? 'bg-emerald-500 text-white'
                            : active
                            ? 'bg-credora-700 dark:bg-credora-600 text-white ring-2 ring-credora-300 dark:ring-credora-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {stepNum}
                      </span>
                      <span
                        className={
                          active
                            ? 'text-slate-900 dark:text-white font-extrabold'
                            : 'text-slate-400 dark:text-slate-500 hidden sm:inline'
                        }
                      >
                        {label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Step Card Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors duration-200">
              {/* STEP 1 */}
              {step === 1 && (
                <form onSubmit={handleRunBRE} className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Step 1: Applicant Information
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Enter your personal & employment details for instant automated verification
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 outline-none text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ABCDE1234F"
                        pattern="^[A-Za-z]{5}[0-9]{4}[A-Za-z]$"
                        title="PAN format: ABCDE1234F"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 outline-none text-xs font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 outline-none text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Monthly Income (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="e.g. 75000"
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 outline-none text-xs font-extrabold"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Employment Sector Mode
                      </label>
                      <select
                        value={employmentMode}
                        onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-credora-500 outline-none text-xs font-bold"
                      >
                        <option value="SALARIED">SALARIED</option>
                        <option value="SELF_EMPLOYED">SELF_EMPLOYED</option>
                        <option value="UNEMPLOYED">UNEMPLOYED</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={breLoading}
                      className="px-6 py-3 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-black text-xs rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer tracking-wider uppercase"
                    >
                      {breLoading ? 'Verifying Eligibility...' : 'Evaluate Eligibility →'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2 */}
              {step === 2 && breResult && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Step 2: Decision Engine (BRE) Assessment
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Automated credit risk evaluation against institutional lending guidelines
                    </p>
                  </div>

                  {breResult.passed ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shrink-0 shadow-xs">
                          ✓
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                            BRE Eligibility Passed!
                          </h3>
                          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            Verified Age: {breResult.calculatedAge} years. You satisfy all Credora underwriting requirements.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <button
                          onClick={() => goToStep(1)}
                          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                        >
                          ← Modify Information
                        </button>
                        <button
                          onClick={() => goToStep(3)}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Proceed to Salary Slip Upload →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="h-9 w-9 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-base shrink-0 shadow-xs">
                          ✕
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-rose-950 dark:text-rose-100">
                            Application Ineligible (BRE Guidelines Unmet)
                          </h3>
                          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
                            Your profile does not satisfy system underwriting parameters:
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                        <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                          Rejection Reasons ({breResult.rejectionReasons.length})
                        </span>
                        <ul className="list-disc list-inside text-xs font-bold text-rose-800 dark:text-rose-200 space-y-1">
                          {breResult.rejectionReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <button
                          onClick={() => goToStep(1)}
                          className="px-4 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl hover:bg-rose-100 cursor-pointer"
                        >
                          ← Edit Applicant Info
                        </button>
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                          Application progression paused
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Step 3: Salary Slip Upload
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Upload your official salary slip (PDF, JPG, JPEG, PNG - Max 5 MB)
                    </p>
                  </div>

                  {uploadError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold">
                      {uploadError}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-credora-500 p-8 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        setError(null)
                        setSelectedFile(e.target.files?.[0] || null)}}
                      className="hidden"
                      id="salarySlipInput"
                    />
                    <label htmlFor="salarySlipInput" className="cursor-pointer space-y-2 block">
                      <span className="text-credora-600 dark:text-credora-400 font-black text-sm block">
                        Choose Document File
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                        {selectedFile ? selectedFile.name : 'Click to select document from device'}
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      disabled={!selectedFile || uploading}
                      onClick={handleUploadFile}
                      className="px-6 py-2.5 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {uploading ? 'Uploading Document...' : 'Upload & Continue →'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Step 4: Loan Calculator & Tenure Configuration
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Customize loan amount, interest rate, and tenure duration
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      <div className="lg:col-span-7 space-y-6">
                        {/* Loan Amount */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-extrabold text-slate-900 dark:text-white">
                              Loan Amount
                            </label>
                            <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs">
                              <input
                                type="number"
                                min={10000}
                                max={500000}
                                step={5000}
                                value={loanAmount || ''}
                                onChange={(e) =>
                                  setLoanAmount(Math.min(500000, Math.max(10000, Number(e.target.value))))
                                }
                                className="w-20 text-right font-black outline-none bg-transparent"
                              />
                              <span className="ml-1 text-slate-400 font-semibold">₹</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={10000}
                            max={500000}
                            step={5000}
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-credora-600"
                          />
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-extrabold text-slate-900 dark:text-white">
                              Monthly Interest
                            </label>
                            <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs">
                              <input
                                type="number"
                                min={0.5}
                                max={5}
                                step={0.1}
                                value={interestMonthly || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (!isNaN(val)) setInterestMonthly(Math.min(5, Math.max(0.1, val)));
                                }}
                                className="w-12 text-right font-black outline-none bg-transparent"
                              />
                              <span className="ml-1 text-slate-400 font-semibold">%</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0.5}
                            max={5}
                            step={0.1}
                            value={interestMonthly}
                            onChange={(e) => setInterestMonthly(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-credora-600"
                          />
                        </div>

                        {/* Tenure */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-extrabold text-slate-900 dark:text-white">
                              Tenure Duration
                            </label>
                            <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs">
                              <input
                                type="number"
                                min={30}
                                max={365}
                                step={5}
                                value={tenureDays || ''}
                                onChange={(e) =>
                                  setTenureDays(Math.min(365, Math.max(30, Number(e.target.value))))
                                }
                                className="w-12 text-right font-black outline-none bg-transparent"
                              />
                              <span className="ml-1 text-slate-400 font-semibold">Days</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={30}
                            max={365}
                            step={5}
                            value={tenureDays}
                            onChange={(e) => setTenureDays(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-credora-600"
                          />
                        </div>
                      </div>

                      {/* Right Calculator Card */}
                      <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                        <div className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex justify-between items-center">
                            <span>Selected Principal</span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              ₹{loanAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Estimated EMI</span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              ₹{emi.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Interest ({interestMonthly}%/mo)</span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              ₹{simpleInterest.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <hr className="border-slate-100 dark:border-slate-800 my-1" />
                          <div className="flex justify-between items-center pt-1">
                            <span className="font-black text-slate-900 dark:text-white">Total Repayment</span>
                            <span className="font-black text-credora-600 dark:text-credora-400 text-lg">
                              ₹{totalRepayment.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => goToStep(5)}
                          className="w-full py-3 bg-credora-700 hover:bg-credora-800 dark:bg-credora-600 dark:hover:bg-credora-700 text-white font-black text-xs rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
                        >
                          Review Application →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back to Upload
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Step 5: Application Summary Review
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Verify your details prior to final institutional submission
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold">
                      {submitError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Applicant Info */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                          Applicant Profile
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-[10px] font-extrabold text-credora-600 dark:text-credora-400 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1.5 text-slate-800 dark:text-slate-200">
                        <p><strong className="text-slate-500 dark:text-slate-400">Full Name:</strong> {fullName}</p>
                        <p><strong className="text-slate-500 dark:text-slate-400">PAN Card:</strong> <span className="font-mono uppercase">{pan}</span></p>
                        <p><strong className="text-slate-500 dark:text-slate-400">Date of Birth:</strong> {dateOfBirth}</p>
                        <p><strong className="text-slate-500 dark:text-slate-400">Monthly Salary:</strong> ₹{numericSalary.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                          Financial Structure
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(4)}
                          className="text-[10px] font-extrabold text-credora-600 dark:text-credora-400 hover:underline cursor-pointer"
                        >
                          Configure
                        </button>
                      </div>
                      <div className="space-y-1.5 text-slate-800 dark:text-slate-200">
                        <p><strong className="text-slate-500 dark:text-slate-400">Loan Amount:</strong> ₹{loanAmount.toLocaleString('en-IN')}</p>
                        <p><strong className="text-slate-500 dark:text-slate-400">Tenure:</strong> {tenureDays} Days</p>
                        <p><strong className="text-slate-500 dark:text-slate-400">Interest:</strong> ₹{simpleInterest.toLocaleString('en-IN')}</p>
                        <p className="text-sm font-black text-credora-700 dark:text-credora-400 pt-1">
                          Total Repayment: ₹{totalRepayment.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Document & Preview Button */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block">Attached Salary Slip</span>
                      <span className="font-bold text-slate-900 dark:text-white block">📄 {selectedFile?.name || uploadedName || 'SalarySlip.pdf'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePreviewDocument}
                      className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Preview Document ↗
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalSubmit}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6 */}
              {step === 6 && submittedLoan && (
                <div className="space-y-6">
                  <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-center space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                        Application Submitted Successfully!
                      </h2>
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        Your loan application has been received and routed to the Sales Operations Desk.
                      </p>
                    </div>
                    <div className="inline-block bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 font-mono text-xs font-black text-emerald-800 dark:text-emerald-200 shadow-2xs">
                      Reference: #{submittedLoan._id.slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block">Uploaded Salary Slip Document</span>
                      <span className="font-bold text-slate-900 dark:text-white block">📄 {submittedLoan.salarySlipOriginalName}</span>
                    </div>

                    <button
                      type="button"
                      disabled={fetchingDoc}
                      onClick={() => handlePreviewSubmittedDocument(submittedLoan._id)}
                      className="px-4 py-2 bg-credora-700 hover:bg-credora-800 text-white font-bold text-xs rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      {fetchingDoc ? 'Opening Document...' : 'View Salary Slip ↗'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href="/borrower/loans"
                      className="w-full sm:w-auto text-center px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                    >
                      ← Portfolio Overview
                    </Link>

                    <Link
                      href={`/borrower/loans/${submittedLoan._id}`}
                      className="w-full sm:w-auto text-center px-6 py-2.5 bg-credora-700 hover:bg-credora-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Track Application Details →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>

      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        fileName={previewFileName}
        blobUrl={previewBlobUrl}
        isImage={previewIsImage}
        isLoading={previewLoading}
      />
    </ProtectedRoute>
  );
}
