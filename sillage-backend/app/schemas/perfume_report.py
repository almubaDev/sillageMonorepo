from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PerfumeReportCreate(BaseModel):
    """Schema para crear un reporte de perfume"""
    nombre: str = Field(..., min_length=2, max_length=255, description="Nombre del perfume")
    marca: str = Field(..., min_length=2, max_length=255, description="Marca del perfume")


class PerfumeReportResponse(BaseModel):
    """Schema para respuesta de reporte de perfume"""
    id: int
    nombre: str
    marca: str
    user_id: int
    created_at: datetime

    # Información del usuario que reportó
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
