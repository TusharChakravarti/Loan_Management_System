import { Schema, model, Document, Types } from 'mongoose';

export enum EmploymentMode {
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  SALES_REVIEW = 'SALES_REVIEW',
  SANCTION_PENDING = 'SANCTION_PENDING',
  SANCTIONED = 'SANCTIONED',
  DISBURSEMENT_PENDING = 'DISBURSEMENT_PENDING',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export interface ILoan extends Document {
  borrowerId: Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  breResult: {
    passed: boolean;
    rejectionReasons: string[];
  };
  salarySlipUrl: string;
  salarySlipPublicId?: string;
  salarySlipOriginalName: string;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;

  // Operations Workflow Fields
  salesReviewedBy?: Types.ObjectId;
  salesReviewedAt?: Date;
  salesRemarks?: string;

  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  sanctionRemarks?: string;

  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionRemarks?: string;

  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  disbursementReference?: string;
  disbursementRemarks?: string;

  lastPaymentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    pan: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
    },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
      required: true,
    },
    breResult: {
      passed: { type: Boolean, required: true },
      rejectionReasons: [{ type: String }],
    },
    salarySlipUrl: {
      type: String,
      required: true,
    },
    salarySlipPublicId: {
      type: String,
    },
    salarySlipOriginalName: {
      type: String,
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
    },
    tenureDays: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      required: true,
      default: 12,
    },
    simpleInterest: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.PENDING,
      required: true,
      index: true,
    },

    // Audit fields
    salesReviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    salesReviewedAt: { type: Date },
    salesRemarks: { type: String, trim: true },

    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    sanctionRemarks: { type: String, trim: true },

    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionRemarks: { type: String, trim: true },

    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    disbursementReference: { type: String, trim: true },
    disbursementRemarks: { type: String, trim: true },

    lastPaymentAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, any>).__v;
        return ret;
      },
    },
  }
);

export const Loan = model<ILoan>('Loan', loanSchema);
