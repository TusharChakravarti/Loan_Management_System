import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  loanId: Types.ObjectId;
  borrowerId: Types.ObjectId;
  amount: number;
  paymentReference: string;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentReference: {
      type: String,
      required: true,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
    },
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

export const Payment = model<IPayment>('Payment', paymentSchema);
