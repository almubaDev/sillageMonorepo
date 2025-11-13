from sqlalchemy import Column, Integer, String, Table, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


# Tabla de asociación para la relación muchos a muchos entre User y Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)


class Role(Base):
    """Modelo de Rol para el sistema de permisos"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    permissions = Column(JSON, nullable=False, default=list)  # Lista de permisos como strings

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    users = relationship("User", secondary=user_roles, back_populates="roles")


class AdminLog(Base):
    """Modelo para registrar acciones administrativas"""
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, GIFT, etc.
    resource = Column(String(50), nullable=False)  # users, perfumes, consultations, etc.
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # Detalles adicionales de la acción
    ip_address = Column(String(45), nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación con el admin que realizó la acción
    admin = relationship("User", foreign_keys=[admin_id])


class GiftedConsultation(Base):
    """Modelo para registrar consultas regaladas a usuarios"""
    __tablename__ = "gifted_consultations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    user = relationship("User", foreign_keys=[user_id], backref="gifted_consultations")
    admin = relationship("User", foreign_keys=[admin_id])
