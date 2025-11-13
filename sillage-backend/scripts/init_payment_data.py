"""
Script para inicializar datos del sistema de pagos

Crea:
- Método de pago PayPal
- 3 paquetes de consultas (Básico, Popular, Premium)
- Botones de pago asociados
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.payment import MetodoPago, PaqueteConsultas, BotonPago


async def init_payment_data():
    """Inicializar datos del sistema de pagos"""

    async with AsyncSessionLocal() as db:
        try:
            print("=" * 80)
            print("🚀 INICIALIZANDO SISTEMA DE PAGOS")
            print("=" * 80)

            # ===================================================================
            # 1. CREAR MÉTODO DE PAGO: PAYPAL
            # ===================================================================
            print("\n📦 Creando método de pago PayPal...")

            # Verificar si ya existe
            result = await db.execute(
                select(MetodoPago).where(MetodoPago.codigo == 'paypal')
            )
            paypal = result.scalar_one_or_none()

            if not paypal:
                paypal = MetodoPago(
                    nombre="PayPal",
                    codigo="paypal",
                    descripcion="Paga con tarjeta de crédito/débito o cuenta PayPal",
                    icono="fab fa-paypal",
                    color_boton="#0070ba",
                    paises_soportados=["GLOBAL"],  # Disponible en todos los países
                    activo=True,
                    orden=1
                )
                db.add(paypal)
                await db.flush()
                print(f"✅ PayPal creado (ID: {paypal.id})")
            else:
                print(f"ℹ️ PayPal ya existe (ID: {paypal.id})")

            # ===================================================================
            # 2. CREAR PAQUETES DE CONSULTAS
            # ===================================================================
            print("\n📦 Creando paquetes de consultas...")

            paquetes_data = [
                {
                    'nombre': 'Essence',
                    'descripcion': 'Ideal para probar el servicio',
                    'cantidad_consultas': 5,
                    'precio': 2.99,
                    'precio_anterior': None,
                    'moneda': 'USD',
                    'destacado': False
                },
                {
                    'nombre': 'Sillage',
                    'descripcion': 'El más elegido por nuestros usuarios',
                    'cantidad_consultas': 15,
                    'precio': 6.99,
                    'precio_anterior': 8.99,  # 22% descuento
                    'moneda': 'USD',
                    'destacado': False
                },
                {
                    'nombre': 'Signature',
                    'descripcion': 'Para los apasionados de los perfumes',
                    'cantidad_consultas': 30,
                    'precio': 9.99,
                    'precio_anterior': 14.99,  # 33% descuento
                    'moneda': 'USD',
                    'destacado': True
                }
            ]

            paquetes_creados = []

            for paquete_data in paquetes_data:
                # Verificar si ya existe
                result = await db.execute(
                    select(PaqueteConsultas).where(
                        PaqueteConsultas.nombre == paquete_data['nombre']
                    )
                )
                paquete = result.scalar_one_or_none()

                if not paquete:
                    paquete = PaqueteConsultas(**paquete_data)
                    db.add(paquete)
                    await db.flush()
                    print(f"✅ {paquete.nombre} creado (ID: {paquete.id}) - {paquete.cantidad_consultas} consultas por ${paquete.precio}")
                else:
                    print(f"ℹ️ {paquete.nombre} ya existe (ID: {paquete.id})")

                paquetes_creados.append(paquete)

            # ===================================================================
            # 3. CREAR BOTONES DE PAGO
            # ===================================================================
            print("\n📦 Creando botones de pago...")

            for paquete in paquetes_creados:
                # Verificar si ya existe el botón
                result = await db.execute(
                    select(BotonPago).where(
                        BotonPago.paquete_id == paquete.id,
                        BotonPago.metodo_pago_id == paypal.id
                    )
                )
                boton = result.scalar_one_or_none()

                if not boton:
                    boton = BotonPago(
                        paquete_id=paquete.id,
                        metodo_pago_id=paypal.id,
                        activo=True
                    )
                    db.add(boton)
                    await db.flush()
                    print(f"✅ Botón PayPal creado para {paquete.nombre} (ID: {boton.id})")
                else:
                    print(f"ℹ️ Botón PayPal ya existe para {paquete.nombre} (ID: {boton.id})")

            # Commit final
            await db.commit()

            print("\n" + "=" * 80)
            print("✅ SISTEMA DE PAGOS INICIALIZADO EXITOSAMENTE")
            print("=" * 80)
            print("\n📊 RESUMEN:")
            print(f"  • Métodos de pago: 1 (PayPal)")
            print(f"  • Paquetes creados: {len(paquetes_creados)}")
            print(f"  • Botones de pago: {len(paquetes_creados)}")
            print("\n🎯 PRÓXIMOS PASOS:")
            print("  1. Verificar que el backend esté corriendo")
            print("  2. Probar endpoint: GET /api/v1/payments/paquetes")
            print("  3. Implementar frontend mobile")
            print("  4. Probar flujo completo de pago")
            print("\n")

        except Exception as e:
            await db.rollback()
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    print("\n🚀 Iniciando script de inicialización de pagos...\n")
    asyncio.run(init_payment_data())
    print("✅ Script completado\n")
