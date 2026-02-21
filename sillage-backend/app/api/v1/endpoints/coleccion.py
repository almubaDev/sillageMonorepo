from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from decimal import Decimal

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.coleccion import Coleccion, PerfumeColeccion, Reposicion
from app.schemas.coleccion import (
    ColeccionWithStats,
    PerfumeColeccionCreate,
    PerfumeColeccionUpdate,
    PerfumeColeccionResponse,
    ReposicionCreate,
    ReposicionResponse,
)

router = APIRouter()


async def get_or_create_coleccion(db: AsyncSession, user: User) -> Coleccion:
    result = await db.execute(
        select(Coleccion).where(Coleccion.usuario_id == user.id)
    )
    coleccion = result.scalar_one_or_none()
    if not coleccion:
        coleccion = Coleccion(usuario_id=user.id, nombre="Mi Coleccion")
        db.add(coleccion)
        await db.commit()
        await db.refresh(coleccion)
    return coleccion


# GET /coleccion - Stats de la coleccion
@router.get("", response_model=ColeccionWithStats)
async def get_my_coleccion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)

    count_result = await db.execute(
        select(func.count(PerfumeColeccion.id)).where(
            PerfumeColeccion.coleccion_id == coleccion.id
        )
    )
    perfumes_count = count_result.scalar() or 0

    precio_result = await db.execute(
        select(func.coalesce(func.sum(PerfumeColeccion.precio), 0)).where(
            PerfumeColeccion.coleccion_id == coleccion.id
        )
    )
    reposicion_result = await db.execute(
        select(func.coalesce(func.sum(Reposicion.costo), 0))
        .join(PerfumeColeccion)
        .where(PerfumeColeccion.coleccion_id == coleccion.id)
    )
    inversion = Decimal(str(precio_result.scalar())) + Decimal(str(reposicion_result.scalar()))

    return ColeccionWithStats(
        id=coleccion.id,
        usuario_id=coleccion.usuario_id,
        nombre=coleccion.nombre,
        es_publica=coleccion.es_publica,
        created_at=coleccion.created_at,
        perfumes_count=perfumes_count,
        inversion_total=inversion,
    )


# GET /coleccion/perfumes - Listar perfumes con filtros
@router.get("/perfumes", response_model=List[PerfumeColeccionResponse])
async def list_perfumes(
    nombre: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    perfumista: Optional[str] = Query(None),
    familia_olfativa: Optional[str] = Query(None),
    momento_dia: Optional[str] = Query(None),
    estacion: Optional[str] = Query(None),
    precio_max: Optional[float] = Query(None),
    calificacion: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)

    query = (
        select(PerfumeColeccion)
        .options(selectinload(PerfumeColeccion.reposiciones))
        .where(PerfumeColeccion.coleccion_id == coleccion.id)
    )

    if nombre:
        query = query.where(PerfumeColeccion.nombre.ilike(f"%{nombre}%"))
    if marca:
        query = query.where(PerfumeColeccion.marca.ilike(f"%{marca}%"))
    if perfumista:
        query = query.where(PerfumeColeccion.perfumista.ilike(f"%{perfumista}%"))
    if familia_olfativa:
        query = query.where(PerfumeColeccion.familia_olfativa.ilike(f"%{familia_olfativa}%"))

    if momento_dia:
        values = [v.strip() for v in momento_dia.split(",") if v.strip()]
        if values:
            conditions = [PerfumeColeccion.momento_dia.ilike(f"%{v}%") for v in values]
            query = query.where(or_(*conditions))
    if estacion:
        values = [v.strip() for v in estacion.split(",") if v.strip()]
        if values:
            conditions = [PerfumeColeccion.estacion.ilike(f"%{v}%") for v in values]
            query = query.where(or_(*conditions))

    if precio_max is not None:
        query = query.where(PerfumeColeccion.precio <= precio_max)
    if calificacion is not None:
        query = query.where(PerfumeColeccion.calificacion == calificacion)

    query = query.order_by(PerfumeColeccion.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


# POST /coleccion/perfumes - Crear perfume
@router.post("/perfumes", response_model=PerfumeColeccionResponse, status_code=status.HTTP_201_CREATED)
async def create_perfume(
    data: PerfumeColeccionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)

    perfume = PerfumeColeccion(
        coleccion_id=coleccion.id,
        **data.model_dump(),
    )
    db.add(perfume)
    await db.commit()
    await db.refresh(perfume, attribute_names=["reposiciones"])
    return perfume


# GET /coleccion/perfumes/{id} - Detalle perfume
@router.get("/perfumes/{perfume_id}", response_model=PerfumeColeccionResponse)
async def get_perfume(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)
    result = await db.execute(
        select(PerfumeColeccion)
        .options(selectinload(PerfumeColeccion.reposiciones))
        .where(
            PerfumeColeccion.id == perfume_id,
            PerfumeColeccion.coleccion_id == coleccion.id,
        )
    )
    perfume = result.scalar_one_or_none()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")
    return perfume


# PUT /coleccion/perfumes/{id} - Actualizar perfume
@router.put("/perfumes/{perfume_id}", response_model=PerfumeColeccionResponse)
async def update_perfume(
    perfume_id: int,
    data: PerfumeColeccionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)
    result = await db.execute(
        select(PerfumeColeccion)
        .options(selectinload(PerfumeColeccion.reposiciones))
        .where(
            PerfumeColeccion.id == perfume_id,
            PerfumeColeccion.coleccion_id == coleccion.id,
        )
    )
    perfume = result.scalar_one_or_none()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(perfume, field, value)

    await db.commit()
    await db.refresh(perfume, attribute_names=["reposiciones"])
    return perfume


# DELETE /coleccion/perfumes/{id} - Eliminar perfume
@router.delete("/perfumes/{perfume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_perfume(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)
    result = await db.execute(
        select(PerfumeColeccion).where(
            PerfumeColeccion.id == perfume_id,
            PerfumeColeccion.coleccion_id == coleccion.id,
        )
    )
    perfume = result.scalar_one_or_none()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")

    await db.delete(perfume)
    await db.commit()
    return None


# POST /coleccion/perfumes/{id}/reposiciones - Agregar reposicion
@router.post(
    "/perfumes/{perfume_id}/reposiciones",
    response_model=ReposicionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reposicion(
    perfume_id: int,
    data: ReposicionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)
    result = await db.execute(
        select(PerfumeColeccion).where(
            PerfumeColeccion.id == perfume_id,
            PerfumeColeccion.coleccion_id == coleccion.id,
        )
    )
    perfume = result.scalar_one_or_none()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume no encontrado")

    reposicion = Reposicion(
        perfume_coleccion_id=perfume_id,
        **data.model_dump(),
    )
    db.add(reposicion)
    await db.commit()
    await db.refresh(reposicion)
    return reposicion


# DELETE /coleccion/reposiciones/{id} - Eliminar reposicion
@router.delete("/reposiciones/{reposicion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reposicion(
    reposicion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coleccion = await get_or_create_coleccion(db, current_user)
    result = await db.execute(
        select(Reposicion)
        .join(PerfumeColeccion)
        .where(
            Reposicion.id == reposicion_id,
            PerfumeColeccion.coleccion_id == coleccion.id,
        )
    )
    reposicion = result.scalar_one_or_none()
    if not reposicion:
        raise HTTPException(status_code=404, detail="Reposicion no encontrada")

    await db.delete(reposicion)
    await db.commit()
    return None
