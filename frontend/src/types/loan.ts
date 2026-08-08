export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export type LoanStatus =
  | 'PENDING'
  | 'SALES_REVIEW'
  | 'SANCTION_PENDING'
  | 'SANCTIONED'
  | 'DISBURSEMENT_PENDING'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'CLOSED';

export interface BREResult {
  passed: boolean;
  rejectionReasons: string[];
  calculatedAge: number;
}

export interface Loan {
  _id: string;
  borrowerId: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  breResult: {
    passed: boolean;
    rejectionReasons: string[];
  };
  salarySlipUrl: string;
  salarySlipPublicId?: string;
  salarySlipResourceType?: string;
  salarySlipFormat?: string;
  salarySlipOriginalName: string;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;

  // Audit & Remarks
  salesRemarks?: string;
  sanctionRemarks?: string;
  rejectionRemarks?: string;
  disbursementReference?: string;
  disbursementRemarks?: string;
  lastPaymentAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanPayload {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl: string;
  salarySlipPublicId?: string;
  salarySlipResourceType?: string;
  salarySlipFormat?: string;
  salarySlipOriginalName: string;
  loanAmount: number;
  tenureDays: number;
}
