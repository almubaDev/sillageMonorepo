"""
Pytest configuration and fixtures for testing
"""
import pytest
import os
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.api.deps import get_db
from app.models.user import User
from app.models.perfume import Perfume
from app.models.recommendation import Recomendacion
from app.core.security import get_password_hash

# Use in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session"""
    async def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user with subscription"""
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        suscrito=True,  # Enable subscription for tests
        consultas_restantes=10
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_token(client: AsyncClient, test_user):
    """Get authentication token for test user"""
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def auth_headers(auth_token):
    """Get authorization headers with token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
async def test_perfume(db_session: AsyncSession, test_user):
    """Create a test perfume and add to user's collection"""
    from sqlalchemy import insert
    from app.models.perfume import perfume_collection

    perfume = Perfume(
        nombre="Test Perfume",
        marca="Test Brand",
        perfumista="Test Perfumista",
        notas={
            "salida": ["Rose", "Jasmine"],
            "corazon": ["Lily", "Violet"],
            "fondo": ["Musk", "Amber"]
        },
        acordes=["Floral", "Woody"],
        is_private=False,
        created_by=test_user.id
    )
    db_session.add(perfume)
    await db_session.commit()
    await db_session.refresh(perfume)

    # Add perfume to user's collection
    await db_session.execute(
        insert(perfume_collection).values(
            user_id=test_user.id,
            perfume_id=perfume.id
        )
    )
    await db_session.commit()

    return perfume


@pytest.fixture
async def test_recommendation(db_session: AsyncSession, test_user, test_perfume):
    """Create a test recommendation"""
    from datetime import date, time
    recommendation = Recomendacion(
        user_id=test_user.id,
        perfume_recomendado_id=test_perfume.id,
        fecha_evento=date(2025, 1, 15),
        hora_evento=time(14, 0),
        lugar_nombre="Café",
        lugar_tipo="cerrado",
        ocasion="Casual meeting",
        expectativa="Confidence",
        vestimenta="Smart casual",
        latitud=40.7128,
        longitud=-74.0060,
        explicacion="Perfect for a casual afternoon meeting."
    )
    db_session.add(recommendation)
    await db_session.commit()
    await db_session.refresh(recommendation)
    return recommendation


# Mock environment variables for testing
@pytest.fixture(autouse=True)
def setup_env_vars(monkeypatch):
    """Setup environment variables for testing"""
    os.environ["GEMINI_API_KEY"] = "test_api_key"
    os.environ["SECRET_KEY"] = "test_secret_key_for_testing_purposes_only"
    os.environ["ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["REDIS_URL"] = "redis://localhost:6379"
    os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test"
    os.environ["ENVIRONMENT"] = "test"

    # Mock the cache to avoid Redis connection
    from unittest.mock import MagicMock, AsyncMock
    mock_cache = MagicMock()
    mock_cache.connect = AsyncMock()
    mock_cache.disconnect = AsyncMock()
    mock_cache.get = AsyncMock(return_value=None)
    mock_cache.set = AsyncMock()
    monkeypatch.setattr("app.utils.cache.cache", mock_cache)

    yield
    # Cleanup after tests
