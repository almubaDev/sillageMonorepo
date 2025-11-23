/**
 * Servicio para endpoints del panel administrativo
 * Requiere que el usuario sea superuser
 */
import api from './api';

// ==================== INTERFACES ====================

export interface DashboardStats {
  total_users: number;
  active_users: number;
  subscribed_users: number;
  total_perfumes: number;
  total_recommendations: number;
  total_consultations_gifted: number;
  new_users_this_month: number;
  new_subscriptions_this_month: number;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  is_superuser: boolean;
  suscrito: boolean;
  consultas_restantes: number;
  created_at: string;
  last_login: string | null;
}

export interface AdminPerfume {
  id: number;
  nombre: string;
  marca: string;
  perfumista?: string | null;
  notas?: { [key: string]: string[] } | string[] | null;
  acordes?: string[] | null;
  is_private: boolean;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface GiftConsultationRequest {
  quantity: number;
  reason?: string;
}

export interface GiftConsultationResponse {
  id: number;
  user_id: number;
  admin_id: number;
  quantity: number;
  reason: string | null;
  created_at: string;
  new_total: number;
}

export interface ConsultationStats {
  total_consultations_gifted: number;
  unique_recipients: number;
  admins_who_gifted: number;
  total_gift_records: number;
  average_per_gift: number;
}

export interface FinancialSummary {
  total_revenue: number;
  monthly_revenue: number;
  daily_revenue: number;
  total_transactions: number;
  avg_ticket: number;
}

export interface PackageRevenue {
  name: string;
  price: number;
  sales_count: number;
  total_revenue: number;
  avg_per_sale: number;
}

export interface TopCustomer {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  purchases_count: number;
  total_spent: number;
  last_purchase: string | null;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  month_name: string;
  date: string;
  revenue: number;
  transactions: number;
}

export interface ListParams {
  search?: string;
  skip?: number;
  limit?: number;
  is_active?: boolean;
  is_admin?: boolean;
  suscrito?: boolean;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// ==================== COUPONS ====================

export enum CouponType {
  SINGLE_USE = 'single_use',
  MULTI_USE = 'multi_use'
}

export interface CouponBatchCreate {
  title: string;
  type: CouponType;
  consultations_amount: number;
  total_coupons: number;
  expiration_date?: string | null;
  custom_code?: string | null;
}

export interface CouponBatch {
  id: number;
  title: string;
  type: CouponType;
  consultations_amount: number;
  total_coupons: number;
  created_by: number | null;
  created_at: string;
  expiration_date: string | null;
  used_count: number;
  available_count: number;
}

export interface CouponCode {
  id: number;
  code: string;
  batch_id: number;
  is_used: boolean;
  used_by: number | null;
  used_at: string | null;
  created_at: string;
}

export interface CouponBatchWithCoupons extends CouponBatch {
  coupons: CouponCode[];
}

export interface CouponStats {
  total_batches: number;
  total_coupons_generated: number;
  total_coupons_used: number;
  total_coupons_available: number;
  total_consultations_gifted: number;
}

// ==================== ADMIN TOOLS ====================

export interface ResetResponse {
  success: boolean;
  message: string;
  affected_records: number;
}

// ==================== API USAGE ====================

export interface APIUsageLimitInfo {
  calls: number;
  limit: number;
  percentage: number;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
}

export interface APIAlert {
  level: 'warning' | 'critical';
  message: string;
}

export interface APISummaryItem {
  is_paid_tier: boolean;
  today: APIUsageLimitInfo;
  month: APIUsageLimitInfo;
  alerts: APIAlert[];
}

export interface APIUsageSummary {
  gemini?: APISummaryItem;
  openweather?: APISummaryItem;
  google_maps?: APISummaryItem;
}

export interface APIConfigInfo {
  api_name: string;
  is_paid_tier: boolean;
  free_daily_limit: number;
  free_monthly_limit: number;
  cost_per_call: number;
  cost_per_1m_tokens_input: number;
  cost_per_1m_tokens_output: number;
}

// ==================== ADMIN SERVICE ====================

export const adminService = {
  // ========== DASHBOARD ==========
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },

  // ========== USERS ==========
  async listUsers(params: ListParams = {}): Promise<ListResponse<AdminUser>> {
    const response = await api.get<ListResponse<AdminUser>>('/admin/users', { params });
    return response.data;
  },

  async getUser(id: number): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${id}`, data);
    return response.data;
  },

  async deactivateUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  // ========== PERFUMES ==========
  async listPerfumes(params: ListParams = {}): Promise<ListResponse<AdminPerfume>> {
    const response = await api.get<ListResponse<AdminPerfume>>('/admin/perfumes', { params });
    return response.data;
  },

  async getPerfume(id: number): Promise<AdminPerfume> {
    const response = await api.get<AdminPerfume>(`/admin/perfumes/${id}`);
    return response.data;
  },

  async createPerfume(data: Omit<AdminPerfume, 'id'>): Promise<AdminPerfume> {
    const response = await api.post<AdminPerfume>('/admin/perfumes', data);
    return response.data;
  },

  async updatePerfume(id: number, data: Partial<AdminPerfume>): Promise<AdminPerfume> {
    const response = await api.put<AdminPerfume>(`/admin/perfumes/${id}`, data);
    return response.data;
  },

  async deletePerfume(id: number): Promise<void> {
    await api.delete(`/admin/perfumes/${id}`);
  },

  async bulkImportPerfumes(perfumes: Omit<AdminPerfume, 'id'>[]): Promise<any> {
    const response = await api.post('/admin/perfumes/bulk', { perfumes });
    return response.data;
  },

  // ========== CONSULTATIONS ==========
  async giftConsultations(
    userId: number,
    data: GiftConsultationRequest
  ): Promise<GiftConsultationResponse> {
    const response = await api.post<GiftConsultationResponse>(
      `/admin/consultations/gift/${userId}`,
      data
    );
    return response.data;
  },

  async listGiftedConsultations(params: any = {}): Promise<any> {
    const response = await api.get('/admin/consultations/gifted', { params });
    return response.data;
  },

  async getConsultationStats(): Promise<ConsultationStats> {
    const response = await api.get<ConsultationStats>('/admin/consultations/stats');
    return response.data;
  },

  // ========== FINANCIAL REPORTS ==========
  async getFinancialSummary(): Promise<FinancialSummary> {
    const response = await api.get<FinancialSummary>('/admin/financial/summary');
    return response.data;
  },

  async getRevenueByPackage(period: 'all' | 'month' | 'day' = 'all', date_filter?: string): Promise<PackageRevenue[]> {
    const response = await api.get<PackageRevenue[]>('/admin/financial/by-package', {
      params: { period, date_filter }
    });
    return response.data;
  },

  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    const response = await api.get<TopCustomer[]>('/admin/financial/top-customers', {
      params: { limit }
    });
    return response.data;
  },

  async getDailyRevenueChart(days: number = 30): Promise<DailyRevenue[]> {
    const response = await api.get<DailyRevenue[]>('/admin/financial/daily-chart', {
      params: { days }
    });
    return response.data;
  },

  async getMonthlyRevenueChart(months: number = 12): Promise<MonthlyRevenue[]> {
    const response = await api.get<MonthlyRevenue[]>('/admin/financial/monthly-chart', {
      params: { months }
    });
    return response.data;
  },

  // ========== COUPONS ==========
  async createCouponBatch(data: CouponBatchCreate): Promise<CouponBatch> {
    const response = await api.post<CouponBatch>('/admin/coupons/batches', data);
    return response.data;
  },

  async listCouponBatches(params: ListParams = {}): Promise<ListResponse<CouponBatch>> {
    const response = await api.get<ListResponse<CouponBatch>>('/admin/coupons/batches', { params });
    return response.data;
  },

  async getCouponBatchDetail(batchId: number): Promise<CouponBatchWithCoupons> {
    const response = await api.get<CouponBatchWithCoupons>(`/admin/coupons/batches/${batchId}`);
    return response.data;
  },

  async deleteCouponBatch(batchId: number): Promise<void> {
    await api.delete(`/admin/coupons/batches/${batchId}`);
  },

  async deleteSingleCoupon(couponId: number): Promise<void> {
    await api.delete(`/admin/coupons/coupons/${couponId}`);
  },

  async getCouponStats(): Promise<CouponStats> {
    const response = await api.get<CouponStats>('/admin/coupons/stats');
    return response.data;
  },

  // ========== API USAGE ==========
  async getAPIUsageSummary(apiName?: string): Promise<APIUsageSummary> {
    const response = await api.get<APIUsageSummary>('/admin/api-usage/summary', {
      params: apiName ? { api_name: apiName } : {}
    });
    return response.data;
  },

  async getAPIConfigs(): Promise<APIConfigInfo[]> {
    const response = await api.get<APIConfigInfo[]>('/admin/api-usage/configs');
    return response.data;
  },

  async setAPITierMode(apiName: string, isPaid: boolean): Promise<void> {
    await api.post('/admin/api-usage/set-tier', {
      api_name: apiName,
      is_paid: isPaid
    });
  },

  async getAPIChartData(apiName?: string, days: number = 30): Promise<any[]> {
    const response = await api.get('/admin/api-usage/chart-data', {
      params: { api_name: apiName, days }
    });
    return response.data;
  },

  async getFreeTierLimits(): Promise<any> {
    const response = await api.get('/admin/api-usage/free-tier-limits');
    return response.data;
  },

  // ========== ADMIN TOOLS ==========
  async verifyPassword(password: string): Promise<boolean> {
    try {
      await api.post('/admin/tools/verify-password', { password });
      return true;
    } catch {
      return false;
    }
  },

  async resetConsultations(password: string, target: 'all' | 'free_only' | string = 'all'): Promise<ResetResponse> {
    const response = await api.post<ResetResponse>('/admin/tools/reset-consultations', {
      password,
      target
    });
    return response.data;
  },

  async resetAPIUsage(password: string, apiName?: string): Promise<ResetResponse> {
    const response = await api.post<ResetResponse>('/admin/tools/reset-api-usage', {
      password,
      api_name: apiName
    });
    return response.data;
  },
};
