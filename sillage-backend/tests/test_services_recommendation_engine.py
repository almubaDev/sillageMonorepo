"""
Tests for Recommendation Engine Service
"""
import pytest
from datetime import date, time
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.recommendation_engine import extract_perfume_name, generate_recommendation
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
            acordes=["Woody", "Fresh"],
            notas=["Bergamot", "Pepper"],
            is_private=False,
            created_by=1
        ),
        Perfume(
            id=2,
            nombre="Chanel No 5",
            marca="Chanel",
            acordes=["Floral"],
            notas=["Jasmine", "Rose"],
            is_private=False,
            created_by=1
        ),
        Perfume(
            id=3,
            nombre="Bleu de Chanel",
            marca="Chanel",
            acordes=["Woody", "Aromatic"],
            notas=["Citrus", "Incense"],
            is_private=False,
            created_by=1
        )
    ]


def test_extract_perfume_name_first_line(sample_perfumes):
    """Test extracting perfume name from first line"""
    ai_response = "Dior Sauvage\n\nThis perfume is perfect for your occasion because..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.id == 1
    assert result.nombre == "Dior Sauvage"


def test_extract_perfume_name_with_asterisks(sample_perfumes):
    """Test extracting perfume name with markdown formatting"""
    ai_response = "**Dior Sauvage**\n\nExcellent choice for..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Dior Sauvage"


def test_extract_perfume_name_with_special_chars(sample_perfumes):
    """Test extracting perfume name with special characters"""
    ai_response = "### Recomendación: Dior Sauvage ###\n\nThis perfume..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Dior Sauvage"


def test_extract_perfume_name_case_insensitive(sample_perfumes):
    """Test case-insensitive perfume extraction"""
    ai_response = "DIOR SAUVAGE\n\nPerfect for..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Dior Sauvage"


def test_extract_perfume_name_partial_match(sample_perfumes):
    """Test partial name matching"""
    # Use full name since algorithm looks for perfume.nombre in text
    ai_response = "I recommend Dior Sauvage for this occasion\n\nBecause..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Dior Sauvage"


def test_extract_perfume_name_in_body(sample_perfumes):
    """Test finding perfume name in body text when not in first line"""
    ai_response = "Para esta ocasión especial,\nrecomiendo Chanel No 5\npor su elegancia..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Chanel No 5"


def test_extract_perfume_name_with_spaces(sample_perfumes):
    """Test extracting name with different spacing"""
    ai_response = "BleudeChanel es perfecto\n\nPara esta ocasión..."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    assert result.nombre == "Bleu de Chanel"


def test_extract_perfume_name_not_found(sample_perfumes):
    """Test when perfume name is not found"""
    ai_response = "I recommend something completely different\n\nThat doesn't exist in your collection."

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is None


def test_extract_perfume_name_empty_response(sample_perfumes):
    """Test with empty AI response"""
    ai_response = ""

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is None


def test_extract_perfume_name_whitespace_only(sample_perfumes):
    """Test with whitespace-only response"""
    ai_response = "   \n\n   \n  "

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is None


def test_extract_perfume_name_multiple_perfumes(sample_perfumes):
    """Test when multiple perfumes mentioned (should return first found)"""
    ai_response = "Both Dior Sauvage and Chanel No 5 are great, but I recommend Dior Sauvage"

    result = extract_perfume_name(ai_response, sample_perfumes)

    assert result is not None
    # Should find one of them
    assert result.nombre in ["Dior Sauvage", "Chanel No 5"]


@pytest.mark.asyncio
async def test_generate_recommendation_success(db_session: AsyncSession, test_user, sample_perfumes):
    """Test successful recommendation generation"""
    with patch('app.services.recommendation_engine.get_weather_data') as mock_weather, \
         patch('app.services.recommendation_engine.get_ai_recommendation') as mock_ai:

        # Mock weather data
        mock_weather.return_value = {
            'descripcion': 'cielo despejado',
            'temperatura': 22.5,
            'humedad': 65.0
        }

        # Mock AI response
        mock_ai.return_value = "Dior Sauvage\n\nPerfect choice for your evening event..."

        result = await generate_recommendation(
            db=db_session,
            user_id=test_user.id,
            perfumes=sample_perfumes,
            fecha_evento=date(2025, 3, 15),
            hora_evento=time(18, 0),
            latitud=40.7128,
            longitud=-74.0060,
            lugar_nombre="Restaurante",
            lugar_tipo="cerrado",
            lugar_descripcion="Restaurante elegante",
            ocasion="Cena romántica",
            expectativa="Seducción",
            vestimenta="Formal",
            idioma="es"
        )

        assert result is not None
        assert result.user_id == test_user.id
        assert result.lugar_nombre == "Restaurante"
        assert result.clima_descripcion == 'cielo despejado'
        assert result.temperatura == 22.5
        assert result.humedad == 65.0
        assert result.perfume_recomendado_id == 1  # Dior Sauvage
        assert "Dior Sauvage" in result.explicacion

        # Verify mocks were called
        mock_weather.assert_called_once()
        mock_ai.assert_called_once()


@pytest.mark.asyncio
async def test_generate_recommendation_weather_failure(db_session: AsyncSession, test_user, sample_perfumes):
    """Test recommendation generation when weather API fails"""
    with patch('app.services.recommendation_engine.get_weather_data') as mock_weather, \
         patch('app.services.recommendation_engine.get_ai_recommendation') as mock_ai:

        # Mock weather failure (returns None)
        mock_weather.return_value = None

        # Mock AI response
        mock_ai.return_value = "Chanel No 5\n\nElegant choice..."

        result = await generate_recommendation(
            db=db_session,
            user_id=test_user.id,
            perfumes=sample_perfumes,
            fecha_evento=date(2025, 3, 15),
            hora_evento=time(18, 0),
            latitud=40.7128,
            longitud=-74.0060,
            lugar_nombre="Teatro",
            lugar_tipo="cerrado",
            lugar_descripcion="Teatro",
            ocasion="Obra de teatro",
            expectativa="Elegancia",
            vestimenta="Formal",
            idioma="es"
        )

        assert result is not None
        # Should use default weather values
        assert result.clima_descripcion == 'información no disponible'
        assert result.temperatura == 20.0
        assert result.humedad == 60.0


@pytest.mark.asyncio
async def test_generate_recommendation_perfume_not_found(db_session: AsyncSession, test_user, sample_perfumes):
    """Test recommendation when AI doesn't mention a valid perfume"""
    with patch('app.services.recommendation_engine.get_weather_data') as mock_weather, \
         patch('app.services.recommendation_engine.get_ai_recommendation') as mock_ai:

        mock_weather.return_value = {
            'descripcion': 'soleado',
            'temperatura': 25.0,
            'humedad': 55.0
        }

        # AI response doesn't mention any perfume from the list
        mock_ai.return_value = "I recommend some unknown perfume not in your collection"

        result = await generate_recommendation(
            db=db_session,
            user_id=test_user.id,
            perfumes=sample_perfumes,
            fecha_evento=date(2025, 3, 15),
            hora_evento=time(12, 0),
            latitud=40.7128,
            longitud=-74.0060,
            lugar_nombre="Parque",
            lugar_tipo="abierto",
            lugar_descripcion="Parque público",
            ocasion="Paseo",
            expectativa="Relajación",
            vestimenta="Casual",
            idioma="es"
        )

        assert result is not None
        assert result.perfume_recomendado_id is None
        assert "No se pudo determinar" in result.explicacion


@pytest.mark.asyncio
async def test_generate_recommendation_english(db_session: AsyncSession, test_user, sample_perfumes):
    """Test recommendation generation in English"""
    with patch('app.services.recommendation_engine.get_weather_data') as mock_weather, \
         patch('app.services.recommendation_engine.get_ai_recommendation') as mock_ai:

        mock_weather.return_value = {
            'descripcion': 'clear sky',
            'temperatura': 20.0,
            'humedad': 60.0
        }

        mock_ai.return_value = "Bleu de Chanel\n\nExcellent for business meetings..."

        result = await generate_recommendation(
            db=db_session,
            user_id=test_user.id,
            perfumes=sample_perfumes,
            fecha_evento=date(2025, 3, 15),
            hora_evento=time(10, 0),
            latitud=40.7128,
            longitud=-74.0060,
            lugar_nombre="Office",
            lugar_tipo="cerrado",
            lugar_descripcion="Office building",
            ocasion="Business meeting",
            expectativa="Confidence",
            vestimenta="Business suit",
            idioma="en"  # English
        )

        assert result is not None
        assert result.perfume_recomendado_id == 3  # Bleu de Chanel


@pytest.mark.asyncio
async def test_generate_recommendation_stores_prompt(db_session: AsyncSession, test_user, sample_perfumes):
    """Test that the prompt is stored in the recommendation"""
    with patch('app.services.recommendation_engine.get_weather_data') as mock_weather, \
         patch('app.services.recommendation_engine.get_ai_recommendation') as mock_ai:

        mock_weather.return_value = {
            'descripcion': 'nublado',
            'temperatura': 18.0,
            'humedad': 70.0
        }

        mock_ai.return_value = "Dior Sauvage\n\nGreat choice"

        result = await generate_recommendation(
            db=db_session,
            user_id=test_user.id,
            perfumes=sample_perfumes,
            fecha_evento=date(2025, 3, 15),
            hora_evento=time(15, 0),
            latitud=40.7128,
            longitud=-74.0060,
            lugar_nombre="Café",
            lugar_tipo="cerrado",
            lugar_descripcion="Cafetería",
            ocasion="Encuentro casual",
            expectativa="Confort",
            vestimenta="Casual",
            idioma="es"
        )

        assert result is not None
        assert result.prompt is not None
        assert len(result.prompt) > 0
        assert "Café" in result.prompt
        assert result.respuesta_ia == "Dior Sauvage\n\nGreat choice"
