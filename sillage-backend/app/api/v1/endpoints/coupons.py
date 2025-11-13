from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.coupon import Coupon, CouponBatch, CouponType
from app.schemas.coupon import CouponRedeemRequest, CouponRedeemResponse

router = APIRouter()


@router.post("/redeem", response_model=CouponRedeemResponse)
async def redeem_coupon(
    redeem_data: CouponRedeemRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Canjear un cupón para obtener consultas gratuitas.
    Requiere autenticación.
    """
    # Buscar cupón por código
    stmt = select(Coupon).where(Coupon.code == redeem_data.code.upper())
    result = await db.execute(stmt)
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cupón no encontrado"
        )

    # Obtener el lote del cupón
    batch_stmt = select(CouponBatch).where(CouponBatch.id == coupon.batch_id)
    batch_result = await db.execute(batch_stmt)
    batch = batch_result.scalar_one_or_none()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de cupón no encontrado"
        )

    # Validar si es de un solo uso y ya fue usado
    if batch.type == CouponType.SINGLE_USE and coupon.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este cupón ya fue utilizado"
        )

    # Validar si es multi-uso y está expirado
    if batch.type == CouponType.MULTI_USE:
        if batch.expiration_date and batch.expiration_date < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este cupón ha expirado"
            )

    # Validar si el usuario ya usó este cupón (para single-use)
    if batch.type == CouponType.SINGLE_USE and coupon.used_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya has utilizado este cupón"
        )

    # Agregar consultas al usuario
    current_user.consultas_restantes += batch.consultations_amount

    # Marcar cupón como usado (solo si es single-use)
    if batch.type == CouponType.SINGLE_USE:
        coupon.is_used = True
        coupon.used_by = current_user.id
        coupon.used_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return CouponRedeemResponse(
        id=coupon.id,
        code=coupon.code,
        consultations_added=batch.consultations_amount,
        new_total=current_user.consultas_restantes,
        message=f"¡Cupón canjeado exitosamente! Se agregaron {batch.consultations_amount} consultas a tu cuenta."
    )
