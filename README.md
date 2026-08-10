# CREDORA --- Digital Loan Management Platform

CREDORA is a full-stack digital loan management platform designed to
streamline the complete loan lifecycle --- from borrower registration
and document submission to sales review, sanction assessment,
disbursement, and repayment tracking.

The application provides role-based dashboards for **Borrowers, Sales,
Sanction/Operations, and Administrators**, with authentication,
authorization, document management, loan calculations, and cloud
deployment.

------------------------------------------------------------------------

## ✨ Key Features

### 🔐 Authentication & Authorization

-   User registration and login
-   JWT-based authentication
-   Google OAuth authentication
-   Password reset workflow
-   Role-Based Access Control (RBAC)
-   Role-specific dashboards and permissions
-   Protected backend APIs

### 👥 Role-Based Workflows

CREDORA supports different workflows depending on the authenticated
user's role.

#### Borrower

-   Register and log in
-   Apply for loans
-   View loan applications
-   Track application lifecycle
-   Upload required documents
-   View loan and repayment details
-   Access application-specific documents

#### Sales

-   View borrower loan applications
-   Review submitted information
-   Perform sales-stage processing
-   Update application status

#### Sanction / Operations

-   Review applications after sales processing
-   Perform sanction assessment
-   Approve or reject applications according to the configured workflow

#### Administrator

-   Manage and monitor application workflows
-   Access administrative functionality
-   Manage users and system-level operations according to permissions

> The exact roles and permissions depend on the configuration of the
> deployed application.

------------------------------------------------------------------------

## 💰 Loan Management

The platform supports the major stages of the loan lifecycle:

``` text
Application Submitted
        ↓
Sales Review
        ↓
Sanction Assessment
        ↓
Disbursement
        ↓
Repayment
        ↓
Closed
```

The application calculates financial values such as:

-   Loan principal
-   Loan tenure
-   Interest
-   Total repayment amount
-   EMI
-   Amount paid
-   Outstanding balance

Loan calculations are performed according to the application's
configured business rules.

------------------------------------------------------------------------

## 📄 Document Management

=======
#CREDORA --- Digital Loan Management Platform
CREDORA is a full-stack digital loan management platform designed to
streamline the complete loan lifecycle --- from borrower registration
and document submission to sales review, sanction assessment,
disbursement, and repayment tracking.

The application provides role-based dashboards for users such as
Borrowers, Sales, Sanction/Operations, and Administrators, with
authentication, authorization, document management, loan calculations,
and cloud deployment.

✨ Key Features
🔐 Authentication & Authorization
User registration and login

JWT-based authentication

Google OAuth authentication

Password reset workflow

Role-Based Access Control (RBAC)

Role-specific dashboards and permissions

Protected backend APIs

👥 Role-Based Workflows
CREDORA supports different workflows depending on the authenticated
user's role.

Borrower
Register/login

Apply for loans

View loan applications

Track application lifecycle

Upload required documents

View loan and repayment details

Access application-specific documents

Sales
View borrower loan applications

Review submitted information

Perform sales-stage processing

Update application status

Sanction / Operations
Review applications after sales processing

Perform sanction assessment

Approve/reject applications according to the configured workflow

Administrator
Manage and monitor application workflows

Access administrative functionality

Manage users and system-level operations according to permissions

The exact roles and permissions depend on the configuration of the
deployed application.

💰 Loan Management
The platform supports the major stages of the loan lifecycle:

Application Submitted
        ↓
Sales Review
        ↓
Sanction Assessment
        ↓
Disbursement
        ↓
Repayment
        ↓
Closed
The application calculates financial values such as:

Loan principal

Loan tenure

Interest

Total repayment amount

EMI

Amount paid

Outstanding balance

Loan calculations are performed according to the application's
configured business rules.

📄 Document Management
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
Borrowers can upload documents required for loan processing.

The application supports:

<<<<<<< HEAD
-   Salary slips and other loan-related documents
-   Document previews
-   Cloud-based document storage
-   Role-based access to documents
-   File validation
-   Image and PDF handling

**Cloudinary** is used for cloud-based media/document management.

------------------------------------------------------------------------

## 🔑 Google OAuth

=======
Salary slips and other loan-related documents

Document previews

Cloud-based document storage

Role-based access to documents

File validation

Image/PDF handling

Cloudinary is used for cloud-based media/document management.

🔑 Google OAuth
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
CREDORA supports Google-based authentication.

The high-level authentication flow is:

<<<<<<< HEAD
``` text
User
  ↓
Google OAuth
  ↓
Google identity/token
  ↓
CREDORA Backend
  ↓
Find/Create User
  ↓
Retrieve User Role
  ↓
Issue Application Authentication Token
  ↓
Role-Based Dashboard
```

Google authentication establishes the user's identity, while the
application's database determines the user's role and permissions.

------------------------------------------------------------------------

## 🛡️ Role-Based Access Control

CREDORA separates **authentication** from **authorization**.

### Authentication

Answers:

> Who is this user?

Implemented using:

-   JWT authentication
-   Google OAuth

### Authorization

Answers:

> What is this user allowed to access?
=======
User
 │
 ▼
Google OAuth
 │
 ▼
Google identity/token
 │
 ▼
CREDORA Backend
 │
 ▼
Find/Create User
 │
 ▼
Retrieve User Role
 │
 ▼
Issue Application Authentication Token
 │
 ▼
Role-Based Dashboard
Google authentication is responsible for establishing the user's
identity, while the application's database determines the user's role
and permissions.

🛡️ Role-Based Access Control
CREDORA separates authentication from authorization.

Authentication
Answers:

Who is this user?

Implemented using mechanisms such as:

JWT authentication

Google OAuth

Authorization
Answers:

What is this user allowed to access?
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2

The user's role determines access to protected functionality.

For example:

<<<<<<< HEAD
``` text
=======
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
BORROWER
   ↓
Borrower APIs / Dashboard

SALES
   ↓
Sales APIs / Dashboard

ADMIN
   ↓
Administrative APIs / Dashboard
<<<<<<< HEAD
```

This prevents users from accessing functionality outside their assigned
role.

------------------------------------------------------------------------

## 🏗️ Architecture

The application follows a frontend/backend architecture:

``` text
                         CREDORA
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Frontend                         Backend
             │                             │
             │                         REST APIs
             │                             │
             │                    Authentication
             │                    Authorization
             │                    Business Logic
             │                             │
             │                          MongoDB
             │                             │
             └──────────── API ─────────────┘
                                           │
                                       Cloudinary
                                           │
                                       File Storage
```

------------------------------------------------------------------------

## 🧰 Tech Stack

### Frontend

-   React / Next.js
-   JavaScript / TypeScript
-   Tailwind CSS
-   Responsive UI
-   REST API integration

### Backend

-   Node.js
-   Express.js
-   REST APIs
-   JWT authentication
-   Google OAuth
-   Role-Based Access Control

### Database

-   MongoDB

### Cloud & External Services

-   **Vercel** --- frontend deployment
-   **Render** --- backend deployment
-   **Cloudinary** --- document/media storage
-   **Google OAuth** --- authentication

------------------------------------------------------------------------

## 📁 Project Structure

``` text
CREDORA/
=======
This prevents users from accessing functionality outside their assigned
role.

🏗️ Architecture
The application follows a frontend/backend architecture:

                    CREDORA
                       │
          ┌────────────┴────────────┐
          │                         │
      Frontend                   Backend
          │                         │
          │                    REST APIs
          │                         │
          │                Authentication
          │                Authorization
          │                Business Logic
          │                         │
          │                    MongoDB
          │                         │
          └────────── API ───────────┘
                       │
                  Cloudinary
                       │
                 File Storage
🧰 Tech Stack
Frontend
React / Next.js

JavaScript / TypeScript

Tailwind CSS

Responsive UI

REST API integration

Backend
Node.js

Express.js

REST APIs

JWT authentication

Google OAuth

Role-Based Access Control

Database
MongoDB

Cloud / External Services
Vercel --- frontend deployment

Render --- backend deployment

Cloudinary --- document/media storage

Google OAuth --- authentication

📁 Project Structure


CREDORA/
│
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── app/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── ...
│
<<<<<<< HEAD
└── README.md
```

> Update this section if your actual repository structure differs.

------------------------------------------------------------------------

## 🔄 Loan Application Workflow

A typical borrower workflow is:

``` text
=======
├── README.md
└── ...


🔄 Loan Application Workflow
A typical borrower workflow is:

>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
Register / Login
      ↓
Borrower Dashboard
      ↓
Apply for Loan
      ↓
Enter Financial Details
      ↓
Upload Documents
      ↓
Submit Application
      ↓
Sales Review
      ↓
Sanction Assessment
      ↓
Disbursement
      ↓
Repayment
      ↓
Loan Closed
<<<<<<< HEAD
```

Each stage is controlled by the application's backend workflow and role
permissions.

------------------------------------------------------------------------

## 🧮 Financial Calculations

The platform calculates loan-related financial information based on the
configured:

-   Principal amount
-   Interest rate
-   Tenure
-   Repayment rules

Example:

``` text
=======
Each stage is controlled by the application's backend workflow and role
permissions.

🧮 Financial Calculations
The platform calculates loan-related financial information based on the
configured:

Principal amount

Interest rate

Tenure

Repayment rules

Example:

>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
Loan Amount
     ↓
Interest Calculation
     ↓
Total Repayment
     ↓
EMI / Payment Schedule
     ↓
Outstanding Balance
<<<<<<< HEAD
```

The frontend displays these values to the user while the backend remains
responsible for the authoritative business logic.

------------------------------------------------------------------------

## 🔒 Security Considerations

The application uses several security mechanisms, including:

-   JWT-based authentication
-   Protected API routes
-   Role-based authorization
-   Password reset functionality
-   OAuth-based authentication
-   Environment variables for secrets
-   Cloud-based document storage
-   Server-side validation and business rules

### Secrets

The following should never be committed to source control:

-   JWT secrets
-   Database credentials
-   OAuth credentials
-   Cloudinary credentials
-   Other private API keys

------------------------------------------------------------------------

## 🚀 Deployment

### Frontend

The frontend is deployed using **Vercel**.

``` text
=======
The frontend displays these values to the user while the backend remains
responsible for the authoritative business logic.

🔒 Security Considerations
The application uses several security mechanisms, including:

JWT-based authentication

Protected API routes

Role-based authorization

Password reset functionality

OAuth-based authentication

Environment variables for secrets

Cloud-based document storage

Server-side validation and business rules

Secrets such as:

JWT secrets

Database credentials

OAuth credentials

Cloudinary credentials

should never be committed to source control.

🚀 Deployment
Frontend
The frontend can be deployed using Vercel.

Typical deployment flow:

>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
GitHub Repository
       ↓
Vercel
       ↓
Production Frontend
<<<<<<< HEAD
```

### Backend

The backend is deployed using **Render**.

``` text
=======
Backend
The backend can be deployed using Render.

>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
GitHub Repository
       ↓
Render
       ↓
Production API
<<<<<<< HEAD
```

### Production Configuration

For production deployment, make sure:

-   Frontend points to the production backend URL
-   Backend has the production MongoDB connection string
-   Google OAuth origins and redirect URIs match the production domain
-   Cloudinary credentials are configured
-   CORS allows the production frontend
-   All required environment variables are configured

------------------------------------------------------------------------

## 🧪 Testing Checklist

Before deployment, verify:

### Authentication

-   [ ] Registration works
-   [ ] Login works
-   [ ] Logout works
-   [ ] Google login works
-   [ ] Password reset works
-   [ ] Invalid credentials are rejected

### Authorization

-   [ ] Borrowers cannot access Admin functionality
-   [ ] Sales users cannot access restricted Admin functionality
-   [ ] Protected APIs reject unauthenticated requests
-   [ ] Role-specific dashboards load correctly

### Loan Workflow

-   [ ] Loan application can be created
-   [ ] Documents can be uploaded
-   [ ] Application status changes correctly
-   [ ] Sales workflow works
-   [ ] Sanction workflow works
-   [ ] Disbursement workflow works
-   [ ] Repayment information is displayed correctly

### Documents

-   [ ] PDF upload works
-   [ ] JPG/JPEG upload works
-   [ ] PNG upload works
-   [ ] Document preview works
-   [ ] Invalid files are rejected
-   [ ] Uploaded documents remain accessible after deployment

------------------------------------------------------------------------

## 📌 API Examples

Authentication endpoints include:

``` http
POST /auth/google/token
POST /auth/forgot-password
POST /auth/reset-password
```

Additional loan, user, document, and workflow endpoints are implemented
by the backend according to the application's API structure.

------------------------------------------------------------------------

## 🌐 Production

-   **Frontend:** https://loan-management-system-mu-lac.vercel.app/
-   **Backend:** https://loan-management-system-lv5o.onrender.com/

------------------------------------------------------------------------

## 🔮 Future Improvements

Potential improvements include:

-   Automated loan risk scoring
-   AI-assisted document verification
-   Intelligent fraud detection
-   Notification system
-   Advanced analytics dashboard
-   Automated repayment reminders
-   Audit logging
-   More granular permissions
-   Improved application monitoring

------------------------------------------------------------------------

## 👨‍💻 Project Highlights

CREDORA demonstrates practical experience with:

-   Full-stack web development
-   REST API development
-   Authentication and authorization
-   Google OAuth
-   Role-Based Access Control
-   MongoDB
-   Cloudinary
-   Financial and business workflows
-   File/document management
-   Responsive dashboard development
-   Cloud deployment
-   Production debugging and integration

------------------------------------------------------------------------

## 📄 License

This project is intended for educational, portfolio, and demonstration
purposes unless otherwise specified by the repository owner.
=======
Production Configuration
For production deployment, make sure:

Frontend points to the production backend URL

Backend has the production MongoDB connection string

Google OAuth origins/redirect URIs match the production domain

Cloudinary credentials are configured

CORS allows the production frontend

All required environment variables are configured

🧪 Testing Checklist
Before deployment, verify:

Authentication
Registration works

Login works

Logout works

Google login works

Password reset works

Invalid credentials are rejected

Authorization
Borrowers cannot access Admin functionality

Sales users cannot access restricted Admin functionality

Protected APIs reject unauthenticated requests

Role-specific dashboards load correctly

Loan Workflow
Loan application can be created

Documents can be uploaded

Application status changes correctly

Sales workflow works

Sanction workflow works

Disbursement workflow works

Repayment information is displayed correctly

Documents
PDF upload works

JPG/JPEG upload works

PNG upload works

Document preview works

Invalid files are rejected

Uploaded documents remain accessible after deployment

📌 API Examples
Authentication endpoints include routes such as:

POST /auth/google/token
POST /auth/forgot-password
POST /auth/reset-password
Additional loan, user, document, and workflow endpoints are implemented
by the backend according to the application's API structure.

🌐 Production
Frontend: https://loan-management-system-mu-lac.vercel.app/
Backend:  https://loan-management-system-lv5o.onrender.com/
🔮 Future Improvements
Potential improvements include:

Automated loan risk scoring

AI-assisted document verification

Intelligent fraud detection

Notification system

Advanced analytics dashboard

Automated repayment reminders

Audit logging

More granular permissions

Improved application monitoring

👨‍💻 Project Highlights
CREDORA demonstrates practical experience with:

Full-stack web development

REST API development

Authentication and authorization

Google OAuth

Role-Based Access Control

MongoDB

Cloudinary

Financial/business workflows

File/document management

Responsive dashboard development

Cloud deployment

Production debugging and integration
>>>>>>> d64ab581774018aec96dee2870aa738fefd85bd2
