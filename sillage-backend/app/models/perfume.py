from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


# Tabla intermedia para la relación muchos a muchos
perfume_collection = Table(
    'perfume_collections',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('perfume_id', Integer, ForeignKey('perfumes.id', ondelete='CASCADE')),
    Column('added_at', DateTime(timezone=True), server_default=func.now()),
    Column('removed_at', DateTime(timezone=True), nullable=True)
)


class Perfume(Base):
    __tablename__ = "perfumes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    marca = Column(String(100), nullable=False, index=True)
    perfumista = Column(String(100), nullable=True)

    # Datos JSON para notas y acordes
    notas = Column(JSON, default=list)
    acordes = Column(JSON, default=list)

    is_private = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones (se configurarán después)
    # users = relationship("User", secondary=perfume_collection, back_populates="perfumes")