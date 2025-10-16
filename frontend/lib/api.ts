import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as { response?: { data?: unknown }; message?: string };
    return Promise.reject(
      (err.response?.data as string | undefined) || err.message || "Request failed"
    );
  }
);

export type AuthStatusResponse = {
  signedIn: boolean;
  username?: string;
  upiId?: string;
  qrCodeUrl?: string;
  mobile?: string;
  balance?: number;
  signedInUntil?: string;
};

export type Payment = {
  sender: string;
  receiver: string;
  amount: number;
  status?: "success" | "failed" | string;
  createdAt?: string | number | Date;
};

export type PaymentHistoryResponse = {
  transactions: Payment[];
};

export async function getAuthStatus(mobile: string) {
  const { data } = await apiClient.get<AuthStatusResponse>(
    `/auth/status/${mobile}`
  );
  return data;
}

export async function getQrForMobile(mobile: string) {
  const { data } = await apiClient.get<{ mobile: string; username?: string; upiId: string; qrCodeUrl: string }>(
    `/auth/qr/${mobile}`
  );
  return data;
}

export async function postLogout(mobile: string) {
  const { data } = await apiClient.post(`/auth/logout`, { mobile });
  return data;
}

export async function postPayment(payload: Payment) {
  const { data } = await apiClient.post(`/payment`, payload);
  return data;
}

export async function getPaymentHistory(upiId: string): Promise<Payment[]> {
  const { data } = await apiClient.get<PaymentHistoryResponse | Payment[]>(
    `/payment/history/${upiId}`
  );
  if (Array.isArray(data)) return data as Payment[];
  if (data && Array.isArray((data as PaymentHistoryResponse).transactions)) {
    return (data as PaymentHistoryResponse).transactions;
  }
  return [];
}

export async function getBalance(upiId: string): Promise<{ upiId: string; balance: number; updatedAt?: string } | null> {
  try {
    const { data } = await apiClient.get<{ upiId: string; balance: number; updatedAt?: string }>(
      `/bank/balance/${upiId}`
    );
    return data;
  } catch {
    return null;
  }
}

export async function getUserByUpi(upiId: string): Promise<{ mobile: string; username: string; upiId: string } | null> {
  try {
    const { data } = await apiClient.get<{ mobile: string; username: string; upiId: string }>(
      `/auth/user/by-upi/${encodeURIComponent(upiId)}`
    );
    return data;
  } catch {
    return null;
  }
}

export async function getUserBalanceByMobile(mobile: string): Promise<{ mobile: string; upiId: string; balance: number } | null> {
  try {
    const { data } = await apiClient.get<{ mobile: string; upiId: string; balance: number }>(
      `/auth/balance/${mobile}`
    );
    return data;
  } catch {
    return null;
  }
}


