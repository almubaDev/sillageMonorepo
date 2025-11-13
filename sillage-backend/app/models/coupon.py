from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class CouponType(str, enum.Enum):
    SINGLE_USE = "single_use"  # Un solo uso
    MULTI_USE = "multi_use"    # Múltiples usos con fecha de expiración


class CouponBatch(Base):
    """Lote de cupones generados juntos"""
    __tablename__ = "coupon_batches"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)  # Título del lote
    type = Column(Enum(CouponType), nullable=False, default=CouponType.SINGLE_USE)
    consultations_amount = Column(Integer, nullable=False)  # Cantidad de consultas que otorga
    total_coupons = Column(Integer, nullable=False)  # Cantidad total de cupones en el lote
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Para cupones multi-uso
    expiration_date = Column(DateTime(timezone=True), nullable=True)  # Fecha de expiración

    # Relación con cupones individuales
    coupons = relationship("Coupon", back_populates="batch", cascade="all, delete-orphan")


class Coupon(Base):
    """Cupón individual"""
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # Código único
    batch_id = Column(Integer, ForeignKey("coupon_batches.id", ondelete="CASCADE"), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    used_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    batch = relationship("CouponBatch", back_populates="coupons")
