import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def update_test_user():
    """Actualizar usuario de prueba con suscripción y consultas"""
    async with AsyncSessionLocal() as db:
        # Actualizar el usuario test3@example.com
        await db.execute(
            update(User)
            .where(User.email == "test3@example.com")
            .values(
                suscrito=True,
                consultas_restantes=30
            )
        )
        await db.commit()
        print("✅ Usuario actualizado con suscripción y 30 consultas")

if __name__ == "__main__":
    asyncio.run(update_test_user())