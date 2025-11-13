"""
Simplified tests for recommendation endpoints
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from datetime import date, time, timedelta


@pytest.mark.asyncio
async def test_create_recommendation_success(client: AsyncClient, auth_headers, test_perfume):
    """Test creating a recommendation with mocked AI"""
    # Use a valid future date (tomorrow)
    tomorrow = date.today() + timedelta(days=1)

    # Mock the recommendation engine
    with patch('app.api.v1.endpoints.recommendations.generate_recommendation') as mock_gen:
        # Create a mock recommendation object
        from app.models.recommendation import Recomendacion

        from datetime import datetime
        mock_rec = Recomendacion(
            id=1,
            user_id=1,
            perfume_recomendado_id=test_perfume.id,
            fecha_evento=tomorrow,
            hora_evento=time(14, 0),
            lugar_nombre="Café",
            lugar_tipo="cerrado",
            ocasion="Casual",
            expectativa="Confidence",
            vestimenta="Smart casual",
            latitud=40.7128,
            longitud=-74.0060,
            explicacion="Perfect for a casual day.",
            clima_descripcion="Sunny",
            temperatura=22.0,
            humedad=60.0,
            respuesta_ia="AI response text",
            created_at=datetime.now()
        )

        mock_gen.return_value = mock_rec

        response = await client.post(
            "/api/v1/recommendations/",
            headers=auth_headers,
            json={
                "fecha_evento": tomorrow.isoformat(),
                "hora_evento": "14:00",
                "latitud": 40.7128,
                "longitud": -74.0060,
                "lugar_nombre": "Café",
                "lugar_tipo": "cerrado",
                "ocasion": "Casual meeting",
                "expectativa": "Confidence",
                "vestimenta": "Smart casual"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "explicacion" in data


@pytest.mark.asyncio
async def test_get_recommendation_history(client: AsyncClient, auth_headers, test_recommendation):
    """Test getting recommendation history"""
    response = await client.get("/api/v1/recommendations/history", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_recommendation_by_id(client: AsyncClient, auth_headers, test_recommendation):
    """Test getting a specific recommendation"""
    response = await client.get(
        f"/api/v1/recommendations/{test_recommendation.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_recommendation.id
    assert data["ocasion"] == test_recommendation.ocasion


@pytest.mark.asyncio
async def test_get_nonexistent_recommendation(client: AsyncClient, auth_headers):
    """Test getting a recommendation that doesn't exist"""
    response = await client.get("/api/v1/recommendations/99999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_recommendation_without_auth(client: AsyncClient):
    """Test creating recommendation without authentication"""
    tomorrow = date.today() + timedelta(days=1)
    response = await client.post(
        "/api/v1/recommendations/",
        json={
            "fecha_evento": tomorrow.isoformat(),
            "hora_evento": "14:00",
            "latitud": 40.7128,
            "longitud": -74.0060,
            "lugar_nombre": "Café",
            "lugar_tipo": "cerrado"
        }
    )
    assert response.status_code == 401
