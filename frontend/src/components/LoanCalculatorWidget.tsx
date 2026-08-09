'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface LoanCalculatorWidgetProps {
  initialAmount?: number;
  initialTenure?: number;
  onApply?: (amount: number, tenure: number) => void;
  showApplyButton?: boolean;
  ctaText?: string;
}

export const LoanCalculatorWidget: React.FC<LoanCalculatorWidgetProps> = ({
  initialAmount = 100000,
  initialTenure = 180,
  onApply,
  showApplyButton = true,
  ctaText = 'Apply for Loan →',
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [tenureDays, setTenureDays] = useState<number>(initialTenure);
  const [interestMonthly, setInterestMonthly] = useState<number>(1); // 1% per month = 12% p.a.

  const interestAnnual = interestMonthly * 12; // 12% p.a.
  const simpleInterest = Math.round(((amount * interestAnnual * tenureDays) / (365 * 100)) * 100) / 100;
  const totalAmount = Math.round((amount + simpleInterest) * 100) / 100;
  
  // Approximate EMI per 30 days
  const tenureMonths = Math.max(1, tenureDays / 30);
  const emi = Math.round((totalAmount / tenureMonths) * 100) / 100;

  const handleAmountInput = (val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setAmount(Math.min(1000000, Math.max(0, num)));
    }
  };

  const handleTenureInput = (val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setTenureDays(Math.min(365, Math.max(1, num)));
    }
  };

  const handleInterestInput = (val: string) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setInterestMonthly(Math.min(5, Math.max(0.1, num)));
    }
  };

  return (
    <div className="bg-[#f6f8fd] p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-5xl mx-auto">
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
                  min={5000}
                  max={1000000}
                  step={1000}
                  value={amount || ''}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  className="w-24 text-right font-black text-slate-900 outline-hidden bg-transparent"
                />
                <span className="ml-2 text-slate-400 text-sm font-semibold">Rs.</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
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
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={interestMonthly || ''}
                  onChange={(e) => handleInterestInput(e.target.value)}
                  className="w-16 text-right font-black text-slate-900 outline-hidden bg-transparent"
                />
                <span className="ml-2 text-slate-400 text-sm font-semibold">%</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={interestMonthly}
                onChange={(e) => setInterestMonthly(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* 3. Tenure */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-base font-extrabold text-slate-900 tracking-tight">Tenure</label>
              <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs font-bold text-slate-800">
                <input
                  type="number"
                  min={15}
                  max={365}
                  step={1}
                  value={tenureDays || ''}
                  onChange={(e) => handleTenureInput(e.target.value)}
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
              <span className="font-black text-slate-900 text-base">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>EMI (Approx. Monthly)</span>
              <span className="font-black text-slate-900 text-base">₹{emi.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Total Interest</span>
              <span className="font-black text-slate-900 text-base">₹{simpleInterest.toLocaleString('en-IN')}</span>
            </div>

            <hr className="border-slate-100 my-2" />

            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-slate-900 text-base">Total Amount</span>
              <span className="font-black text-slate-900 text-xl">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {showApplyButton && (
            <div>
              {onApply ? (
                <button
                  type="button"
                  onClick={() => onApply(amount, tenureDays)}
                  className="w-full py-4 bg-[#0066ff] hover:bg-blue-700 text-white font-black text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>{ctaText}</span>
                </button>
              ) : (
                <Link
                  href="/borrower/apply"
                  className="w-full py-4 bg-[#0066ff] hover:bg-blue-700 text-white font-black text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>{ctaText}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
