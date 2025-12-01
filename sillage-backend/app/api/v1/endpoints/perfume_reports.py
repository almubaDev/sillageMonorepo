from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.core.permissions import require_admin
from app.models.user import User
from app.models.perfume_report import PerfumeReport
from app.schemas.perfume_report import PerfumeReportCreate, PerfumeReportResponse

router = APIRouter()


@router.post("", response_model=PerfumeReportResponse, status_code=status.HTTP_201_CREATED)
async def create_perfume_report(
    report_data: PerfumeReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un reporte de perfume faltante (usuarios autenticados)"""

    # Crear el reporte
    new_report = PerfumeReport(
        nombre=report_data.nombre.strip(),
        marca=report_data.marca.strip(),
        user_id=current_user.id
    )

    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    # Agregar información del usuario
    response = PerfumeReportResponse.from_orm(new_report)
    response.user_email = current_user.email
    response.user_name = f"{current_user.first_name} {current_user.last_name}".strip()

    return response


@router.get("", response_model=List[PerfumeReportResponse])
async def get_all_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtener todos los reportes de perfumes (solo admin)"""

    result = await db.execute(
        select(PerfumeReport)
        .order_by(PerfumeReport.created_at.desc())
    )
    reports = result.scalars().all()

    # Cargar información de usuarios
    response_list = []
    for report in reports:
        # Cargar el usuario
        user_result = await db.execute(
            select(User).where(User.id == report.user_id)
        )
        user = user_result.scalar_one_or_none()

        report_response = PerfumeReportResponse.from_orm(report)
        if user:
            report_response.user_email = user.email
            report_response.user_name = f"{user.first_name} {user.last_name}".strip()

        response_list.append(report_response)

    return response_list


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Eliminar un reporte de perfume (solo admin)"""

    # Verificar que el reporte existe
    result = await db.execute(
        select(PerfumeReport).where(PerfumeReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )

    # Eliminar el reporte
    await db.execute(
        delete(PerfumeReport).where(PerfumeReport.id == report_id)
    )
    await db.commit()

    return None
