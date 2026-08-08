import { LoanStatus } from '../models/Loan.js';

const ALLOWED_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  [LoanStatus.PENDING]: [LoanStatus.SALES_REVIEW, LoanStatus.SANCTION_PENDING, LoanStatus.REJECTED],
  [LoanStatus.SALES_REVIEW]: [LoanStatus.SANCTION_PENDING, LoanStatus.REJECTED],
  [LoanStatus.SANCTION_PENDING]: [
    LoanStatus.DISBURSEMENT_PENDING,
    LoanStatus.SANCTIONED,
    LoanStatus.REJECTED,
  ],
  [LoanStatus.SANCTIONED]: [LoanStatus.DISBURSEMENT_PENDING, LoanStatus.ACTIVE, LoanStatus.DISBURSED],
  [LoanStatus.DISBURSEMENT_PENDING]: [LoanStatus.ACTIVE, LoanStatus.DISBURSED, LoanStatus.REJECTED],
  [LoanStatus.DISBURSED]: [LoanStatus.ACTIVE, LoanStatus.CLOSED],
  [LoanStatus.ACTIVE]: [LoanStatus.ACTIVE, LoanStatus.CLOSED],
  [LoanStatus.REJECTED]: [], // Terminal state
  [LoanStatus.CLOSED]: [],   // Terminal state
};

export const isValidTransition = (currentStatus: LoanStatus, targetStatus: LoanStatus): boolean => {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
};

export const validateStateTransition = (currentStatus: LoanStatus, targetStatus: LoanStatus): void => {
  if (!isValidTransition(currentStatus, targetStatus)) {
    throw new Error(
      `Illegal state transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
};
