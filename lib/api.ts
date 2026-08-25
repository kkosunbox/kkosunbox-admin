import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const AUTH_TOKEN_KEY = 'kkosunbox_admin_token';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(AUTH_TOKEN_KEY);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (error.response?.status === 400) return '요청 값이 올바르지 않습니다.';
    if (error.response?.status === 401) return '로그인이 필요합니다.';
    if (error.response?.status === 403) return '접근 권한이 없습니다.';
    if (error.response?.status === 404) return '데이터를 찾을 수 없습니다.';
    if (error.response?.status === 409) return '이미 처리된 요청입니다.';
    if (error.response?.status === 422) return '현재 상태에서는 처리할 수 없습니다.';
    if (error.response?.status === 500) return '서버 오류가 발생했습니다.';
  }
  return '알 수 없는 오류가 발생했습니다.';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const adminApi = {
  login: (data: { username: string; password: string }) =>
    apiClient.post('/admin/auth/login', data).then((r) => r.data.data),

  getMe: () => apiClient.get('/admin/auth/me').then((r) => r.data.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    apiClient.get('/admin/dashboard/stats').then((r) => r.data.data),

  getCalendar: (year: number, month: number) =>
    apiClient
      .get('/admin/dashboard/calendar', { params: { year, month } })
      .then((r) => r.data.data),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptionsApi = {
  getList: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/subscriptions', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/subscriptions/${id}`).then((r) => r.data.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  getList: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    deliveryStatus?: string;
  }) => apiClient.get('/admin/orders', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/orders/${id}`).then((r) => r.data.data),

  updateDelivery: (id: number, trackingNumber: string) =>
    apiClient
      .patch(`/admin/orders/${id}/delivery`, { trackingNumber })
      .then((r) => r.data.data),

  cancelPayment: (id: number, cancelSubscription = false) =>
    apiClient
      .post(`/admin/orders/${id}/cancel`, { cancelSubscription })
      .then((r) => r.data.data),

  refundPayment: (id: number, refundReason?: string) =>
    apiClient
      .post(`/admin/orders/${id}/refund`, { refundReason })
      .then((r) => r.data.data),
};

// ─── Products (단건 판매) ───────────────────────────────────────────────────────

export const productsApi = {
  getList: () => apiClient.get('/admin/products').then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/products/${id}`).then((r) => r.data.data),

  create: (data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  }) => apiClient.post('/admin/products', data).then((r) => r.data.data),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      isActive: boolean;
    }>,
  ) => apiClient.patch(`/admin/products/${id}`, data).then((r) => r.data.data),
};

// ─── Product Orders (단건 판매 주문) ─────────────────────────────────────────────

export const productOrdersApi = {
  getList: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    deliveryStatus?: string;
  }) =>
    apiClient.get('/admin/product-orders', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/product-orders/${id}`).then((r) => r.data.data),

  updateDelivery: (id: number, trackingNumber: string) =>
    apiClient
      .patch(`/admin/product-orders/${id}/delivery`, { trackingNumber })
      .then((r) => r.data.data),

  cancel: (id: number, cancelReason?: string) =>
    apiClient
      .post(`/admin/product-orders/${id}/cancel`, { cancelReason })
      .then((r) => r.data.data),

  refund: (id: number, refundReason?: string) =>
    apiClient
      .post(`/admin/product-orders/${id}/refund`, { refundReason })
      .then((r) => r.data.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getList: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => apiClient.get('/admin/users', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/users/${id}`).then((r) => r.data.data),

  updateStatus: (id: number, status: string) =>
    apiClient
      .patch(`/admin/users/${id}/status`, { status })
      .then((r) => r.data.data),

  setInfluencer: (id: number, isInfluencer: boolean) =>
    apiClient
      .patch(`/admin/users/${id}/influencer`, { isInfluencer })
      .then((r) => r.data.data),
};

// ─── Influencers ──────────────────────────────────────────────────────────────

export const influencersApi = {
  getList: (params?: { page?: number; limit?: number; hasUnsettled?: boolean }) =>
    apiClient.get('/admin/influencers', { params }).then((r) => r.data.data),

  getById: (userId: number) =>
    apiClient.get(`/admin/influencers/${userId}`).then((r) => r.data.data),

  getMonthlySummary: (userId: number, year?: number) =>
    apiClient
      .get(`/admin/influencers/${userId}/points/monthly-summary`, { params: { year } })
      .then((r) => r.data.data),

  getPoints: (userId: number, params?: { year?: number; month?: number; page?: number; limit?: number }) =>
    apiClient.get(`/admin/influencers/${userId}/points`, { params }).then((r) => r.data.data),

  getSettlements: (userId: number) =>
    apiClient.get(`/admin/influencers/${userId}/settlements`).then((r) => r.data.data),

  createSettlement: (userId: number, data: { year: number; month: number; note?: string }) =>
    apiClient.post(`/admin/influencers/${userId}/settlements`, data).then((r) => r.data.data),

  deleteSettlement: (userId: number, settlementId: number) =>
    apiClient
      .delete(`/admin/influencers/${userId}/settlements/${settlementId}`)
      .then((r) => r.data.data),
};

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const inquiriesApi = {
  getList: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/inquiries', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/inquiries/${id}`).then((r) => r.data.data),

  answer: (id: number, answer: string) =>
    apiClient
      .patch(`/admin/inquiries/${id}/answer`, { answer })
      .then((r) => r.data.data),
};

// ─── Partnership Inquiries ────────────────────────────────────────────────────

export const partnershipInquiriesApi = {
  getList: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get("/admin/partnership-inquiries", { params })
      .then((r) => r.data.data),

  getById: (id: number) =>
    apiClient
      .get(`/admin/partnership-inquiries/${id}`)
      .then((r) => r.data.data),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plansApi = {
  getList: () => apiClient.get('/admin/plans').then((r) => r.data.data),

  create: (data: {
    name: string;
    description?: string;
    monthlyPrice: number;
    originalPrice?: number | null;
    discountRate?: number | null;
    sortOrder?: number;
    tagIds?: number[];
  }) => apiClient.post('/admin/plans', data).then((r) => r.data.data),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      monthlyPrice: number;
      originalPrice: number | null;
      discountRate: number | null;
      sortOrder: number;
      isActive: boolean;
      tagIds: number[];
    }>,
  ) => apiClient.patch(`/admin/plans/${id}`, data).then((r) => r.data.data),

  delete: (id: number) =>
    apiClient.delete(`/admin/plans/${id}`).then((r) => r.data.data),
};

// ─── Plan Tags ────────────────────────────────────────────────────────────────

export const planTagsApi = {
  getList: () => apiClient.get('/admin/plan-tags').then((r) => r.data.data),

  create: (data: { name: string; bgColor: string; textColor: string }) =>
    apiClient.post('/admin/plan-tags', data).then((r) => r.data.data),

  update: (id: number, data: Partial<{ name: string; bgColor: string; textColor: string }>) =>
    apiClient.patch(`/admin/plan-tags/${id}`, data).then((r) => r.data.data),

  delete: (id: number) =>
    apiClient.delete(`/admin/plan-tags/${id}`).then((r) => r.data.data),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const couponsApi = {
  getList: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/coupons', { params }).then((r) => r.data.data),

  create: (data: {
    code: string;
    name?: string;
    description?: string;
    discountType?: 'percent' | 'fixed';
    discountRate?: number;
    discountAmount?: number;
    applyCount?: number;
    startDate?: string;
    endDate?: string;
  }) => apiClient.post('/admin/coupons', data).then((r) => r.data.data),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      discountType: 'percent' | 'fixed';
      discountRate: number;
      discountAmount: number;
      applyCount: number;
      isActive: boolean;
      startDate: string;
      endDate: string;
    }>,
  ) => apiClient.patch(`/admin/coupons/${id}`, data).then((r) => r.data.data),
};

// ─── Product Coupons (단건 상품 쿠폰) ────────────────────────────────────────────

export const productCouponsApi = {
  getList: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/product-coupons', { params }).then((r) => r.data.data),

  create: (data: {
    code: string;
    name?: string;
    description?: string;
    discountRate: number;
    maxDiscountAmount?: number;
    startDate?: string;
    endDate?: string;
  }) => apiClient.post('/admin/product-coupons', data).then((r) => r.data.data),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      discountRate: number;
      maxDiscountAmount: number | null;
      isActive: boolean;
      startDate: string;
      endDate: string;
    }>,
  ) => apiClient.patch(`/admin/product-coupons/${id}`, data).then((r) => r.data.data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  getList: (params?: {
    page?: number;
    limit?: number;
    planId?: number;
    isHidden?: boolean;
  }) => apiClient.get('/admin/reviews', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    apiClient.get(`/admin/reviews/${id}`).then((r) => r.data.data),

  hide: (id: number) =>
    apiClient.patch(`/admin/reviews/${id}/hide`).then((r) => r.data.data),

  unhide: (id: number) =>
    apiClient.patch(`/admin/reviews/${id}/unhide`).then((r) => r.data.data),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  getList: () => apiClient.get('/admin/settings').then((r) => r.data.data),

  create: (data: { key: string; value: string; description?: string }) =>
    apiClient.post('/admin/settings', data).then((r) => r.data.data),

  update: (key: string, data: { value: string; description?: string }) =>
    apiClient.patch(`/admin/settings/${key}`, data).then((r) => r.data.data),
};
