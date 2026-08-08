import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import loanRoutes from './routes/loan.routes.js';
import operationsRoutes from './routes/operations.routes.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', testRoutes);
app.use('/api', loanRoutes);
app.use('/api', operationsRoutes);
app.use('/', loanRoutes); // Protected static file serving

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Loan Management System API',
    health: '/api/health',
    auth: '/api/auth',
    loans: '/api/loans',
    operations: '/api/operations',
  });
});

// Database Connection & Server Start
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`[Server Critical Error] Could not start server due to database failure: ${err.message}`);
  });

export default app;
