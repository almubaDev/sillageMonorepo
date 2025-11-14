"""
Endpoints de administración para el sistema de pagos
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.permissions import require_superuser
from app.models.user import User
from app.models.payment import PaqueteConsultas, MetodoPago, BotonPago, PagoConsultas
from app.schemas.admin import (
    PaqueteCreate,
    PaqueteUpdate,
    PaqueteAdmin,
    BotonPagoInfo,
    PagoHistorialItem,
    PagoHistorialResponse,
    EstadisticasVentas,
    EstadisticasPaquete
)

router = APIRouter(prefix="/admin/payments", tags=["Admin - Payments"])


# ========================================================================
# PAQUETES - CRUD
# ========================================================================

@router.get("/paquetes", response_model=List[PaqueteAdmin])
async def get_paquetes_admin(
    incluir_inactivos: bool = Query(True, description="Incluir paquetes inactivos"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener todos los paquetes (incluyendo inactivos) con información de botones
    """
    query = select(PaqueteConsultas).options(
        selectinload(PaqueteConsultas.botones_pago).selectinload(BotonPago.metodo_pago)
    )

    if not incluir_inactivos:
        query = query.where(PaqueteConsultas.activo == True)

    query = query.order_by(PaqueteConsultas.created_at.desc())

    result = await db.execute(query)
    paquetes = result.scalars().all()

    # Construir response con información de botones
    paquetes_response = []
    for paquete in paquetes:
        botones_info = [
            BotonPagoInfo(
                id=boton.id,
                metodo_pago=boton.metodo_pago.nombre,
                codigo_metodo=boton.metodo_pago.codigo,
                activo=boton.activo and boton.metodo_pago.activo
            )
            for boton in paquete.botones_pago
        ]

        paquete_data = PaqueteAdmin(
            id=paquete.id,
            nombre=paquete.nombre,
            descripcion=paquete.descripcion,
            cantidad_consultas=paquete.cantidad_consultas,
            precio=paquete.precio,
            precio_anterior=paquete.precio_anterior,
            precio_por_consulta=paquete.precio_por_consulta,
            tiene_descuento=paquete.tiene_descuento,
            porcentaje_descuento=paquete.porcentaje_descuento,
            moneda=paquete.moneda,
            destacado=paquete.destacado,
            activo=paquete.activo,
            created_at=paquete.created_at,
            updated_at=paquete.updated_at,
            botones_pago=botones_info
        )
        paquetes_response.append(paquete_data)

    return paquetes_response


@router.post("/paquetes", response_model=PaqueteAdmin, status_code=status.HTTP_201_CREATED)
async def create_paquete(
    paquete_data: PaqueteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Crear un nuevo paquete de consultas y vincularlo automáticamente con PayPal
    """
    # 1. Crear el paquete
    nuevo_paquete = PaqueteConsultas(
        nombre=paquete_data.nombre,
        descripcion=paquete_data.descripcion,
        cantidad_consultas=paquete_data.cantidad_consultas,
        precio=paquete_data.precio,
        precio_anterior=paquete_data.precio_anterior,
        moneda=paquete_data.moneda,
        destacado=paquete_data.destacado,
        activo=paquete_data.activo
    )

    db.add(nuevo_paquete)
    await db.flush()  # Para obtener el ID

    # 2. Obtener método de pago PayPal
    result = await db.execute(
        select(MetodoPago).where(MetodoPago.codigo == 'paypal')
    )
    paypal = result.scalar_one_or_none()

    if not paypal:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Método de pago PayPal no encontrado. Ejecuta init_payment_data.py primero."
        )

    # 3. Crear botón de pago automáticamente
    boton = BotonPago(
        paquete_id=nuevo_paquete.id,
        metodo_pago_id=paypal.id,
        activo=True
    )
    db.add(boton)

    await db.commit()
    await db.refresh(nuevo_paquete)

    # 4. Cargar relaciones para response
    await db.refresh(nuevo_paquete, ['botones_pago'])
    for boton in nuevo_paquete.botones_pago:
        await db.refresh(boton, ['metodo_pago'])

    # 5. Construir response
    botones_info = [
        BotonPagoInfo(
            id=b.id,
            metodo_pago=b.metodo_pago.nombre,
            codigo_metodo=b.metodo_pago.codigo,
            activo=b.activo
        )
        for b in nuevo_paquete.botones_pago
    ]

    return PaqueteAdmin(
        id=nuevo_paquete.id,
        nombre=nuevo_paquete.nombre,
        descripcion=nuevo_paquete.descripcion,
        cantidad_consultas=nuevo_paquete.cantidad_consultas,
        precio=nuevo_paquete.precio,
        precio_anterior=nuevo_paquete.precio_anterior,
        precio_por_consulta=nuevo_paquete.precio_por_consulta,
        tiene_descuento=nuevo_paquete.tiene_descuento,
        porcentaje_descuento=nuevo_paquete.porcentaje_descuento,
        moneda=nuevo_paquete.moneda,
        destacado=nuevo_paquete.destacado,
        activo=nuevo_paquete.activo,
        created_at=nuevo_paquete.created_at,
        updated_at=nuevo_paquete.updated_at,
        botones_pago=botones_info
    )


@router.put("/paquetes/{paquete_id}", response_model=PaqueteAdmin)
async def update_paquete(
    paquete_id: int,
    paquete_data: PaqueteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Actualizar un paquete existente
    """
    # Buscar paquete
    result = await db.execute(
        select(PaqueteConsultas)
        .where(PaqueteConsultas.id == paquete_id)
        .options(
            selectinload(PaqueteConsultas.botones_pago).selectinload(BotonPago.metodo_pago)
        )
    )
    paquete = result.scalar_one_or_none()

    if not paquete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paquete con ID {paquete_id} no encontrado"
        )

    # Actualizar campos proporcionados
    update_data = paquete_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paquete, field, value)

    await db.commit()
    await db.refresh(paquete)

    # Construir response
    botones_info = [
        BotonPagoInfo(
            id=b.id,
            metodo_pago=b.metodo_pago.nombre,
            codigo_metodo=b.metodo_pago.codigo,
            activo=b.activo
        )
        for b in paquete.botones_pago
    ]

    return PaqueteAdmin(
        id=paquete.id,
        nombre=paquete.nombre,
        descripcion=paquete.descripcion,
        cantidad_consultas=paquete.cantidad_consultas,
        precio=paquete.precio,
        precio_anterior=paquete.precio_anterior,
        precio_por_consulta=paquete.precio_por_consulta,
        tiene_descuento=paquete.tiene_descuento,
        porcentaje_descuento=paquete.porcentaje_descuento,
        moneda=paquete.moneda,
        destacado=paquete.destacado,
        activo=paquete.activo,
        created_at=paquete.created_at,
        updated_at=paquete.updated_at,
        botones_pago=botones_info
    )


@router.delete("/paquetes/{paquete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paquete(
    paquete_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Desactivar un paquete (soft delete)
    """
    result = await db.execute(
        select(PaqueteConsultas).where(PaqueteConsultas.id == paquete_id)
    )
    paquete = result.scalar_one_or_none()

    if not paquete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paquete con ID {paquete_id} no encontrado"
        )

    paquete.activo = False
    await db.commit()


# ========================================================================
# HISTORIAL DE PAGOS
# ========================================================================

@router.get("/pagos", response_model=PagoHistorialResponse)
async def get_pagos_historial(
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Items por página"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (pendiente, completado, fallido)"),
    paquete_id: Optional[int] = Query(None, description="Filtrar por paquete"),
    usuario_email: Optional[str] = Query(None, description="Buscar por email de usuario"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha fin"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener historial de pagos con filtros y paginación
    """
    # Query base
    query = select(PagoConsultas).options(
        selectinload(PagoConsultas.user),
        selectinload(PagoConsultas.paquete_consultas)
    )

    # Aplicar filtros
    filtros = []
    if estado:
        filtros.append(PagoConsultas.estado == estado)
    if paquete_id:
        filtros.append(PagoConsultas.paquete_consultas_id == paquete_id)
    if fecha_desde:
        filtros.append(PagoConsultas.created_at >= fecha_desde)
    if fecha_hasta:
        filtros.append(PagoConsultas.created_at <= fecha_hasta)

    if filtros:
        query = query.where(and_(*filtros))

    # Filtro por email (requiere join)
    if usuario_email:
        query = query.join(User).where(User.email.ilike(f"%{usuario_email}%"))

    # Contar total
    count_query = select(func.count()).select_from(PagoConsultas)
    if filtros:
        count_query = count_query.where(and_(*filtros))
    if usuario_email:
        count_query = count_query.join(User).where(User.email.ilike(f"%{usuario_email}%"))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginación
    offset = (pagina - 1) * por_pagina
    query = query.order_by(desc(PagoConsultas.created_at)).offset(offset).limit(por_pagina)

    result = await db.execute(query)
    pagos = result.scalars().all()

    # Construir response
    pagos_items = [
        PagoHistorialItem(
            id=pago.id,
            custom_id=pago.custom_id,
            usuario_email=pago.user.email,
            paquete_nombre=pago.paquete_consultas.nombre,
            cantidad_consultas=pago.paquete_consultas.cantidad_consultas,
            monto=pago.monto,
            moneda=pago.moneda,
            estado=pago.estado,
            metodo_pago=pago.metodo_pago,
            referencia_externa=pago.referencia_externa,
            created_at=pago.created_at,
            updated_at=pago.updated_at
        )
        for pago in pagos
    ]

    paginas_totales = (total + por_pagina - 1) // por_pagina

    return PagoHistorialResponse(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        paginas_totales=paginas_totales,
        pagos=pagos_items
    )


# ========================================================================
# ESTADÍSTICAS
# ========================================================================

@router.get("/estadisticas", response_model=EstadisticasVentas)
async def get_estadisticas_ventas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener estadísticas generales de ventas
    """
    # Totales generales
    total_query = select(
        func.coalesce(func.sum(PagoConsultas.monto), 0).label('total_ventas'),
        func.count(PagoConsultas.id).label('total_transacciones')
    ).where(PagoConsultas.estado == 'completado')

    result = await db.execute(total_query)
    totales = result.one()

    # Total consultas vendidas
    consultas_query = select(
        func.coalesce(func.sum(PaqueteConsultas.cantidad_consultas), 0)
    ).select_from(PagoConsultas).join(PaqueteConsultas).where(
        PagoConsultas.estado == 'completado'
    )
    consultas_result = await db.execute(consultas_query)
    total_consultas = consultas_result.scalar()

    # Por estado
    estados_query = select(
        PagoConsultas.estado,
        func.count(PagoConsultas.id).label('cantidad')
    ).group_by(PagoConsultas.estado)

    estados_result = await db.execute(estados_query)
    estados_dict = {row.estado: row.cantidad for row in estados_result}

    # Top paquetes
    top_paquetes_query = select(
        PaqueteConsultas.nombre,
        func.count(PagoConsultas.id).label('cantidad_ventas'),
        func.sum(PagoConsultas.monto).label('total_recaudado')
    ).select_from(PagoConsultas).join(PaqueteConsultas).where(
        PagoConsultas.estado == 'completado'
    ).group_by(PaqueteConsultas.nombre).order_by(desc('cantidad_ventas')).limit(5)

    top_result = await db.execute(top_paquetes_query)
    top_paquetes_raw = top_result.all()

    # Calcular porcentajes
    top_paquetes = []
    for paq in top_paquetes_raw:
        porcentaje = (float(paq.total_recaudado) / float(totales.total_ventas) * 100) if totales.total_ventas > 0 else 0
        top_paquetes.append(
            EstadisticasPaquete(
                paquete_nombre=paq.nombre,
                cantidad_ventas=paq.cantidad_ventas,
                total_recaudado=paq.total_recaudado,
                porcentaje_ventas=round(porcentaje, 1)
            )
        )

    # Ventas temporales
    hoy = datetime.utcnow().date()
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    inicio_mes = hoy.replace(day=1)

    # Hoy
    ventas_hoy_query = select(func.coalesce(func.sum(PagoConsultas.monto), 0)).where(
        and_(
            PagoConsultas.estado == 'completado',
            func.date(PagoConsultas.created_at) == hoy
        )
    )
    ventas_hoy_result = await db.execute(ventas_hoy_query)
    ventas_hoy = ventas_hoy_result.scalar()

    # Semana
    ventas_semana_query = select(func.coalesce(func.sum(PagoConsultas.monto), 0)).where(
        and_(
            PagoConsultas.estado == 'completado',
            func.date(PagoConsultas.created_at) >= inicio_semana
        )
    )
    ventas_semana_result = await db.execute(ventas_semana_query)
    ventas_semana = ventas_semana_result.scalar()

    # Mes
    ventas_mes_query = select(func.coalesce(func.sum(PagoConsultas.monto), 0)).where(
        and_(
            PagoConsultas.estado == 'completado',
            func.date(PagoConsultas.created_at) >= inicio_mes
        )
    )
    ventas_mes_result = await db.execute(ventas_mes_query)
    ventas_mes = ventas_mes_result.scalar()

    return EstadisticasVentas(
        total_ventas=Decimal(str(totales.total_ventas)),
        total_transacciones=totales.total_transacciones,
        total_consultas_vendidas=total_consultas or 0,
        pagos_completados=estados_dict.get('completado', 0),
        pagos_pendientes=estados_dict.get('pendiente', 0),
        pagos_fallidos=estados_dict.get('fallido', 0),
        paquete_mas_vendido=top_paquetes[0].paquete_nombre if top_paquetes else None,
        top_paquetes=top_paquetes,
        ventas_hoy=Decimal(str(ventas_hoy)),
        ventas_semana=Decimal(str(ventas_semana)),
        ventas_mes=Decimal(str(ventas_mes))
    )
