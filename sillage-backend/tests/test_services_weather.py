"""
Tests for Weather Service
"""
import pytest
from datetime import date, time, datetime
from unittest.mock import AsyncMock, patch, Mock
from app.services.weather import get_weather_data


@pytest.mark.asyncio
async def test_get_weather_data_success():
    """Test successful weather data retrieval"""
    mock_response = {
        "list": [
            {
                "dt_txt": "2025-03-15 18:00:00",
                "weather": [{"description": "cielo despejado"}],
                "main": {
                    "temp": 22.5,
                    "humidity": 65
                }
            },
            {
                "dt_txt": "2025-03-15 21:00:00",
                "weather": [{"description": "parcialmente nublado"}],
                "main": {
                    "temp": 20.0,
                    "humidity": 70
                }
            }
        ]
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = Mock()

        mock_get = AsyncMock(return_value=mock_response_obj)
        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        assert result is not None
        assert result['descripcion'] == "cielo despejado"
        assert result['temperatura'] == 22.5
        assert result['humedad'] == 65
        mock_get.assert_called_once()


@pytest.mark.asyncio
async def test_get_weather_data_closest_time():
    """Test that it finds the closest time block"""
    mock_response = {
        "list": [
            {
                "dt_txt": "2025-03-15 12:00:00",
                "weather": [{"description": "soleado"}],
                "main": {"temp": 25.0, "humidity": 50}
            },
            {
                "dt_txt": "2025-03-15 15:00:00",
                "weather": [{"description": "despejado"}],
                "main": {"temp": 24.0, "humidity": 55}
            },
            {
                "dt_txt": "2025-03-15 18:00:00",
                "weather": [{"description": "nublado"}],
                "main": {"temp": 22.0, "humidity": 60}
            }
        ]
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = Mock()

        mock_get = AsyncMock(return_value=mock_response_obj)
        mock_client.return_value.__aenter__.return_value.get = mock_get

        # Request for 14:00, should get 15:00 (closest)
        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(14, 0)
        )

        assert result is not None
        assert result['descripcion'] == "despejado"
        assert result['temperatura'] == 24.0


@pytest.mark.asyncio
async def test_get_weather_data_empty_list():
    """Test weather data with empty list"""
    mock_response = {
        "list": []
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.raise_for_status = Mock()

        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Should return default values when list is empty
        assert result is not None
        assert result['descripcion'] == 'parcialmente nublado'
        assert result['temperatura'] == 20.0
        assert result['humedad'] == 60.0


@pytest.mark.asyncio
async def test_get_weather_data_network_error():
    """Test weather data with network error"""
    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.side_effect = Exception("Network error")

        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Should return default values on error
        assert result is not None
        assert result['descripcion'] == 'parcialmente nublado'
        assert result['temperatura'] == 20.0
        assert result['humedad'] == 60.0


@pytest.mark.asyncio
async def test_get_weather_data_http_error():
    """Test weather data with HTTP error"""
    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.return_value.raise_for_status.side_effect = Exception("HTTP 500")

        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Should return default values on HTTP error
        assert result is not None
        assert result['descripcion'] == 'parcialmente nublado'
        assert result['temperatura'] == 20.0
        assert result['humedad'] == 60.0


@pytest.mark.asyncio
async def test_get_weather_data_invalid_json():
    """Test weather data with invalid JSON response"""
    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.return_value.json.side_effect = ValueError("Invalid JSON")
        mock_get.return_value.raise_for_status = Mock()

        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Should return default values on invalid JSON
        assert result is not None
        assert result['descripcion'] == 'parcialmente nublado'
        assert result['temperatura'] == 20.0
        assert result['humedad'] == 60.0


@pytest.mark.asyncio
async def test_get_weather_data_missing_fields():
    """Test weather data with missing fields"""
    mock_response = {
        "list": [
            {
                "dt_txt": "2025-03-15 18:00:00",
                # Missing weather and main fields
            }
        ]
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.raise_for_status = Mock()

        mock_client.return_value.__aenter__.return_value.get = mock_get

        result = await get_weather_data(
            lat=40.7128,
            lon=-74.0060,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Should return default values when fields are missing
        assert result is not None
        assert result['descripcion'] == 'parcialmente nublado'


@pytest.mark.asyncio
async def test_get_weather_data_params():
    """Test that correct parameters are sent to API"""
    mock_response = {
        "list": [
            {
                "dt_txt": "2025-03-15 18:00:00",
                "weather": [{"description": "test"}],
                "main": {"temp": 20.0, "humidity": 60}
            }
        ]
    }

    with patch('httpx.AsyncClient') as mock_client:
        mock_get = AsyncMock()
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.raise_for_status = Mock()

        mock_client.return_value.__aenter__.return_value.get = mock_get

        await get_weather_data(
            lat=-34.6037,
            lon=-58.3816,
            fecha=date(2025, 3, 15),
            hora=time(18, 0)
        )

        # Verify the call was made with correct params
        call_args = mock_get.call_args
        assert call_args is not None
        params = call_args.kwargs.get('params')
        assert params['lat'] == -34.6037
        assert params['lon'] == -58.3816
        assert params['units'] == 'metric'
        assert params['lang'] == 'es'
