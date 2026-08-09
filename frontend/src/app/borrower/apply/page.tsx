'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BorrowerNav } from '../../../components/BorrowerNav';
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

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLoan, setSubmittedLoan] = useState<Loan | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<boolean>(false);

  // Calculation Math
  const interestRate = 12;
  const numericSalary = typeof monthlySalary === 'number' ? monthlySalary : 0;
  const simpleInterest = Math.round(((loanAmount * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((loanAmount + simpleInterest) * 100) / 100;

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
      setStep(2);
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
      setStep(4);
    } catch (err: any) {
      setUploadError(err.message || 'Unable to upload salary slip file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Pre-Submission Local Browser Document Preview Handler (Same-Tab Navigation)
  const handlePreviewDocument = () => {
    if (selectedFile) {
      const docBlobUrl = URL.createObjectURL(selectedFile);
      const fileName = selectedFile.name;
      const isImage = selectedFile.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(fileName);

      let htmlBodyContent = `<iframe src="${docBlobUrl}"></iframe>`;
      let bodyStyles = `margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #525659;`;

      if (isImage) {
        bodyStyles = `margin: 0; padding: 0; width: 100%; min-height: 100vh; background-color: #0f172a; display: flex; align-items: center; justify-content: center; overflow: auto;`;
        htmlBodyContent = `<div style="display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;max-width:100%;">
          <img src="${docBlobUrl}" alt="${fileName}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);" />
        </div>`;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${fileName}</title>
    <style>
      html, body { ${bodyStyles} }
      iframe { width: 100%; height: 100%; border: none; }
    </style>
  </head>
  <body>
    ${htmlBodyContent}
  </body>
</html>`;

      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlBlobUrl = URL.createObjectURL(htmlBlob);

      // Navigate in SAME TAB (NO _blank, NO window.open)
      window.location.href = htmlBlobUrl;
    } else {
      alert('No document file selected for preview.');
    }
  };

  // Post-Submission Authenticated Document Preview Handler (Same-Tab Navigation)
  const handlePreviewSubmittedDocument = async (loanId: string) => {
    setFetchingDoc(true);
    try {
      await loanApi.previewSalarySlip(loanId);
    } catch (err: any) {
      alert(err.message || 'Failed to preview salary slip document');
    } finally {
      setFetchingDoc(false);
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
      setStep(6);
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

        <div className="max-w-3xl mx-auto px-6 space-y-6">
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
                  <div key={label} className="flex items-center gap-2">
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
                  </div>
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
                        onClick={() => setStep(1)}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        ← Edit Info
                      </button>

                      <button
                        onClick={() => setStep(3)}
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
                        onClick={() => setStep(1)}
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
                      onClick={() => setStep(2)}
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

            {/* STEP 4: Loan Configuration */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Step 4: Configure Loan Amount & Tenure
                </h2>

                <div className="space-y-6">
                  {/* Loan Amount Slider */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase">Desired Loan Amount</label>
                      <span className="text-xl font-black text-blue-600">₹{loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={500000}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Min: ₹50,000</span>
                      <span>Max: ₹5,00,000</span>
                    </div>
                  </div>

                  {/* Tenure Slider */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase">Tenure Duration</label>
                      <span className="text-xl font-black text-slate-800">{tenureDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={365}
                      step={5}
                      value={tenureDays}
                      onChange={(e) => setTenureDays(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Min: 30 Days</span>
                      <span>Max: 365 Days</span>
                    </div>
                  </div>

                  {/* Live Calculation Output Card */}
                  <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                        Interest Rate
                      </span>
                      <span className="text-base font-bold text-slate-800 block mt-1">12% p.a. (Fixed)</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                        Simple Interest (SI)
                      </span>
                      <span className="text-base font-bold text-slate-800 block mt-1">
                        ₹{simpleInterest.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                        Total Repayment
                      </span>
                      <span className="text-lg font-black text-blue-700 block mt-1">
                        ₹{totalRepayment.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
                    >
                      Review Application →
                    </button>
                  </div>
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
                        onClick={() => setStep(1)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
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
                        onClick={() => setStep(4)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Configure
                      </button>
                    </div>
                    <div className="space-y-1.5 text-slate-800">
                      <p><strong className="text-slate-500 font-semibold">Requested Amount:</strong> ₹{loanAmount.toLocaleString('en-IN')}</p>
                      <p><strong className="text-slate-500 font-semibold">Tenure Duration:</strong> {tenureDays} Days</p>
                      <p><strong className="text-slate-500 font-semibold">Interest Rate:</strong> 12% p.a. (Fixed)</p>
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
                      onClick={() => setStep(3)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
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
                      className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
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
                    onClick={() => setStep(4)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalSubmit}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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
                      <p><strong className="text-slate-500 font-semibold">Interest Rate:</strong> 12% p.a. (Fixed)</p>
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
    </ProtectedRoute>
  );
}
