import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Test Route 1: Any Authenticated User
router.get('/test/authenticated', authenticate, (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to authenticated test endpoint',
    user: req.user,
  });
});

// Test Route 2: ADMIN Only
router.get('/test/admin', authenticate, authorizeRoles(UserRole.ADMIN), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to ADMIN test endpoint',
    user: req.user,
  });
});

// Test Route 3: SALES or ADMIN
router.get('/test/sales', authenticate, authorizeRoles(UserRole.SALES), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to SALES test endpoint',
    user: req.user,
  });
});

// Test Route 4: SANCTION or ADMIN
router.get('/test/sanction', authenticate, authorizeRoles(UserRole.SANCTION), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to SANCTION test endpoint',
    user: req.user,
  });
});

// Test Route 5: DISBURSEMENT or ADMIN
router.get('/test/disbursement', authenticate, authorizeRoles(UserRole.DISBURSEMENT), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to DISBURSEMENT test endpoint',
    user: req.user,
  });
});

// Test Route 6: COLLECTION or ADMIN
router.get('/test/collection', authenticate, authorizeRoles(UserRole.COLLECTION), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to COLLECTION test endpoint',
    user: req.user,
  });
});

// Test Route 7: BORROWER only
router.get('/test/borrower', authenticate, authorizeRoles(UserRole.BORROWER), (req: Request, res: Response) => {
  res.json({
    message: 'Access granted to BORROWER test endpoint',
    user: req.user,
  });
});

export default router;
