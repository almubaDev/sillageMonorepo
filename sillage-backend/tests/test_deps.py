"""
Tests for API Dependencies (get_db, get_current_user, etc.)
"""
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_current_active_user, get_current_subscribed_user
from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_get_current_user_valid_token(db_session: AsyncSession, test_user):
    """Test getting current user with valid token"""
    token = create_access_token(subject=str(test_user.id))

    user = await get_current_user(db=db_session, token=token)

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session: AsyncSession):
    """Test getting current user with invalid token"""
    invalid_token = "invalid.token.here"

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=invalid_token)

    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_expired_token(db_session: AsyncSession, test_user):
    """Test getting current user with expired token"""
    from datetime import timedelta

    expired_token = create_access_token(
        subject=str(test_user.id),
        expires_delta=timedelta(minutes=-10)
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=expired_token)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_nonexistent_user(db_session: AsyncSession):
    """Test getting current user for non-existent user ID"""
    # Create token for user that doesn't exist
    token = create_access_token(subject="99999")

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=token)

    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_inactive_user(db_session: AsyncSession):
    """Test getting current user when user is inactive"""
    from app.models.user import User

    # Create inactive user
    inactive_user = User(
        email="inactive@example.com",
        first_name="Inactive",
        last_name="User",
        hashed_password="hashed",
        is_active=False
    )
    db_session.add(inactive_user)
    await db_session.commit()
    await db_session.refresh(inactive_user)

    token = create_access_token(subject=str(inactive_user.id))

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=token)

    assert exc_info.value.status_code == 400
    assert "inactivo" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_get_current_user_malformed_token(db_session: AsyncSession):
    """Test getting current user with malformed token"""
    malformed_token = "not.a.valid.jwt"

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=malformed_token)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_token_without_sub(db_session: AsyncSession):
    """Test token without 'sub' claim"""
    from jose import jwt
    from app.core.config import settings

    # Create token without 'sub' field
    token = jwt.encode(
        {"exp": 9999999999, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, token=token)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_active_user_success(test_user):
    """Test getting active user"""
    # test_user is active by default
    user = await get_current_active_user(current_user=test_user)

    assert user is not None
    assert user.id == test_user.id
    assert user.is_active is True


@pytest.mark.asyncio
async def test_get_current_active_user_inactive():
    """Test getting inactive user raises exception"""
    inactive_user = User(
        id=1,
        email="inactive@example.com",
        first_name="Inactive",
        last_name="User",
        hashed_password="hash",
        is_active=False
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_active_user(current_user=inactive_user)

    assert exc_info.value.status_code == 400
    assert "inactivo" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_get_current_subscribed_user_success(test_user):
    """Test getting subscribed user with queries remaining"""
    # test_user has subscription and queries by default
    user = await get_current_subscribed_user(current_user=test_user)

    assert user is not None
    assert user.id == test_user.id
    assert user.suscrito is True
    assert user.consultas_restantes > 0


@pytest.mark.asyncio
async def test_get_current_subscribed_user_no_subscription():
    """Test getting user without subscription"""
    unsubscribed_user = User(
        id=1,
        email="free@example.com",
        first_name="Free",
        last_name="User",
        hashed_password="hash",
        is_active=True,
        suscrito=False,
        consultas_restantes=0
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_subscribed_user(current_user=unsubscribed_user)

    assert exc_info.value.status_code == 402
    assert "Suscripción requerida" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_subscribed_user_no_queries():
    """Test getting subscribed user with no queries remaining"""
    no_queries_user = User(
        id=1,
        email="nomore@example.com",
        first_name="No",
        last_name="Queries",
        hashed_password="hash",
        is_active=True,
        suscrito=True,
        consultas_restantes=0
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_subscribed_user(current_user=no_queries_user)

    assert exc_info.value.status_code == 429
    assert "No tienes consultas disponibles" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_subscribed_user_negative_queries():
    """Test subscribed user with negative queries (edge case)"""
    negative_queries_user = User(
        id=1,
        email="negative@example.com",
        first_name="Negative",
        last_name="Queries",
        hashed_password="hash",
        is_active=True,
        suscrito=True,
        consultas_restantes=-5
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_subscribed_user(current_user=negative_queries_user)

    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_get_current_subscribed_user_one_query_left(test_user):
    """Test subscribed user with exactly one query left"""
    test_user.consultas_restantes = 1

    user = await get_current_subscribed_user(current_user=test_user)

    assert user is not None
    assert user.consultas_restantes == 1


@pytest.mark.asyncio
async def test_dependency_chain(db_session: AsyncSession, test_user):
    """Test the full dependency chain from token to subscribed user"""
    # Create token
    token = create_access_token(subject=str(test_user.id))

    # Step 1: Get current user from token
    current_user = await get_current_user(db=db_session, token=token)
    assert current_user.id == test_user.id

    # Step 2: Verify active user
    active_user = await get_current_active_user(current_user=current_user)
    assert active_user.is_active is True

    # Step 3: Verify subscribed user
    subscribed_user = await get_current_subscribed_user(current_user=active_user)
    assert subscribed_user.suscrito is True
    assert subscribed_user.consultas_restantes > 0


@pytest.mark.asyncio
async def test_get_db_dependency():
    """Test get_db dependency yields session"""
    from app.api.deps import get_db

    async for session in get_db():
        assert isinstance(session, AsyncSession)
        # Verify session is usable
        assert session is not None
        break  # Only test first yield


@pytest.mark.asyncio
async def test_oauth2_scheme_token_url():
    """Test OAuth2 scheme configuration"""
    from app.api.deps import oauth2_scheme

    # OAuth2PasswordBearer uses 'model' which has a 'tokenUrl' field in Pydantic v2
    # or we can check the flows directly
    assert oauth2_scheme.model.flows.password.tokenUrl == "/api/v1/auth/login"


@pytest.mark.asyncio
async def test_get_current_user_with_string_id(db_session: AsyncSession, test_user):
    """Test that user ID as string in token works correctly"""
    # Token stores user ID as string
    token = create_access_token(subject=str(test_user.id))

    user = await get_current_user(db=db_session, token=token)

    assert user.id == test_user.id


@pytest.mark.asyncio
async def test_get_current_user_with_integer_id(db_session: AsyncSession, test_user):
    """Test that user ID as integer in token works correctly"""
    # Some tokens might have integer subject
    token = create_access_token(subject=test_user.id)

    user = await get_current_user(db=db_session, token=token)

    assert user.id == test_user.id
