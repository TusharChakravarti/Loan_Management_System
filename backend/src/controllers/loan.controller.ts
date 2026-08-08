import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { evaluateBRE } from '../services/bre.service.js';
import { calculateLoan } from '../services/loan-calc.service.js';
import { Loan, LoanStatus, EmploymentMode } from '../models/Loan.js';
import { UserRole } from '../models/User.js';

export const checkBREHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateOfBirth, monthlySalary, pan, employmentMode } = req.body;

    if (!dateOfBirth || monthlySalary === undefined || !pan || !employmentMode) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Required fields: dateOfBirth, monthlySalary, pan, employmentMode',
      });
      return;
    }

    const breResult = evaluateBRE({
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      pan,
      employmentMode,
    });

    res.status(200).json(breResult);
  } catch (error) {
    console.error('[Loan Controller] BRE Check Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to evaluate BRE rules' });
  }
};

export const uploadSalarySlipHandler = (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'Bad Request', message: 'No file was uploaded or file failed validation' });
    return;
  }

  const fileUrl = `/uploads/salary-slips/${req.file.filename}`;

  res.status(200).json({
    message: 'Salary slip uploaded successfully',
    salarySlipUrl: fileUrl,
    originalName: req.file.originalname,
  });
};

export const getSalarySlipFileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required to access uploaded documents' });
      return;
    }

    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'salary-slips');
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Not Found', message: 'Salary slip document not found' });
      return;
    }

    const targetUrl = `/uploads/salary-slips/${sanitizedFilename}`;

    // Ownership Verification against database
    const associatedLoan = await Loan.findOne({ salarySlipUrl: targetUrl });
    if (associatedLoan) {
      if (req.user.role === UserRole.BORROWER && associatedLoan.borrowerId.toString() !== req.user.userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: "Access denied. You do not have permission to view another borrower's salary slip.",
        });
        return;
      }
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('[Loan Controller] File Serve Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to serve document file' });
  }
};

export const createLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const {
      fullName,
      pan,
      dateOfBirth,
      monthlySalary,
      employmentMode,
      salarySlipUrl,
      salarySlipOriginalName,
      loanAmount,
      tenureDays,
    } = req.body;

    // 1. Mandatory input checks
    if (
      !fullName ||
      !pan ||
      !dateOfBirth ||
      monthlySalary === undefined ||
      !employmentMode ||
      !salarySlipUrl ||
      !loanAmount ||
      !tenureDays
    ) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required loan application fields',
      });
      return;
    }

    // 2. Salary Slip File Existence & Path Security Verification
    if (!salarySlipUrl.startsWith('/uploads/salary-slips/')) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid salary slip URL format' });
      return;
    }

    const filename = path.basename(salarySlipUrl);
    const diskPath = path.join(process.cwd(), 'uploads', 'salary-slips', filename);
    if (!fs.existsSync(diskPath)) {
      res.status(400).json({ error: 'Validation Error', message: 'Referenced salary slip file does not exist on server' });
      return;
    }

    // 3. Salary Slip Ownership Check - Prevent reusing another borrower's uploaded document
    const existingLoanWithSlip = await Loan.findOne({ salarySlipUrl });
    if (existingLoanWithSlip && existingLoanWithSlip.borrowerId.toString() !== req.user.userId) {
      res.status(400).json({
        error: 'Security Error',
        message: 'Referenced salary slip file belongs to another user or application',
      });
      return;
    }

    // 4. Authoritative BRE Re-evaluation on server
    const breResult = evaluateBRE({
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      pan,
      employmentMode,
    });

    if (!breResult.passed) {
      res.status(400).json({
        error: 'BRE Verification Failed',
        message: 'Loan application rejected based on Business Rules Engine criteria',
        rejectionReasons: breResult.rejectionReasons,
      });
      return;
    }

    // 5. Authoritative Loan Financial Calculation on server
    const calcResult = calculateLoan({
      loanAmount: Number(loanAmount),
      tenureDays: Number(tenureDays),
    });

    if (!calcResult.valid) {
      res.status(400).json({
        error: 'Loan Parameter Error',
        message: 'Invalid loan amount or tenure parameters',
        validationErrors: calcResult.validationErrors,
      });
      return;
    }

    // 6. Create Loan document with server-enforced security & PENDING status
    const loan = await Loan.create({
      borrowerId: req.user.userId,
      fullName,
      pan: pan.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      employmentMode: employmentMode as EmploymentMode,
      breResult: {
        passed: true,
        rejectionReasons: [],
      },
      salarySlipUrl,
      salarySlipOriginalName: salarySlipOriginalName || 'SalarySlip.pdf',
      loanAmount: calcResult.loanAmount,
      tenureDays: calcResult.tenureDays,
      interestRate: calcResult.interestRate,
      simpleInterest: calcResult.simpleInterest,
      totalRepayment: calcResult.totalRepayment,
      totalPaid: 0,
      outstandingBalance: calcResult.outstandingBalance,
      status: LoanStatus.PENDING,
    });

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Loan Controller] Create Loan Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create loan application' });
  }
};

export const getMyLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const loans = await Loan.find({ borrowerId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('[Loan Controller] Get My Loans Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve borrower loans' });
  }
};

export const getLoanByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    // Security Isolation: Borrower can only access their own loan application
    if (req.user.role === UserRole.BORROWER && loan.borrowerId.toString() !== req.user.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You do not have permission to view this loan application.',
      });
      return;
    }

    res.status(200).json({ loan });
  } catch (error) {
    console.error('[Loan Controller] Get Loan By Id Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve loan details' });
  }
};
