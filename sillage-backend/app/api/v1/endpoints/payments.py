"""
Endpoints para sistema de pagos con PayPal
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, Any
import logging
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.api import deps
from app.models.user import User
from app.models.payment import (
    PagoConsultas,
    PaqueteConsultas,
    BotonPago,
    TransaccionConsultas
)
from app.schemas.payment import (
    CrearPagoRequest,
    CrearPagoResponse,
    FormularioPago,
    VerificarPagoResponse,
    ListaPaquetesResponse,
    MisConsultasResponse
)
from app.services.payment_service import payment_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/paquetes", response_model=Dict[str, Any])
async def obtener_paquetes(
    pais_usuario: str = "US",
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener todos los paquetes de consultas disponibles con sus botones de pago

    Args:
        pais_usuario: Código del país del usuario (ej: US, CL, MX)
        db: Sesión de base de datos

    Returns:
        Lista de paquetes con botones de pago y métodos disponibles
    """
    try:
        data = await payment_service.get_paquetes_con_botones(db, pais_usuario.upper())
        return data
    except Exception as e:
        logger.error(f"Error obteniendo paquetes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo paquetes: {str(e)}"
        )


@router.post("/generar-pago", response_model=CrearPagoResponse)
async def generar_pago(
    request: CrearPagoRequest,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Genera formulario HTML de PayPal para procesar el pago

    Flow:
    1. Genera custom_id único (SILL-XXXXXXXXXXXX)
    2. Crea registro PagoConsultas en estado 'pendiente'
    3. Retorna datos del formulario HTML para enviar a PayPal

    Args:
        request: Datos del pago (paquete_id, boton_pago_id, pais_usuario)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Datos del formulario HTML para PayPal
    """
    try:
        logger.info(f"📦 Generando pago | Usuario: {current_user.email} | Paquete: {request.paquete_id}")

        # Validar que exista el paquete
        result_paquete = await db.execute(
            select(PaqueteConsultas).where(
                PaqueteConsultas.id == request.paquete_id,
                PaqueteConsultas.activo == True
            )
        )
        paquete = result_paquete.scalar_one_or_none()
        if not paquete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paquete no encontrado o inactivo"
            )

        # Validar que exista el botón de pago
        result_boton = await db.execute(
            select(BotonPago)
            .where(
                BotonPago.id == request.boton_pago_id,
                BotonPago.paquete_id == paquete.id,
                BotonPago.activo == True
            )
            .options(selectinload(BotonPago.metodo_pago))
        )
        boton_pago = result_boton.scalar_one_or_none()
        if not boton_pago:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Botón de pago no encontrado o inactivo"
            )

        # Verificar disponibilidad para el país
        if not boton_pago.es_disponible_para_pais(request.pais_usuario):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Método de pago no disponible en tu país"
            )

        # ===================================================================
        # PASO 1: GENERAR CUSTOM_ID ÚNICO
        # ===================================================================
        custom_id = PagoConsultas.generar_custom_id()
        logger.info(f"🔑 Custom ID generado: {custom_id}")

        # ===================================================================
        # PASO 2: CREAR REGISTRO DE PAGO PENDIENTE
        # ===================================================================
        nuevo_pago = PagoConsultas(
            user_id=current_user.id,
            paquete_consultas_id=paquete.id,
            boton_pago_id=boton_pago.id,
            monto=paquete.precio,
            moneda=paquete.moneda,
            metodo_pago=boton_pago.metodo_pago.codigo,
            estado='pendiente',
            referencia_externa=custom_id,
            custom_id=custom_id,
            datos_pago={
                'pais_usuario': request.pais_usuario,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': current_user.id,
                'user_email': current_user.email,
                'metodo': 'formulario_paypal'
            }
        )
        db.add(nuevo_pago)
        await db.commit()
        await db.refresh(nuevo_pago)

        logger.info(f"💾 Pago pendiente creado: ID={nuevo_pago.id}, Custom ID={custom_id}")

        # ===================================================================
        # PASO 3: GENERAR DATOS DEL FORMULARIO HTML
        # ===================================================================
        # Construir URL base para redirecciones
        # Usar el backend como intermediario para las redirecciones
        backend_url = str(settings.BACKEND_URL).rstrip('/')

        # URLs de retorno que apuntan al backend
        # El backend luego redirige a la app móvil/web
        return_url = f"{backend_url}/api/v1/payments/paypal-return?ref={custom_id}&source=paypal&status=completed"
        cancel_url = f"{backend_url}/api/v1/payments/paypal-cancel?ref={custom_id}"

        formulario_data = FormularioPago(
            action=settings.PAYPAL_URL,  # https://www.paypal.com/cgi-bin/webscr
            method='POST',
            campos={
                'cmd': '_xclick',  # Tipo de botón PayPal
                'business': settings.PAYPAL_BUSINESS_EMAIL,  # Email de PayPal que recibe pagos
                'item_name': f'Sillage - {paquete.nombre}',
                'item_number': str(paquete.id),
                'amount': str(paquete.precio),
                'currency_code': paquete.moneda,
                'custom': custom_id,  # ← CRÍTICO: Este es el ID que regresa PayPal
                'return': return_url,
                'cancel_return': cancel_url,
                'notify_url': f"{backend_url}/api/v1/payments/webhook/paypal",  # IPN webhook (futuro)
                'rm': '2',  # Return method (POST)
                'no_shipping': '1',  # No pedir dirección de envío
                'no_note': '1',  # No permitir notas
                'charset': 'utf-8'
            }
        )

        logger.info(f"✅ Formulario generado exitosamente para {custom_id}")

        return CrearPagoResponse(
            success=True,
            tipo='formulario',
            formulario=formulario_data,
            custom_id=custom_id,
            paquete_nombre=paquete.nombre,
            monto=str(paquete.precio),
            mensaje="Formulario generado exitosamente"
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"💥 Error generando pago: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando formulario de pago: {str(e)}"
        )


@router.get("/verificar-pago", response_model=VerificarPagoResponse)
async def verificar_pago(
    ref: str,  # custom_id
    source: str = None,  # "paypal"
    status_param: str = Query(None, alias="status"),  # "completed"
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica el estado de un pago usando el custom_id

    Query Parameters:
        - ref: custom_id del pago (ej: "SILL-A1B2C3D4E5F6")
        - source: origen del pago (opcional, "paypal")
        - status: estado reportado (opcional, "completed")

    Returns:
        Estado del pago y detalles si está completado
    """
    try:
        logger.info(f"🔍 Verificando pago | Ref: {ref} | Source: {source} | Status: {status_param}")

        if not ref:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referencia de pago requerida"
            )

        # ===================================================================
        # BUSCAR EL PAGO POR CUSTOM_ID
        # ===================================================================
        result = await db.execute(
            select(PagoConsultas)
            .where(PagoConsultas.custom_id == ref)
            .options(
                selectinload(PagoConsultas.paquete_consultas),
                selectinload(PagoConsultas.user)
            )
        )
        pago = result.scalar_one_or_none()

        if not pago:
            logger.warning(f"⚠️ Pago no encontrado: {ref}")
            return VerificarPagoResponse(
                success=False,
                estado='no_encontrado',
                error='Pago no encontrado',
                mensaje='No se encontró un pago con esta referencia'
            )

        # Verificar que el pago pertenece al usuario autenticado
        if pago.user_id != current_user.id:
            logger.warning(f"⚠️ Usuario {current_user.id} intentó verificar pago de usuario {pago.user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para verificar este pago"
            )

        # ===================================================================
        # CASO 1: PAGO YA COMPLETADO
        # ===================================================================
        if pago.estado == 'completado':
            logger.info(f"✅ Pago ya completado: {ref}")
            return VerificarPagoResponse(
                success=True,
                estado='completado',
                paquete_nombre=pago.paquete_consultas.nombre,
                consultas_agregadas=pago.paquete_consultas.cantidad_consultas,
                consultas_totales=pago.user.consultas_restantes,
                monto=str(pago.monto),
                fecha_pago=pago.updated_at,
                mensaje='Pago completado exitosamente'
            )

        # ===================================================================
        # CASO 2: PAGO PENDIENTE - COMPLETAR SI VIENE DE PAYPAL
        # ===================================================================
        if pago.estado == 'pendiente':
            if source == 'paypal' and status_param == 'completed':
                logger.info(f"🔄 Completando pago pendiente: {ref}")

                # Procesar pago completado
                resultado = await payment_service.procesar_pago_completado(db, pago)

                # Refrescar datos del pago y usuario
                await db.refresh(pago)
                await db.refresh(pago.user)

                return VerificarPagoResponse(
                    success=True,
                    estado='completado',
                    paquete_nombre=pago.paquete_consultas.nombre,
                    consultas_agregadas=resultado['consultas_agregadas'],
                    consultas_totales=resultado['consultas_totales'],
                    monto=str(pago.monto),
                    fecha_pago=pago.updated_at,
                    mensaje='Pago procesado y consultas agregadas exitosamente'
                )
            else:
                # Pago pendiente sin confirmación
                logger.info(f"⏳ Pago pendiente: {ref}")
                return VerificarPagoResponse(
                    success=True,
                    estado='pendiente',
                    mensaje='Verificando pago...'
                )

        # ===================================================================
        # CASO 3: OTROS ESTADOS (fallido, reembolsado)
        # ===================================================================
        logger.warning(f"⚠️ Pago en estado {pago.estado}: {ref}")
        return VerificarPagoResponse(
            success=False,
            estado=pago.estado,
            error=f'El pago está en estado: {pago.estado}',
            mensaje=f'El pago no pudo completarse. Estado: {pago.estado}'
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error verificando pago {ref}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verificando pago: {str(e)}"
        )


@router.api_route("/paypal-return", methods=["GET", "POST"])
async def paypal_return(
    request: Request,
    ref: str = None,
    source: str = None,
    status: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint de retorno exitoso de PayPal.
    Redirige directamente al frontend.
    """
    try:
        # Si viene por POST (rm=2), leer ref del form data
        if request.method == "POST" and not ref:
            form_data = await request.form()
            ref = form_data.get("custom") or form_data.get("ref") or ""
            source = source or "paypal"
            status = status or "completed"

        logger.info(f"✅ PayPal return | Method: {request.method} | Ref: {ref} | Source: {source} | Status: {status}")

        frontend_url = str(settings.FRONTEND_URL).rstrip('/')
        redirect_url = f"{frontend_url}/payment/success?ref={ref}&source={source or 'paypal'}&status={status or 'completed'}"

        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        logger.error(f"💥 Error en PayPal return: {str(e)}")
        frontend_url = str(settings.FRONTEND_URL).rstrip('/')
        return RedirectResponse(url=f"{frontend_url}/payment/error", status_code=302)


@router.get("/paypal-cancel")
async def paypal_cancel(
    ref: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint de cancelación de PayPal.
    Redirige directamente al frontend.
    """
    try:
        logger.info(f"❌ PayPal cancel | Ref: {ref}")

        # Actualizar el estado del pago a "cancelado"
        try:
            result = await db.execute(
                select(PagoConsultas).where(PagoConsultas.custom_id == ref)
            )
            pago = result.scalar_one_or_none()

            if pago and pago.estado == 'pendiente':
                pago.estado = 'cancelado'
                pago.datos_pago = {
                    **(pago.datos_pago or {}),
                    'cancelado_en': datetime.utcnow().isoformat(),
                    'razon': 'usuario_cancelo_en_paypal'
                }
                await db.commit()
                logger.info(f"💾 Pago {ref} marcado como cancelado")
        except Exception as db_error:
            logger.error(f"Error actualizando pago cancelado: {db_error}")
            await db.rollback()

        frontend_url = str(settings.FRONTEND_URL).rstrip('/')
        redirect_url = f"{frontend_url}/payment/cancel?ref={ref}"

        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        logger.error(f"💥 Error en PayPal cancel: {str(e)}")
        frontend_url = str(settings.FRONTEND_URL).rstrip('/')
        return RedirectResponse(url=f"{frontend_url}/payment/cancel?ref={ref or 'unknown'}", status_code=302)


@router.get("/mis-consultas", response_model=Dict[str, Any])
async def obtener_mis_consultas(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener información de consultas del usuario actual

    Returns:
        - consultas_disponibles: Número de consultas restantes
        - historial_compras: Últimas 10 compras
        - historial_transacciones: Últimas 20 transacciones
    """
    try:
        # Consultas disponibles
        result_user = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result_user.scalar_one()

        # Historial de compras
        result_pagos = await db.execute(
            select(PagoConsultas)
            .where(PagoConsultas.user_id == current_user.id)
            .order_by(PagoConsultas.created_at.desc())
            .limit(10)
            .options(selectinload(PagoConsultas.paquete_consultas))
        )
        pagos = result_pagos.scalars().all()

        # Historial de transacciones
        result_transacciones = await db.execute(
            select(TransaccionConsultas)
            .where(TransaccionConsultas.user_id == current_user.id)
            .order_by(TransaccionConsultas.created_at.desc())
            .limit(20)
        )
        transacciones = result_transacciones.scalars().all()

        return {
            'consultas_disponibles': user.consultas_restantes,
            'historial_compras': [
                {
                    'id': p.id,
                    'custom_id': p.custom_id,
                    'paquete_nombre': p.paquete_consultas.nombre,
                    'consultas': p.paquete_consultas.cantidad_consultas,
                    'monto': float(p.monto),
                    'moneda': p.moneda,
                    'estado': p.estado,
                    'metodo_pago': p.metodo_pago,
                    'fecha': p.created_at
                } for p in pagos
            ],
            'historial_transacciones': [
                {
                    'id': t.id,
                    'tipo': t.tipo,
                    'cantidad': t.cantidad,
                    'descripcion': t.descripcion,
                    'fecha': t.created_at
                } for t in transacciones
            ]
        }

    except Exception as e:
        logger.error(f"Error obteniendo consultas de usuario {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo información de consultas: {str(e)}"
        )
