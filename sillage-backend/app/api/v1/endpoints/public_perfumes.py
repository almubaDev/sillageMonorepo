from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_

from app.api.deps import get_db
from app.core.config import settings
from app.models.perfume import Perfume
from app.schemas.perfume import Perfume as PerfumeSchema

router = APIRouter()

api_key_header = APIKeyHeader(name="X-API-Key")


async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.PUBLIC_API_KEY:
        raise HTTPException(status_code=403, detail="API key inválida")
    return api_key


@router.get("/", response_model=List[PerfumeSchema])
async def list_perfumes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Listar perfumes públicos con paginación"""
    query = (
        select(Perfume)
        .where(Perfume.is_private.is_(False))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/count")
async def count_perfumes(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Total de perfumes públicos"""
    query = select(func.count(Perfume.id)).where(Perfume.is_private.is_(False))
    result = await db.execute(query)
    return {"total": result.scalar()}


@router.get("/search", response_model=List[PerfumeSchema])
async def search_perfumes(
    q: Optional[str] = Query(None, description="Buscar por nombre o marca"),
    marca: Optional[str] = Query(None, description="Filtrar por marca"),
    acorde: Optional[str] = Query(None, description="Filtrar por acorde"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Buscar perfumes con filtros"""
    query = select(Perfume).where(Perfume.is_private.is_(False))

    if q:
        query = query.where(
            or_(
                Perfume.nombre.ilike(f"%{q}%"),
                Perfume.marca.ilike(f"%{q}%"),
            )
        )
    if marca:
        query = query.where(Perfume.marca.ilike(f"%{marca}%"))
    if acorde:
        query = query.where(Perfume.acordes.contains([acorde]))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/brands")
async def list_brands(
    q: str = Query("", description="Buscar marca"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Listar marcas disponibles"""
    query = select(func.distinct(Perfume.marca)).where(
        Perfume.is_private.is_(False)
    )
    if q.strip():
        query = query.where(Perfume.marca.ilike(f"%{q.strip()}%"))
    query = query.order_by(Perfume.marca).limit(limit)
    result = await db.execute(query)
    return [row[0] for row in result.all()]


@router.get("/acordes")
async def list_acordes(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Listar todos los acordes únicos disponibles"""
    query = select(Perfume.acordes).where(
        and_(
            Perfume.is_private.is_(False),
            Perfume.acordes.isnot(None),
        )
    )
    result = await db.execute(query)
    acordes_set = set()
    for (acordes,) in result.all():
        if isinstance(acordes, list):
            acordes_set.update(acordes)
    return sorted(acordes_set)


@router.get("/{perfume_id}", response_model=PerfumeSchema)
async def get_perfume(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(verify_api_key),
):
    """Obtener un perfume por ID"""
    result = await db.execute(
        select(Perfume).where(
            and_(Perfume.id == perfume_id, Perfume.is_private.is_(False))
        )
    )
    perfume = result.scalar_one_or_none()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")
    return perfume
