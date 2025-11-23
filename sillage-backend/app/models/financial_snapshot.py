# sillage-backend/app/models/financial_snapshot.py
"""
Modelo para snapshots diarios de datos financieros (ingresos, gastos, margen)
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, Date, Numeric, DateTime, UniqueConstraint
from app.core.database import Base


class DailyFinancialSnapshot(Base):
    """
    Snapshot diario de datos financieros.
    Se genera automáticamente (lazy) cuando un admin accede al panel.
    """
    __tablename__ = "daily_financial_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    # Fecha del snapshot (única por día)
    date = Column(Date, nullable=False, unique=True, index=True)

    # Ingresos del día (ventas de paquetes)
    revenue = Column(Numeric(10, 2), default=0)
    transactions_count = Column(Integer, default=0)

    # Gastos de APIs del día
    api_costs_gemini = Column(Numeric(10, 4), default=0)
    api_costs_openweather = Column(Numeric(10, 4), default=0)
    api_costs_google_maps = Column(Numeric(10, 4), default=0)
    api_costs_total = Column(Numeric(10, 4), default=0)

    # Margen (revenue - api_costs_total)
    margin = Column(Numeric(10, 2), default=0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('date', name='unique_snapshot_date'),
    )
