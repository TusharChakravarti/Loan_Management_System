import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';
import { BREResult, CreateLoanPayload, Loan } from '../types/loan';
import {
  AdminOverview,
  DisbursementPayload,
  Payment,
  RecordPaymentPayload,
  SalesReviewPayload,
  SanctionPayload,
} from '../types/operations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lms_auth_token');
  }
  return null;
};

export const setAuthToken = (token: string | null): void => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('lms_auth_token', token);
    } else {
      localStorage.removeItem('lms_auth_token');
    }
  }
};

const isTechnicalErrorMessage = (msg: string): boolean => {
  if (!msg || typeof msg !== 'string') return true;
  const technicalKeywords = [
    'cloudinary',
    'mongodb',
    'mongoose',
    'jwt_secret',
    'api_key',
    'api_secret',
    'actions=',
    'node_modules',
    '.env',
    'typeerror',
    'referenceerror',
    'syntaxerror',
    'eaddrinuse',
    'econnrefused',
    'unexpectedresponse',
    'http_code',
  ];
  const lower = msg.toLowerCase();
  return technicalKeywords.some((kw) => lower.includes(kw));
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    let rawMsg = data.message || data.error;

    if (isTechnicalErrorMessage(rawMsg)) {
      if (endpoint.includes('upload-salary-slip')) {
        rawMsg = 'Unable to upload your salary slip. Please try again.';
      } else if (endpoint.includes('salary-slip')) {
        rawMsg = 'Unable to retrieve the document. Please try again.';
      } else if (endpoint.includes('/auth/login')) {
        rawMsg = 'Unable to sign in. Please check your credentials and try again.';
      } else if (endpoint.includes('/auth/register')) {
        rawMsg = 'Unable to create your account. Please try again.';
      } else {
        rawMsg = 'Something went wrong on our end. Please try again later.';
      }
    }

    const err = new Error(rawMsg) as any;
    err.rejectionReasons = data.rejectionReasons;
    err.status = response.status;
    throw err;
  }

  return data;
};

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(data.token);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(data.token);
    return data;
  },

  googleToken: async (token: string): Promise<AuthResponse> => {
    const data = await apiFetch('/auth/google/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    setAuthToken(data.token);
    return data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getGoogleAuthUrl: (): string => {
    return `${API_BASE_URL}/auth/google`;
  },

  getMe: async (): Promise<{ user: User }> => {
    return await apiFetch('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
    }
  },

  testEndpoint: async (path: string): Promise<any> => {
    return await apiFetch(`/test/${path}`);
  },
};

export const loanApi = {
  checkBRE: async (payload: {
    dateOfBirth: string;
    monthlySalary: number;
    pan: string;
    employmentMode: string;
  }): Promise<BREResult> => {
    return await apiFetch('/loans/bre/check', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  uploadSalarySlip: async (
    file: File
  ): Promise<{
    salarySlipUrl: string;
    salarySlipPublicId?: string;
    salarySlipResourceType?: string;
    salarySlipFormat?: string;
    originalName: string;
  }> => {
    const formData = new FormData();
    formData.append('salarySlip', file);
    return await apiFetch('/loans/upload-salary-slip', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * AUTHENTICATED BINARY SALARY SLIP FETCH
   * Sends Authorization: Bearer <token> to backend proxy endpoint and returns raw blob + metadata
   */
  fetchSalarySlipBlob: async (loanId: string): Promise<{ blob: Blob; fileName: string; isImage: boolean }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required to preview document.');
    }

    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/salary-slip/preview`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Unable to preview salary slip. Please try again.');
    }

    let fileName = `Salary_Slip_${loanId.slice(-6)}.pdf`;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Unable to preview salary slip. Please try again.');
    }

    const isImage = blob.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(fileName);
    return { blob, fileName, isImage };
  },

  previewSalarySlip: async (loanId: string): Promise<void> => {
    const res = await loanApi.fetchSalarySlipBlob(loanId);
    const docBlobUrl = URL.createObjectURL(res.blob);
    window.location.href = docBlobUrl;
  },

  getSalarySlipUrl: async (loanId: string): Promise<{ url: string; originalName: string }> => {
    return await apiFetch(`/loans/${loanId}/salary-slip`);
  },

  createLoan: async (payload: CreateLoanPayload): Promise<{ message: string; loan: Loan }> => {
    return await apiFetch('/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyLoans: async (): Promise<{ loans: Loan[] }> => {
    return await apiFetch('/loans/my');
  },

  getLoanById: async (id: string): Promise<{ loan: Loan }> => {
    return await apiFetch(`/loans/${id}`);
  },
};

export const operationsApi = {
  // Sales
  getSalesLoans: async (status?: string): Promise<{ loans: Loan[] }> => {
    const query = status ? `?status=${status}` : '';
    return await apiFetch(`/operations/sales/loans${query}`);
  },
  reviewSalesLoan: async (id: string, payload: SalesReviewPayload): Promise<{ message: string; loan: Loan }> => {
    return await apiFetch(`/operations/sales/loans/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Sanction
  getSanctionLoans: async (): Promise<{ loans: Loan[] }> => {
    return await apiFetch('/operations/sanction/loans');
  },
  approveSanctionLoan: async (id: string, payload: SanctionPayload): Promise<{ message: string; loan: Loan }> => {
    return await apiFetch(`/operations/sanction/loans/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  rejectSanctionLoan: async (id: string, payload: SanctionPayload): Promise<{ message: string; loan: Loan }> => {
    return await apiFetch(`/operations/sanction/loans/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Disbursement
  getDisbursementLoans: async (): Promise<{ loans: Loan[] }> => {
    return await apiFetch('/operations/disbursement/loans');
  },
  disburseLoan: async (id: string, payload: DisbursementPayload): Promise<{ message: string; loan: Loan }> => {
    return await apiFetch(`/operations/disbursement/loans/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Collection
  getCollectionLoans: async (): Promise<{ loans: Loan[] }> => {
    return await apiFetch('/operations/collection/loans');
  },
  getLoanPayments: async (id: string): Promise<{ loan: Loan; payments: Payment[] }> => {
    return await apiFetch(`/operations/collection/loans/${id}`);
  },
  recordPayment: async (
    id: string,
    payload: RecordPaymentPayload
  ): Promise<{ message: string; loan: Loan; payment: Payment }> => {
    return await apiFetch(`/operations/collection/loans/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin Overview
  getAdminOverview: async (): Promise<AdminOverview> => {
    return await apiFetch('/operations/admin/overview');
  },
};
