import { auth } from './firebase';
import { signOut } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

let isRedirecting = false;

function handleUnauthorized() {
  if (isRedirecting) return;
  isRedirecting = true;

  signOut(auth).catch(() => {});

  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  totalRevenue?: number;
  totalProfit?: number;
  totalOrders?: number;
  logs?: any[];
  transactions?: any[];
  notifications?: any[];
  token?: string;
  user?: any;
  balance?: number;
};

// ── Admin Dashboard Types ──────────────────────────

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
};

export type Sale = {
  id: string;
  receiptNumber: string;
  customerName: string;
  items: SaleItem[];
  revenue: number;
  profit: number;
  status: 'pending' | 'completed' | 'cancelled';
  issued: boolean;
  issuedBy: string | null;
  issuedAt: string | null;
  date: string;
};

export type SalesListResponse = {
  data: Sale[];
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type RevenueDataPoint = {
  period: string;
  revenue: number;
  profit: number;
  salesCount: number;
};

export type TopProduct = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  imageUrl: string;
  costPrice: number;
  sellingPrice: number;
  profitPerUnit: number;
  totalAdded: number;
  totalSold: number;
  lowStockThreshold: number;
  isActive: boolean;
  quantity: number;
  createdAt: { _seconds: number; _nanoseconds: number };
  updatedAt: { _seconds: number; _nanoseconds: number };
};

export type TopCustomer = {
  userId: string;
  fullName: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
};

export type TopProductsResponse = {
  bestSelling: TopProduct[];
  highestProfit: TopProduct[];
};

export type CustomersResponse = {
  mostActive: TopCustomer[];
  highestSpending: TopCustomer[];
};

export type ProfitResponse = {
  productProfit: {
    productId: string;
    productName: string;
    profit: number;
    unitsSold: number;
    margin: number;
  }[];
  dailyProfit: number;
  monthlyProfit: number;
  lifetimeProfit: number;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const headers = await getAuthHeaders();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please login again.');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed: ${res.status}`);
  }

  return data as ApiResponse<T>;
}

export async function downloadReport(path: string, fileName: string): Promise<void> {
  const url = `${BASE_URL}${path}`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please login again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Download failed: ${res.status}`);
  }
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export const api = {
  // ── Auth ──────────────────────────────────────────
  auth: {
    me: () => request<any>('/auth/me'),
    profile: () => request<any>('/auth/profile'),
    updateProfile: (body: { fullName?: string; phoneNumber?: string }) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
    setupPin: (pin: string) =>
      request('/auth/setup-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
    changePin: (oldPin: string, newPin: string) =>
      request('/auth/change-pin', { method: 'POST', body: JSON.stringify({ oldPin, newPin }) }),
    savePushToken: (token: string) =>
      request('/auth/expo-push-token', { method: 'POST', body: JSON.stringify({ token }) }),
  },

  // ── Wallet ────────────────────────────────────────
  wallet: {
    balance: () => request<{ balance: number; walletId: string }>('/wallet/balance'),
    info: () => request<any>('/wallet/info'),
    fundInitialize: (amount: number, provider: 'paystack' | 'flutterwave') =>
      request<{ authorizationUrl: string; reference: string }>('/wallet/fund/initialize', {
        method: 'POST',
        body: JSON.stringify({ amount, provider }),
      }),
    fundVerify: (reference: string, provider: 'paystack' | 'flutterwave') =>
      request('/wallet/fund/verify', {
        method: 'POST',
        body: JSON.stringify({ reference, provider }),
      }),
    transactions: (params?: { type?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.type) qs.set('type', params.type);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const query = qs.toString();
      return request(`/wallet/transactions${query ? `?${query}` : ''}`);
    },
    transactionsAll: (page = 1, limit = 20) =>
      request(`/wallet/transactions/all?page=${page}&limit=${limit}`),
  },

  // ── Payments ──────────────────────────────────────
  payments: {
    initiate: (amount: number) =>
      request<{ authorizationUrl: string; reference: string; amount: number; displayAmount: string; publicKey?: string }>(
        '/payments/initiate',
        { method: 'POST', body: JSON.stringify({ amount }) },
      ),
    verify: (reference: string) =>
      request<{ alreadyApplied: boolean; transactionId: string; amount: number }>(
        '/payments/verify',
        { method: 'POST', body: JSON.stringify({ reference }) },
      ),
  },

  // ── Notifications ──────────────────────────────────
  notifications: {
    list: (page = 1, limit = 20) =>
      request(`/notifications/user?page=${page}&limit=${limit}`),
    read: (id: string) =>
      request(`/notifications/user/${id}/read`, { method: 'PUT' }),
    alerts: (acknowledged?: boolean) => {
      const qs = new URLSearchParams();
      if (acknowledged !== undefined) qs.set('acknowledged', String(acknowledged));
      const query = qs.toString();
      return request(`/notifications/alerts${query ? `?${query}` : ''}`);
    },
    checkAlerts: () =>
      request('/notifications/alerts/check', { method: 'POST' }),
    acknowledgeAlert: (id: string) =>
      request(`/notifications/alerts/${id}/acknowledge`, { method: 'PUT' }),
    auditLogs: (page = 1, limit = 50) =>
      request(`/notifications/audit-logs?page=${page}&limit=${limit}`),
  },

  // ── Orders ────────────────────────────────────────
  orders: {
    place: (items: { productId: string; quantity: number }[], pin: string) =>
      request<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, pin }),
      }),
    list: (page = 1, limit = 20) =>
      request(`/orders?page=${page}&limit=${limit}`),
    receipt: (orderId: string) => request(`/orders/receipt/${orderId}`),
    receiptByNumber: (receiptNumber: string) =>
      request(`/orders/receipt-by-number/${receiptNumber}`),
  },

  // ── Products ──────────────────────────────────────
  products: {
    list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.search) qs.set('search', params.search);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const query = qs.toString();
      return request(`/products${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request(`/products/${id}`),
    create: (body: {
      name: string;
      categoryId: string;
      description?: string;
      imageUrl?: string;
      costPrice: number;
      sellingPrice: number;
      quantity: number;
    }) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: {
        name?: string;
        categoryId?: string;
        description?: string;
        imageUrl?: string;
        costPrice?: number;
        sellingPrice?: number;
        lowStockThreshold?: number;
        isActive?: boolean;
      },
    ) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    restock: (id: string, body: { quantity: number; newCostPrice?: number }) =>
      request(`/products/${id}/restock`, { method: 'POST', body: JSON.stringify(body) }),
    stockHistory: (id: string) => request(`/products/${id}/stock-history`),
    lowStockAlerts: () => request('/products/alerts/low-stock'),
    checkStock: (items: { productId: string; quantity: number }[]) =>
      request<Array<{ productId: string; name: string; inStock: boolean; quantity: number; lowStockThreshold: number }>>('/products/check-stock', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // ── Categories ────────────────────────────────────
  categories: {
    list: () => request('/categories'),
    get: (id: string) => request(`/categories/${id}`),
    create: (body: { name: string; description?: string }) =>
      request('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; description?: string; isActive?: boolean }) =>
      request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  // ── Search ────────────────────────────────────────
  search: {
    products: (q: string, category?: string) => {
      const qs = new URLSearchParams({ q });
      if (category) qs.set('category', category);
      return request(`/search/products?${qs.toString()}`);
    },
    categories: () => request('/search/categories'),
  },

  // ── Images ────────────────────────────────────────
  images: {
    search: (q: string, count = 10) =>
      request<any>(`/images/search?q=${encodeURIComponent(q)}&count=${count}`),
  },

  // ── App Version ───────────────────────────────────
  version: {
    get: () => request<any>('/version'),
    update: (body: {
      version: string;
      versionCode: number;
      apkLink: string;
      releaseNotes?: string;
      forceUpdate?: boolean;
    }) => request('/version/update', { method: 'PUT', body: JSON.stringify(body) }),
    check: (platform = 'android') => request<any>(`/version/check?platform=${platform}`),
  },

  // ── Admin Analytics & Users (v1) ──────────────────
  admin: {
    analytics: {
      dashboard: () => request<any>('/admin/analytics/dashboard'),
      revenue: (period = 'weekly', limit = 30) =>
        request<any>(`/admin/analytics/revenue?period=${period}&limit=${limit}`),
      topProducts: (limit = 10) =>
        request<any>(`/admin/analytics/top-products?limit=${limit}`),
      customers: (limit = 10) =>
        request<any>(`/admin/analytics/customers?limit=${limit}`),
      profit: () => request<any>('/admin/analytics/profit'),
    },
    users: {
      list: (page = 1, limit = 20) =>
        request<any>(`/admin/users?page=${page}&limit=${limit}`),
      toggleStatus: (id: string) =>
        request(`/admin/users/${id}/toggle-status`, { method: 'PUT' }),
      paymentLogs: (id: string, page = 1, limit = 50) =>
        request<any>(`/admin/users/${id}/payment-logs?page=${page}&limit=${limit}`),
      setRole: (uid: string, role: string) =>
        request(`/admin/users/${uid}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    },
    reports: {
      downloadSales: (start?: string, end?: string) =>
        downloadReport(`/admin/sales?start=${start || ''}&end=${end || ''}`, `sales-report-${Date.now()}.xlsx`),
      downloadInventory: () =>
        downloadReport('/admin/inventory', `inventory-report-${Date.now()}.xlsx`),
      downloadProfit: (start?: string, end?: string) =>
        downloadReport(`/admin/profit?start=${start || ''}&end=${end || ''}`, `profit-report-${Date.now()}.xlsx`),
      downloadTransactions: (userId?: string) =>
        downloadReport(`/admin/transactions${userId ? `?userId=${userId}` : ''}`, `transactions-report-${Date.now()}.xlsx`),
    },
  },

  // ── Admin Dashboard (v2) ──────────────────────────
  adminDashboard: {
    auth: {
      login: (body: { email: string; password?: string }) =>
        request<any>('/admin-dashboard/auth/login', { method: 'POST', body: JSON.stringify(body) }),
      me: () => request<any>('/admin-dashboard/auth/me'),
      setupPin: (pin: string) =>
        request<any>('/admin-dashboard/auth/setup-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
      changePin: (oldPin: string, newPin: string) =>
        request<any>('/admin-dashboard/auth/change-pin', { method: 'POST', body: JSON.stringify({ oldPin, newPin }) }),
    },
    overview: () => request<any>('/admin-dashboard/overview'),
    products: {
      create: (body: {
        name: string;
        categoryId: string;
        description?: string;
        imageUrl?: string;
        costPrice: number;
        sellingPrice: number;
        quantity: number;
        lowStockThreshold?: number;
        pin: string;
      }) => request<any>('/admin-dashboard/products', { method: 'POST', body: JSON.stringify(body) }),
      restock: (id: string, body: { quantity: number; newCostPrice?: number; pin: string }) =>
        request<any>(`/admin-dashboard/products/${id}/restock`, { method: 'POST', body: JSON.stringify(body) }),
      removeStock: (id: string, body: { quantity: number; reason: string; pin: string }) =>
        request<any>(`/admin-dashboard/products/${id}/remove-stock`, { method: 'POST', body: JSON.stringify(body) }),
      analytics: (id: string, params?: { period?: string; startDate?: string; endDate?: string }) => {
        const qs = new URLSearchParams();
        if (params?.period) qs.set('period', params.period);
        if (params?.startDate) qs.set('startDate', params.startDate);
        if (params?.endDate) qs.set('endDate', params.endDate);
        const query = qs.toString();
        return request<any>(`/admin-dashboard/products/${id}/analytics${query ? `?${query}` : ''}`);
      },
    },
    inventoryTracking: (page = 1, limit = 50) =>
      request<any>(`/admin-dashboard/inventory-tracking?page=${page}&limit=${limit}`),
    categories: {
      create: (body: { name: string; description?: string }) =>
        request<any>('/admin-dashboard/categories', { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: { name?: string; description?: string; isActive?: boolean }) =>
        request<any>(`/admin-dashboard/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      delete: (id: string) =>
        request<any>(`/admin-dashboard/categories/${id}`, { method: 'DELETE' }),
    },
    sales: {
      list: (params?: { filter?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
        const qs = new URLSearchParams();
        if (params?.filter) qs.set('filter', params.filter);
        if (params?.startDate) qs.set('startDate', params.startDate);
        if (params?.endDate) qs.set('endDate', params.endDate);
        if (params?.page) qs.set('page', String(params.page));
        if (params?.limit) qs.set('limit', String(params.limit));
        const query = qs.toString();
        return request<Sale[]>(`/admin-dashboard/sales${query ? `?${query}` : ''}`);
      },
      adjust: (id: string, body: { status: 'pending' | 'completed' | 'cancelled'; pin: string }) =>
        request<{ balance?: number }>(`/admin-dashboard/sales/${id}/adjust`, { method: 'PUT', body: JSON.stringify(body) }),
      issue: (id: string) =>
        request<Sale>(`/admin-dashboard/sales/${id}/issue`, { method: 'PUT' }),
    },
    analytics: {
      revenue: (period: 'daily' | 'weekly' | 'monthly' = 'daily', limit = 30) =>
        request<RevenueDataPoint[]>(`/admin-dashboard/analytics/revenue?period=${period}&limit=${limit}`),
      topProducts: (limit = 10) =>
        request<TopProductsResponse>(`/admin-dashboard/analytics/top-products?limit=${limit}`),
      customers: (limit = 10) =>
        request<CustomersResponse>(`/admin-dashboard/analytics/customers?limit=${limit}`),
      profit: () => request<ProfitResponse>('/admin-dashboard/analytics/profit'),
    },
    alerts: {
      list: () => request<any>('/admin-dashboard/alerts'),
      acknowledge: (id: string) =>
        request<any>(`/admin-dashboard/alerts/${id}/acknowledge`, { method: 'PUT' }),
    },
    wallet: {
      adjust: (body: { userId: string; amount: number; description?: string; pin: string }) =>
        request<any>('/admin-dashboard/wallet/adjust', { method: 'POST', body: JSON.stringify(body) }),
    },
    reports: {
      download: (params: { type: string; format: string; startDate?: string; endDate?: string; userId?: string }) => {
        const qs = new URLSearchParams({ type: params.type, format: params.format });
        if (params.startDate) qs.set('startDate', params.startDate);
        if (params.endDate) qs.set('endDate', params.endDate);
        if (params.userId) qs.set('userId', params.userId);
        const formatExt = params.format === 'excel' ? 'xlsx' : params.format;
        return downloadReport(`/admin-dashboard/reports/export?${qs.toString()}`, `${params.type}_report_${Date.now()}.${formatExt}`);
      }
    }
  },
};

export default api;
