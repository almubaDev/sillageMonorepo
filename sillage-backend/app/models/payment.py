"""
Modelos para sistema de pagos y consultas
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import uuid
from app.core.database import Base


class MetodoPago(Base):
    """
    Métodos de pago disponibles (PayPal, Flow, Stripe, etc.)
    """
    __tablename__ = "metodos_pago"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)  # "PayPal"
    codigo = Column(String(20), unique=True, nullable=False)  # "paypal"
    descripcion = Column(Text, nullable=True)
    icono = Column(String(50), nullable=True)  # Clase CSS del ícono
    color_boton = Column(String(7), default='#007cba')  # Color hex
    paises_soportados = Column(JSON, default=list)  # ["US", "CL", "MX", "GLOBAL"]
    activo = Column(Boolean, default=True)
    orden = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    botones_pago = relationship("BotonPago", back_populates="metodo_pago", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MetodoPago {self.nombre}>"

    def soporta_pais(self, codigo_pais: str) -> bool:
        """Verificar si el método soporta un país específico"""
        if not self.paises_soportados:
            return False
        return 'GLOBAL' in self.paises_soportados or codigo_pais in self.paises_soportados


class PaqueteConsultas(Base):
    """
    Paquetes de consultas que los usuarios pueden comprar
    """
    __tablename__ = "paquetes_consultas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)  # "Paquete Básico"
    descripcion = Column(Text, nullable=True)
    cantidad_consultas = Column(Integer, nullable=False)  # 10 consultas
    precio = Column(Numeric(10, 2), nullable=False)  # 9.99
    precio_anterior = Column(Numeric(10, 2), nullable=True)  # 14.99 (para mostrar descuento)
    moneda = Column(String(3), default='USD')  # USD, CLP, EUR
    destacado = Column(Boolean, default=False)  # "Más Popular"
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    botones_pago = relationship("BotonPago", back_populates="paquete", cascade="all, delete-orphan")
    pagos = relationship("PagoConsultas", back_populates="paquete_consultas")
    transacciones = relationship("TransaccionConsultas", back_populates="paquete_consultas")

    def __repr__(self):
        return f"<PaqueteConsultas {self.nombre} - {self.cantidad_consultas} consultas>"

    @property
    def precio_por_consulta(self) -> float:
        """Calcular precio unitario por consulta"""
        if self.cantidad_consultas > 0:
            return round(float(self.precio) / self.cantidad_consultas, 2)
        return 0.0

    @property
    def tiene_descuento(self) -> bool:
        """Verificar si tiene precio anterior (descuento)"""
        return self.precio_anterior and float(self.precio_anterior) > float(self.precio)

    @property
    def porcentaje_descuento(self) -> int:
        """Calcular porcentaje de descuento"""
        if self.tiene_descuento:
            descuento = ((float(self.precio_anterior) - float(self.precio)) / float(self.precio_anterior)) * 100
            return round(descuento)
        return 0


class BotonPago(Base):
    """
    Botón de pago específico para un paquete y método de pago
    """
    __tablename__ = "botones_pago"

    id = Column(Integer, primary_key=True, index=True)
    paquete_id = Column(Integer, ForeignKey("paquetes_consultas.id", ondelete="CASCADE"), nullable=False)
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id", ondelete="CASCADE"), nullable=False)
    url_base = Column(String(255), nullable=True)  # URL específica si es necesario
    parametros_adicionales = Column(JSON, default=dict)  # Parámetros extra
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    paquete = relationship("PaqueteConsultas", back_populates="botones_pago")
    metodo_pago = relationship("MetodoPago", back_populates="botones_pago")
    pagos = relationship("PagoConsultas", back_populates="boton_pago")

    def __repr__(self):
        return f"<BotonPago {self.metodo_pago.nombre} - {self.paquete.nombre}>"

    def es_disponible_para_pais(self, codigo_pais: str) -> bool:
        """Verificar si el botón está disponible para un país"""
        return self.activo and self.metodo_pago.activo and self.metodo_pago.soporta_pais(codigo_pais)


class PagoConsultas(Base):
    """
    Registro de cada pago de consultas realizado
    MODELO CENTRAL del sistema de pagos
    """
    __tablename__ = "pagos_consultas"

    ESTADO_CHOICES = ['pendiente', 'completado', 'fallido', 'reembolsado']

    id = Column(Integer, primary_key=True, index=True)

    # Referencias
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    paquete_consultas_id = Column(Integer, ForeignKey("paquetes_consultas.id", ondelete="CASCADE"), nullable=False)
    boton_pago_id = Column(Integer, ForeignKey("botones_pago.id", ondelete="SET NULL"), nullable=True)

    # Información del pago
    monto = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(3), default='USD')
    estado = Column(String(20), default='pendiente')  # pendiente, completado, fallido, reembolsado
    metodo_pago = Column(String(50), nullable=True)  # "paypal"

    # Identificadores únicos
    referencia_externa = Column(String(200), nullable=True)  # ID de PayPal si lo envía
    custom_id = Column(String(20), unique=True, nullable=False, index=True)  # SILL-XXXXXXXXXXXX

    # Metadata
    datos_pago = Column(JSON, default=dict)  # Información adicional

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    user = relationship("User", backref="pagos_consultas")
    paquete_consultas = relationship("PaqueteConsultas", back_populates="pagos")
    boton_pago = relationship("BotonPago", back_populates="pagos")

    def __repr__(self):
        return f"<PagoConsultas {self.custom_id} - {self.estado} - ${self.monto}>"

    @staticmethod
    def generar_custom_id() -> str:
        """Generar custom_id único para el pago"""
        # Formato: SILL-{12 caracteres hexadecimales}
        # Ejemplo: SILL-A1B2C3D4E5F6
        return f"SILL-{uuid.uuid4().hex[:12].upper()}"


class TransaccionConsultas(Base):
    """
    Registro de auditoría de todos los movimientos de consultas
    """
    __tablename__ = "transacciones_consultas"

    TIPO_CHOICES = ['compra', 'uso', 'regalo', 'reembolso', 'expiracion']

    id = Column(Integer, primary_key=True, index=True)

    # Referencias
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    paquete_consultas_id = Column(Integer, ForeignKey("paquetes_consultas.id", ondelete="SET NULL"), nullable=True)

    # Información de la transacción
    tipo = Column(String(20), nullable=False)  # compra, uso, regalo, reembolso, expiracion
    cantidad = Column(Integer, nullable=False)  # Positivo para compra/regalo, negativo para uso
    descripcion = Column(Text, nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    user = relationship("User", backref="transacciones_consultas")
    paquete_consultas = relationship("PaqueteConsultas", back_populates="transacciones")

    def __repr__(self):
        return f"<TransaccionConsultas {self.tipo} - {self.cantidad} consultas - {self.user.email}>"
