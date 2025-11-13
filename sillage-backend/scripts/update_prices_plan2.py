"""
Script para actualizar precios a Plan 2
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.payment import PaqueteConsultas


async def update_prices():
    """Actualizar precios de paquetes al Plan 2"""

    async with AsyncSessionLocal() as db:
        try:
            print("=" * 80)
            print("🔄 ACTUALIZANDO PRECIOS A PLAN 2")
            print("=" * 80)

            # Actualizar Paquete Básico
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Básico')
                .values(
                    precio=2.99,
                    precio_anterior=None
                )
            )
            print("✅ Paquete Básico: $2.99 (5 consultas)")

            # Actualizar Paquete Popular
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Popular')
                .values(
                    precio=6.99,
                    precio_anterior=8.99
                )
            )
            print("✅ Paquete Popular: $6.99 (15 consultas) - antes $8.99")

            # Actualizar Paquete Premium
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Premium')
                .values(
                    precio=9.99,
                    precio_anterior=14.99
                )
            )
            print("✅ Paquete Premium: $9.99 (30 consultas) - antes $14.99")

            await db.commit()

            print("\n" + "=" * 80)
            print("✅ PRECIOS ACTUALIZADOS EXITOSAMENTE")
            print("=" * 80)

        except Exception as e:
            await db.rollback()
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    print("\n🚀 Actualizando precios...\n")
    asyncio.run(update_prices())
    print("\n✅ Script completado\n")
