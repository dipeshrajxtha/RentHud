/**
 * KYC Client Service
 *
 * Handles API calls for identity verification submissions,
 * verification checks, and admin KYC review workflows.
 */

export interface KycSubmissionData {
  id: string;
  userId: string;
  userRole: 'tenant' | 'landlord';
  citizenshipFrontUrl: string;
  citizenshipBackUrl: string;
  policeReportUrl?: string | null;
  ownershipDocumentUrl?: string | null;
  businessRegistrationUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
}

export interface SubmitKycInput {
  citizenshipFrontUrl: string;
  citizenshipBackUrl: string;
  policeReportUrl?: string | null;
  ownershipDocumentUrl?: string | null;
  businessRegistrationUrl?: string | null;
}

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const kycService = {
  /**
   * Fetch current user's KYC submission (null if not submitted).
   */
  async getMyKyc(token?: string | null): Promise<KycSubmissionData | null> {
    const res = await fetch('/api/kyc/me', {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      if (res.status === 401) return null;
      throw new Error('Failed to fetch KYC submission');
    }
    const json = await res.json();
    return json.data ?? null;
  },

  /**
   * Quick boolean check if the current user is approved.
   */
  async getKycStatus(token?: string | null): Promise<{ verified: boolean }> {
    const res = await fetch('/api/kyc/status', {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      return { verified: false };
    }
    const json = await res.json();
    return json.data ?? { verified: false };
  },

  /**
   * Submit KYC documents for review.
   */
  async submitKyc(input: SubmitKycInput, token?: string | null): Promise<KycSubmissionData> {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to submit KYC documents');
    }
    return json.data;
  },

  /**
   * Admin: List all KYC submissions.
   */
  async adminListKyc(status?: 'pending' | 'approved' | 'rejected', token?: string | null): Promise<KycSubmissionData[]> {
    const url = status ? `/api/admin/kyc?status=${status}` : '/api/admin/kyc';
    const res = await fetch(url, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch KYC submissions for admin');
    }
    const json = await res.json();
    return json.data ?? [];
  },

  /**
   * Admin: Approve a KYC submission.
   */
  async adminApproveKyc(submissionId: string, token?: string | null): Promise<KycSubmissionData> {
    const res = await fetch(`/api/admin/kyc/${submissionId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to approve KYC');
    }
    return json.data;
  },

  /**
   * Admin: Reject a KYC submission with reason.
   */
  async adminRejectKyc(submissionId: string, reason: string, token?: string | null): Promise<KycSubmissionData> {
    const res = await fetch(`/api/admin/kyc/${submissionId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to reject KYC');
    }
    return json.data;
  },
};
