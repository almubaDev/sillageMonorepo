from app.core.database import Base
from app.models.user import User
from app.models.perfume import Perfume, perfume_collection
from app.models.recommendation import Recomendacion
from app.models.subscription import Suscripcion, HistorialPago
from app.models.role import Role, AdminLog, GiftedConsultation, user_roles
from app.models.password_reset import PasswordResetToken
from app.models.perfume_report import PerfumeReport
from app.models.payment import (
    MetodoPago,
    PaqueteConsultas,
    BotonPago,
    PagoConsultas,
    TransaccionConsultas
)
from app.models.coupon import Coupon, CouponBatch, CouponType
from app.models.api_usage import APIUsageLog, APIDailyUsage, APIUsageConfig
from app.models.financial_snapshot import DailyFinancialSnapshot

# Esto es importante para que Alembic detecte todos los modelos
__all__ = [
    "Base",
    "User",
    "Perfume",
    "perfume_collection",
    "Recomendacion",
    "Suscripcion",
    "HistorialPago",
    "Role",
    "AdminLog",
    "GiftedConsultation",
    "user_roles",
    "PasswordResetToken",
    "PerfumeReport",
    "MetodoPago",
    "PaqueteConsultas",
    "BotonPago",
    "PagoConsultas",
    "TransaccionConsultas",
    "Coupon",
    "CouponBatch",
    "CouponType",
    "APIUsageLog",
    "APIDailyUsage",
    "APIUsageConfig",
    "DailyFinancialSnapshot"
]