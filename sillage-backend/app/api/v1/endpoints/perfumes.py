from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.perfume import Perfume, perfume_collection
from app.schemas.perfume import Perfume as PerfumeSchema, PerfumeCreate
from typing import List, Optional

router = APIRouter()


@router.get("/search", response_model=List[PerfumeSchema])
async def search_perfumes(
    q: Optional[str] = Query(None, description="Búsqueda por nombre"),
    marca: Optional[str] = Query(None, description="Filtrar por marca"),
    acorde: Optional[str] = Query(None, description="Filtrar por acorde"),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Buscar perfumes en la base de datos"""
    query = select(Perfume)
    
    # Aplicar filtros
    conditions = []
    if q:
        conditions.append(
            or_(
                Perfume.nombre.ilike(f"%{q}%"),
                Perfume.marca.ilike(f"%{q}%")
            )
        )
    if marca:
        conditions.append(Perfume.marca.ilike(f"%{marca}%"))
    if acorde:
        conditions.append(Perfume.acordes.contains([acorde]))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/collection")
async def get_my_collection(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener la colección de perfumes del usuario"""
    query = select(
        Perfume,
        perfume_collection.c.added_at
    ).join(
        perfume_collection,
        and_(
            perfume_collection.c.perfume_id == Perfume.id,
            perfume_collection.c.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    perfumes = []
    for perfume, added_at in result:
        perfume_dict = {
            "id": perfume.id,
            "nombre": perfume.nombre,
            "marca": perfume.marca,
            "perfumista": perfume.perfumista,
            "notas": perfume.notas,
            "acordes": perfume.acordes,
            "created_at": perfume.created_at,
            "updated_at": perfume.updated_at,
            "added_at": added_at
        }
        perfumes.append(perfume_dict)
    
    return perfumes


@router.post("/collection/{perfume_id}")
async def add_to_collection(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Agregar un perfume a mi colección"""
    # Verificar que el perfume existe
    result = await db.execute(select(Perfume).where(Perfume.id == perfume_id))
    perfume = result.scalar_one_or_none()
    
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")
    
    # Verificar si ya está en la colección
    existing = await db.execute(
        select(perfume_collection).where(
            and_(
                perfume_collection.c.user_id == current_user.id,
                perfume_collection.c.perfume_id == perfume_id
            )
        )
    )
    
    if existing.first():
        raise HTTPException(status_code=400, detail="El perfume ya está en tu colección")
    
    # Agregar a la colección
    await db.execute(
        perfume_collection.insert().values(
            user_id=current_user.id,
            perfume_id=perfume_id,
            added_at=datetime.utcnow()
        )
    )
    await db.commit()
    
    return {"message": "Perfume agregado a tu colección"}


@router.delete("/collection/{perfume_id}")
async def remove_from_collection(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Eliminar un perfume de mi colección"""
    result = await db.execute(
        perfume_collection.delete().where(
            and_(
                perfume_collection.c.user_id == current_user.id,
                perfume_collection.c.perfume_id == perfume_id
            )
        )
    )
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Perfume no encontrado en tu colección")
    
    return {"message": "Perfume eliminado de tu colección"}


@router.post("/", response_model=PerfumeSchema)
async def create_perfume(
    perfume_data: PerfumeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crear un nuevo perfume y agregarlo a la colección"""
    # Crear el perfume
    new_perfume = Perfume(**perfume_data.dict())
    db.add(new_perfume)
    await db.flush()  # Para obtener el ID
    
    # Agregarlo automáticamente a la colección del usuario
    await db.execute(
        perfume_collection.insert().values(
            user_id=current_user.id,
            perfume_id=new_perfume.id,
            added_at=datetime.utcnow()
        )
    )
    
    await db.commit()
    await db.refresh(new_perfume)
    
    return new_perfume