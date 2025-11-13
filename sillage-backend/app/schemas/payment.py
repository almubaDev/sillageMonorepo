"""
Schemas Pydantic para sistema de pagos
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ==================== MÉTODO DE PAGO ====================

class MetodoPagoBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    color_boton: str = "#007cba"
    paises_soportados: List[str] = []
    activo: bool = True
    orden: int = 0


class MetodoPagoCreate(MetodoPagoBase):
    pass


class MetodoPago(MetodoPagoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PAQUETE DE CONSULTAS ====================

class PaqueteConsultasBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cantidad_consultas: int = Field(..., gt=0)
    precio: Decimal = Field(..., gt=0)
    precio_anterior: Optional[Decimal] = None
    moneda: str = "USD"
    destacado: bool = False
    activo: bool = True


class PaqueteConsultasCreate(PaqueteConsultasBase):
    pass


class PaqueteConsultas(PaqueteConsultasBase):
    id: int
    precio_por_consulta: float
    tiene_descuento: bool
    porcentaje_descuento: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== BOTÓN DE PAGO ====================

class BotonPagoBase(BaseModel):
    paquete_id: int
    metodo_pago_id: int
    url_base: Optional[str] = None
    parametros_adicionales: Dict[str, Any] = {}
    activo: bool = True


class BotonPagoCreate(BotonPagoBase):
    pass


class BotonPago(BotonPagoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PAQUETE CON BOTONES (Response completo) ====================

class PaqueteConBotones(PaqueteConsultas):
    """
    Paquete de consultas con sus botones de pago asociados
    """
    botones_pago: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


# ==================== CREAR PAGO ====================

class CrearPagoRequest(BaseModel):
    """Request para generar un pago"""
    paquete_id: int = Field(..., description="ID del paquete de consultas")
    boton_pago_id: int = Field(..., description="ID del botón de pago seleccionado")
    pais_usuario: str = Field(default="US", description="Código del país del usuario (ISO 3166-1 alpha-2)")

    @validator('pais_usuario')
    def validar_pais(cls, v):
        if len(v) != 2:
            raise ValueError('El código de país debe ser de 2 caracteres (ej: US, CL, MX)')
        return v.upper()


class FormularioPago(BaseModel):
    """Datos del formulario HTML para PayPal"""
    action: str
    method: str
    campos: Dict[str, str]


class CrearPagoResponse(BaseModel):
    """Response al crear un pago"""
    success: bool
    tipo: str = "formulario"  # "formulario" o "redirect"
    formulario: Optional[FormularioPago] = None
    redirect_url: Optional[str] = None
    custom_id: str
    paquete_nombre: str
    monto: str
    mensaje: Optional[str] = None


# ==================== VERIFICAR PAGO ====================

class VerificarPagoResponse(BaseModel):
    """Response al verificar un pago"""
    success: bool
    estado: str  # pendiente, completado, fallido
    paquete_nombre: Optional[str] = None
    consultas_agregadas: Optional[int] = None
    consultas_totales: Optional[int] = None
    monto: Optional[str] = None
    fecha_pago: Optional[datetime] = None
    mensaje: Optional[str] = None
    error: Optional[str] = None


# ==================== PAGO DE CONSULTAS ====================

class PagoConsultasBase(BaseModel):
    monto: Decimal
    moneda: str = "USD"
    estado: str = "pendiente"
    metodo_pago: Optional[str] = None


class PagoConsultasCreate(PagoConsultasBase):
    user_id: int
    paquete_consultas_id: int
    boton_pago_id: Optional[int] = None
    custom_id: str
    referencia_externa: Optional[str] = None
    datos_pago: Dict[str, Any] = {}


class PagoConsultas(PagoConsultasBase):
    id: int
    user_id: int
    paquete_consultas_id: int
    boton_pago_id: Optional[int] = None
    custom_id: str
    referencia_externa: Optional[str] = None
    datos_pago: Dict[str, Any] = {}
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== TRANSACCIÓN DE CONSULTAS ====================

class TransaccionConsultasBase(BaseModel):
    tipo: str  # compra, uso, regalo, reembolso, expiracion
    cantidad: int
    descripcion: str


class TransaccionConsultasCreate(TransaccionConsultasBase):
    user_id: int
    paquete_consultas_id: Optional[int] = None


class TransaccionConsultas(TransaccionConsultasBase):
    id: int
    user_id: int
    paquete_consultas_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== LISTADOS ====================

class ListaPaquetesResponse(BaseModel):
    """Response con lista de paquetes y métodos de pago"""
    paquetes: List[PaqueteConBotones]
    metodos_pago: List[MetodoPago]


class MisConsultasResponse(BaseModel):
    """Response con información de consultas del usuario"""
    consultas_disponibles: int
    historial_compras: List[PagoConsultas]
    historial_transacciones: List[TransaccionConsultas]
