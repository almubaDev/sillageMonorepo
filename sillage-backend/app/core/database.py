from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# Convertir la URL de PostgreSQL para async
DATABASE_URL = str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")

# Crear el engine async
engine = create_async_engine(
    DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "local" else False,
    pool_size=10,
    max_overflow=20,
)

# Crear el sessionmaker async
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base para los modelos
Base = declarative_base()

# Dependency para obtener la sesión
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()