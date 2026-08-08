import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const dbStatusMap: Record<number, string> = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbStatusMap[dbState] || 'Unknown';

  res.status(200).json({
    status: 'UP',
    service: 'Loan Management System Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      connected: dbState === 1,
    },
    rolesSupported: ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION', 'BORROWER'],
  });
});

export default router;
