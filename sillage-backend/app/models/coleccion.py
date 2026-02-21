from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Coleccion(Base):
    __tablename__ = "colecciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False, default="Mi Coleccion")
    es_publica = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    usuario = relationship("User", backref="coleccion", uselist=False)
    perfumes = relationship("PerfumeColeccion", back_populates="coleccion", cascade="all, delete-orphan")


class PerfumeColeccion(Base):
    __tablename__ = "perfumes_coleccion"

    id = Column(Integer, primary_key=True, index=True)
    coleccion_id = Column(Integer, ForeignKey("colecciones.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(200), nullable=False, index=True)
    marca = Column(String(200), nullable=False, default="")
    perfumistas = Column(JSON, nullable=True, default=list)

    # JSON arrays
    acordes = Column(JSON, nullable=True, default=list)
    notas = Column(JSON, nullable=True, default=list)

    # Campos descriptivos
    familia_olfativa = Column(String(200), nullable=True, default="")
    concentracion = Column(String(100), nullable=True, default="")
    momento_dia = Column(String(20), nullable=True, default="")       # "dia", "noche", "dia,noche"
    estacion = Column(String(60), nullable=True, default="")          # "verano,otono,invierno,primavera"

    # Campos numericos
    cantidad_ml = Column(Integer, nullable=False, default=1)
    precio = Column(Numeric(10, 2), nullable=True)
    calificacion = Column(Numeric(3, 1), nullable=True)              # 0.5 a 10
    imagen = Column(String(500), nullable=True, default="")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    coleccion = relationship("Coleccion", back_populates="perfumes")
    reposiciones = relationship("Reposicion", back_populates="perfume_coleccion", cascade="all, delete-orphan")


class Reposicion(Base):
    __tablename__ = "reposiciones"

    id = Column(Integer, primary_key=True, index=True)
    perfume_coleccion_id = Column(Integer, ForeignKey("perfumes_coleccion.id", ondelete="CASCADE"), nullable=False)
    cantidad_ml = Column(Integer, nullable=False)
    costo = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    perfume_coleccion = relationship("PerfumeColeccion", back_populates="reposiciones")
