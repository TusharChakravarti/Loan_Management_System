import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { handleSalarySlipUpload } from '../middleware/upload.middleware.js';
import { UserRole } from '../models/User.js';
import {
  checkBREHandler,
  uploadSalarySlipHandler,
  getSalarySlipFileHandler,
  getLoanSalarySlipDocumentHandler,
  previewSalarySlipDocumentHandler,
  createLoanHandler,
  getMyLoansHandler,
  getLoanByIdHandler,
} from '../controllers/loan.controller.js';

const router = Router();

// BRE check (Borrower or Admin)
router.post('/loans/bre/check', authenticate, authorizeRoles(UserRole.BORROWER, UserRole.ADMIN), checkBREHandler);

// Salary slip upload (Borrower or Admin)
router.post(
  '/loans/upload-salary-slip',
  authenticate,
  authorizeRoles(UserRole.BORROWER, UserRole.ADMIN),
  handleSalarySlipUpload,
  uploadSalarySlipHandler
);

// Protected authenticated binary document preview stream endpoint
router.get('/loans/:id/salary-slip/preview', authenticate, previewSalarySlipDocumentHandler);

// Protected secure salary slip document access metadata endpoint
router.get('/loans/:id/salary-slip', authenticate, getLoanSalarySlipDocumentHandler);

// Protected legacy static salary slip file serving (Requires JWT auth)
router.get('/uploads/salary-slips/:filename', authenticate, getSalarySlipFileHandler);

// Create loan application (BORROWER only)
router.post('/loans', authenticate, authorizeRoles(UserRole.BORROWER), createLoanHandler);

// Get my loans (BORROWER or Admin)
router.get('/loans/my', authenticate, authorizeRoles(UserRole.BORROWER, UserRole.ADMIN), getMyLoansHandler);

// Get single loan by ID (Authenticated user with ownership validation in controller)
router.get('/loans/:id', authenticate, getLoanByIdHandler);

export default router;
