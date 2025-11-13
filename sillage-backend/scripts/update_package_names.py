"""
Script para actualizar nombres de paquetes a temática de perfumes
Paquete Básico → Essence
Paquete Popular → Sillage
Paquete Premium → Signature
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


async def update_package_names():
    """Actualizar nombres de paquetes a temática de perfumes"""

    async with AsyncSessionLocal() as db:
        try:
            print("=" * 80)
            print("🔄 ACTUALIZANDO NOMBRES DE PAQUETES")
            print("=" * 80)

            # Actualizar Paquete Básico → Essence
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Básico')
                .values(nombre='Essence')
            )
            print("✅ 'Paquete Básico' → 'Essence'")

            # Actualizar Paquete Popular → Sillage
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Popular')
                .values(nombre='Sillage')
            )
            print("✅ 'Paquete Popular' → 'Sillage'")

            # Actualizar Paquete Premium → Signature
            await db.execute(
                update(PaqueteConsultas)
                .where(PaqueteConsultas.nombre == 'Paquete Premium')
                .values(nombre='Signature')
            )
            print("✅ 'Paquete Premium' → 'Signature'")

            await db.commit()

            # Verificar los cambios
            print("\n📋 Verificando cambios...")
            result = await db.execute(
                select(PaqueteConsultas).order_by(PaqueteConsultas.id)
            )
            paquetes = result.scalars().all()

            print("\n📦 Paquetes actualizados:")
            for p in paquetes:
                destacado = " ⭐ (Más Conveniente)" if p.destacado else ""
                print(f"  • {p.nombre} - {p.cantidad_consultas} consultas - ${p.precio}{destacado}")

            print("\n" + "=" * 80)
            print("✅ NOMBRES ACTUALIZADOS EXITOSAMENTE")
            print("=" * 80)

        except Exception as e:
            await db.rollback()
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    print("\n🚀 Actualizando nombres de paquetes...\n")
    asyncio.run(update_package_names())
    print("\n✅ Script completado\n")
