import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { UserRole } from '../models/User.js';
import {
  getSalesLoansHandler,
  reviewSalesLoanHandler,
  getSanctionLoansHandler,
  approveSanctionLoanHandler,
  rejectSanctionLoanHandler,
  getDisbursementLoansHandler,
  disburseLoanHandler,
  getCollectionLoansHandler,
  getLoanPaymentsHandler,
  recordPaymentHandler,
  getAdminOverviewHandler,
} from '../controllers/operations.controller.js';

const router = Router();

// Sales Endpoints (SALES or ADMIN)
router.get('/operations/sales/loans', authenticate, authorizeRoles(UserRole.SALES, UserRole.ADMIN), getSalesLoansHandler);
router.post('/operations/sales/loans/:id/review', authenticate, authorizeRoles(UserRole.SALES, UserRole.ADMIN), reviewSalesLoanHandler);

// Sanction Endpoints (SANCTION or ADMIN)
router.get('/operations/sanction/loans', authenticate, authorizeRoles(UserRole.SANCTION, UserRole.ADMIN), getSanctionLoansHandler);
router.post('/operations/sanction/loans/:id/approve', authenticate, authorizeRoles(UserRole.SANCTION, UserRole.ADMIN), approveSanctionLoanHandler);
router.post('/operations/sanction/loans/:id/reject', authenticate, authorizeRoles(UserRole.SANCTION, UserRole.ADMIN), rejectSanctionLoanHandler);

// Disbursement Endpoints (DISBURSEMENT or ADMIN)
router.get('/operations/disbursement/loans', authenticate, authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN), getDisbursementLoansHandler);
router.post('/operations/disbursement/loans/:id/disburse', authenticate, authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN), disburseLoanHandler);

// Collection Endpoints (COLLECTION or ADMIN)
router.get('/operations/collection/loans', authenticate, authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN), getCollectionLoansHandler);
router.get('/operations/collection/loans/:id', authenticate, authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN), getLoanPaymentsHandler);
router.post('/operations/collection/loans/:id/payments', authenticate, authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN), recordPaymentHandler);

// Admin Overview (ADMIN only)
router.get('/operations/admin/overview', authenticate, authorizeRoles(UserRole.ADMIN), getAdminOverviewHandler);

export default router;
