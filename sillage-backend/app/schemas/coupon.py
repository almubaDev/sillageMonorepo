from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models.coupon import CouponType


# ============= COUPON BATCH SCHEMAS =============

class CouponBatchCreate(BaseModel):
    """Schema para crear un lote de cupones"""
    title: str = Field(..., min_length=1, max_length=200, description="Título del lote")
    type: CouponType = Field(default=CouponType.SINGLE_USE, description="Tipo de cupón")
    consultations_amount: int = Field(..., ge=1, le=1000, description="Cantidad de consultas que otorga cada cupón")
    total_coupons: int = Field(..., ge=1, le=1000, description="Cantidad de cupones a generar")
    expiration_date: Optional[datetime] = Field(None, description="Fecha de expiración (solo para multi-uso)")
    custom_code: Optional[str] = Field(None, min_length=3, max_length=50, description="Código personalizado (opcional, solo para multi-uso)")

    @field_validator('expiration_date')
    @classmethod
    def validate_expiration(cls, v, info):
        if info.data.get('type') == CouponType.MULTI_USE and v is None:
            raise ValueError('Los cupones multi-uso requieren fecha de expiración')
        if info.data.get('type') == CouponType.SINGLE_USE and v is not None:
            raise ValueError('Los cupones de un solo uso no deben tener fecha de expiración')
        return v

    @field_validator('custom_code')
    @classmethod
    def validate_custom_code(cls, v, info):
        if v and info.data.get('type') == CouponType.SINGLE_USE:
            raise ValueError('Los cupones de un solo uso no pueden tener código personalizado')
        if v:
            # Solo permitir letras mayúsculas, números y guiones
            import re
            if not re.match(r'^[A-Z0-9-]+$', v):
                raise ValueError('El código personalizado solo puede contener letras mayúsculas, números y guiones')
        return v


class CouponBatchResponse(BaseModel):
    """Schema de respuesta para lote de cupones"""
    id: int
    title: str
    type: CouponType
    consultations_amount: int
    total_coupons: int
    created_by: Optional[int]
    created_at: datetime
    expiration_date: Optional[datetime]
    used_count: int = 0  # Cantidad de cupones usados (se calcula)
    available_count: int = 0  # Cantidad de cupones disponibles (se calcula)

    class Config:
        from_attributes = True


# ============= COUPON SCHEMAS =============

class CouponResponse(BaseModel):
    """Schema de respuesta para cupón individual"""
    id: int
    code: str
    batch_id: int
    is_used: bool
    used_by: Optional[int]
    used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CouponBatchWithCoupons(CouponBatchResponse):
    """Schema de lote con sus cupones incluidos"""
    coupons: List[CouponResponse] = []


class CouponRedeemRequest(BaseModel):
    """Schema para canjear un cupón"""
    code: str = Field(..., min_length=1, max_length=50, description="Código del cupón")


class CouponRedeemResponse(BaseModel):
    """Schema de respuesta al canjear cupón"""
    id: int
    code: str
    consultations_added: int
    new_total: int
    message: str


# ============= STATISTICS SCHEMAS =============

class CouponStats(BaseModel):
    """Estadísticas de cupones"""
    total_batches: int
    total_coupons_generated: int
    total_coupons_used: int
    total_coupons_available: int
    total_consultations_gifted: int


# ============= PAGINATION =============

class CouponBatchListResponse(BaseModel):
    """Respuesta paginada de lotes de cupones"""
    items: List[CouponBatchResponse]
    total: int
    skip: int
    limit: int
