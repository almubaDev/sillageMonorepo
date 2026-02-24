from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.api.deps import get_db
from app.models.user import User
from app.models.role import Role
from app.core.security import get_password_hash, verify_password
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin,
    require_superuser,
    log_admin_action
)
from app.schemas.admin import (
    UserAdminResponse,
    UserAdminUpdate,
    UserListFilter,
    PaginatedResponse
)


class AdminResetPasswordRequest(BaseModel):
    new_password: str


class AdminPromoteSuperuserRequest(BaseModel):
    admin_password: str

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_permission(Permission.USERS_READ))])
async def list_users(
    search: Optional[str] = Query(None, description="Buscar por email, nombre o apellido"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    is_admin: Optional[bool] = Query(None, description="Filtrar por admin"),
    is_superuser: Optional[bool] = Query(None, description="Filtrar por superuser"),
    suscrito: Optional[bool] = Query(None, description="Filtrar por suscripción"),
    role_id: Optional[int] = Query(None, description="Filtrar por rol"),
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Límite de registros"),
    order_by: str = Query("created_at", regex="^(created_at|email|last_login)$"),
    order_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Listar usuarios con filtros y paginación.
    Requiere permiso: USERS_READ
    """
    # Construir query base
    stmt = select(User).options(selectinload(User.roles))

    # Aplicar filtros
    filters = []

    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%")
        )
        filters.append(search_filter)

    if is_active is not None:
        filters.append(User.is_active == is_active)

    if is_admin is not None:
        filters.append(User.is_admin == is_admin)

    if is_superuser is not None:
        filters.append(User.is_superuser == is_superuser)

    if suscrito is not None:
        filters.append(User.suscrito == suscrito)

    if filters:
        stmt = stmt.where(and_(*filters))

    # Filtro por rol (requiere join)
    if role_id:
        stmt = stmt.join(User.roles).where(Role.id == role_id)

    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Aplicar ordenamiento
    order_column = getattr(User, order_by)
    if order_dir == "desc":
        stmt = stmt.order_by(order_column.desc())
    else:
        stmt = stmt.order_by(order_column.asc())

    # Aplicar paginación
    stmt = stmt.offset(skip).limit(limit)

    # Ejecutar query
    result = await db.execute(stmt)
    users = result.scalars().all()

    return PaginatedResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=[UserAdminResponse.model_validate(user) for user in users]
    )


@router.get("/{user_id}", response_model=UserAdminResponse, dependencies=[Depends(require_permission(Permission.USERS_READ))])
async def get_user_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener detalles de un usuario específico.
    Requiere permiso: USERS_READ
    """
    stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    return UserAdminResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserAdminResponse, dependencies=[Depends(require_permission(Permission.USERS_WRITE))])
async def update_user(
    user_id: int,
    user_update: UserAdminUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Actualizar un usuario.
    Requiere permiso: USERS_WRITE
    """
    # Buscar usuario
    stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # No permitir que un admin regular modifique a un superusuario
    if user.is_superuser and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar un superusuario"
        )

    # No permitir que un admin se quite sus propios privilegios
    if user.id == current_user.id:
        if user_update.is_admin is False or user_update.is_superuser is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes quitarte tus propios privilegios de administrador"
            )

    # Actualizar campos
    update_data = user_update.model_dump(exclude_unset=True, exclude={"role_ids"})
    for field, value in update_data.items():
        setattr(user, field, value)

    # Actualizar roles si se proporcionan
    if user_update.role_ids is not None:
        # Solo superusuarios pueden asignar roles
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los superusuarios pueden asignar roles"
            )

        # Buscar roles
        roles_stmt = select(Role).where(Role.id.in_(user_update.role_ids))
        roles_result = await db.execute(roles_stmt)
        roles = roles_result.scalars().all()

        if len(roles) != len(user_update.role_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uno o más roles no existen"
            )

        user.roles = roles

    # Guardar cambios
    await db.commit()
    await db.refresh(user)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="UPDATE",
        resource="users",
        resource_id=user_id,
        details=user_update.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None
    )

    return UserAdminResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission(Permission.USERS_DELETE))])
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Eliminar (desactivar) un usuario.
    Requiere permiso: USERS_DELETE
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

    # No permitir eliminar superusuarios
    if user.is_superuser and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar un superusuario"
        )

    # No permitir auto-eliminación
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )

    # Soft delete - solo desactivar el usuario
    user.is_active = False
    await db.commit()

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="DELETE",
        resource="users",
        resource_id=user_id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None
    )

    return None


@router.post("/{user_id}/reset-password", dependencies=[Depends(require_superuser)])
async def admin_reset_password(
    user_id: int,
    body: AdminResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Resetear la contraseña de un usuario (solo superusuarios).
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    user.hashed_password = get_password_hash(body.new_password)
    await db.commit()

    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="RESET_PASSWORD",
        resource="users",
        resource_id=user_id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None
    )

    return {"message": "Contraseña reseteada exitosamente"}


@router.post("/{user_id}/promote-superuser", dependencies=[Depends(require_superuser)])
async def promote_to_superuser(
    user_id: int,
    body: AdminPromoteSuperuserRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Promover un usuario a superusuario.
    Requiere verificación de contraseña del admin que ejecuta la acción.
    """
    # Verificar contraseña del admin
    if not verify_password(body.admin_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya es superusuario"
        )

    user.is_superuser = True
    user.is_admin = True
    await db.commit()

    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="PROMOTE_SUPERUSER",
        resource="users",
        resource_id=user_id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None
    )

    return {"message": f"Usuario {user.email} promovido a superusuario"}
