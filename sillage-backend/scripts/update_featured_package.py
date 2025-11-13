"""
Script para actualizar paquete destacado
Cambiar de Paquete Popular a Paquete Premium
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


async def update_featured():
    """Actualizar paquete destacado de Popular a Premium"""

    async with AsyncSessionLocal() as db:
        try:
            print("=" * 80)
            print("🔄 ACTUALIZANDO PAQUETE DESTACADO")
            print("=" * 80)

            # Quitar destacado del Paquete Popular
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Popular')
                .values(destacado=False)
            )
            print("✅ Paquete Popular: destacado = False")

            # Poner destacado en el Paquete Premium
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Premium')
                .values(destacado=True)
            )
            print("✅ Paquete Premium: destacado = True")

            await db.commit()

            print("\n" + "=" * 80)
            print("✅ PAQUETE DESTACADO ACTUALIZADO EXITOSAMENTE")
            print("=" * 80)

        except Exception as e:
            await db.rollback()
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    print("\n🚀 Actualizando paquete destacado...\n")
    asyncio.run(update_featured())
    print("\n✅ Script completado\n")
