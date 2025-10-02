from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Time, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Recomendacion(Base):
    __tablename__ = "recomendaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Usuario
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Información temporal
    fecha_evento = Column(Date, nullable=False)
    hora_evento = Column(Time, nullable=False)
    
    # Ubicación
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    lugar_nombre = Column(String(200))
    lugar_tipo = Column(String(20))  # 'abierto' o 'cerrado'
    lugar_descripcion = Column(String(300))
    
    # Contexto
    ocasion = Column(String(200))
    expectativa = Column(String(200))
    vestimenta = Column(String(200))
    
    # Datos climáticos
    clima_descripcion = Column(String(100))
    temperatura = Column(Float)
    humedad = Column(Float)
    
    # IA
    prompt = Column(Text)
    respuesta_ia = Column(Text)
    
    # Resultado
    perfume_recomendado_id = Column(Integer, ForeignKey("perfumes.id", ondelete="SET NULL"), nullable=True)
    explicacion = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones (se configurarán después)
    # user = relationship("User", back_populates="recomendaciones")
    # perfume_recomendado = relationship("Perfume")