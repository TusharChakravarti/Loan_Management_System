'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../components/BorrowerNav';
import { DocumentPreviewModal } from '../../../components/DocumentPreviewModal';
import { useAuth } from '../../../context/AuthContext';
import { loanApi } from '../../../lib/api';
import { BREResult, EmploymentMode, Loan } from '../../../types/loan';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplyLoanPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<number>(1);

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

  // Helper for step navigation & browser location history synchronization
  const goToStep = (targetStep: number, pushHistory = true) => {
    setStep(targetStep);
    if (pushHistory && typeof window !== 'undefined') {
      window.history.pushState({ step: targetStep }, '', `/borrower/apply?step=${targetStep}`);
    }
  };

  useEffect(() => {
    // Read step from URL on initial load if present
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

    // Sync browser Back/Forward buttons with wizard steps
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

  // Dynamic Calculation Math based on selected interestMonthly state
  const interestAnnual = (interestMonthly || 1) * 12;
  const numericSalary = typeof monthlySalary === 'number' ? monthlySalary : 0;
  const simpleInterest = Math.round(((loanAmount * interestAnnual * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((loanAmount + simpleInterest) * 100) / 100;
  const tenureMonths = Math.max(1, tenureDays / 30);
  const emi = Math.round((totalRepayment / tenureMonths) * 100) / 100;

  // Step 1 -> Step 2: Trigger BRE
  const handleRunBRE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !pan || !dateOfBirth || !monthlySalary) {
      alert('Please fill in all required applicant details.');
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
      goToStep(2);
    } catch (err: any) {
      alert(err.message || 'BRE evaluation failed');
    } finally {
      setBreLoading(false);
    }
  };

  // Step 3: Handle Salary Slip File Upload to Cloudinary
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
      goToStep(4);
    } catch (err: any) {
      setUploadError(err.message || 'Unable to upload salary slip file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Pre-Submission Document Preview Handler (Opens Sleek In-Page Modal Overlay)
  const handlePreviewDocument = () => {
    if (!selectedFile) {
      alert('No document file selected for preview.');
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

  // Post-Submission Authenticated Document Preview Handler
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
      alert(err.message || 'Failed to preview salary slip document');
      setPreviewModalOpen(false);
    } finally {
      setFetchingDoc(false);
      setPreviewLoading(false);
    }
  };

  // Step 5: Final Loan Submission -> Step 6: Receipt & Confirmation
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
      goToStep(6);
    } catch (err: any) {
      setSubmitError(err.message || 'Loan submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['BORROWER']}>
      <div className="min-h-screen bg-slate-100 pb-12">
        <BorrowerNav title="Apply for Loan" subtitle="Multi-step borrower application wizard" />

        <div className="max-w-4xl mx-auto px-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Apply for Personal Loan</h1>
              <p className="text-slate-500 text-xs mt-1">Multi-step borrower application portal</p>
            </div>
            <Link
              href="/borrower/loans"
              className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              My Loans
            </Link>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600">
            {['1. Personal Info', '2. BRE Check', '3. Salary Slip', '4. Configure', '5. Review', '6. Receipt'].map(
              (label, idx) => {
                const stepNum = idx + 1;
                const active = step === stepNum;
                const completed = step > stepNum;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (completed || active) {
                        goToStep(stepNum);
                      }
                    }}
                    className={`flex items-center gap-2 text-left ${completed ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        completed
                          ? 'bg-emerald-500 text-white'
                          : active
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {stepNum}
                    </span>
                    <span className={active ? 'text-slate-900 font-bold' : 'hidden md:inline'}>{label}</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Wizard Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {/* STEP 1: Personal & Employment Details */}
            {step === 1 && (
              <form onSubmit={handleRunBRE} className="space-y-5">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Step 1: Personal & Employment Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABCDE1234F"
                      pattern="^[A-Za-z]{5}[0-9]{4}[A-Za-z]$"
                      title="PAN format: ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 50000"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employment Mode</label>
                    <select
                      value={employmentMode}
                      onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
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
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {breLoading ? 'Running BRE Verification...' : 'Validate BRE & Continue →'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: BRE Result Evaluation */}
            {step === 2 && breResult && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Step 2: Business Rules Engine (BRE) Eligibility Assessment
                </h2>

                {breResult.passed ? (
                  <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-lg">
                        ✓
                      </span>
                      <div>
                        <h3 className="font-extrabold text-base">BRE Verification Passed!</h3>
                        <p className="text-xs text-emerald-700 font-medium">
                          Calculated Age: {breResult.calculatedAge} years. You satisfy all system eligibility rules.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                      <button
                        onClick={() => goToStep(1)}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        ← Edit Info
                      </button>

                      <button
                        onClick={() => goToStep(3)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors"
                      >
                        Proceed to Salary Slip Upload →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-lg">
                        ✕
                      </span>
                      <div>
                        <h3 className="font-extrabold text-base text-rose-800">
                          Application Ineligible (BRE Rejection)
                        </h3>
                        <p className="text-xs text-rose-700 font-medium">
                          Your profile did not satisfy the backend eligibility rules. All rejection reasons are listed below:
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-rose-200 space-y-2">
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                        Rejection Reasons ({breResult.rejectionReasons.length})
                      </span>
                      <ul className="list-disc list-inside text-xs font-semibold text-rose-800 space-y-1">
                        {breResult.rejectionReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <button
                        onClick={() => goToStep(1)}
                        className="px-4 py-2 bg-white border border-rose-300 text-rose-700 font-bold text-xs rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        ← Modify Info
                      </button>
                      <span className="text-xs text-rose-600 font-bold">Progression blocked due to BRE failure</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Salary Slip Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Step 3: Upload Salary Slip Document
                </h2>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">
                    Upload your latest salary slip. Allowed file formats: <strong>PDF, JPG, JPEG, PNG</strong> (Max size: <strong>5 MB</strong>).
                  </p>

                  {uploadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                      {uploadError}
                    </div>
                  )}

                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 p-8 rounded-xl text-center space-y-3 bg-slate-50">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="salarySlipInput"
                    />
                    <label htmlFor="salarySlipInput" className="cursor-pointer space-y-2 block">
                      <span className="text-blue-600 font-bold text-sm block">Choose Document File</span>
                      <span className="text-xs text-slate-500 font-semibold block">
                        {selectedFile ? selectedFile.name : 'Click to browse file from device'}
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      disabled={!selectedFile || uploading}
                      onClick={handleUploadFile}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {uploading ? 'Uploading File...' : 'Upload & Continue →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Interactive Loan Calculator */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Step 4: Configure Loan Amount & Tenure
                </h2>

                <div className="bg-[#f6f8fd] p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Inputs Column */}
                    <div className="lg:col-span-7 space-y-7">
                      {/* 1. Loan Amount */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-base font-extrabold text-slate-900 tracking-tight">Loan Amount</label>
                          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs font-bold text-slate-800">
                            <input
                              type="number"
                              min={10000}
                              max={500000}
                              step={5000}
                              value={loanAmount || ''}
                              onChange={(e) => setLoanAmount(Math.min(500000, Math.max(10000, Number(e.target.value))))}
                              className="w-24 text-right font-black text-slate-900 outline-hidden bg-transparent"
                            />
                            <span className="ml-2 text-slate-400 text-sm font-semibold">Rs.</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={10000}
                          max={500000}
                          step={5000}
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Number(e.target.value))}
                          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      {/* 2. Interest (In Months) */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <label className="text-base font-extrabold text-slate-900 tracking-tight">Interest</label>
                            <span className="text-xs font-semibold text-slate-400">(In Months)</span>
                          </div>
                          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs font-bold text-slate-800">
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
                              className="w-16 text-right font-black text-slate-900 outline-hidden bg-transparent"
                            />
                            <span className="ml-2 text-slate-400 text-sm font-semibold">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={5}
                          step={0.1}
                          value={interestMonthly}
                          onChange={(e) => setInterestMonthly(Number(e.target.value))}
                          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      {/* 3. Tenure */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-base font-extrabold text-slate-900 tracking-tight">Tenure</label>
                          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs font-bold text-slate-800">
                            <input
                              type="number"
                              min={30}
                              max={365}
                              step={5}
                              value={tenureDays || ''}
                              onChange={(e) => setTenureDays(Math.min(365, Math.max(30, Number(e.target.value))))}
                              className="w-16 text-right font-black text-slate-900 outline-hidden bg-transparent"
                            />
                            <span className="ml-2 text-slate-400 text-sm font-semibold">Days</span>
                          </div>
                        </div>
                        <div className="relative flex items-center p-1 rounded-xl bg-white border border-slate-300">
                          <input
                            type="range"
                            min={30}
                            max={365}
                            step={5}
                            value={tenureDays}
                            onChange={(e) => setTenureDays(Number(e.target.value))}
                            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Summary Column */}
                    <div className="lg:col-span-5 bg-white p-7 sm:p-8 rounded-2xl shadow-xs border border-slate-100 space-y-6">
                      <div className="space-y-4 text-sm font-medium text-slate-700">
                        <div className="flex justify-between items-center">
                          <span>Loan Amount selected</span>
                          <span className="font-black text-slate-900 text-base">₹{loanAmount.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>EMI (Approx. Monthly)</span>
                          <span className="font-black text-slate-900 text-base">₹{emi.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span>Total Interest</span>
                            <span className="text-[10px] text-blue-600 font-bold">({interestMonthly}%/mo = {interestAnnual}% p.a.)</span>
                          </div>
                          <span className="font-black text-slate-900 text-base">₹{simpleInterest.toLocaleString('en-IN')}</span>
                        </div>

                        <hr className="border-slate-100 my-2" />

                        <div className="flex justify-between items-center pt-1">
                          <span className="font-bold text-slate-900 text-base">Total Amount</span>
                          <span className="font-black text-slate-900 text-xl">₹{totalRepayment.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => goToStep(5)}
                        className="w-full py-4 bg-[#0066ff] hover:bg-blue-700 text-white font-black text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Apply for Loan →</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    ← Back to Salary Slip Upload
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Final Review & Submission */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                    Step 5: Review & Submit Application
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    You are about to submit your loan application. Please review all personal details, loan structure, and your uploaded salary slip document before confirming.
                  </p>
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                    {submitError}
                  </div>
                )}

                {/* Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Applicant Details Card */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Applicant Details
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1.5 text-slate-800">
                      <p><strong className="text-slate-500 font-semibold">Full Name:</strong> {fullName}</p>
                      <p><strong className="text-slate-500 font-semibold">PAN Card:</strong> <span className="font-mono uppercase">{pan}</span></p>
                      <p><strong className="text-slate-500 font-semibold">Date of Birth:</strong> {dateOfBirth}</p>
                      <p><strong className="text-slate-500 font-semibold">Monthly Salary:</strong> ₹{numericSalary.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500 font-semibold">Employment Mode:</strong> {employmentMode}</p>
                    </div>
                  </div>

                  {/* Loan Structure Card */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Loan Details
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(4)}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Configure
                      </button>
                    </div>
                    <div className="space-y-1.5 text-slate-800">
                      <p><strong className="text-slate-500 font-semibold">Requested Amount:</strong> ₹{loanAmount.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500 font-semibold">Tenure Duration:</strong> {tenureDays} Days</p>
                      <p><strong className="text-slate-500 font-semibold">Interest Rate:</strong> {interestMonthly}%/mo ({interestAnnual}% p.a.)</p>
                      <p><strong className="text-slate-500 font-semibold">Simple Interest:</strong> ₹{simpleInterest.toLocaleString('en-IN')}</p>
                      <p className="text-sm font-black text-blue-700 pt-1">
                        Total Repayment: ₹{totalRepayment.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents & Verification Card */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Uploaded Document & Verification
                    </span>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Reupload
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        📄 {selectedFile?.name || uploadedName || 'SalarySlip.pdf'}
                      </span>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Uploaded
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ BRE Verification Passed
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePreviewDocument}
                      className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Preview Document</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalSubmit}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Confirmation Receipt Screen */}
            {step === 6 && submittedLoan && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500 text-white font-black text-2xl flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-emerald-950">Application Submitted Successfully!</h2>
                    <p className="text-xs text-emerald-700 font-semibold mt-1">
                      Your loan request has been registered and assigned for Sales verification.
                    </p>
                  </div>
                  <div className="inline-block bg-white px-4 py-1.5 rounded-full border border-emerald-200 font-mono text-xs font-bold text-emerald-800 shadow-xs">
                    Application ID: #{submittedLoan._id.slice(-6).toUpperCase()}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Financial Summary */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-2">
                      Loan Structure
                    </span>
                    <div className="space-y-1.5 text-slate-800">
                      <p><strong className="text-slate-500 font-semibold">Requested Amount:</strong> ₹{submittedLoan.loanAmount.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500 font-semibold">Tenure:</strong> {submittedLoan.tenureDays} Days</p>
                      <p><strong className="text-slate-500 font-semibold">Interest Rate:</strong> {submittedLoan.interestRate}% p.a. (Fixed)</p>
                      <p><strong className="text-slate-500 font-semibold">Simple Interest:</strong> ₹{submittedLoan.simpleInterest.toLocaleString('en-IN')}</p>
                      <p className="text-sm font-black text-blue-700 pt-1">
                        Total Repayment: ₹{submittedLoan.totalRepayment.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Applicant Details */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-2">
                      Applicant Info
                    </span>
                    <div className="space-y-1.5 text-slate-800">
                      <p><strong className="text-slate-500 font-semibold">Full Name:</strong> {submittedLoan.fullName}</p>
                      <p><strong className="text-slate-500 font-semibold">PAN Card:</strong> <span className="font-mono uppercase">{submittedLoan.pan}</span></p>
                      <p><strong className="text-slate-500 font-semibold">Monthly Salary:</strong> ₹{submittedLoan.monthlySalary.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500 font-semibold">Status:</strong> <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">{submittedLoan.status}</span></p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Document Card with Post-Submission Preview Button */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-500 font-semibold block">Uploaded Salary Slip Document</span>
                    <span className="font-bold text-slate-900 block">📄 {submittedLoan.salarySlipOriginalName}</span>
                  </div>

                  <button
                    type="button"
                    disabled={fetchingDoc}
                    onClick={() => handlePreviewSubmittedDocument(submittedLoan._id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{fetchingDoc ? 'Opening Document...' : 'Salary Slip Document'}</span>
                    <span>↗</span>
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200">
                  <Link
                    href="/borrower/loans"
                    className="w-full sm:w-auto text-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    ← View All Your Loan Applications
                  </Link>

                  <Link
                    href={`/borrower/loans/${submittedLoan._id}`}
                    className="w-full sm:w-auto text-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    View Application Tracking Details →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reusable In-Page Document Preview Modal Overlay */}
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
