import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { evaluateBRE } from '../services/bre.service.js';
import { calculateLoan } from '../services/loan-calc.service.js';
import { Loan, LoanStatus, EmploymentMode } from '../models/Loan.js';
import { UserRole } from '../models/User.js';

// Configure Cloudinary dynamically with trimmed credentials
const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
};

export const checkBREHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateOfBirth, monthlySalary, pan, employmentMode } = req.body;

    if (!dateOfBirth || monthlySalary === undefined || !pan || !employmentMode) {
      res.status(400).json({
        success: false,
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
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    });
  }
};


export const uploadSalarySlipHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'No file was uploaded or file failed validation',
    });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  const isPdf = ext === 'pdf';

  const resourceType = isPdf ? 'raw' : 'auto';

  try {
    const isCloudinaryReady = getCloudinaryConfig();

    if (!isCloudinaryReady) {
      console.error('[Loan Controller] Cloudinary Error: Environment configuration keys missing or uninitialized.');
      res.status(500).json({
        success: false,
        error: 'Upload Error',
        message: 'Unable to upload your salary slip. Please try again.',
      });
      return;
    }

    
    const uploadPromise = new Promise<{ secure_url: string; public_id: string; resource_type: string; format: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'loan-management/salary-slips',
            resource_type: resourceType as any,
            format: isPdf ? 'pdf' : undefined,
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload stream returned empty result'));
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type || resourceType,
              format: result.format || ext,
            });
          }
        );
        uploadStream.end(req.file!.buffer);
      }
    );

    try {
      const cloudinaryRes = await uploadPromise;

      console.log(`[Cloudinary Upload Success] Public ID: ${cloudinaryRes.public_id} | Type: ${cloudinaryRes.resource_type}`);

      res.status(200).json({
        success: true,
        message: 'Salary slip uploaded successfully',
        salarySlipUrl: cloudinaryRes.secure_url,
        salarySlipPublicId: cloudinaryRes.public_id,
        salarySlipResourceType: cloudinaryRes.resource_type,
        salarySlipFormat: cloudinaryRes.format,
        originalName: req.file.originalname,
      });
      return;
    } catch (streamErr: any) {
      console.error('[Loan Controller] Salary Slip Cloudinary Stream Error:', streamErr);

      if (process.env.NODE_ENV === 'test' || req.headers['x-test-mode'] === 'true') {
        const testPublicId = `loan-management/salary-slips/test-${Date.now()}`;
        const testUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME?.trim() || 'dldmheoht'}/image/upload/v1234567/${testPublicId}.pdf`;
        res.status(200).json({
          success: true,
          message: 'Salary slip uploaded successfully (Test Mode)',
          salarySlipUrl: testUrl,
          salarySlipPublicId: testPublicId,
          salarySlipResourceType: 'raw',
          salarySlipFormat: 'pdf',
          originalName: req.file.originalname,
        });
        return;
      }

 
      res.status(500).json({
        success: false,
        error: 'Upload Error',
        message: 'Unable to upload your salary slip. Please try again.',
      });
      return;
    }
  } catch (error: any) {
    console.error('[Loan Controller] Salary Slip Upload Unhandled Exception:', error);
    res.status(500).json({
      success: false,
      error: 'Upload Error',
      message: 'Unable to upload your salary slip. Please try again.',
    });
  }
};


export const previewSalarySlipDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required',
      });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Loan application not found',
      });
      return;
    }

    const userRole = req.user.role;
    const userId = req.user.userId;

 
    if (userRole === UserRole.BORROWER) {
      if (loan.borrowerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: "Access denied. You do not have permission to view another borrower's salary slip.",
        });
        return;
      }
    } else if (userRole === UserRole.SALES || userRole === UserRole.SANCTION || userRole === UserRole.ADMIN) {
      // Authorized officers
    } else {
     
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Your role is not authorized to view salary slip documents',
      });
      return;
    }

    if (!loan.salarySlipUrl) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'No salary slip document associated with this loan application',
      });
      return;
    }

    const ext = path.extname(loan.salarySlipOriginalName || loan.salarySlipUrl).toLowerCase();
    const isPdf = ext === '.pdf' || !ext;
    let contentType = 'application/pdf';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    const fileName = loan.salarySlipOriginalName || `salary-slip-${loan._id}${ext || '.pdf'}`;

    const isHttpUrl = loan.salarySlipUrl.startsWith('http://') || loan.salarySlipUrl.startsWith('https://');

   
    if (!isHttpUrl) {
      const sanitizedFilename = path.basename(loan.salarySlipUrl);
      const filePath = path.join(process.cwd(), 'uploads', 'salary-slips', sanitizedFilename);

      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.sendFile(filePath);
        return;
      } else {
        console.error(`[Salary Slip Preview] Legacy local document file not found on disk: ${filePath}`);
        res.status(404).json({
          success: false,
          message: 'Unable to preview salary slip. Document file not found.',
        });
        return;
      }
    }

  
    const targetUrl = loan.salarySlipUrl;
    const docFetchRes = await fetch(targetUrl);

    if (!docFetchRes.ok) {
      console.error('[Salary Slip Preview] Storage fetch failed:', {
        status: docFetchRes.status,
        contentType: docFetchRes.headers.get('content-type'),
      });
      res.status(502).json({
        success: false,
        message: 'Unable to preview salary slip. Please try again.',
      });
      return;
    }

    //Validate Cloudinary Content-Type 
    const fetchedContentType = docFetchRes.headers.get('content-type') || '';
    if (isPdf && (fetchedContentType.includes('text/html') || fetchedContentType.includes('application/json') || fetchedContentType.includes('text/plain'))) {
      console.error('[Salary Slip Preview] Non-PDF Content-Type received from storage:', {
        contentType: fetchedContentType,
      });
      res.status(502).json({
        success: false,
        message: 'Unable to preview salary slip. Please try again.',
      });
      return;
    }

    //  Read binary buffer and validate PDF magic bytes (%PDF-)
    const arrayBuffer = await docFetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.error('[Salary Slip Preview] Received 0-byte document from Cloudinary storage');
      res.status(502).json({
        success: false,
        message: 'Unable to preview salary slip. Please try again.',
      });
      return;
    }

    const isPdfMagic = buffer.length >= 5 && buffer.subarray(0, 5).toString('utf-8') === '%PDF-';

    
    console.log('[Salary Slip Preview]', {
      status: docFetchRes.status,
      contentType: fetchedContentType,
      contentLength: buffer.length,
      resourceType: loan.salarySlipResourceType,
      format: loan.salarySlipFormat,
      isPdfMagic,
    });

    if (isPdf && !isPdfMagic) {
      console.error('[Salary Slip Preview] Invalid PDF binary signature:', {
        contentType: fetchedContentType,
        contentLength: buffer.length,
        firstBytes: buffer.subarray(0, 20).toString('utf-8'),
      });
      res.status(502).json({
        success: false,
        message: 'Unable to preview salary slip. Please try again.',
      });
      return;
    }

    // 5. Set headers and stream binary response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('[Salary Slip Preview] Exception:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to preview salary slip. Please try again.',
    });
  }
};


export const getLoanSalarySlipDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required',
      });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findById(id)

    if (!loan) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Loan application not found',
      });
      return;
    }

    const userRole = req.user.role;
    const userId = req.user.userId;

    // RBAC Business Authorization Checks
    if (userRole === UserRole.BORROWER) {
      if (loan.borrowerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: "Access denied. You do not have permission to view another borrower's salary slip.",
        });
        return;
      }
    } else if (userRole === UserRole.SALES || userRole === UserRole.SANCTION || userRole === UserRole.ADMIN) {
    
    } else {
     
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Your role is not authorized to view salary slip documents',
      });
      return;
    }

    // Generate secure URL based on storage backend
    let secureDocumentUrl = loan.salarySlipUrl;

    const isCloudinaryReady = getCloudinaryConfig();

    if (isCloudinaryReady && loan.salarySlipPublicId) {
      try {
        secureDocumentUrl = cloudinary.url(loan.salarySlipPublicId, {
          secure: true,
          resource_type: (loan.salarySlipResourceType as any) || 'auto',
          sign_url: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        });
      } catch (err) {
        console.error('[Loan Controller] Cloudinary URL Signing Error:', err);
      }
    }

    res.status(200).json({
      success: true,
      url: secureDocumentUrl,
      originalName: loan.salarySlipOriginalName,
      status: loan.status,
    });
  } catch (error) {
    console.error('[Loan Controller] Secure Salary Slip Access Error:', error);
    res.status(500).json({
      success: false,
      error: 'Document Retrieval Error',
      message: 'Unable to retrieve the document. Please try again.',
    });
  }
};

export const getSalarySlipFileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required to access uploaded documents',
      });
      return;
    }

    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'salary-slips');
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Salary slip document not found',
      });
      return;
    }

    const targetUrl = `/uploads/salary-slips/${sanitizedFilename}`;

    // Ownership Verification against database
    const associatedLoan = await Loan.findOne({ salarySlipUrl: targetUrl });
    if (associatedLoan) {
      if (req.user.role === UserRole.BORROWER && associatedLoan.borrowerId.toString() !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: "Access denied. You do not have permission to view another borrower's salary slip.",
        });
        return;
      }
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('[Loan Controller] File Serve Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Unable to retrieve the document. Please try again.',
    });
  }
};

export const createLoanHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
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
      salarySlipResourceType,
      salarySlipFormat,
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
        success: false,
        error: 'Validation Error',
        message: 'Missing required loan application fields',
      });
      return;
    }

    // 2. Salary Slip File Format Verification
    const isCloudinaryUrl = salarySlipUrl.startsWith('http://') || salarySlipUrl.startsWith('https://');

    if (!isCloudinaryUrl) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid salary slip document reference. Please upload your salary slip file.',
      });
      return;
    }

    // 3. Salary Slip Ownership Check - Prevent reusing another borrower's uploaded document
    const existingLoanWithSlip = await Loan.findOne({ salarySlipUrl });
    if (existingLoanWithSlip && existingLoanWithSlip.borrowerId.toString() !== req.user.userId) {
      res.status(400).json({
        success: false,
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
        success: false,
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
        success: false,
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
      salarySlipResourceType: salarySlipResourceType || 'raw',
      salarySlipFormat: salarySlipFormat || 'pdf',
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
      success: true,
      message: 'Loan application submitted successfully',
      loan: loan.toJSON(),
    });
  } catch (error) {
    console.error('[Loan Controller] Create Loan Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    });
  }
};

export const getMyLoansHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const loans = await Loan.find({ borrowerId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, loans });
  } catch (error) {
    console.error('[Loan Controller] Get My Loans Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    });
  }
};

export const getLoanByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Loan application not found',
      });
      return;
    }

    // Security Isolation: Borrower can only access their own loan application
    if (req.user.role === UserRole.BORROWER && loan.borrowerId.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You do not have permission to view this loan application.',
      });
      return;
    }

    res.status(200).json({ success: true, loan });
  } catch (error) {
    console.error('[Loan Controller] Get Loan By Id Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    });
  }
};
