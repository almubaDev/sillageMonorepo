"""
Tests for Redis Cache Utility
"""
import pytest
import json
from unittest.mock import AsyncMock, Mock, patch
from app.utils.cache import RedisCache


@pytest.fixture
def cache_instance():
    """Create a cache instance for testing"""
    return RedisCache()


@pytest.mark.asyncio
async def test_cache_connect():
    """Test cache connection"""
    cache = RedisCache()

    with patch('redis.asyncio.from_url') as mock_redis:
        mock_connection = Mock()
        # Make from_url return an awaitable
        mock_redis.return_value = AsyncMock(return_value=mock_connection)()

        await cache.connect()

        assert cache.redis is not None
        mock_redis.assert_called_once()


@pytest.mark.asyncio
async def test_cache_disconnect():
    """Test cache disconnection"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    await cache.disconnect()

    cache.redis.close.assert_called_once()


@pytest.mark.asyncio
async def test_cache_disconnect_without_connection():
    """Test disconnecting when not connected"""
    cache = RedisCache()
    cache.redis = None

    # Should not raise error
    await cache.disconnect()


@pytest.mark.asyncio
async def test_cache_get_json_value():
    """Test getting JSON value from cache"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    test_data = {"key": "value", "number": 123}
    cache.redis.get.return_value = json.dumps(test_data)

    result = await cache.get("test_key")

    assert result == test_data
    cache.redis.get.assert_called_once_with("test_key")


@pytest.mark.asyncio
async def test_cache_get_string_value():
    """Test getting plain string value from cache"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    cache.redis.get.return_value = "plain_string"

    result = await cache.get("test_key")

    # Should return the string as-is if not valid JSON
    assert result == "plain_string"


@pytest.mark.asyncio
async def test_cache_get_none():
    """Test getting non-existent key"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    cache.redis.get.return_value = None

    result = await cache.get("nonexistent_key")

    assert result is None


@pytest.mark.asyncio
async def test_cache_get_without_connection():
    """Test getting value when not connected"""
    cache = RedisCache()
    cache.redis = None

    result = await cache.get("test_key")

    assert result is None


@pytest.mark.asyncio
async def test_cache_get_invalid_json():
    """Test getting value with invalid JSON"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    # Return invalid JSON that can't be parsed
    cache.redis.get.return_value = "{invalid json}"

    result = await cache.get("test_key")

    # Should return the raw value when JSON parsing fails
    assert result == "{invalid json}"


@pytest.mark.asyncio
async def test_cache_set_dict_value():
    """Test setting dictionary value"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.set.return_value = True

    test_data = {"user": "john", "age": 30}

    result = await cache.set("user_key", test_data, expire=7200)

    assert result is True
    cache.redis.set.assert_called_once()
    # Verify JSON serialization
    call_args = cache.redis.set.call_args
    assert json.loads(call_args[0][1]) == test_data
    assert call_args[1]["ex"] == 7200


@pytest.mark.asyncio
async def test_cache_set_string_value():
    """Test setting string value"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.set.return_value = True

    result = await cache.set("string_key", "simple_string")

    assert result is True
    cache.redis.set.assert_called_once()


@pytest.mark.asyncio
async def test_cache_set_default_expire():
    """Test setting value with default expiration"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.set.return_value = True

    await cache.set("test_key", "test_value")

    call_args = cache.redis.set.call_args
    assert call_args[1]["ex"] == 3600  # Default 1 hour


@pytest.mark.asyncio
async def test_cache_set_without_connection():
    """Test setting value when not connected"""
    cache = RedisCache()
    cache.redis = None

    result = await cache.set("test_key", "test_value")

    assert result is False


@pytest.mark.asyncio
async def test_cache_set_list_value():
    """Test setting list value"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.set.return_value = True

    test_list = [1, 2, 3, "four", {"five": 5}]

    result = await cache.set("list_key", test_list)

    assert result is True
    call_args = cache.redis.set.call_args
    assert json.loads(call_args[0][1]) == test_list


@pytest.mark.asyncio
async def test_cache_delete_existing_key():
    """Test deleting existing key"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.delete.return_value = 1  # Redis returns count

    result = await cache.delete("test_key")

    assert result is True
    cache.redis.delete.assert_called_once_with("test_key")


@pytest.mark.asyncio
async def test_cache_delete_nonexistent_key():
    """Test deleting non-existent key"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.delete.return_value = 0  # No keys deleted

    result = await cache.delete("nonexistent_key")

    assert result is False


@pytest.mark.asyncio
async def test_cache_delete_without_connection():
    """Test deleting key when not connected"""
    cache = RedisCache()
    cache.redis = None

    result = await cache.delete("test_key")

    assert result is False


@pytest.mark.asyncio
async def test_cache_exists_true():
    """Test checking if key exists (returns True)"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.exists.return_value = 1

    result = await cache.exists("existing_key")

    assert result is True
    cache.redis.exists.assert_called_once_with("existing_key")


@pytest.mark.asyncio
async def test_cache_exists_false():
    """Test checking if key exists (returns False)"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.exists.return_value = 0

    result = await cache.exists("nonexistent_key")

    assert result is False


@pytest.mark.asyncio
async def test_cache_exists_without_connection():
    """Test checking existence when not connected"""
    cache = RedisCache()
    cache.redis = None

    result = await cache.exists("test_key")

    assert result is False


@pytest.mark.asyncio
async def test_cache_roundtrip():
    """Test complete roundtrip: set, get, exists, delete"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    # Setup mocks
    test_data = {"message": "Hello, Cache!"}
    cache.redis.set.return_value = True
    cache.redis.get.return_value = json.dumps(test_data)
    cache.redis.exists.return_value = 1
    cache.redis.delete.return_value = 1

    # Set
    set_result = await cache.set("roundtrip_key", test_data)
    assert set_result is True

    # Get
    get_result = await cache.get("roundtrip_key")
    assert get_result == test_data

    # Exists
    exists_result = await cache.exists("roundtrip_key")
    assert exists_result is True

    # Delete
    delete_result = await cache.delete("roundtrip_key")
    assert delete_result is True


@pytest.mark.asyncio
async def test_cache_set_complex_nested_data():
    """Test setting complex nested data structure"""
    cache = RedisCache()
    cache.redis = AsyncMock()
    cache.redis.set.return_value = True

    complex_data = {
        "user": {
            "id": 123,
            "name": "John Doe",
            "permissions": ["read", "write"],
            "metadata": {
                "last_login": "2025-03-15",
                "settings": {
                    "theme": "dark",
                    "notifications": True
                }
            }
        }
    }

    result = await cache.set("complex_key", complex_data)

    assert result is True
    call_args = cache.redis.set.call_args
    # Verify serialization and deserialization
    serialized = call_args[0][1]
    assert json.loads(serialized) == complex_data


@pytest.mark.asyncio
async def test_cache_get_multiple_types():
    """Test getting different data types"""
    cache = RedisCache()
    cache.redis = AsyncMock()

    # Test cases
    test_cases = [
        (json.dumps({"dict": "value"}), {"dict": "value"}),
        (json.dumps([1, 2, 3]), [1, 2, 3]),
        (json.dumps("string"), "string"),
        (json.dumps(123), 123),
        (json.dumps(True), True),
        (json.dumps(None), None),
    ]

    for redis_value, expected in test_cases:
        cache.redis.get.return_value = redis_value
        result = await cache.get("test_key")
        assert result == expected
