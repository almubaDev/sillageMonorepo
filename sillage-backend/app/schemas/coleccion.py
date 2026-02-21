from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


# --- Reposicion ---

class ReposicionBase(BaseModel):
    cantidad_ml: int = Field(..., ge=1)
    costo: Decimal = Field(default=Decimal("0"), ge=0)


class ReposicionCreate(ReposicionBase):
    pass


class ReposicionResponse(ReposicionBase):
    id: int
    perfume_coleccion_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Coleccion ---

class ColeccionBase(BaseModel):
    nombre: str = Field(default="Mi Coleccion", max_length=200)
    es_publica: bool = Field(default=True)


class ColeccionResponse(ColeccionBase):
    id: int
    usuario_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ColeccionWithStats(ColeccionResponse):
    perfumes_count: int = 0
    inversion_total: Decimal = Decimal("0")


# --- PerfumeColeccion ---

class PerfumeColeccionBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    marca: str = Field(default="", max_length=200)
    perfumista: Optional[str] = Field(default="", max_length=500)
    acordes: Optional[List[str]] = Field(default_factory=list)
    notas: Optional[List[str]] = Field(default_factory=list)
    familia_olfativa: Optional[str] = Field(default="", max_length=200)
    concentracion: Optional[str] = Field(default="", max_length=100)
    momento_dia: Optional[str] = Field(default="", max_length=20)
    estacion: Optional[str] = Field(default="", max_length=60)
    cantidad_ml: int = Field(default=1, ge=1)
    precio: Optional[Decimal] = Field(default=None, ge=0)
    calificacion: Optional[Decimal] = Field(default=None, ge=Decimal("0.5"), le=Decimal("10"))
    imagen: Optional[str] = Field(default="", max_length=500)

    @field_validator('momento_dia')
    @classmethod
    def validate_momento_dia(cls, v):
        if v:
            valid = {'dia', 'noche'}
            parts = [p.strip() for p in v.split(',') if p.strip()]
            for p in parts:
                if p not in valid:
                    raise ValueError(f'Valor invalido para momento_dia: {p}')
        return v

    @field_validator('estacion')
    @classmethod
    def validate_estacion(cls, v):
        if v:
            valid = {'verano', 'otono', 'invierno', 'primavera'}
            parts = [p.strip() for p in v.split(',') if p.strip()]
            for p in parts:
                if p not in valid:
                    raise ValueError(f'Valor invalido para estacion: {p}')
        return v


class PerfumeColeccionCreate(PerfumeColeccionBase):
    pass


class PerfumeColeccionUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    marca: Optional[str] = Field(None, max_length=200)
    perfumista: Optional[str] = Field(None, max_length=500)
    acordes: Optional[List[str]] = None
    notas: Optional[List[str]] = None
    familia_olfativa: Optional[str] = Field(None, max_length=200)
    concentracion: Optional[str] = Field(None, max_length=100)
    momento_dia: Optional[str] = Field(None, max_length=20)
    estacion: Optional[str] = Field(None, max_length=60)
    cantidad_ml: Optional[int] = Field(None, ge=1)
    precio: Optional[Decimal] = Field(None, ge=0)
    calificacion: Optional[Decimal] = Field(None, ge=Decimal("0.5"), le=Decimal("10"))
    imagen: Optional[str] = Field(None, max_length=500)

    @field_validator('momento_dia')
    @classmethod
    def validate_momento_dia(cls, v):
        if v is not None and v:
            valid = {'dia', 'noche'}
            parts = [p.strip() for p in v.split(',') if p.strip()]
            for p in parts:
                if p not in valid:
                    raise ValueError(f'Valor invalido para momento_dia: {p}')
        return v

    @field_validator('estacion')
    @classmethod
    def validate_estacion(cls, v):
        if v is not None and v:
            valid = {'verano', 'otono', 'invierno', 'primavera'}
            parts = [p.strip() for p in v.split(',') if p.strip()]
            for p in parts:
                if p not in valid:
                    raise ValueError(f'Valor invalido para estacion: {p}')
        return v


# --- Import ---

class PerfumeImportItem(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    marca: str = Field(default="", max_length=200)
    perfumistas: Optional[List[str]] = Field(default_factory=list)
    acordes: Optional[List[str]] = Field(default_factory=list)
    notas: Optional[List[str]] = Field(default_factory=list)
    familia_olfativa: Optional[str] = Field(default="", max_length=200)
    concentracion: Optional[str] = Field(default="", max_length=100)
    momento_dia: Optional[str] = Field(default="", max_length=20)
    estacion: Optional[str] = Field(default="", max_length=60)
    cantidad_ml: int = Field(default=1, ge=1)
    precio: Optional[Decimal] = Field(default=None, ge=0)
    calificacion: Optional[Decimal] = Field(default=None, ge=Decimal("0.5"), le=Decimal("10"))
    imagen: Optional[str] = Field(default="", max_length=500)
    reposiciones: Optional[List[ReposicionBase]] = Field(default_factory=list)


class ImportColeccionRequest(BaseModel):
    perfumes: List[PerfumeImportItem]


class ImportColeccionResponse(BaseModel):
    imported: int
    message: str


class PerfumeColeccionResponse(PerfumeColeccionBase):
    id: int
    coleccion_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    reposiciones: List[ReposicionResponse] = []

    class Config:
        from_attributes = True
