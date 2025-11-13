from enum import Enum
from typing import List, Optional
from fastapi import HTTPException, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.role import Role, AdminLog
from app.api.deps import get_current_user


class Permission(str, Enum):
    """Permisos disponibles en el sistema"""
    # Usuarios
    USERS_READ = "users.read"
    USERS_WRITE = "users.write"
    USERS_DELETE = "users.delete"

    # Perfumes
    PERFUMES_READ = "perfumes.read"
    PERFUMES_WRITE = "perfumes.write"
    PERFUMES_DELETE = "perfumes.delete"

    # Suscripciones
    SUBSCRIPTIONS_READ = "subscriptions.read"
    SUBSCRIPTIONS_WRITE = "subscriptions.write"

    # Consultas
    CONSULTATIONS_GIFT = "consultations.gift"
    CONSULTATIONS_READ = "consultations.read"

    # Cupones
    COUPONS_CREATE = "coupons.create"
    COUPONS_READ = "coupons.read"
    COUPONS_DELETE = "coupons.delete"

    # Roles
    ROLES_READ = "roles.read"
    ROLES_WRITE = "roles.write"

    # Dashboard
    DASHBOARD_VIEW = "dashboard.view"
    DASHBOARD_STATS = "dashboard.stats"

    # Logs
    LOGS_READ = "logs.read"


# Roles predeterminados y sus permisos
DEFAULT_ROLES = {
    "superadmin": {
        "description": "Acceso completo al sistema",
        "permissions": [p.value for p in Permission]  # Todos los permisos
    },
    "admin": {
        "description": "Administrador con permisos limitados",
        "permissions": [
            Permission.USERS_READ.value,
            Permission.USERS_WRITE.value,
            Permission.PERFUMES_READ.value,
            Permission.PERFUMES_WRITE.value,
            Permission.SUBSCRIPTIONS_READ.value,
            Permission.CONSULTATIONS_GIFT.value,
            Permission.CONSULTATIONS_READ.value,
            Permission.DASHBOARD_VIEW.value,
            Permission.DASHBOARD_STATS.value,
        ]
    },
    "moderator": {
        "description": "Moderador con permisos de solo lectura",
        "permissions": [
            Permission.USERS_READ.value,
            Permission.PERFUMES_READ.value,
            Permission.SUBSCRIPTIONS_READ.value,
            Permission.CONSULTATIONS_READ.value,
            Permission.DASHBOARD_VIEW.value,
            Permission.LOGS_READ.value,
        ]
    }
}


async def has_permission(user: User, permission: Permission, db: AsyncSession) -> bool:
    """
    Verifica si un usuario tiene un permiso específico.
    Los superusuarios siempre tienen todos los permisos.
    """
    # Los superusuarios tienen todos los permisos
    if user.is_superuser:
        return True

    # Si no es admin, no tiene permisos de administración
    if not user.is_admin:
        return False

    # Cargar roles del usuario con sus permisos
    stmt = select(User).where(User.id == user.id).options(selectinload(User.roles))
    result = await db.execute(stmt)
    user_with_roles = result.scalar_one_or_none()

    if not user_with_roles or not user_with_roles.roles:
        return False

    # Verificar si alguno de los roles del usuario tiene el permiso
    for role in user_with_roles.roles:
        if permission.value in role.permissions:
            return True

    return False


async def check_permission(
    permission: Permission,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency para verificar permisos en rutas.
    Lanza HTTPException si el usuario no tiene el permiso.
    """
    if not await has_permission(user, permission, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permiso para realizar esta acción. Permiso requerido: {permission.value}"
        )
    return user


def require_permission(permission: Permission):
    """
    Factory function para crear dependencies de permisos específicos.
    Uso: @router.get("/users", dependencies=[Depends(require_permission(Permission.USERS_READ))])
    """
    async def permission_dependency(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        return await check_permission(permission, user, db)

    return permission_dependency


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency para verificar que el usuario sea admin o superuser.
    """
    if not current_user.is_admin and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren privilegios de administrador."
        )
    return current_user


async def require_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency para verificar que el usuario sea superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren privilegios de superusuario."
        )
    return current_user


async def log_admin_action(
    db: AsyncSession,
    admin_id: int,
    action: str,
    resource: str,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> AdminLog:
    """
    Registra una acción administrativa en el log.
    """
    log_entry = AdminLog(
        admin_id=admin_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry


async def initialize_default_roles(db: AsyncSession) -> None:
    """
    Inicializa los roles predeterminados en la base de datos.
    Se debe ejecutar al iniciar la aplicación.
    """
    for role_name, role_data in DEFAULT_ROLES.items():
        # Verificar si el rol ya existe
        stmt = select(Role).where(Role.name == role_name)
        result = await db.execute(stmt)
        existing_role = result.scalar_one_or_none()

        if not existing_role:
            # Crear el rol
            new_role = Role(
                name=role_name,
                description=role_data["description"],
                permissions=role_data["permissions"]
            )
            db.add(new_role)
            print(f"✓ Rol '{role_name}' creado con éxito")
        else:
            # Actualizar permisos del rol existente
            existing_role.permissions = role_data["permissions"]
            existing_role.description = role_data["description"]
            print(f"✓ Rol '{role_name}' actualizado")

    await db.commit()
    print("✓ Roles predeterminados inicializados correctamente")
