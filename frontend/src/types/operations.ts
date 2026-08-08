import { Loan } from './loan';
import { UserRole } from './auth';

export interface Payment {
  _id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  paymentReference: string;
  recordedBy: {
    _id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
  recordedAt: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverview {
  counts: Record<string, number>;
  financials: {
    totalDisbursedAmount: number;
    totalCollectedAmount: number;
    totalOutstandingAmount: number;
  };
  loans: Loan[];
}

export interface SalesReviewPayload {
  remarks: string;
  action: 'APPROVE' | 'REJECT';
}

export interface SanctionPayload {
  remarks: string;
}

export interface DisbursementPayload {
  disbursementReference: string;
  remarks?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  paymentReference: string;
  remarks?: string;
}
