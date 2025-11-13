"""
Servicio de procesamiento de pagos y gestión de consultas
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update as sql_update
from sqlalchemy.orm import selectinload
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from app.models.payment import (
    PagoConsultas,
    PaqueteConsultas,
    MetodoPago,
    BotonPago,
    TransaccionConsultas
)
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)


class PaymentService:
    """Servicio para manejar toda la lógica de pagos y consultas"""

    @staticmethod
    async def get_paquetes_con_botones(
        db: AsyncSession,
        pais_usuario: str = "US"
    ) -> Dict[str, Any]:
        """
        Obtener todos los paquetes activos con sus botones de pago disponibles

        Args:
            db: Sesión de base de datos
            pais_usuario: Código del país del usuario (ej: "US", "CL")

        Returns:
            Dict con paquetes y métodos de pago
        """
        try:
            # Obtener paquetes activos ordenados por precio
            result = await db.execute(
                select(PaqueteConsultas)
                .where(PaqueteConsultas.activo == True)
                .order_by(PaqueteConsultas.precio)
                .options(selectinload(PaqueteConsultas.botones_pago))
            )
            paquetes = result.scalars().all()

            # Obtener métodos de pago activos
            result_metodos = await db.execute(
                select(MetodoPago)
                .where(MetodoPago.activo == True)
                .order_by(MetodoPago.orden)
            )
            metodos = result_metodos.scalars().all()

            # Construir respuesta con paquetes y sus botones
            paquetes_data = []
            for paquete in paquetes:
                # Filtrar botones disponibles para el país
                botones_disponibles = []
                for boton in paquete.botones_pago:
                    if boton.es_disponible_para_pais(pais_usuario):
                        botones_disponibles.append({
                            'id': boton.id,
                            'metodo_pago': {
                                'id': boton.metodo_pago.id,
                                'nombre': boton.metodo_pago.nombre,
                                'codigo': boton.metodo_pago.codigo,
                                'icono': boton.metodo_pago.icono,
                                'color_boton': boton.metodo_pago.color_boton
                            }
                        })

                if botones_disponibles:  # Solo incluir paquetes con botones disponibles
                    paquetes_data.append({
                        'id': paquete.id,
                        'nombre': paquete.nombre,
                        'descripcion': paquete.descripcion,
                        'cantidad_consultas': paquete.cantidad_consultas,
                        'precio': float(paquete.precio),
                        'precio_anterior': float(paquete.precio_anterior) if paquete.precio_anterior else None,
                        'moneda': paquete.moneda,
                        'destacado': paquete.destacado,
                        'precio_por_consulta': paquete.precio_por_consulta,
                        'tiene_descuento': paquete.tiene_descuento,
                        'porcentaje_descuento': paquete.porcentaje_descuento,
                        'botones_pago': botones_disponibles
                    })

            return {
                'paquetes': paquetes_data,
                'metodos_pago': [
                    {
                        'id': m.id,
                        'nombre': m.nombre,
                        'codigo': m.codigo,
                        'descripcion': m.descripcion,
                        'icono': m.icono,
                        'color_boton': m.color_boton
                    } for m in metodos if m.soporta_pais(pais_usuario)
                ]
            }

        except Exception as e:
            logger.error(f"Error obteniendo paquetes con botones: {str(e)}")
            raise

    @staticmethod
    async def procesar_pago_completado(
        db: AsyncSession,
        pago: PagoConsultas
    ) -> Dict[str, Any]:
        """
        Procesar un pago como completado y agregar consultas al usuario

        Esta función es ATÓMICA: o todo se ejecuta correctamente o nada se ejecuta

        Args:
            db: Sesión de base de datos
            pago: Instancia de PagoConsultas

        Returns:
            Dict con información del procesamiento
        """
        try:
            # Validación: Verificar que no esté ya completado
            if pago.estado == 'completado':
                logger.info(f"ℹ️ Pago {pago.custom_id} ya estaba completado")

                # Obtener user con consultas actuales
                result = await db.execute(
                    select(User).where(User.id == pago.user_id)
                )
                user = result.scalar_one()

                return {
                    'ya_completado': True,
                    'consultas_agregadas': pago.paquete_consultas.cantidad_consultas,
                    'consultas_totales': user.consultas_restantes
                }

            logger.info(f"🔄 Procesando pago como completado: {pago.custom_id}")

            # Cargar relaciones necesarias
            result = await db.execute(
                select(PagoConsultas)
                .where(PagoConsultas.id == pago.id)
                .options(
                    selectinload(PagoConsultas.paquete_consultas),
                    selectinload(PagoConsultas.user)
                )
            )
            pago = result.scalar_one()

            # PASO 1: Actualizar estado del pago
            pago.estado = 'completado'
            await db.flush()

            # PASO 2: Agregar consultas al usuario
            consultas_antes = pago.user.consultas_restantes
            consultas_a_agregar = pago.paquete_consultas.cantidad_consultas

            # Actualizar usando UPDATE directo (más confiable)
            await db.execute(
                sql_update(User)
                .where(User.id == pago.user_id)
                .values(consultas_restantes=User.consultas_restantes + consultas_a_agregar)
            )

            consultas_despues = consultas_antes + consultas_a_agregar

            # PASO 3: Crear registro de auditoría
            # Verificar que no exista ya
            result_transaccion = await db.execute(
                select(TransaccionConsultas)
                .where(
                    TransaccionConsultas.user_id == pago.user_id,
                    TransaccionConsultas.tipo == 'compra',
                    TransaccionConsultas.paquete_consultas_id == pago.paquete_consultas_id,
                    TransaccionConsultas.descripcion.contains(pago.custom_id)
                )
            )
            transaccion_existente = result_transaccion.scalar_one_or_none()

            if not transaccion_existente:
                nueva_transaccion = TransaccionConsultas(
                    user_id=pago.user_id,
                    tipo='compra',
                    cantidad=consultas_a_agregar,
                    descripcion=f'Compra de {pago.paquete_consultas.nombre} vía {pago.metodo_pago} - Ref: {pago.custom_id}',
                    paquete_consultas_id=pago.paquete_consultas_id
                )
                db.add(nueva_transaccion)
                logger.info(f"📝 Transacción registrada para {pago.custom_id}")
            else:
                logger.info(f"ℹ️ Transacción ya existía para {pago.custom_id}")

            # Commit de toda la transacción
            await db.commit()

            # Logging final
            logger.info(
                f"✅ Pago {pago.custom_id} completado | "
                f"Usuario: {pago.user.email} | "
                f"Consultas: {consultas_antes} → {consultas_despues}"
            )

            return {
                'ya_completado': False,
                'consultas_agregadas': consultas_a_agregar,
                'consultas_totales': consultas_despues
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"💥 Error procesando pago completado {pago.custom_id}: {str(e)}")
            import traceback
            logger.error(f"💥 Traceback: {traceback.format_exc()}")
            raise

    @staticmethod
    async def registrar_uso_consulta(
        db: AsyncSession,
        user_id: int,
        descripcion: str = "Consulta de recomendación de perfume"
    ) -> bool:
        """
        Descontar una consulta al usuario y registrar en auditoría

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            descripcion: Descripción de la consulta

        Returns:
            True si se descontó exitosamente, False si no tiene consultas
        """
        try:
            # Obtener usuario
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one()

            # Verificar que tenga consultas disponibles
            if user.consultas_restantes <= 0:
                logger.warning(f"⚠️ Usuario {user.email} sin consultas disponibles")
                return False

            # Descontar consulta
            await db.execute(
                sql_update(User)
                .where(User.id == user_id)
                .values(consultas_restantes=User.consultas_restantes - 1)
            )

            # Registrar en auditoría
            transaccion = TransaccionConsultas(
                user_id=user_id,
                tipo='uso',
                cantidad=-1,  # Negativo porque se descuenta
                descripcion=descripcion
            )
            db.add(transaccion)

            await db.commit()

            logger.info(f"✅ Consulta descontada | Usuario: {user.email} | Restantes: {user.consultas_restantes - 1}")
            return True

        except Exception as e:
            await db.rollback()
            logger.error(f"💥 Error descontando consulta para usuario {user_id}: {str(e)}")
            raise


# Instancia global del servicio
payment_service = PaymentService()
