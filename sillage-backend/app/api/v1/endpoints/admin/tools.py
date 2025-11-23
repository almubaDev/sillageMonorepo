# sillage-backend/app/api/v1/endpoints/admin/tools.py
"""
Endpoints de herramientas de administración con acciones críticas.
Todas las acciones requieren confirmación de contraseña del superusuario.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.permissions import require_superuser
from app.core.security import verify_password
from app.models.user import User
from app.models.api_usage import APIUsageLog, APIDailyUsage
from app.models.role import GiftedConsultation

router = APIRouter(prefix="/admin/tools", tags=["Admin - Tools"])


# ========================================================================
# SCHEMAS
# ========================================================================

class PasswordConfirmRequest(BaseModel):
    password: str


class ResetGiftedConsultationsRequest(BaseModel):
    password: str


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

@router.post("/reset-gifted-consultations", response_model=ResetResponse)
async def reset_gifted_consultations(
    request: ResetGiftedConsultationsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Resetear el historial de consultas regaladas.

    Esto elimina todos los registros de la tabla gifted_consultations,
    permitiendo empezar un conteo limpio de consultas regaladas.

    NO afecta las consultas restantes de los usuarios.

    Requiere confirmación de contraseña del superusuario.
    """
    # Verificar contraseña
    if not await verify_superuser_password(current_user, request.password):
        raise HTTPException(
            status_code=403,
            detail="Contraseña incorrecta. Operación cancelada."
        )

    try:
        # Eliminar todos los registros de consultas regaladas
        result = await db.execute(delete(GiftedConsultation))
        affected = result.rowcount
        await db.commit()

        return ResetResponse(
            success=True,
            message=f"Se eliminaron {affected} registros del historial de consultas regaladas",
            affected_records=affected
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al resetear historial: {str(e)}")


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
