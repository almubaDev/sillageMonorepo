from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Obtener perfil del usuario actual"""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Actualizar perfil del usuario actual"""
    update_data = user_update.dict(exclude_unset=True)
    
    # Si hay nueva contraseña, hashearla
    if "password" in update_data:
        from app.core.security import get_password_hash
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Actualizar en la BD
    if update_data:
        await db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(current_user)
    
    return current_user


@router.get("/me/subscription")
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user)
):
    """Obtener estado de suscripción del usuario"""
    return {
        "suscrito": current_user.suscrito,
        "consultas_restantes": current_user.consultas_restantes,
        "message": "Suscripción activa" if current_user.suscrito else "Sin suscripción activa"
    }