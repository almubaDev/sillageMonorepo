from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import Optional

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import Token, UserCreate, User as UserSchema
from app.services.email import email_service
from app.core.rate_limit import limiter
from pydantic import BaseModel

router = APIRouter()


def get_token_expiration(user_agent: Optional[str] = None) -> int:
    """
    Determinar el tiempo de expiración del token según el tipo de cliente

    - Mobile (React Native/Expo): 7 días
    - Web: 1 hora
    - Default: 30 minutos
    """
    if user_agent:
        user_agent_lower = user_agent.lower()
        # Detectar clientes mobile
        if any(keyword in user_agent_lower for keyword in ['expo', 'react-native', 'android', 'ios', 'mobile']):
            return settings.ACCESS_TOKEN_EXPIRE_MINUTES_MOBILE
        # Detectar clientes web
        elif any(keyword in user_agent_lower for keyword in ['mozilla', 'chrome', 'safari', 'firefox', 'edge']):
            return settings.ACCESS_TOKEN_EXPIRE_MINUTES_WEB

    # Default
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES


@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    user_agent: Optional[str] = Header(None)
):
    """Registrar un nuevo usuario"""
    # Verificar si el email ya existe
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )

    # Crear nuevo usuario
    db_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        hashed_password=get_password_hash(user_data.password),
        is_active=True,
        is_verified=False,
        suscrito=False,
        consultas_restantes=1  # Consulta de bienvenida gratis
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Enviar email de bienvenida (no bloquear si falla)
    try:
        await email_service.send_welcome_email(
            user_email=db_user.email,
            user_name=db_user.first_name or "Usuario"
        )
    except Exception as e:
        pass  # No bloquear registro si falla el email

    # Determinar tiempo de expiración según cliente
    expire_minutes = get_token_expiration(user_agent)
    # Crear token
    access_token = create_access_token(
        subject=db_user.id,
        expires_delta=timedelta(minutes=expire_minutes)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_agent: Optional[str] = Header(None)
):
    """Login con email y contraseña"""
    # Buscar usuario por email
    result = await db.execute(
        select(User).where(User.email == form_data.username)  # OAuth2 usa 'username'
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )

    # Actualizar último login
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(last_login=datetime.utcnow())
    )
    await db.commit()

    # Determinar tiempo de expiración según cliente
    expire_minutes = get_token_expiration(user_agent)
    # Crear token
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=expire_minutes)
    )

    await db.refresh(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


class DeleteAccountRequest(BaseModel):
    password: str


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    request: DeleteAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Eliminar cuenta de usuario permanentemente.
    Requiere contraseña para confirmar.
    """
    # Verificar contraseña
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
        )

    # Eliminar el usuario
    await db.delete(current_user)
    await db.commit()

    return {
        "message": "Cuenta eliminada exitosamente",
        "email": current_user.email
    }