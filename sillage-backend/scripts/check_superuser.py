"""
Script para verificar usuarios superusuarios
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User


async def check_superusers():
    """Verificar usuarios superusuarios en la base de datos"""

    async with AsyncSessionLocal() as db:
        try:
            print("=" * 80)
            print("🔍 VERIFICANDO USUARIOS SUPERUSUARIOS")
            print("=" * 80)

            # Buscar todos los usuarios
            result = await db.execute(
                select(User).order_by(User.id)
            )
            users = result.scalars().all()

            if not users:
                print("\n❌ No hay usuarios en la base de datos")
                return

            print(f"\n📋 Total de usuarios: {len(users)}\n")

            superusers = []
            admins = []
            regular_users = []

            for user in users:
                status_flags = []
                if user.is_superuser:
                    status_flags.append("SUPERUSER")
                    superusers.append(user)
                if user.is_admin:
                    status_flags.append("ADMIN")
                    admins.append(user)
                if not user.is_superuser and not user.is_admin:
                    regular_users.append(user)

                status = " + ".join(status_flags) if status_flags else "USUARIO REGULAR"
                active_status = "✅ ACTIVO" if user.is_active else "❌ INACTIVO"

                print(f"ID: {user.id}")
                print(f"Email: {user.email}")
                print(f"Nombre: {user.first_name} {user.last_name}")
                print(f"Estado: {active_status}")
                print(f"Permisos: {status}")
                print(f"is_superuser: {user.is_superuser}")
                print(f"is_admin: {user.is_admin}")
                print("-" * 80)

            print("\n" + "=" * 80)
            print("📊 RESUMEN")
            print("=" * 80)
            print(f"👑 Superusuarios: {len(superusers)}")
            print(f"🛡️  Administradores: {len(admins)}")
            print(f"👤 Usuarios regulares: {len(regular_users)}")

            if not superusers:
                print("\n⚠️  NO HAY SUPERUSUARIOS EN LA BASE DE DATOS")
                print("📝 Ejecuta 'python scripts/create_superuser.py' para crear uno")

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    print("\n🚀 Iniciando verificación...\n")
    asyncio.run(check_superusers())
    print("\n✅ Verificación completada\n")
