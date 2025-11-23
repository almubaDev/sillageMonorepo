# sillage-backend/app/api/v1/endpoints/admin/tools.py
"""
Endpoints de herramientas de administración con acciones críticas.
Todas las acciones requieren confirmación de contraseña del superusuario.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, delete
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.permissions import require_superuser
from app.core.security import verify_password
from app.models.user import User
from app.models.api_usage import APIUsageLog, APIDailyUsage

router = APIRouter(prefix="/admin/tools", tags=["Admin - Tools"])


# ========================================================================
# SCHEMAS
# ========================================================================

class PasswordConfirmRequest(BaseModel):
    password: str


class ResetConsultationsRequest(BaseModel):
    password: str
    target: str = "all"  # "all" | "free_only" | user_id específico


class ResetAPIUsageRequest(BaseModel):
    password: str
    api_name: Optional[str] = None  # None = todas las APIs


class ResetResponse(BaseModel):
    success: bool
    message: str
    affected_records: int


# ========================================================================
# HELPER FUNCTIONS
# ========================================================================

async def verify_superuser_password(user: User, password: str) -> bool:
    """Verificar que la contraseña proporcionada es correcta para el superusuario"""
    return verify_password(password, user.hashed_password)


# ========================================================================
# ENDPOINTS
# ========================================================================

@router.post("/reset-consultations", response_model=ResetResponse)
async def reset_consultations(
    request: ResetConsultationsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Resetear consultas regaladas de usuarios.

    - target: "all" resetea todos los usuarios
    - target: "free_only" resetea solo usuarios que no han pagado nunca
    - target: número = resetea solo ese user_id específico

    Requiere confirmación de contraseña del superusuario.
    """
    # Verificar contraseña
    if not await verify_superuser_password(current_user, request.password):
        raise HTTPException(
            status_code=403,
            detail="Contraseña incorrecta. Operación cancelada."
        )

    try:
        if request.target == "all":
            # Resetear todas las consultas restantes a 0
            result = await db.execute(
                update(User)
                .where(User.consultas_restantes > 0)
                .values(consultas_restantes=0)
            )
            affected = result.rowcount
            await db.commit()

            return ResetResponse(
                success=True,
                message=f"Se resetearon las consultas de {affected} usuarios",
                affected_records=affected
            )

        elif request.target == "free_only":
            # Resetear solo usuarios no suscritos
            result = await db.execute(
                update(User)
                .where(User.consultas_restantes > 0, User.suscrito == False)
                .values(consultas_restantes=0)
            )
            affected = result.rowcount
            await db.commit()

            return ResetResponse(
                success=True,
                message=f"Se resetearon las consultas gratuitas de {affected} usuarios",
                affected_records=affected
            )

        else:
            # Intentar como user_id específico
            try:
                user_id = int(request.target)
                result = await db.execute(
                    update(User)
                    .where(User.id == user_id)
                    .values(consultas_restantes=0)
                )
                affected = result.rowcount
                await db.commit()

                if affected == 0:
                    raise HTTPException(status_code=404, detail="Usuario no encontrado")

                return ResetResponse(
                    success=True,
                    message=f"Se resetearon las consultas del usuario {user_id}",
                    affected_records=affected
                )
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Target inválido. Use 'all', 'free_only' o un user_id numérico"
                )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al resetear consultas: {str(e)}")


@router.post("/reset-api-usage", response_model=ResetResponse)
async def reset_api_usage(
    request: ResetAPIUsageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Resetear el seguimiento de uso de APIs.

    - api_name: None = resetea todas las APIs
    - api_name: "gemini" | "openweather" | "google_maps" = resetea solo esa API

    Esto elimina los registros históricos de uso.
    Requiere confirmación de contraseña del superusuario.
    """
    # Verificar contraseña
    if not await verify_superuser_password(current_user, request.password):
        raise HTTPException(
            status_code=403,
            detail="Contraseña incorrecta. Operación cancelada."
        )

    valid_apis = ['gemini', 'openweather', 'google_maps']

    if request.api_name and request.api_name not in valid_apis:
        raise HTTPException(
            status_code=400,
            detail=f"API no válida. APIs válidas: {valid_apis}"
        )

    try:
        total_affected = 0

        # Eliminar logs individuales
        if request.api_name:
            result = await db.execute(
                delete(APIUsageLog).where(APIUsageLog.api_name == request.api_name)
            )
        else:
            result = await db.execute(delete(APIUsageLog))
        total_affected += result.rowcount

        # Eliminar resúmenes diarios
        if request.api_name:
            result = await db.execute(
                delete(APIDailyUsage).where(APIDailyUsage.api_name == request.api_name)
            )
        else:
            result = await db.execute(delete(APIDailyUsage))
        total_affected += result.rowcount

        await db.commit()

        api_msg = request.api_name if request.api_name else "todas las APIs"
        return ResetResponse(
            success=True,
            message=f"Se eliminaron los registros de uso de {api_msg}",
            affected_records=total_affected
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al resetear uso de APIs: {str(e)}")


@router.post("/verify-password")
async def verify_admin_password(
    request: PasswordConfirmRequest,
    current_user: User = Depends(require_superuser)
):
    """
    Verificar la contraseña del superusuario.
    Útil para validar antes de mostrar opciones críticas.
    """
    is_valid = await verify_superuser_password(current_user, request.password)

    if not is_valid:
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")

    return {"valid": True, "message": "Contraseña verificada correctamente"}
