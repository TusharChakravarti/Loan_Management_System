import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { evaluateBRE } from '../services/bre.service.js';
import { calculateLoan } from '../services/loan-calc.service.js';
import { Loan, LoanStatus, EmploymentMode } from '../models/Loan.js';
import { UserRole } from '../models/User.js';

// Configure Cloudinary if environment variables exist
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

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

export const uploadSalarySlipHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Bad Request', message: 'No file was uploaded or file failed validation' });
    return;
  }

  try {
    if (isCloudinaryConfigured) {
      // Cloudinary Stream Upload
      const uploadPromise = new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'lms_salary_slips',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload returned empty result'));
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        stream.end(req.file!.buffer);
      });

      const cloudinaryRes = await uploadPromise;

      res.status(200).json({
        message: 'Salary slip uploaded successfully to Cloudinary',
        salarySlipUrl: cloudinaryRes.secure_url,
        salarySlipPublicId: cloudinaryRes.public_id,
        originalName: req.file.originalname,
      });
      return;
    }

    // Local Disk Fallback (when Cloudinary environment credentials are not present)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `salary-slip-${uniqueSuffix}${ext}`;
    const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'salary-slips');
    const localFilePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(localFilePath, req.file.buffer);

    const fileUrl = `/uploads/salary-slips/${filename}`;

    res.status(200).json({
      message: 'Salary slip uploaded successfully',
      salarySlipUrl: fileUrl,
      originalName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('[Loan Controller] Salary Slip Upload Error:', error);
    res.status(500).json({
      error: 'Upload Error',
      message: error.message || 'Failed to upload salary slip document',
    });
  }
};

/**
 * SECURE SALARY SLIP ACCESS API (GET /api/loans/:id/salary-slip)
 * Authenticates user, verifies RBAC authorization, and returns secure document access URL.
 */
export const getLoanSalarySlipDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication token is required' });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({ error: 'Not Found', message: 'Loan application not found' });
      return;
    }

    const userRole = req.user.role;
    const userId = req.user.userId;

    // RBAC Business Authorization Checks
    if (userRole === UserRole.BORROWER) {
      if (loan.borrowerId.toString() !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: "Access denied. You do not have permission to view another borrower's salary slip.",
        });
        return;
      }
    } else if (userRole === UserRole.SALES || userRole === UserRole.SANCTION || userRole === UserRole.ADMIN) {
      // Sales, Sanction, and Admin officers are authorized for application document processing
    } else {
      // COLLECTION or other unauthorized roles
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your role is not authorized to view salary slip documents',
      });
      return;
    }

    // Generate secure URL based on storage backend
    let secureDocumentUrl = loan.salarySlipUrl;

    if (isCloudinaryConfigured && loan.salarySlipPublicId) {
      // Cloudinary signed URL or secure URL
      secureDocumentUrl = cloudinary.url(loan.salarySlipPublicId, {
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour temporary access
      });
    } else if (loan.salarySlipUrl.startsWith('/uploads/')) {
      // Local document fallback: host-aware full URL
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      secureDocumentUrl = `${protocol}://${host}${loan.salarySlipUrl}`;
    }

    res.status(200).json({
      url: secureDocumentUrl,
      originalName: loan.salarySlipOriginalName,
      status: loan.status,
    });
  } catch (error) {
    console.error('[Loan Controller] Secure Salary Slip Access Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to generate document access URL' });
  }
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
      salarySlipPublicId,
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

    // 2. Salary Slip File Format Verification
    const isCloudinaryUrl = salarySlipUrl.startsWith('http://') || salarySlipUrl.startsWith('https://');
    const isLocalUrl = salarySlipUrl.startsWith('/uploads/salary-slips/');

    if (!isCloudinaryUrl && !isLocalUrl) {
      res.status(400).json({ error: 'Validation Error', message: 'Invalid salary slip URL format' });
      return;
    }

    if (isLocalUrl) {
      const filename = path.basename(salarySlipUrl);
      const diskPath = path.join(process.cwd(), 'uploads', 'salary-slips', filename);
      if (!fs.existsSync(diskPath)) {
        res.status(400).json({ error: 'Validation Error', message: 'Referenced salary slip file does not exist on server' });
        return;
      }
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
      salarySlipPublicId,
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
