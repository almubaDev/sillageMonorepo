from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime
import secrets
import string

from app.api.deps import get_db
from app.models.user import User
from app.models.coupon import Coupon, CouponBatch, CouponType
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin,
    log_admin_action
)
from app.schemas.coupon import (
    CouponBatchCreate,
    CouponBatchResponse,
    CouponBatchWithCoupons,
    CouponResponse,
    CouponBatchListResponse,
    CouponStats
)

router = APIRouter(prefix="/admin/coupons", tags=["Admin - Coupons"])


def generate_coupon_code(length: int = 12) -> str:
    """Genera un código de cupón aleatorio"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


@router.post("/batches", response_model=CouponBatchResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.COUPONS_CREATE))])
async def create_coupon_batch(
    batch_data: CouponBatchCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Crear un lote de cupones.
    Requiere permiso: COUPONS_CREATE
    """
    # Validar fecha de expiración para multi-uso
    if batch_data.type == CouponType.MULTI_USE:
        if not batch_data.expiration_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los cupones multi-uso requieren fecha de expiración"
            )
        if batch_data.expiration_date <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha de expiración debe ser futura"
            )

    # Crear el lote
    new_batch = CouponBatch(
        title=batch_data.title,
        type=batch_data.type,
        consultations_amount=batch_data.consultations_amount,
        total_coupons=batch_data.total_coupons,
        created_by=current_user.id,
        expiration_date=batch_data.expiration_date
    )

    db.add(new_batch)
    await db.flush()  # Para obtener el ID del batch

    # Generar cupones individuales
    coupons = []
    for i in range(batch_data.total_coupons):
        # Para multi-uso con código personalizado, usar el código personalizado
        if batch_data.type == CouponType.MULTI_USE and batch_data.custom_code:
            code = batch_data.custom_code.upper()
            # Verificar que no exista
            existing = await db.execute(select(Coupon).where(Coupon.code == code))
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El código '{code}' ya existe. Por favor elige otro código."
                )
        else:
            # Generar código único aleatorio
            while True:
                code = generate_coupon_code()
                # Verificar que no exista
                existing = await db.execute(select(Coupon).where(Coupon.code == code))
                if not existing.scalar_one_or_none():
                    break

        coupon = Coupon(
            code=code,
            batch_id=new_batch.id
        )
        coupons.append(coupon)

    db.add_all(coupons)
    await db.commit()
    await db.refresh(new_batch)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="CREATE_COUPON_BATCH",
        resource="coupons",
        resource_id=new_batch.id,
        details={
            "title": batch_data.title,
            "type": batch_data.type,
            "total_coupons": batch_data.total_coupons,
            "consultations_amount": batch_data.consultations_amount
        },
        ip_address=request.client.host if request.client else None
    )

    # Calcular used_count y available_count
    response = CouponBatchResponse.model_validate(new_batch)
    response.used_count = 0
    response.available_count = batch_data.total_coupons

    return response


@router.get("/batches", response_model=CouponBatchListResponse, dependencies=[Depends(require_permission(Permission.COUPONS_READ))])
async def list_coupon_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Listar lotes de cupones.
    Requiere permiso: COUPONS_READ
    """
    # Query base
    stmt = select(CouponBatch).order_by(CouponBatch.created_at.desc())

    # Contar total
    count_stmt = select(func.count()).select_from(CouponBatch)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Aplicar paginación
    stmt = stmt.offset(skip).limit(limit)

    # Ejecutar query
    result = await db.execute(stmt)
    batches = result.scalars().all()

    # Enriquecer con contadores
    items = []
    for batch in batches:
        # Contar cupones usados
        used_stmt = select(func.count()).select_from(Coupon).where(
            and_(Coupon.batch_id == batch.id, Coupon.is_used == True)
        )
        used_result = await db.execute(used_stmt)
        used_count = used_result.scalar_one()

        batch_response = CouponBatchResponse.model_validate(batch)
        batch_response.used_count = used_count
        batch_response.available_count = batch.total_coupons - used_count
        items.append(batch_response)

    return CouponBatchListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/batches/{batch_id}", response_model=CouponBatchWithCoupons, dependencies=[Depends(require_permission(Permission.COUPONS_READ))])
async def get_coupon_batch_detail(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener detalle de un lote con todos sus cupones.
    Requiere permiso: COUPONS_READ
    """
    # Buscar lote
    stmt = select(CouponBatch).where(CouponBatch.id == batch_id)
    result = await db.execute(stmt)
    batch = result.scalar_one_or_none()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de cupones no encontrado"
        )

    # Obtener todos los cupones del lote
    coupons_stmt = select(Coupon).where(Coupon.batch_id == batch_id).order_by(Coupon.created_at.desc())
    coupons_result = await db.execute(coupons_stmt)
    coupons = coupons_result.scalars().all()

    # Contar usados
    used_count = sum(1 for c in coupons if c.is_used)

    # Crear respuesta con from_orm
    batch_dict = {
        "id": batch.id,
        "title": batch.title,
        "type": batch.type,
        "consultations_amount": batch.consultations_amount,
        "total_coupons": batch.total_coupons,
        "created_by": batch.created_by,
        "created_at": batch.created_at,
        "expiration_date": batch.expiration_date,
        "used_count": used_count,
        "available_count": batch.total_coupons - used_count,
        "coupons": [
            {
                "id": c.id,
                "code": c.code,
                "batch_id": c.batch_id,
                "is_used": c.is_used,
                "used_by": c.used_by,
                "used_at": c.used_at,
                "created_at": c.created_at
            }
            for c in coupons
        ]
    }

    return CouponBatchWithCoupons(**batch_dict)


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission(Permission.COUPONS_DELETE))])
async def delete_coupon_batch(
    batch_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Eliminar un lote de cupones completo (incluye todos sus cupones).
    Requiere permiso: COUPONS_DELETE
    """
    # Buscar lote
    stmt = select(CouponBatch).where(CouponBatch.id == batch_id)
    result = await db.execute(stmt)
    batch = result.scalar_one_or_none()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de cupones no encontrado"
        )

    # Registrar acción antes de eliminar
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="DELETE_COUPON_BATCH",
        resource="coupons",
        resource_id=batch_id,
        details={"title": batch.title, "total_coupons": batch.total_coupons},
        ip_address=request.client.host if request.client else None
    )

    # Eliminar lote (los cupones se eliminan en cascada)
    await db.delete(batch)
    await db.commit()

    return None


@router.delete("/coupons/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission(Permission.COUPONS_DELETE))])
async def delete_single_coupon(
    coupon_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Eliminar un cupón individual.
    Requiere permiso: COUPONS_DELETE
    """
    # Buscar cupón
    stmt = select(Coupon).where(Coupon.id == coupon_id)
    result = await db.execute(stmt)
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cupón no encontrado"
        )

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="DELETE_COUPON",
        resource="coupons",
        resource_id=coupon_id,
        details={"code": coupon.code, "batch_id": coupon.batch_id},
        ip_address=request.client.host if request.client else None
    )

    # Actualizar el total_coupons del batch
    batch_stmt = select(CouponBatch).where(CouponBatch.id == coupon.batch_id)
    batch_result = await db.execute(batch_stmt)
    batch = batch_result.scalar_one_or_none()

    if batch:
        batch.total_coupons -= 1

    # Eliminar cupón
    await db.delete(coupon)
    await db.commit()

    return None


@router.get("/stats", response_model=CouponStats, dependencies=[Depends(require_permission(Permission.COUPONS_READ))])
async def get_coupon_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener estadísticas de cupones.
    Requiere permiso: COUPONS_READ
    """
    # Total de lotes
    batches_stmt = select(func.count()).select_from(CouponBatch)
    batches_result = await db.execute(batches_stmt)
    total_batches = batches_result.scalar_one()

    # Total de cupones generados
    coupons_stmt = select(func.count()).select_from(Coupon)
    coupons_result = await db.execute(coupons_stmt)
    total_coupons_generated = coupons_result.scalar_one()

    # Total de cupones usados
    used_stmt = select(func.count()).select_from(Coupon).where(Coupon.is_used == True)
    used_result = await db.execute(used_stmt)
    total_coupons_used = used_result.scalar_one()

    # Total de cupones disponibles
    total_coupons_available = total_coupons_generated - total_coupons_used

    # Total de consultas regaladas mediante cupones
    consultations_stmt = select(
        func.sum(CouponBatch.consultations_amount)
    ).select_from(Coupon).join(
        CouponBatch, Coupon.batch_id == CouponBatch.id
    ).where(Coupon.is_used == True)
    consultations_result = await db.execute(consultations_stmt)
    total_consultations_gifted = consultations_result.scalar_one() or 0

    return CouponStats(
        total_batches=total_batches,
        total_coupons_generated=total_coupons_generated,
        total_coupons_used=total_coupons_used,
        total_coupons_available=total_coupons_available,
        total_consultations_gifted=total_consultations_gifted
    )
