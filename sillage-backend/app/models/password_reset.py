"""
Modelo para tokens de recuperación de contraseña
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.core.database import Base
import secrets


class PasswordResetToken(Base):
    """
    Modelo para tokens de recuperación de contraseña
    """
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    used_at = Column(DateTime, nullable=True)

    # Relación
    user = relationship("User", back_populates="password_reset_tokens")

    @staticmethod
    def generate_token() -> str:
        """Generar un token URL-safe seguro"""
        return secrets.token_urlsafe(48)

    @staticmethod
    def create_expiration_time() -> datetime:
        """Crear tiempo de expiración (1 hora desde ahora)"""
        return datetime.utcnow() + timedelta(hours=1)

    def is_expired(self) -> bool:
        """Verificar si el token ha expirado"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Verificar si el token es válido (no usado y no expirado)"""
        return not self.used and not self.is_expired()
