from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db
from app.models.user import User
from app.models.role import GiftedConsultation
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin,
    log_admin_action
)
from app.schemas.admin import (
    GiftConsultationsRequest,
    GiftConsultationsResponse,
    PaginatedResponse
)

router = APIRouter(prefix="/admin/consultations", tags=["Admin - Consultations"])


@router.post("/gift/{user_id}", response_model=GiftConsultationsResponse, dependencies=[Depends(require_permission(Permission.CONSULTATIONS_GIFT))])
async def gift_consultations(
    user_id: int,
    gift_data: GiftConsultationsRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Regalar consultas a un usuario específico.
    Requiere permiso: CONSULTATIONS_GIFT
    """
    # Buscar usuario
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden regalar consultas a un usuario inactivo"
        )

    # Actualizar consultas del usuario
    user.consultas_restantes += gift_data.quantity

    # Crear registro de regalo
    gifted = GiftedConsultation(
        user_id=user_id,
        admin_id=current_user.id,
        quantity=gift_data.quantity,
        reason=gift_data.reason
    )

    db.add(gifted)
    await db.commit()
    await db.refresh(gifted)
    await db.refresh(user)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="GIFT_CONSULTATIONS",
        resource="consultations",
        resource_id=user_id,
        details={
            "quantity": gift_data.quantity,
            "reason": gift_data.reason,
            "new_total": user.consultas_restantes
        },
        ip_address=request.client.host if request.client else None
    )

    response = GiftConsultationsResponse(
        id=gifted.id,
        user_id=user_id,
        admin_id=current_user.id,
        quantity=gift_data.quantity,
        reason=gift_data.reason,
        created_at=gifted.created_at,
        new_total=user.consultas_restantes
    )

    return response


@router.get("/gifted", response_model=PaginatedResponse, dependencies=[Depends(require_permission(Permission.CONSULTATIONS_READ))])
async def list_gifted_consultations(
    user_id: int = Query(None, description="Filtrar por ID de usuario"),
    admin_id: int = Query(None, description="Filtrar por ID de admin que regaló"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Listar historial de consultas regaladas.
    Requiere permiso: CONSULTATIONS_READ
    """
    # Query base
    stmt = select(GiftedConsultation)

    # Aplicar filtros
    if user_id:
        stmt = stmt.where(GiftedConsultation.user_id == user_id)
    if admin_id:
        stmt = stmt.where(GiftedConsultation.admin_id == admin_id)

    # Contar total
    count_stmt = select(func.count()).select_from(GiftedConsultation)
    if user_id:
        count_stmt = count_stmt.where(GiftedConsultation.user_id == user_id)
    if admin_id:
        count_stmt = count_stmt.where(GiftedConsultation.admin_id == admin_id)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Ordenar por fecha descendente
    stmt = stmt.order_by(GiftedConsultation.created_at.desc())

    # Aplicar paginación
    stmt = stmt.offset(skip).limit(limit)

    # Ejecutar query
    result = await db.execute(stmt)
    gifted_consultations = result.scalars().all()

    # Convertir a response (necesitamos cargar info del usuario para new_total)
    responses = []
    for gc in gifted_consultations:
        # Obtener usuario actual para saber su total de consultas
        user_stmt = select(User).where(User.id == gc.user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        responses.append(GiftConsultationsResponse(
            id=gc.id,
            user_id=gc.user_id,
            admin_id=gc.admin_id,
            quantity=gc.quantity,
            reason=gc.reason,
            created_at=gc.created_at,
            new_total=user.consultas_restantes if user else 0
        ))

    return PaginatedResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=responses
    )


@router.get("/stats", dependencies=[Depends(require_permission(Permission.CONSULTATIONS_READ))])
async def consultation_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Estadísticas de consultas regaladas.
    Requiere permiso: CONSULTATIONS_READ
    """
    # Total de consultas regaladas
    total_stmt = select(func.sum(GiftedConsultation.quantity))
    total_result = await db.execute(total_stmt)
    total_gifted = total_result.scalar_one() or 0

    # Número de usuarios que han recibido consultas
    users_stmt = select(func.count(func.distinct(GiftedConsultation.user_id)))
    users_result = await db.execute(users_stmt)
    users_count = users_result.scalar_one() or 0

    # Número de admins que han regalado
    admins_stmt = select(func.count(func.distinct(GiftedConsultation.admin_id)))
    admins_result = await db.execute(admins_stmt)
    admins_count = admins_result.scalar_one() or 0

    # Total de registros de regalo
    records_stmt = select(func.count()).select_from(GiftedConsultation)
    records_result = await db.execute(records_stmt)
    records_count = records_result.scalar_one() or 0

    # Promedio de consultas por regalo
    avg_per_gift = round(total_gifted / records_count, 2) if records_count > 0 else 0

    return {
        "total_consultations_gifted": total_gifted,
        "unique_recipients": users_count,
        "admins_who_gifted": admins_count,
        "total_gift_records": records_count,
        "average_per_gift": avg_per_gift
    }
