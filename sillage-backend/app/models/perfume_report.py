from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base


class PerfumeReport(Base):
    """Modelo para reportes de perfumes faltantes"""
    __tablename__ = "perfume_reports"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    marca = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación con usuario
    user = relationship("User", back_populates="perfume_reports")
