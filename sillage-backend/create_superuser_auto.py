#!/usr/bin/env python3
"""
Script no interactivo para crear un superusuario en Sillage
Uso: python create_superuser_auto.py <email> <password> [first_name] [last_name]
"""

import sys
import asyncio
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.role import Role, user_roles
from app.core.security import get_password_hash
from app.core.permissions import initialize_default_roles


async def create_superuser_auto(email: str, password: str, first_name: str = "Admin", last_name: str = "Sillage"):
    """Crear un superusuario de forma automática (no interactiva)"""

    async with AsyncSessionLocal() as db:
        try:
            # Inicializar roles predeterminados si no existen
            print("🔧 Inicializando roles predeterminados...")
            await initialize_default_roles(db)

            # Verificar si el email ya existe
            stmt = select(User).where(User.email == email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # Convertir usuario existente en superusuario
                print(f"ℹ️  Usuario '{email}' ya existe. Actualizando a superusuario...")
                existing_user.is_admin = True
                existing_user.is_superuser = True
                existing_user.is_active = True
                existing_user.is_verified = True
                existing_user.hashed_password = get_password_hash(password)

                # Asignar rol de superadmin
                superadmin_stmt = select(Role).where(Role.name == "superadmin")
                role_result = await db.execute(superadmin_stmt)
                superadmin_role = role_result.scalar_one_or_none()

                if superadmin_role:
                    # Verificar si ya tiene el rol
                    check_role_stmt = select(user_roles).where(
                        user_roles.c.user_id == existing_user.id,
                        user_roles.c.role_id == superadmin_role.id
                    )
                    check_result = await db.execute(check_role_stmt)
                    has_role = check_result.first()

                    if not has_role:
                        # Insertar rol
                        insert_role_stmt = insert(user_roles).values(
                            user_id=existing_user.id,
                            role_id=superadmin_role.id
                        )
                        await db.execute(insert_role_stmt)

                await db.commit()
                print(f"✅ Usuario '{email}' actualizado como superusuario exitosamente")
                return

            # Hash de la contraseña
            hashed_password = get_password_hash(password)

            # Crear el nuevo usuario
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                hashed_password=hashed_password,
                is_active=True,
                is_verified=True,
                is_admin=True,
                is_superuser=True,
                suscrito=False,
                consultas_restantes=0
            )

            db.add(new_user)
            await db.flush()  # Para obtener el ID

            # Asignar rol de superadmin
            superadmin_stmt = select(Role).where(Role.name == "superadmin")
            role_result = await db.execute(superadmin_stmt)
            superadmin_role = role_result.scalar_one_or_none()

            if superadmin_role:
                insert_role_stmt = insert(user_roles).values(
                    user_id=new_user.id,
                    role_id=superadmin_role.id
                )
                await db.execute(insert_role_stmt)
            else:
                print("⚠️  Advertencia: No se encontró el rol 'superadmin'. El usuario tendrá privilegios de superusuario pero sin rol asignado.")

            await db.commit()

            print()
            print("✅ SUPERUSUARIO CREADO EXITOSAMENTE")
            print(f"📧 Email: {email}")
            print(f"👤 Nombre: {first_name} {last_name}")
            print(f"🔑 ID: {new_user.id}")
            print(f"🛡️  Privilegios: Superusuario (acceso completo)")
            print()

        except Exception as e:
            print(f"❌ Error al crear superusuario: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


async def main():
    """Función principal"""
    if len(sys.argv) < 3:
        print("Uso: python create_superuser_auto.py <email> <password> [first_name] [last_name]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    first_name = sys.argv[3] if len(sys.argv) > 3 else "Admin"
    last_name = sys.argv[4] if len(sys.argv) > 4 else "Sillage"

    await create_superuser_auto(email, password, first_name, last_name)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Operación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
