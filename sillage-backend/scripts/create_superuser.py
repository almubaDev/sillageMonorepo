#!/usr/bin/env python3
"""
Script para crear un superusuario en Sillage
Uso: python scripts/create_superuser.py
"""

import sys
import asyncio
import getpass
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.role import Role, user_roles
from app.core.security import get_password_hash
from app.core.permissions import initialize_default_roles, DEFAULT_ROLES


async def create_superuser():
    """Crear un superusuario de forma interactiva"""
    print("=" * 60)
    print("🔐  CREAR SUPERUSUARIO PARA SILLAGE ADMIN")
    print("=" * 60)
    print()

    # Solicitar información del usuario
    email = input("📧 Email: ").strip()
    if not email or "@" not in email:
        print("❌ Error: Email inválido")
        return

    first_name = input("👤 Nombre: ").strip()
    if not first_name:
        print("❌ Error: El nombre es requerido")
        return

    last_name = input("👤 Apellido: ").strip()
    if not last_name:
        print("❌ Error: El apellido es requerido")
        return

    password = getpass.getpass("🔑 Password: ")
    if len(password) < 8:
        print("❌ Error: La contraseña debe tener al menos 8 caracteres")
        return

    password_confirm = getpass.getpass("🔑 Confirmar password: ")
    if password != password_confirm:
        print("❌ Error: Las contraseñas no coinciden")
        return

    print()
    print("📋 Resumen del superusuario a crear:")
    print(f"   Email: {email}")
    print(f"   Nombre: {first_name} {last_name}")
    print(f"   Privilegios: Superusuario (acceso completo)")
    print()

    confirm = input("¿Confirmar creación? (s/n): ").strip().lower()
    if confirm not in ["s", "si", "y", "yes"]:
        print("❌ Operación cancelada")
        return

    print()
    print("⏳ Creando superusuario...")

    # Crear sesión de base de datos
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
                print(f"❌ Error: Ya existe un usuario con el email '{email}'")

                # Ofrecer convertir usuario existente en superusuario
                convert = input("¿Convertir este usuario en superusuario? (s/n): ").strip().lower()
                if convert in ["s", "si", "y", "yes"]:
                    existing_user.is_admin = True
                    existing_user.is_superuser = True
                    existing_user.is_active = True
                    existing_user.is_verified = True

                    # Asignar rol de superadmin usando SQL directo
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
                            # Insertar rol usando SQL directo
                            insert_role_stmt = insert(user_roles).values(
                                user_id=existing_user.id,
                                role_id=superadmin_role.id
                            )
                            await db.execute(insert_role_stmt)

                    await db.commit()
                    print(f"✅ Usuario '{email}' convertido en superusuario exitosamente")
                else:
                    print("❌ Operación cancelada")
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

            # Asignar rol de superadmin usando SQL directo
            superadmin_stmt = select(Role).where(Role.name == "superadmin")
            role_result = await db.execute(superadmin_stmt)
            superadmin_role = role_result.scalar_one_or_none()

            if superadmin_role:
                # Insertar en la tabla de asociación usando SQL directo
                insert_role_stmt = insert(user_roles).values(
                    user_id=new_user.id,
                    role_id=superadmin_role.id
                )
                await db.execute(insert_role_stmt)
            else:
                print("⚠️  Advertencia: No se encontró el rol 'superadmin'. El usuario tendrá privilegios de superusuario pero sin rol asignado.")

            await db.commit()

            print()
            print("=" * 60)
            print("✅ SUPERUSUARIO CREADO EXITOSAMENTE")
            print("=" * 60)
            print(f"📧 Email: {email}")
            print(f"👤 Nombre: {first_name} {last_name}")
            print(f"🔑 ID: {new_user.id}")
            print(f"🛡️  Privilegios: Superusuario (acceso completo)")
            if superadmin_role:
                print(f"👥 Rol: superadmin")
            print()
            print("💡 Ahora puedes iniciar sesión en el panel administrativo con estas credenciales.")
            print()

        except Exception as e:
            print(f"❌ Error al crear superusuario: {str(e)}")
            import traceback
            traceback.print_exc()


async def list_superusers():
    """Listar todos los superusuarios existentes"""
    print("=" * 60)
    print("👥 SUPERUSUARIOS EXISTENTES")
    print("=" * 60)
    print()

    async with AsyncSessionLocal() as db:
        try:
            stmt = select(User).where(User.is_superuser == True)
            result = await db.execute(stmt)
            superusers = result.scalars().all()

            if not superusers:
                print("ℹ️  No hay superusuarios registrados")
                return

            for i, user in enumerate(superusers, 1):
                print(f"{i}. {user.email}")
                print(f"   Nombre: {user.first_name} {user.last_name}")
                print(f"   ID: {user.id}")
                print(f"   Activo: {'Sí' if user.is_active else 'No'}")
                print(f"   Verificado: {'Sí' if user.is_verified else 'No'}")
                print()

        except Exception as e:
            print(f"❌ Error al listar superusuarios: {str(e)}")


def show_menu():
    """Mostrar menú principal"""
    print()
    print("=" * 60)
    print("🔧 GESTIÓN DE SUPERUSUARIOS - SILLAGE")
    print("=" * 60)
    print()
    print("1. Crear nuevo superusuario")
    print("2. Listar superusuarios existentes")
    print("3. Salir")
    print()


async def main():
    """Función principal"""
    while True:
        show_menu()
        option = input("Selecciona una opción (1-3): ").strip()

        if option == "1":
            print()
            await create_superuser()
        elif option == "2":
            print()
            await list_superusers()
        elif option == "3":
            print("👋 Hasta luego!")
            break
        else:
            print("❌ Opción inválida. Por favor selecciona 1, 2 o 3.")

        input("\nPresiona Enter para continuar...")


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
