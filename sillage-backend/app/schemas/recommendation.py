# sillage-backend/app/schemas/recommendation.py

from typing import Optional, List
from datetime import date, time, datetime
from pydantic import BaseModel, Field, validator
from app.i18n.config import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE


class RecommendationRequest(BaseModel):
    """Request para crear una recomendación"""
    fecha_evento: date
    hora_evento: time
    latitud: float
    longitud: float
    lugar_nombre: str = Field(..., max_length=200)
    lugar_tipo: str = Field(..., pattern="^(abierto|cerrado)$")
    lugar_descripcion: Optional[str] = Field(None, max_length=300)
    ocasion: str = Field(..., max_length=200)
    expectativa: str = Field(..., max_length=200)
    vestimenta: str = Field(..., max_length=200)
    idioma: Optional[str] = Field(default=DEFAULT_LANGUAGE)  # Idioma preferido del usuario

    @validator('fecha_evento')
    def validate_fecha(cls, v):
        from datetime import date, timedelta
        today = date.today()
        max_date = today + timedelta(days=5)

        if v < today:
            raise ValueError('La fecha no puede ser anterior a hoy')
        if v > max_date:
            raise ValueError('Solo puedes solicitar recomendaciones para los próximos 5 días')

        return v

    @validator('idioma')
    def validate_idioma(cls, v):
        """Valida que el idioma esté soportado dinámicamente"""
        if v and v not in SUPPORTED_LANGUAGES:
            raise ValueError(f'Idioma no soportado. Idiomas disponibles: {", ".join(SUPPORTED_LANGUAGES)}')
        return v or DEFAULT_LANGUAGE


class PerfumeRecomendado(BaseModel):
    """Perfume recomendado simplificado"""
    id: int
    nombre: str
    marca: str
    perfumistas: Optional[List[str]] = None
    notas: Optional[List[str]] = None
    acordes: Optional[List[str]] = None

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    """Response de una recomendación"""
    id: int
    fecha_evento: date
    hora_evento: time
    lugar_nombre: str
    lugar_tipo: str
    ocasion: str
    expectativa: str
    vestimenta: str
    clima_descripcion: Optional[str] = None
    temperatura: Optional[float] = None
    humedad: Optional[float] = None
    perfume_recomendado_id: Optional[int] = None
    perfume_recomendado: Optional[PerfumeRecomendado] = None
    explicacion: Optional[str] = None
    respuesta_ia: Optional[str] = None
    created_at: Optional[datetime] = None
    consultas_restantes: Optional[int] = None
    prompt_enviado: Optional[str] = None  # Prompt completo enviado a Gemini (para debug)

    class Config:
        from_attributes = True