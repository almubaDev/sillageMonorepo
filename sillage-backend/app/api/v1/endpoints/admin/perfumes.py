from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_

from app.api.deps import get_db
from app.models.user import User
from app.models.perfume import Perfume
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin,
    log_admin_action
)
from app.schemas.admin import (
    PerfumeAdminCreate,
    PerfumeAdminUpdate,
    PerfumeBulkImport,
    PerfumeBulkImportResponse,
    PaginatedResponse
)
from app.schemas.perfume import PerfumeResponse

router = APIRouter(prefix="/admin/perfumes", tags=["Admin - Perfumes"])


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_READ))])
async def list_perfumes(
    search: Optional[str] = Query(None, description="Buscar por nombre o marca"),
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Límite de registros"),
    order_by: str = Query("created_at", regex="^(created_at|nombre|marca)$"),
    order_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Listar todos los perfumes con paginación.
    Requiere permiso: PERFUMES_READ
    """
    # Construir query base
    stmt = select(Perfume)

    # Aplicar filtro de búsqueda
    if search:
        search_filter = or_(
            Perfume.nombre.ilike(f"%{search}%"),
            Perfume.marca.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)

    # Contar total
    count_stmt = select(func.count()).select_from(Perfume)
    if search:
        count_stmt = count_stmt.where(search_filter)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Aplicar ordenamiento
    order_column = getattr(Perfume, order_by)
    if order_dir == "desc":
        stmt = stmt.order_by(order_column.desc())
    else:
        stmt = stmt.order_by(order_column.asc())

    # Aplicar paginación
    stmt = stmt.offset(skip).limit(limit)

    # Ejecutar query
    result = await db.execute(stmt)
    perfumes = result.scalars().all()

    return PaginatedResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=[PerfumeResponse.model_validate(perfume) for perfume in perfumes]
    )


@router.get("/{perfume_id}", response_model=PerfumeResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_READ))])
async def get_perfume_detail(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener detalles de un perfume específico.
    Requiere permiso: PERFUMES_READ
    """
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    return PerfumeResponse.model_validate(perfume)


@router.post("", response_model=PerfumeResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def create_perfume(
    perfume_data: PerfumeAdminCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Crear un nuevo perfume.
    Requiere permiso: PERFUMES_WRITE
    """
    # Verificar si ya existe un perfume con el mismo nombre y marca
    stmt = select(Perfume).where(
        and_(
            Perfume.nombre == perfume_data.nombre,
            Perfume.marca == perfume_data.marca
        )
    )
    result = await db.execute(stmt)
    existing_perfume = result.scalar_one_or_none()

    if existing_perfume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un perfume con el nombre '{perfume_data.nombre}' de la marca '{perfume_data.marca}'"
        )

    # Crear perfume - usar campos directos del modelo
    new_perfume = Perfume(
        nombre=perfume_data.nombre,
        marca=perfume_data.marca,
        perfumista=perfume_data.perfumista,
        notas=perfume_data.notas,  # Ya es dict o lista según schema
        acordes=perfume_data.acordes,  # Ya es lista según schema
        is_private=perfume_data.is_private,
        created_by=current_user.id
    )

    db.add(new_perfume)
    await db.commit()
    await db.refresh(new_perfume)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="CREATE",
        resource="perfumes",
        resource_id=new_perfume.id,
        details={"nombre": perfume_data.nombre, "marca": perfume_data.marca},
        ip_address=request.client.host if request.client else None
    )

    return PerfumeResponse.model_validate(new_perfume)


@router.post("/bulk", response_model=PerfumeBulkImportResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def bulk_import_perfumes(
    bulk_data: PerfumeBulkImport,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Importar múltiples perfumes en lote.
    Requiere permiso: PERFUMES_WRITE
    """
    success_count = 0
    error_count = 0
    errors = []
    created_ids = []

    for idx, perfume_data in enumerate(bulk_data.perfumes):
        try:
            # Verificar si ya existe
            stmt = select(Perfume).where(
                and_(
                    Perfume.nombre == perfume_data.nombre,
                    Perfume.marca == perfume_data.marca
                )
            )
            result = await db.execute(stmt)
            existing_perfume = result.scalar_one_or_none()

            if existing_perfume:
                error_count += 1
                errors.append({
                    "index": idx,
                    "nombre": perfume_data.nombre,
                    "marca": perfume_data.marca,
                    "error": "Ya existe"
                })
                continue

            # Crear perfume - usar campos directos del modelo
            new_perfume = Perfume(
                nombre=perfume_data.nombre,
                marca=perfume_data.marca,
                perfumista=perfume_data.perfumista,
                notas=perfume_data.notas,
                acordes=perfume_data.acordes,
                is_private=perfume_data.is_private,
                created_by=current_user.id
            )

            db.add(new_perfume)
            await db.flush()  # Para obtener el ID sin hacer commit
            created_ids.append(new_perfume.id)
            success_count += 1

        except Exception as e:
            error_count += 1
            errors.append({
                "index": idx,
                "nombre": perfume_data.nombre,
                "marca": perfume_data.marca,
                "error": str(e)
            })

    # Hacer commit de todos los cambios exitosos
    await db.commit()

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="BULK_CREATE",
        resource="perfumes",
        details={
            "total": len(bulk_data.perfumes),
            "success": success_count,
            "errors": error_count
        },
        ip_address=request.client.host if request.client else None
    )

    return PerfumeBulkImportResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors,
        created_ids=created_ids
    )


@router.put("/{perfume_id}", response_model=PerfumeResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def update_perfume(
    perfume_id: int,
    perfume_update: PerfumeAdminUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Actualizar un perfume existente.
    Requiere permiso: PERFUMES_WRITE
    """
    # Buscar perfume
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    # Actualizar campos - usar campos del modelo base
    if perfume_update.nombre is not None:
        perfume.nombre = perfume_update.nombre
    if perfume_update.marca is not None:
        perfume.marca = perfume_update.marca
    if perfume_update.perfumista is not None:
        perfume.perfumista = perfume_update.perfumista
    if perfume_update.notas is not None:
        perfume.notas = perfume_update.notas
    if perfume_update.acordes is not None:
        perfume.acordes = perfume_update.acordes
    if perfume_update.is_private is not None:
        perfume.is_private = perfume_update.is_private

    await db.commit()
    await db.refresh(perfume)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="UPDATE",
        resource="perfumes",
        resource_id=perfume_id,
        details=perfume_update.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None
    )

    return PerfumeResponse.model_validate(perfume)


@router.delete("/{perfume_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission(Permission.PERFUMES_DELETE))])
async def delete_perfume(
    perfume_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Eliminar un perfume.
    Requiere permiso: PERFUMES_DELETE
    """
    # Buscar perfume
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    # Registrar acción antes de eliminar
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="DELETE",
        resource="perfumes",
        resource_id=perfume_id,
        details={"nombre": perfume.nombre, "marca": perfume.marca},
        ip_address=request.client.host if request.client else None
    )

    # Eliminar perfume
    await db.delete(perfume)
    await db.commit()

    return None
