export interface LoanCalculationInput {
  loanAmount: number;
  tenureDays: number;
}

export interface LoanCalculationResult {
  valid: boolean;
  validationErrors: string[];
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
}

export const calculateLoan = (input: LoanCalculationInput): LoanCalculationResult => {
  const validationErrors: string[] = [];

  const P = Number(input.loanAmount);
  const T = Number(input.tenureDays);
  const R = 12; // Fixed 12% p.a.

  if (isNaN(P) || P < 50000 || P > 500000) {
    validationErrors.push(`Loan amount must be between ₹50,000 and ₹5,00,000 (Provided: ₹${input.loanAmount})`);
  }

  if (isNaN(T) || T < 30 || T > 365) {
    validationErrors.push(`Loan tenure must be between 30 and 365 days (Provided: ${input.tenureDays} days)`);
  }

  if (validationErrors.length > 0) {
    return {
      valid: false,
      validationErrors,
      loanAmount: P,
      tenureDays: T,
      interestRate: R,
      simpleInterest: 0,
      totalRepayment: 0,
      totalPaid: 0,
      outstandingBalance: 0,
    };
  }

  // SI = (P * R * T) / (365 * 100)
  const exactSI = (P * R * T) / (365 * 100);
  const simpleInterest = Math.round(exactSI * 100) / 100;
  const totalRepayment = Math.round((P + simpleInterest) * 100) / 100;

  return {
    valid: true,
    validationErrors: [],
    loanAmount: P,
    tenureDays: T,
    interestRate: R,
    simpleInterest,
    totalRepayment,
    totalPaid: 0,
    outstandingBalance: totalRepayment,
  };
};
