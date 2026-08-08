import { Request, Response } from 'express';
import { Loan, LoanStatus } from '../models/Loan.js';
import { Payment } from '../models/Payment.js';
import { validateStateTransition } from '../services/state-machine.service.js';
import { Types } from 'mongoose';

// ==========================================
// 1. SALES CONTROLLERS
// ==========================================

export const getSalesLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let query: any = {
      status: {
        $in: [LoanStatus.PENDING, LoanStatus.SALES_REVIEW, LoanStatus.SANCTION_PENDING],
      },
    };

    if (status && typeof status === 'string') {
      query = { status };
    }

    const loans = await Loan.find(query)
      .populate('borrowerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('[Operations Controller] Get Sales Loans Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch sales loans' });
  }
};

export const reviewSalesLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks, action } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    const targetStatus = action === 'REJECT' ? LoanStatus.REJECTED : LoanStatus.SANCTION_PENDING;

    try {
      validateStateTransition(loan.status, targetStatus);
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid Transition', message: err.message });
      return;
    }

    loan.status = targetStatus;
    loan.salesReviewedBy = new Types.ObjectId(req.user!.userId);
    loan.salesReviewedAt = new Date();
    loan.salesRemarks = remarks || 'Reviewed by Sales Team';

    if (action === 'REJECT') {
      loan.rejectedBy = new Types.ObjectId(req.user!.userId);
      loan.rejectedAt = new Date();
      loan.rejectionRemarks = remarks || 'Rejected during Sales review';
    }

    await loan.save();

    res.status(200).json({
      message: action === 'REJECT' ? 'Loan application rejected by Sales' : 'Loan review completed and sent to Sanction',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Operations Controller] Review Sales Loan Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process Sales review' });
  }
};

// ==========================================
// 2. SANCTION CONTROLLERS
// ==========================================

export const getSanctionLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: LoanStatus.SANCTION_PENDING })
      .populate('borrowerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('[Operations Controller] Get Sanction Loans Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch sanction loans' });
  }
};

export const approveSanctionLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    try {
      validateStateTransition(loan.status, LoanStatus.DISBURSEMENT_PENDING);
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid Transition', message: err.message });
      return;
    }

    loan.status = LoanStatus.DISBURSEMENT_PENDING;
    loan.sanctionedBy = new Types.ObjectId(req.user!.userId);
    loan.sanctionedAt = new Date();
    loan.sanctionRemarks = remarks || 'Sanction Approved';

    await loan.save();

    res.status(200).json({
      message: 'Loan approved by Sanction officer and forwarded to Disbursement',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Operations Controller] Approve Sanction Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to approve sanction' });
  }
};

export const rejectSanctionLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    try {
      validateStateTransition(loan.status, LoanStatus.REJECTED);
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid Transition', message: err.message });
      return;
    }

    loan.status = LoanStatus.REJECTED;
    loan.rejectedBy = new Types.ObjectId(req.user!.userId);
    loan.rejectedAt = new Date();
    loan.rejectionRemarks = remarks || 'Sanction Rejected';

    await loan.save();

    res.status(200).json({
      message: 'Loan application rejected by Sanction officer',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Operations Controller] Reject Sanction Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reject sanction' });
  }
};

// ==========================================
// 3. DISBURSEMENT CONTROLLERS
// ==========================================

export const getDisbursementLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({
      status: { $in: [LoanStatus.SANCTIONED, LoanStatus.DISBURSEMENT_PENDING] },
    })
      .populate('borrowerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('[Operations Controller] Get Disbursement Loans Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch disbursement loans' });
  }
};

export const disburseLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { disbursementReference, remarks } = req.body;

    if (!disbursementReference || !disbursementReference.trim()) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Disbursement reference number is required',
      });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    // Duplicate Disbursement Check
    if ([LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.CLOSED].includes(loan.status)) {
      res.status(400).json({
        error: 'Duplicate Disbursement Rejected',
        message: `Loan is already disbursed (Current Status: ${loan.status}). Duplicate disbursement request rejected.`,
      });
      return;
    }

    try {
      validateStateTransition(loan.status, LoanStatus.ACTIVE);
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid Transition', message: err.message });
      return;
    }

    loan.status = LoanStatus.ACTIVE;
    loan.disbursedBy = new Types.ObjectId(req.user!.userId);
    loan.disbursedAt = new Date();
    loan.disbursementReference = disbursementReference.trim();
    loan.disbursementRemarks = remarks || 'Disbursement completed via bank transfer';

    await loan.save();

    res.status(200).json({
      message: 'Loan disbursed successfully. Loan is now ACTIVE for repayment.',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Operations Controller] Disburse Loan Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to disburse loan' });
  }
};

// ==========================================
// 4. COLLECTION CONTROLLERS (CONCURRENCY SAFE ATOMIC UPDATES)
// ==========================================

export const getCollectionLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({
      status: { $in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.CLOSED] },
    })
      .populate('borrowerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('[Operations Controller] Get Collection Loans Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch collection loans' });
  }
};

export const getLoanPaymentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('borrowerId', 'fullName email');
    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan not found' });
      return;
    }

    const payments = await Payment.find({ loanId: id })
      .populate('recordedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ loan, payments });
  } catch (error) {
    console.error('[Operations Controller] Get Loan Payments Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch payment records' });
  }
};

export const recordPaymentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, paymentReference, remarks } = req.body;

    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Payment amount must be greater than 0',
      });
      return;
    }

    if (!paymentReference || !paymentReference.trim()) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Payment reference transaction ID is required',
      });
      return;
    }

    // Atomic find & update with conditional balance check to prevent concurrent race conditions
    const updatedLoan = await Loan.findOneAndUpdate(
      {
        _id: id,
        status: { $in: [LoanStatus.DISBURSED, LoanStatus.ACTIVE] },
        outstandingBalance: { $gte: paymentAmount },
      },
      [
        {
          $set: {
            totalPaid: { $round: [{ $add: ['$totalPaid', paymentAmount] }, 2] },
            outstandingBalance: {
              $round: [{ $subtract: ['$totalRepayment', { $add: ['$totalPaid', paymentAmount] }] }, 2],
            },
            lastPaymentAt: new Date(),
            status: {
              $cond: {
                if: { $eq: [{ $subtract: ['$totalRepayment', { $add: ['$totalPaid', paymentAmount] }] }, 0] },
                then: LoanStatus.CLOSED,
                else: LoanStatus.ACTIVE,
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!updatedLoan) {
      const existingLoan = await Loan.findById(id);
      if (!existingLoan) {
        res.status(404).json({ error: 'Not Found', message: 'Loan not found' });
        return;
      }
      if (existingLoan.status === LoanStatus.CLOSED) {
        res.status(400).json({
          error: 'Invalid Operation',
          message: 'Cannot record payment on an already CLOSED loan',
        });
        return;
      }
      if (![LoanStatus.DISBURSED, LoanStatus.ACTIVE].includes(existingLoan.status)) {
        res.status(400).json({
          error: 'Invalid Operation',
          message: `Cannot record payment for loan in '${existingLoan.status}' status. Loan must be DISBURSED or ACTIVE.`,
        });
        return;
      }
      if (paymentAmount > existingLoan.outstandingBalance) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Payment amount (₹${paymentAmount}) exceeds current outstanding balance (₹${existingLoan.outstandingBalance})`,
        });
        return;
      }
      res.status(400).json({
        error: 'Transaction Error',
        message: 'Payment failed due to concurrent update or balance modification',
      });
      return;
    }

    // Create immutable Payment record
    const payment = await Payment.create({
      loanId: updatedLoan._id,
      borrowerId: updatedLoan.borrowerId,
      amount: paymentAmount,
      paymentReference: paymentReference.trim(),
      recordedBy: req.user!.userId,
      remarks: remarks || 'Repayment recorded',
    });

    res.status(200).json({
      message:
        updatedLoan.status === LoanStatus.CLOSED
          ? 'Final payment recorded! Loan is now fully CLOSED.'
          : 'Payment recorded successfully',
      loan: updatedLoan.toJSON(),
      payment: payment.toJSON(),
    });
  } catch (error) {
    console.error('[Operations Controller] Record Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to record payment' });
  }
};

// ==========================================
// 5. ADMIN OVERVIEW CONTROLLER
// ==========================================

export const getAdminOverviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({}).populate('borrowerId', 'fullName email');

    const counts: Record<string, number> = {
      PENDING: 0,
      SALES_REVIEW: 0,
      SANCTION_PENDING: 0,
      SANCTIONED: 0,
      DISBURSEMENT_PENDING: 0,
      DISBURSED: 0,
      ACTIVE: 0,
      REJECTED: 0,
      CLOSED: 0,
      TOTAL: loans.length,
    };

    let totalDisbursedAmount = 0;
    let totalCollectedAmount = 0;
    let totalOutstandingAmount = 0;

    loans.forEach((loan) => {
      counts[loan.status] = (counts[loan.status] || 0) + 1;
      if ([LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.CLOSED].includes(loan.status)) {
        totalDisbursedAmount += loan.loanAmount;
        totalCollectedAmount += loan.totalPaid;
        totalOutstandingAmount += loan.outstandingBalance;
      }
    });

    res.status(200).json({
      counts,
      financials: {
        totalDisbursedAmount: Math.round(totalDisbursedAmount * 100) / 100,
        totalCollectedAmount: Math.round(totalCollectedAmount * 100) / 100,
        totalOutstandingAmount: Math.round(totalOutstandingAmount * 100) / 100,
      },
      loans,
    });
  } catch (error) {
    console.error('[Operations Controller] Admin Overview Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch admin overview' });
  }
};
