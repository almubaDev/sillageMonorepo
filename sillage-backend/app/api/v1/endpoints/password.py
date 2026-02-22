"""
Endpoints para gestión de contraseñas
"""
from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter()


@router.post("/request-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    request: PasswordResetRequest,
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
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    # Siempre retornar éxito (seguridad: no revelar si el email existe)
    if not user:
        return PasswordResetResponse(
            message="Si el email existe, recibirás un enlace de recuperación",
            email=request.email
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
        email=request.email
    )


@router.post("/reset-password", response_model=PasswordChangeResponse)
async def reset_password(
    request: PasswordResetVerify,
    db: AsyncSession = Depends(get_db)
):
    """
    Restablecer contraseña usando el token del enlace enviado por email
    """
    # Buscar usuario
    result = await db.execute(
        select(User).where(User.email == request.email)
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
            PasswordResetToken.token == request.token,
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
    user.hashed_password = get_password_hash(request.new_password)

    # Marcar token como usado
    reset_token.used = True
    reset_token.used_at = datetime.utcnow()

    await db.commit()

    return PasswordChangeResponse(
        message="Contraseña actualizada exitosamente"
    )


@router.post("/change-password", response_model=PasswordChangeResponse)
async def change_password(
    request: PasswordChange,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambiar contraseña (usuario autenticado)
    """
    try:
        print(f"🔒 [1/5] Solicitud de cambio de contraseña para usuario: {current_user.email}")
        print(f"    ID del usuario: {current_user.id}")

        # Verificar contraseña actual
        print(f"🔒 [2/5] Verificando contraseña actual...")
        if not verify_password(request.current_password, current_user.hashed_password):
            print(f"❌ Contraseña actual incorrecta para {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual incorrecta"
            )
        print(f"✅ Contraseña actual verificada")

        # Verificar que la nueva contraseña sea diferente
        print(f"🔒 [3/5] Verificando que la nueva contraseña sea diferente...")
        if verify_password(request.new_password, current_user.hashed_password):
            print(f"❌ Nueva contraseña igual a la actual")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe ser diferente a la actual"
            )
        print(f"✅ Nueva contraseña es diferente")

        # Actualizar contraseña
        print(f"🔒 [4/5] Actualizando contraseña en BD...")
        new_hash = get_password_hash(request.new_password)
        print(f"    Nuevo hash generado: {new_hash[:50]}...")

        # Actualizar usando UPDATE directo
        from sqlalchemy import update as sql_update
        await db.execute(
            sql_update(User)
            .where(User.id == current_user.id)
            .values(hashed_password=new_hash)
        )
        print(f"    UPDATE ejecutado")

        await db.commit()
        print(f"✅ Commit ejecutado")

        # Verificar que se guardó
        print(f"🔒 [5/5] Verificando cambio...")
        result = await db.execute(select(User).where(User.id == current_user.id))
        updated_user = result.scalar_one()
        print(f"    Hash en BD: {updated_user.hashed_password[:50]}...")
        print(f"    Hash esperado: {new_hash[:50]}...")
        if updated_user.hashed_password == new_hash:
            print(f"✅ Verificación EXITOSA - Hash coincide")
        else:
            print(f"❌ Verificación FALLIDA - Hash NO coincide")

        print(f"✅✅✅ Contraseña cambiada exitosamente para {current_user.email}")

        return PasswordChangeResponse(
            message="Contraseña actualizada exitosamente"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌❌❌ ERROR INESPERADO: {str(e)}")
        print(f"❌ Tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )
