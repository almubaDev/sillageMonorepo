from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class PerfumeBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    marca: str = Field(..., max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: List[str] = Field(default_factory=list)
    acordes: List[str] = Field(default_factory=list)


class PerfumeCreate(PerfumeBase):
    pass


class PerfumeUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=200)
    marca: Optional[str] = Field(None, max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: Optional[List[str]] = None
    acordes: Optional[List[str]] = None


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


class PerfumeCollection(BaseModel):
    perfume: Perfume
    added_at: datetime
    
    class Config:
        from_attributes = True