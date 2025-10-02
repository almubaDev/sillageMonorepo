from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Suscripcion(Base):
    __tablename__ = "suscripciones"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Usuario (relación uno a uno)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Estado
    activo = Column(Boolean, default=False)
    estado = Column(String(20), default='pendiente')  # pendiente, activa, cancelada, expirada
    
    # Fechas
    fecha_inicio = Column(DateTime(timezone=True))
    fecha_expiracion = Column(DateTime(timezone=True))
    fecha_ultima_renovacion = Column(DateTime(timezone=True))
    
    # Información de pago
    origen_pago = Column(String(50))  # Flow, PayPal, etc
    referencia_pago = Column(String(100))
    monto = Column(Numeric(10, 2), default=0.0)
    moneda = Column(String(3), default='CLP')
    
    # Flow específico
    flow_customer_id = Column(String(100), nullable=True)
    renovacion_automatica = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones (se configurarán después)
    # user = relationship("User", back_populates="suscripcion", uselist=False)


class HistorialPago(Base):
    __tablename__ = "historial_pagos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Referencias
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    suscripcion_id = Column(Integer, ForeignKey("suscripciones.id", ondelete="SET NULL"), nullable=True)
    
    # Información del pago
    fecha_pago = Column(DateTime(timezone=True), server_default=func.now())
    monto = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(3), default='CLP')
    metodo_pago = Column(String(50))
    referencia = Column(String(255))
    estado = Column(String(20))  # pendiente, completado, fallido, reembolsado
    notas = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones (se configurarán después)
    # user = relationship("User", back_populates="pagos")
    # suscripcion = relationship("Suscripcion", back_populates="pagos")