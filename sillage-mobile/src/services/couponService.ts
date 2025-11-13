import api from './api';

export interface CouponRedeemRequest {
  code: string;
}

export interface CouponRedeemResponse {
  id: number;
  code: string;
  consultations_added: number;
  new_total: number;
  message: string;
}

export const couponService = {
  /**
   * Canjear un cupón para obtener consultas gratuitas
   */
  async redeemCoupon(code: string): Promise<CouponRedeemResponse> {
    const response = await api.post<CouponRedeemResponse>('/coupons/redeem', {
      code: code.trim().toUpperCase(),
    });
    return response.data;
  },
};
