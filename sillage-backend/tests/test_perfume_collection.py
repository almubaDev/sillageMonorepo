import os
from datetime import UTC, datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configurar variables de entorno requeridas antes de importar la app
os.environ.setdefault("DATABASE_URL", "postgresql://user:password@localhost:5432/testdb")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "secret")
os.environ.setdefault("OPENWEATHER_API_KEY", "dummy")
os.environ.setdefault("GEMINI_API_KEY", "dummy")
os.environ.setdefault("GOOGLE_MAPS_API_KEY", "dummy")
os.environ.setdefault("FLOW_API_KEY", "dummy")
os.environ.setdefault("FLOW_SECRET_KEY", "dummy")
os.environ.setdefault("FLOW_API_URL", "https://dummy")

from app.main import app
from app.api.deps import get_db, get_current_active_user
from app.core.database import Base
from app.models.perfume import Perfume
from app.models.user import User


class AsyncSessionWrapper:
    def __init__(self, sync_session):
        self._sync_session = sync_session

    def add(self, instance):
        self._sync_session.add(instance)

    def add_all(self, instances):
        self._sync_session.add_all(instances)

    async def commit(self):
        self._sync_session.commit()

    async def refresh(self, instance):
        self._sync_session.refresh(instance)

    async def execute(self, *args, **kwargs):
        return self._sync_session.execute(*args, **kwargs)

    async def rollback(self):
        self._sync_session.rollback()

    async def flush(self):
        self._sync_session.flush()

    async def close(self):
        self._sync_session.close()


@pytest_asyncio.fixture()
async def db_session():
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine, autoflush=False, future=True)
    sync_session = SessionLocal()
    session = AsyncSessionWrapper(sync_session)

    try:
        yield session
    finally:
        await session.close()
        engine.dispose()


@pytest_asyncio.fixture()
async def test_client(db_session):
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        hashed_password="hashed",
        is_active=True,
        suscrito=True,
        consultas_restantes=5,
    )
    perfume = Perfume(
        nombre="Test Perfume",
        marca="Test Brand",
        perfumista="Tester",
        notas=["nota"],
        acordes=["acorde"],
        created_at=datetime.now(UTC),
        is_private=False,
        created_by=None,
    )

    db_session.add_all([user, perfume])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(perfume)

    async def override_get_db():
        yield db_session

    async def override_get_current_active_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, perfume, db_session, user

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_soft_delete_preserves_perfume_and_allows_readd(test_client):
    client, perfume, session, _ = test_client

    response = await client.post(f"/api/v1/perfumes/collection/{perfume.id}")
    assert response.status_code == 200

    response = await client.delete(f"/api/v1/perfumes/collection/{perfume.id}")
    assert response.status_code == 200

    collection_response = await client.get("/api/v1/perfumes/collection")
    assert collection_response.status_code == 200
    assert collection_response.json() == []

    perfume_in_db = await session.execute(select(Perfume).where(Perfume.id == perfume.id))
    assert perfume_in_db.scalar_one_or_none() is not None

    response = await client.post(f"/api/v1/perfumes/collection/{perfume.id}")
    assert response.status_code == 200

    collection_after_readd = await client.get("/api/v1/perfumes/collection")
    assert collection_after_readd.status_code == 200
    assert len(collection_after_readd.json()) == 1


@pytest.mark.asyncio
async def test_private_perfume_visible_only_to_owner(test_client):
    client, _, session, owner = test_client

    other_user = User(
        email="other@example.com",
        first_name="Other",
        last_name="User",
        hashed_password="hashed",
        is_active=True,
        suscrito=True,
        consultas_restantes=5,
    )

    session.add(other_user)
    await session.commit()
    await session.refresh(other_user)

    response = await client.post(
        "/api/v1/perfumes/",
        json={
            "nombre": "Privado",
            "marca": "Marca",
            "perfumista": "Autor",
            "notas": ["nota"],
            "acordes": ["acorde"],
        },
    )

    assert response.status_code == 200
    created_perfume = response.json()
    assert created_perfume["is_private"] is True
    assert created_perfume["created_by"] == owner.id

    collection_response = await client.get("/api/v1/perfumes/collection")
    assert collection_response.status_code == 200
    assert any(p["id"] == created_perfume["id"] for p in collection_response.json())

    async def override_other_user():
        return other_user

    async def override_owner_user():
        return owner

    app.dependency_overrides[get_current_active_user] = override_other_user

    search_other = await client.get("/api/v1/perfumes/search")
    assert search_other.status_code == 200
    assert all(p["id"] != created_perfume["id"] for p in search_other.json())

    app.dependency_overrides[get_current_active_user] = override_owner_user

    search_owner = await client.get("/api/v1/perfumes/search")
    assert search_owner.status_code == 200
    assert any(p["id"] == created_perfume["id"] for p in search_owner.json())
