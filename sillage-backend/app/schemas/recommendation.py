from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, Field, validator


class RecommendationRequest(BaseModel):
    fecha_evento: date
    hora_evento: time
    latitud: float
    longitud: float
    lugar_nombre: str = Field(..., max_length=200)
    lugar_tipo: str = Field(..., pattern="^(abierto|cerrado)$")
    lugar_descripcion: str = Field(..., max_length=300)
    ocasion: str = Field(..., max_length=200)
    expectativa: str = Field(..., max_length=200)
    vestimenta: str = Field(..., max_length=200)
    
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


class RecommendationResponse(BaseModel):
    id: int
    fecha_evento: date
    hora_evento: time
    lugar_nombre: str
    ocasion: str
    expectativa: str
    vestimenta: str
    clima_descripcion: str
    temperatura: float
    humedad: float
    perfume_recomendado_id: Optional[int]
    perfume_recomendado: Optional[dict]
    explicacion: Optional[str]
    respuesta_ia: str
    created_at: datetime
    
    class Config:
        from_attributes = True