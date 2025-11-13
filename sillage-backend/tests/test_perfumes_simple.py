"""
Simplified tests for perfume endpoints
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_perfume(client: AsyncClient, auth_headers):
    """Test creating a new perfume"""
    response = await client.post(
        "/api/v1/perfumes/",
        headers=auth_headers,
        json={
            "nombre": "Chanel No. 5",
            "marca": "Chanel",
            "perfumista": "Ernest Beaux",
            "notas": {
                "salida": ["Aldehydes", "Ylang-Ylang", "Neroli"],
                "corazon": ["Jasmine", "Rose", "Lily"],
                "fondo": ["Sandalwood", "Vetiver", "Vanilla"]
            },
            "acordes": ["Floral", "Aldehyde", "Powdery"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Chanel No. 5"
    assert data["marca"] == "Chanel"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_my_collection(client: AsyncClient, auth_headers, test_perfume):
    """Test getting user's perfume collection"""
    response = await client.get("/api/v1/perfumes/collection", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["nombre"] == test_perfume.nombre


@pytest.mark.asyncio
async def test_search_perfumes(client: AsyncClient, auth_headers, test_perfume):
    """Test searching perfumes"""
    response = await client.get(
        f"/api/v1/perfumes/search?q={test_perfume.nombre}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_add_to_collection(client: AsyncClient, auth_headers, db_session, test_user):
    """Test adding a perfume to collection"""
    from app.models.perfume import Perfume

    # Create a public perfume not in user's collection
    perfume = Perfume(
        nombre="Public Perfume",
        marca="Public Brand",
        perfumista="Test",
        notas={"salida": ["Test"]},
        acordes=["Test"],
        is_private=False
    )
    db_session.add(perfume)
    await db_session.commit()
    await db_session.refresh(perfume)

    response = await client.post(
        f"/api/v1/perfumes/collection/{perfume.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert "agregado" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_remove_from_collection(client: AsyncClient, auth_headers, test_perfume):
    """Test removing a perfume from collection"""
    response = await client.delete(
        f"/api/v1/perfumes/collection/{test_perfume.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert "eliminado" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_create_perfume_without_auth(client: AsyncClient):
    """Test creating perfume without authentication"""
    response = await client.post(
        "/api/v1/perfumes/",
        json={
            "nombre": "Test Perfume",
            "marca": "Test Brand",
            "notas": {},
            "acordes": []
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_search_by_marca(client: AsyncClient, auth_headers, test_perfume):
    """Test searching perfumes by brand"""
    response = await client.get(
        f"/api/v1/perfumes/search?marca={test_perfume.marca}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_search_by_acorde(client: AsyncClient, auth_headers, test_perfume):
    """Test searching perfumes by accord"""
    response = await client.get(
        "/api/v1/perfumes/search?acorde=Floral",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
