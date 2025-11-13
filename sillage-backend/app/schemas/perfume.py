from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class PerfumeBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    marca: str = Field(..., max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: Optional[Dict[str, List[str]] | List[str]] = Field(default=None)
    acordes: Optional[List[str]] = Field(default=None)


class PerfumeCreate(PerfumeBase):
    is_private: bool = Field(default=False)
    # created_by se establece automáticamente desde el usuario autenticado


class PerfumeUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=200)
    marca: Optional[str] = Field(None, max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: Optional[Dict[str, List[str]] | List[str]] = None
    acordes: Optional[List[str]] = None
    is_private: Optional[bool] = None


class PerfumeInDB(PerfumeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    is_private: bool = False
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class Perfume(PerfumeInDB):
    pass


class PerfumeResponse(PerfumeInDB):
    """Schema de respuesta para perfumes"""
    pass


class PerfumeCollection(BaseModel):
    perfume: Perfume
    added_at: datetime

    class Config:
        from_attributes = True