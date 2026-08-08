import { EmploymentMode } from '../models/Loan.js';

export interface BREInput {
  dateOfBirth: string | Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode | string;
}

export interface BREResult {
  passed: boolean;
  rejectionReasons: string[];
  calculatedAge: number;
}

export const calculateAge = (dateOfBirth: string | Date): number => {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const evaluateBRE = (input: BREInput): BREResult => {
  const rejectionReasons: string[] = [];

  // Rule 1: Age must be between 23 and 50 inclusive
  const age = calculateAge(input.dateOfBirth);
  if (age === -1) {
    rejectionReasons.push('Invalid Date of Birth provided');
  } else if (age < 23 || age > 50) {
    rejectionReasons.push(`Age must be between 23 and 50 years inclusive (Calculated age: ${age})`);
  }

  // Rule 2: Monthly salary must be at least ₹25,000
  if (typeof input.monthlySalary !== 'number' || input.monthlySalary < 25000) {
    rejectionReasons.push(
      `Monthly salary must be at least ₹25,000 (Provided: ₹${input.monthlySalary ?? 0})`
    );
  }

  // Rule 3: PAN must match regex ^[A-Z]{5}[0-9]{4}[A-Z]$
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const normalizedPan = (input.pan || '').trim().toUpperCase();
  if (!panRegex.test(normalizedPan)) {
    rejectionReasons.push('Invalid PAN card format (Expected format: ABCDE1234F)');
  }

  // Rule 4: Employment mode cannot be UNEMPLOYED
  if (input.employmentMode === EmploymentMode.UNEMPLOYED || input.employmentMode === 'UNEMPLOYED') {
    rejectionReasons.push('Employment mode cannot be UNEMPLOYED');
  }

  return {
    passed: rejectionReasons.length === 0,
    rejectionReasons,
    calculatedAge: age,
  };
};
