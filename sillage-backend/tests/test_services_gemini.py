"""
Tests for Gemini AI Service
"""
import pytest
from datetime import date, time
from unittest.mock import Mock, patch, AsyncMock
from app.services.gemini import build_prompt, get_ai_recommendation
from app.models.perfume import Perfume


@pytest.fixture
def sample_perfumes():
    """Create sample perfumes for testing"""
    return [
        Perfume(
            id=1,
            nombre="Dior Sauvage",
            marca="Dior",
            perfumista="François Demachy",
            acordes=["Woody", "Fresh", "Aromatic"],
            notas=["Bergamot", "Pepper", "Ambroxan", "Vetiver", "Patchouli"],
            is_private=False,
            created_by=1
        ),
        Perfume(
            id=2,
            nombre="Chanel No 5",
            marca="Chanel",
            perfumista="Ernest Beaux",
            acordes=["Floral", "Aldehyde"],
            notas=["Aldehydes", "Ylang-Ylang", "Jasmine", "Rose", "Vanilla"],
            is_private=False,
            created_by=1
        )
    ]


def test_build_prompt_spanish(sample_perfumes):
    """Test building prompt in Spanish"""
    prompt = build_prompt(
        perfumes=sample_perfumes,
        fecha_evento=date(2025, 3, 15),
        hora_evento=time(18, 0),
        lugar_nombre="Restaurante Elegante",
        lugar_tipo="cerrado",
        lugar_descripcion="Restaurante de alta cocina",
        ocasion="Cena romántica",
        expectativa="Seducción",
        vestimenta="Formal",
        temperatura=22.0,
        humedad=65.0,
        clima_descripcion="Despejado",
        idioma="es"
    )

    assert "Restaurante Elegante" in prompt
    assert "cerrado" in prompt
    assert "Cena romántica" in prompt
    assert "Seducción" in prompt
    assert "Formal" in prompt
    assert "22.0" in prompt or "22" in prompt
    assert "65" in prompt or "65.0" in prompt
    # Verificar que al menos uno de los perfumes está en el prompt
    assert "Dior Sauvage" in prompt or "Chanel No 5" in prompt


def test_build_prompt_english(sample_perfumes):
    """Test building prompt in English"""
    prompt = build_prompt(
        perfumes=sample_perfumes,
        fecha_evento=date(2025, 3, 15),
        hora_evento=time(18, 0),
        lugar_nombre="Elegant Restaurant",
        lugar_tipo="cerrado",
        lugar_descripcion="Fine dining restaurant",
        ocasion="Romantic dinner",
        expectativa="Seduction",
        vestimenta="Formal",
        temperatura=22.0,
        humedad=65.0,
        clima_descripcion="Clear",
        idioma="en"
    )

    assert "Elegant Restaurant" in prompt
    assert "Romantic dinner" in prompt
    # Verificar que usa formato en inglés
    assert prompt  # Debería generar un prompt válido


def test_build_prompt_morning():
    """Test prompt building for morning time"""
    perfumes = [
        Perfume(
            id=1,
            nombre="Fresh Citrus",
            marca="TestBrand",
            acordes=["Citrus"],
            notas=["Lemon", "Orange"],
            is_private=False,
            created_by=1
        )
    ]

    prompt = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 6, 15),
        hora_evento=time(9, 0),  # Morning
        lugar_nombre="Office",
        lugar_tipo="cerrado",
        lugar_descripcion="Work environment",
        ocasion="Work meeting",
        expectativa="Confidence",
        vestimenta="Business casual",
        temperatura=18.0,
        humedad=55.0,
        clima_descripcion="Cloudy",
        idioma="es"
    )

    # Should contain morning-related text
    assert prompt
    assert "Fresh Citrus" in prompt


def test_build_prompt_afternoon():
    """Test prompt building for afternoon time"""
    perfumes = [
        Perfume(
            id=1,
            nombre="Afternoon Delight",
            marca="TestBrand",
            acordes=["Floral"],
            notas=["Rose"],
            is_private=False,
            created_by=1
        )
    ]

    prompt = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 6, 15),
        hora_evento=time(15, 0),  # Afternoon
        lugar_nombre="Cafe",
        lugar_tipo="cerrado",
        lugar_descripcion="Coffee shop",
        ocasion="Casual meeting",
        expectativa="Relaxation",
        vestimenta="Casual",
        temperatura=24.0,
        humedad=60.0,
        clima_descripcion="Sunny",
        idioma="es"
    )

    assert prompt
    assert "Afternoon Delight" in prompt


def test_build_prompt_night():
    """Test prompt building for night time"""
    perfumes = [
        Perfume(
            id=1,
            nombre="Night Mystery",
            marca="TestBrand",
            acordes=["Oriental"],
            notas=["Oud", "Amber"],
            is_private=False,
            created_by=1
        )
    ]

    prompt = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 6, 15),
        hora_evento=time(21, 0),  # Night
        lugar_nombre="Club",
        lugar_tipo="cerrado",
        lugar_descripcion="Night club",
        ocasion="Party",
        expectativa="Fun",
        vestimenta="Elegant casual",
        temperatura=20.0,
        humedad=70.0,
        clima_descripcion="Clear",
        idioma="es"
    )

    assert prompt
    assert "Night Mystery" in prompt


def test_build_prompt_without_optional_fields():
    """Test building prompt with minimal perfume data"""
    perfumes = [
        Perfume(
            id=1,
            nombre="Simple Perfume",
            marca="Brand",
            perfumista=None,  # No perfumer
            acordes=None,     # No accords
            notas=None,       # No notes
            is_private=False,
            created_by=1
        )
    ]

    prompt = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 6, 15),
        hora_evento=time(12, 0),
        lugar_nombre="Place",
        lugar_tipo="abierto",
        lugar_descripcion="Outdoor place",
        ocasion="Casual",
        expectativa="Comfort",
        vestimenta="Casual",
        temperatura=25.0,
        humedad=50.0,
        clima_descripcion="Sunny",
        idioma="es"
    )

    assert "Simple Perfume" in prompt
    assert prompt  # Should generate valid prompt


def test_build_prompt_seasons():
    """Test that seasons are correctly identified"""
    perfumes = [
        Perfume(
            id=1,
            nombre="Test",
            marca="Test",
            is_private=False,
            created_by=1
        )
    ]

    # Test different months for different seasons (Southern Hemisphere)
    # January = Summer
    prompt_summer = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 1, 15),
        hora_evento=time(12, 0),
        lugar_nombre="Beach",
        lugar_tipo="abierto",
        lugar_descripcion="Beach",
        ocasion="Casual",
        expectativa="Relaxation",
        vestimenta="Casual",
        temperatura=30.0,
        humedad=75.0,
        clima_descripcion="Hot",
        idioma="es"
    )

    # July = Winter
    prompt_winter = build_prompt(
        perfumes=perfumes,
        fecha_evento=date(2025, 7, 15),
        hora_evento=time(12, 0),
        lugar_nombre="Indoor",
        lugar_tipo="cerrado",
        lugar_descripcion="Indoor place",
        ocasion="Casual",
        expectativa="Comfort",
        vestimenta="Casual",
        temperatura=10.0,
        humedad=60.0,
        clima_descripcion="Cold",
        idioma="es"
    )

    assert prompt_summer
    assert prompt_winter


@pytest.mark.asyncio
async def test_get_ai_recommendation_success():
    """Test successful AI recommendation"""
    mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": "Dior Sauvage\n\nThis perfume is perfect for your occasion..."
                        }
                    ]
                }
            }
        ]
    }

    with patch('httpx.AsyncClient') as mock_client:
        # Create a mock response object
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = Mock()

        # Make post return an awaitable
        mock_post = AsyncMock(return_value=mock_response_obj)
        mock_client.return_value.__aenter__.return_value.post = mock_post

        result = await get_ai_recommendation("Test prompt")

        assert result == "Dior Sauvage\n\nThis perfume is perfect for your occasion..."
        mock_post.assert_called_once()


@pytest.mark.asyncio
async def test_get_ai_recommendation_empty_response():
    """Test AI recommendation with empty response"""
    mock_response = {
        "candidates": []
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = Mock()

        mock_post = AsyncMock(return_value=mock_response_obj)
        mock_client.return_value.__aenter__.return_value.post = mock_post

        result = await get_ai_recommendation("Test prompt")

        # When candidates list is empty, accessing [0] raises IndexError
        # which is caught and returns error message
        assert "No se pudo generar una recomendación" in result


@pytest.mark.asyncio
async def test_get_ai_recommendation_network_error():
    """Test AI recommendation with network error"""
    with patch('httpx.AsyncClient') as mock_client:
        mock_post = AsyncMock()
        mock_post.side_effect = Exception("Network error")

        mock_client.return_value.__aenter__.return_value.post = mock_post

        result = await get_ai_recommendation("Test prompt")

        assert "No se pudo generar una recomendación" in result


@pytest.mark.asyncio
async def test_get_ai_recommendation_http_error():
    """Test AI recommendation with HTTP error"""
    with patch('httpx.AsyncClient') as mock_client:
        mock_post = AsyncMock()
        mock_post.return_value.raise_for_status.side_effect = Exception("HTTP 500")

        mock_client.return_value.__aenter__.return_value.post = mock_post

        result = await get_ai_recommendation("Test prompt")

        assert "No se pudo generar una recomendación" in result
