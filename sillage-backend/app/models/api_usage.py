# sillage-backend/app/models/api_usage.py
"""
Modelos para tracking de uso de APIs externas (Gemini, OpenWeather, Google Maps)
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, Text, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class APIUsageLog(Base):
    """Log individual de cada llamada a API externa"""
    __tablename__ = "api_usage_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Identificación de la API
    api_name = Column(String(50), nullable=False, index=True)  # 'gemini', 'openweather', 'google_maps'
    endpoint = Column(String(200), nullable=True)  # URL o endpoint específico

    # Métricas de tokens (principalmente para Gemini)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)

    # Tiempo de respuesta
    response_time_ms = Column(Integer, default=0)

    # Costo estimado en USD
    estimated_cost_usd = Column(Numeric(10, 6), default=0)

    # Contexto (opcional)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recommendation_id = Column(Integer, ForeignKey("recomendaciones.id"), nullable=True)

    # Estado de la llamada
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relaciones
    user = relationship("User", backref="api_usage_logs")


class APIDailyUsage(Base):
    """Resumen diario agregado para reportes rápidos"""
    __tablename__ = "api_daily_usage"

    id = Column(Integer, primary_key=True, index=True)

    # Fecha y API
    date = Column(Date, nullable=False, index=True)
    api_name = Column(String(50), nullable=False, index=True)

    # Contadores de llamadas
    total_calls = Column(Integer, default=0)
    successful_calls = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)

    # Tokens (para Gemini)
    total_tokens_input = Column(Integer, default=0)
    total_tokens_output = Column(Integer, default=0)

    # Costos y tiempos
    total_cost_usd = Column(Numeric(10, 4), default=0)
    avg_response_time_ms = Column(Integer, default=0)

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Índice único para evitar duplicados
    __table_args__ = (
        UniqueConstraint('date', 'api_name', name='unique_daily_api_usage'),
    )


class APIUsageConfig(Base):
    """Configuración de límites y modo (free/paid) por API"""
    __tablename__ = "api_usage_config"

    id = Column(Integer, primary_key=True, index=True)
    api_name = Column(String(50), nullable=False, unique=True)

    # Modo de operación
    is_paid_tier = Column(Boolean, default=False)  # False = Free tier, True = Paid tier

    # Límites del Free Tier
    free_daily_limit = Column(Integer, default=0)
    free_monthly_limit = Column(Integer, default=0)

    # Costos del Paid Tier (en USD)
    cost_per_call = Column(Numeric(10, 6), default=0)  # Para APIs que cobran por llamada
    cost_per_1m_tokens_input = Column(Numeric(10, 4), default=0)  # Para Gemini
    cost_per_1m_tokens_output = Column(Numeric(10, 4), default=0)  # Para Gemini

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
