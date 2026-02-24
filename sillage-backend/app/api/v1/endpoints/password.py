"""
Endpoints para gestión de contraseñas
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.schemas.password import (
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordChange,
    PasswordResetResponse,
    PasswordChangeResponse
)
from app.services.email import email_service
from app.api import deps
from app.core.rate_limit import limiter

router = APIRouter()


@router.post("/request-reset", response_model=PasswordResetResponse)
@limiter.limit("5/hour")
async def request_password_reset(
    request: Request,
    body: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Solicitar recuperación de contraseña.
    Envía un enlace tokenizado por email.
    """
    from app.core.config import settings
    from urllib.parse import quote

    # Buscar usuario por email
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    user = result.scalar_one_or_none()

    # Siempre retornar éxito (seguridad: no revelar si el email existe)
    if not user:
        return PasswordResetResponse(
            message="Si el email existe, recibirás un enlace de recuperación",
            email=body.email
        )

    # Invalidar tokens anteriores del usuario
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        )
    )
    old_tokens = result.scalars().all()
    for token in old_tokens:
        token.used = True

    # Generar nuevo token
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=PasswordResetToken.generate_token(),
        expires_at=PasswordResetToken.create_expiration_time()
    )
    db.add(reset_token)
    await db.commit()

    # Construir URL de recuperación
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token.token}&email={quote(user.email)}"

    # En desarrollo, imprimir el enlace en consola
    if settings.ENVIRONMENT == "local":
        print("=" * 80)
        print(f"ENLACE DE RECUPERACION GENERADO")
        print(f"Email: {user.email}")
        print(f"URL: {reset_url}")
        print(f"Expira: {reset_token.expires_at}")
        print("=" * 80)

    # Enviar email
    email_sent = await email_service.send_password_reset_email(
        user_email=user.email,
        user_name=user.first_name or "Usuario",
        reset_url=reset_url
    )

    # Solo lanzar error si no estamos en desarrollo
    if not email_sent and settings.ENVIRONMENT != "local":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el email. Intenta nuevamente."
        )

    return PasswordResetResponse(
        message="Si el email existe, recibirás un enlace de recuperación",
        email=body.email
    )


@router.post("/reset-password", response_model=PasswordChangeResponse)
@limiter.limit("10/hour")
async def reset_password(
    request: Request,
    body: PasswordResetVerify,
    db: AsyncSession = Depends(get_db)
):
    """
    Restablecer contraseña usando el token del enlace enviado por email
    """
    # Buscar usuario
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enlace inválido o expirado"
        )

    # Buscar token válido
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.token == body.token,
            PasswordResetToken.used == False
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enlace inválido o expirado"
        )

    # Verificar si expiró
    if reset_token.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace ha expirado. Solicita uno nuevo."
        )

    # Cambiar contraseña
    user.hashed_password = get_password_hash(body.new_password)

    # Marcar token como usado
    reset_token.used = True
    reset_token.used_at = datetime.utcnow()

    await db.commit()

    return PasswordChangeResponse(
        message="Contraseña actualizada exitosamente"
    )


@router.post("/change-password", response_model=PasswordChangeResponse)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    body: PasswordChange,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambiar contraseña (usuario autenticado)
    """
    # Verificar contraseña actual
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )

    # Verificar que la nueva contraseña sea diferente
    if verify_password(body.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )

    # Actualizar contraseña
    new_hash = get_password_hash(body.new_password)
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(User)
        .where(User.id == current_user.id)
        .values(hashed_password=new_hash)
    )
    await db.commit()

    return PasswordChangeResponse(
        message="Contraseña actualizada exitosamente"
    )
