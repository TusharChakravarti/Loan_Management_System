# Loan Management System (Full-Stack)

A complete end-to-end Loan Management System built with:
- **Frontend**: Next.js (TypeScript, Tailwind CSS, App Router)
- **Backend**: Node.js + Express (TypeScript)
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt with Role-Based Access Control (RBAC)

## System Roles (RBAC)
1. `ADMIN`: Full system access across all 4 operations modules + administration.
2. `SALES`: Operations module for loan application intake & sales.
3. `SANCTION`: Operations module for underwriting and sanction approval.
4. `DISBURSEMENT`: Operations module for bank transfer and loan disbursement.
5. `COLLECTION`: Operations module for EMI collection & payment tracking.
6. `BORROWER`: Borrower Portal access for application submission, document upload, and loan status.

---

## Directory Structure
```
├── backend/    # Express TypeScript API server
└── frontend/   # Next.js App Router UI dashboard & portal
```

## Running the Application

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Express server runs on `http://localhost:5000`. Health endpoint: `http://localhost:5000/api/health`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Next.js app runs on `http://localhost:3000`.
