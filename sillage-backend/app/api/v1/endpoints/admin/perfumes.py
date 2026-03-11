from typing import List, Optional
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
import logging

from app.api.deps import get_db
from app.models.user import User
from app.models.perfume import Perfume
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin,
    log_admin_action
)
from app.schemas.admin import (
    PerfumeAdminCreate,
    PerfumeAdminUpdate,
    PerfumeBulkImport,
    PerfumeBulkImportResponse,
    PaginatedResponse
)
from app.schemas.perfume import PerfumeResponse
from app.i18n.normalizer import normalize_acordes, normalize_notas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/perfumes", tags=["Admin - Perfumes"])


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_READ))])
async def list_perfumes(
    search: Optional[str] = Query(None, description="Buscar por nombre o marca"),
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Límite de registros"),
    order_by: str = Query("created_at", regex="^(created_at|nombre|marca)$"),
    order_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Listar todos los perfumes con paginación.
    Requiere permiso: PERFUMES_READ
    """
    # Construir query base
    stmt = select(Perfume)

    # Aplicar filtro de búsqueda
    if search:
        search_filter = or_(
            Perfume.nombre.ilike(f"%{search}%"),
            Perfume.marca.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)

    # Contar total
    count_stmt = select(func.count()).select_from(Perfume)
    if search:
        count_stmt = count_stmt.where(search_filter)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Aplicar ordenamiento
    # Cuando se busca, ordenar por: 1) longitud del nombre (ASC), 2) nombre alfabéticamente (ASC)
    if search:
        stmt = stmt.order_by(
            func.length(Perfume.nombre).asc(),
            Perfume.nombre.asc()
        )
    else:
        # Sin búsqueda, usar el ordenamiento especificado
        order_column = getattr(Perfume, order_by)
        if order_dir == "desc":
            stmt = stmt.order_by(order_column.desc())
        else:
            stmt = stmt.order_by(order_column.asc())

    # Aplicar paginación
    stmt = stmt.offset(skip).limit(limit)

    # Ejecutar query
    result = await db.execute(stmt)
    perfumes = result.scalars().all()

    return PaginatedResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=[PerfumeResponse.model_validate(perfume) for perfume in perfumes]
    )


@router.get("/{perfume_id}", response_model=PerfumeResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_READ))])
async def get_perfume_detail(
    perfume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener detalles de un perfume específico.
    Requiere permiso: PERFUMES_READ
    """
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    return PerfumeResponse.model_validate(perfume)


@router.post("", response_model=PerfumeResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def create_perfume(
    perfume_data: PerfumeAdminCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Crear un nuevo perfume.
    Requiere permiso: PERFUMES_WRITE
    """
    # Verificar si ya existe un perfume con el mismo nombre y marca
    stmt = select(Perfume).where(
        and_(
            Perfume.nombre == perfume_data.nombre,
            Perfume.marca == perfume_data.marca
        )
    )
    result = await db.execute(stmt)
    existing_perfume = result.scalar_one_or_none()

    if existing_perfume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un perfume con el nombre '{perfume_data.nombre}' de la marca '{perfume_data.marca}'"
        )

    # Crear perfume - normalizar notas/acordes a español
    new_perfume = Perfume(
        nombre=perfume_data.nombre,
        marca=perfume_data.marca,
        perfumista=perfume_data.perfumista,
        notas=normalize_notas(perfume_data.notas),
        acordes=normalize_acordes(perfume_data.acordes),
        is_private=perfume_data.is_private,
        created_by=current_user.id
    )

    db.add(new_perfume)
    await db.commit()
    await db.refresh(new_perfume)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="CREATE",
        resource="perfumes",
        resource_id=new_perfume.id,
        details={"nombre": perfume_data.nombre, "marca": perfume_data.marca},
        ip_address=request.client.host if request.client else None
    )

    return PerfumeResponse.model_validate(new_perfume)


@router.post("/bulk", response_model=PerfumeBulkImportResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def bulk_import_perfumes(
    bulk_data: PerfumeBulkImport,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Importar múltiples perfumes en lote.
    Requiere permiso: PERFUMES_WRITE
    """
    success_count = 0
    error_count = 0
    errors = []
    created_ids = []

    for idx, perfume_data in enumerate(bulk_data.perfumes):
        try:
            # Verificar si ya existe
            stmt = select(Perfume).where(
                and_(
                    Perfume.nombre == perfume_data.nombre,
                    Perfume.marca == perfume_data.marca
                )
            )
            result = await db.execute(stmt)
            existing_perfume = result.scalar_one_or_none()

            if existing_perfume:
                error_count += 1
                errors.append({
                    "index": idx,
                    "nombre": perfume_data.nombre,
                    "marca": perfume_data.marca,
                    "error": "Ya existe"
                })
                continue

            # Crear perfume - normalizar notas/acordes a español
            new_perfume = Perfume(
                nombre=perfume_data.nombre,
                marca=perfume_data.marca,
                perfumista=perfume_data.perfumista,
                notas=normalize_notas(perfume_data.notas),
                acordes=normalize_acordes(perfume_data.acordes),
                is_private=perfume_data.is_private,
                created_by=current_user.id
            )

            db.add(new_perfume)
            await db.flush()  # Para obtener el ID sin hacer commit
            created_ids.append(new_perfume.id)
            success_count += 1

        except Exception as e:
            error_count += 1
            errors.append({
                "index": idx,
                "nombre": perfume_data.nombre,
                "marca": perfume_data.marca,
                "error": str(e)
            })

    # Hacer commit de todos los cambios exitosos
    await db.commit()

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="BULK_CREATE",
        resource="perfumes",
        details={
            "total": len(bulk_data.perfumes),
            "success": success_count,
            "errors": error_count
        },
        ip_address=request.client.host if request.client else None
    )

    return PerfumeBulkImportResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors,
        created_ids=created_ids
    )


@router.post("/upload-csv", response_model=PerfumeBulkImportResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def upload_perfumes_csv(
    file: UploadFile = File(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Upload CSV file with perfumes (simple format).
    Expected columns: Perfume, Marca, Acordes, Notas
    Requiere permiso: PERFUMES_WRITE
    """
    # Validar extensión
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se aceptan archivos CSV"
        )

    try:
        # Leer archivo
        content = await file.read()

        # Decodificar con manejo de BOM UTF-8
        try:
            decoded = content.decode('utf-8-sig')
        except UnicodeDecodeError:
            decoded = content.decode('latin-1')

        # Parse CSV
        reader = csv.DictReader(io.StringIO(decoded))
        perfumes_data = []

        for idx, row in enumerate(reader):
            try:
                acordes_str = row.get('Acordes', '').strip('"')
                notas_str = row.get('Notas', '').strip('"')

                acordes = [a.strip() for a in acordes_str.split(',') if a.strip()]
                notas = [n.strip() for n in notas_str.split(',') if n.strip()]

                nombre = row.get('Perfume', '').strip()
                marca = row.get('Marca', '').strip()

                if not nombre or not marca:
                    logger.warning(f"Fila {idx+2}: nombre o marca vacíos, saltando...")
                    continue

                perfumes_data.append({
                    "nombre": nombre,
                    "marca": marca,
                    "acordes": acordes if acordes else None,
                    "notas": notas if notas else None,
                })

            except Exception as e:
                logger.warning(f"Error parsing fila {idx+2}: {e}")
                continue

        if not perfumes_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se encontraron perfumes válidos en el archivo CSV"
            )

        # Dedup en memoria: solo quedarse con la primera ocurrencia de (nombre, marca)
        seen = set()
        unique_perfumes = []
        csv_dupes = 0
        for p in perfumes_data:
            key = (p["nombre"], p["marca"])
            if key in seen:
                csv_dupes += 1
                continue
            seen.add(key)
            unique_perfumes.append(p)

        if csv_dupes:
            logger.info(f"CSV: {csv_dupes} duplicados internos descartados")

        # Obtener perfumes existentes en BD para dedup
        existing_result = await db.execute(
            select(Perfume.nombre, Perfume.marca)
        )
        existing_keys = {(r.nombre, r.marca) for r in existing_result.all()}

        # Filtrar los que ya existen en BD
        db_dupes = 0
        to_insert = []
        for p in unique_perfumes:
            key = (p["nombre"], p["marca"])
            if key in existing_keys:
                db_dupes += 1
                continue
            to_insert.append(p)

        if db_dupes:
            logger.info(f"CSV: {db_dupes} perfumes ya existentes en BD, saltando")

        total_dupes = csv_dupes + db_dupes

        # Insertar en batches con savepoints para aislar errores
        BATCH_SIZE = 500
        total_success = 0
        total_errors = 0
        all_errors = []
        total_batches = (len(to_insert) + BATCH_SIZE - 1) // BATCH_SIZE if to_insert else 0

        logger.info(f"Procesando {len(to_insert)} perfumes nuevos en {total_batches} lotes de {BATCH_SIZE}")

        for i in range(0, len(to_insert), BATCH_SIZE):
            batch = to_insert[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1

            try:
                # Usar savepoint para aislar cada batch
                async with db.begin_nested():
                    for p in batch:
                        perfume = Perfume(
                            nombre=p["nombre"],
                            marca=p["marca"],
                            notas=normalize_notas(p["notas"]),
                            acordes=normalize_acordes(p["acordes"]),
                            is_private=False,
                            created_by=current_user.id
                        )
                        db.add(perfume)

                total_success += len(batch)
                logger.info(f"Lote {batch_num}/{total_batches} OK ({len(batch)} perfumes)")

            except Exception as e:
                logger.error(f"Error lote {batch_num}: {e}")
                total_errors += len(batch)
                all_errors.append({
                    "batch": batch_num,
                    "error": str(e),
                    "count": len(batch)
                })

        # Commit final de todos los savepoints exitosos
        await db.commit()

        # Registrar acción
        await log_admin_action(
            db=db,
            admin_id=current_user.id,
            action="CSV_IMPORT",
            resource="perfumes",
            details={
                "archivo": file.filename,
                "total_csv": len(perfumes_data),
                "duplicados_csv": csv_dupes,
                "duplicados_bd": db_dupes,
                "insertados": total_success,
                "errores": total_errors
            },
            ip_address=request.client.host if request.client else None
        )

        logger.info(f"CSV procesado: {total_success} insertados, {total_dupes} duplicados, {total_errors} errores")

        return PerfumeBulkImportResponse(
            success_count=total_success,
            error_count=total_errors + total_dupes,
            errors=all_errors
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando archivo CSV: {str(e)}"
        )


@router.put("/{perfume_id}", response_model=PerfumeResponse, dependencies=[Depends(require_permission(Permission.PERFUMES_WRITE))])
async def update_perfume(
    perfume_id: int,
    perfume_update: PerfumeAdminUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Actualizar un perfume existente.
    Requiere permiso: PERFUMES_WRITE
    """
    # Buscar perfume
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    # Actualizar campos - normalizar notas/acordes a español
    if perfume_update.nombre is not None:
        perfume.nombre = perfume_update.nombre
    if perfume_update.marca is not None:
        perfume.marca = perfume_update.marca
    if perfume_update.perfumista is not None:
        perfume.perfumista = perfume_update.perfumista
    if perfume_update.notas is not None:
        perfume.notas = normalize_notas(perfume_update.notas)
    if perfume_update.acordes is not None:
        perfume.acordes = normalize_acordes(perfume_update.acordes)
    if perfume_update.is_private is not None:
        perfume.is_private = perfume_update.is_private

    await db.commit()
    await db.refresh(perfume)

    # Registrar acción
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="UPDATE",
        resource="perfumes",
        resource_id=perfume_id,
        details=perfume_update.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None
    )

    return PerfumeResponse.model_validate(perfume)


@router.delete("/{perfume_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission(Permission.PERFUMES_DELETE))])
async def delete_perfume(
    perfume_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Eliminar un perfume.
    Requiere permiso: PERFUMES_DELETE
    """
    # Buscar perfume
    stmt = select(Perfume).where(Perfume.id == perfume_id)
    result = await db.execute(stmt)
    perfume = result.scalar_one_or_none()

    if not perfume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfume no encontrado"
        )

    # Registrar acción antes de eliminar
    await log_admin_action(
        db=db,
        admin_id=current_user.id,
        action="DELETE",
        resource="perfumes",
        resource_id=perfume_id,
        details={"nombre": perfume.nombre, "marca": perfume.marca},
        ip_address=request.client.host if request.client else None
    )

    # Eliminar perfume
    await db.delete(perfume)
    await db.commit()

    return None
