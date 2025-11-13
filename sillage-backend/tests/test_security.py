"""
Tests for Security Module (JWT tokens and password hashing)
"""
import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    create_access_token,
    verify_token,
    get_password_hash,
    verify_password
)
from app.core.config import settings


def test_create_access_token():
    """Test JWT token creation"""
    token = create_access_token(subject="test@example.com")

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify token content
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    assert payload["sub"] == "test@example.com"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_access_token_with_custom_expiry():
    """Test JWT token creation with custom expiration"""
    token = create_access_token(
        subject="user123",
        expires_delta=timedelta(minutes=30)
    )

    assert token is not None

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    assert payload["sub"] == "user123"


def test_create_access_token_with_integer_subject():
    """Test JWT token creation with integer subject"""
    token = create_access_token(subject=12345)

    assert token is not None

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    # Subject should be converted to string
    assert payload["sub"] == "12345"


def test_verify_token_valid():
    """Test verifying a valid token"""
    token = create_access_token(subject="test@example.com")

    result = verify_token(token)

    assert result == "test@example.com"


def test_verify_token_invalid():
    """Test verifying an invalid token"""
    invalid_token = "invalid.token.here"

    result = verify_token(invalid_token)

    assert result is None


def test_verify_token_wrong_secret():
    """Test verifying a token signed with wrong secret"""
    # Create token with different secret
    wrong_token = jwt.encode(
        {"sub": "test@example.com", "exp": 9999999999},
        "wrong_secret_key",
        algorithm=settings.ALGORITHM
    )

    result = verify_token(wrong_token)

    assert result is None


def test_verify_token_expired():
    """Test verifying an expired token"""
    # Create token with negative expiry (already expired)
    token = create_access_token(
        subject="test@example.com",
        expires_delta=timedelta(minutes=-10)
    )

    result = verify_token(token)

    assert result is None


def test_verify_token_malformed():
    """Test verifying a malformed token"""
    malformed_tokens = [
        "",
        "not.a.token",
        "missing.signature",
        None
    ]

    for token in malformed_tokens:
        if token is None:
            # Skip None as verify_token expects string
            continue
        result = verify_token(token)
        assert result is None


def test_get_password_hash():
    """Test password hashing"""
    password = "mySecurePassword123"

    hashed = get_password_hash(password)

    assert hashed is not None
    assert isinstance(hashed, str)
    assert hashed != password
    assert hashed.startswith("$2b$")  # bcrypt format


def test_get_password_hash_different_each_time():
    """Test that same password produces different hashes (due to salt)"""
    password = "samePassword"

    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)

    assert hash1 != hash2  # Different due to different salts
    # But both should verify correctly
    assert verify_password(password, hash1)
    assert verify_password(password, hash2)


def test_get_password_hash_long_password():
    """Test hashing a very long password (bcrypt truncates at 72 bytes)"""
    # Create password longer than 72 bytes
    long_password = "a" * 100

    hashed = get_password_hash(long_password)

    assert hashed is not None
    # Should still verify with the full password
    assert verify_password(long_password, hashed)


def test_get_password_hash_unicode():
    """Test hashing password with unicode characters"""
    password = "contraseña_español_日本語"

    hashed = get_password_hash(password)

    assert hashed is not None
    assert verify_password(password, hashed)


def test_verify_password_correct():
    """Test verifying correct password"""
    password = "correctPassword123"
    hashed = get_password_hash(password)

    result = verify_password(password, hashed)

    assert result is True


def test_verify_password_incorrect():
    """Test verifying incorrect password"""
    password = "correctPassword"
    wrong_password = "wrongPassword"
    hashed = get_password_hash(password)

    result = verify_password(wrong_password, hashed)

    assert result is False


def test_verify_password_empty():
    """Test verifying empty password"""
    password = "myPassword"
    hashed = get_password_hash(password)

    result = verify_password("", hashed)

    assert result is False


def test_verify_password_case_sensitive():
    """Test that password verification is case-sensitive"""
    password = "MyPassword"
    hashed = get_password_hash(password)

    assert verify_password("MyPassword", hashed) is True
    assert verify_password("mypassword", hashed) is False
    assert verify_password("MYPASSWORD", hashed) is False


def test_verify_password_with_spaces():
    """Test password with spaces"""
    password = "my password with spaces"
    hashed = get_password_hash(password)

    assert verify_password(password, hashed) is True
    assert verify_password("mypasswordwithspaces", hashed) is False


def test_verify_password_special_characters():
    """Test password with special characters"""
    password = "P@ssw0rd!#$%^&*()"
    hashed = get_password_hash(password)

    assert verify_password(password, hashed) is True


def test_password_hash_roundtrip():
    """Test complete roundtrip: hash and verify"""
    passwords = [
        "simple",
        "With Spaces",
        "Special!@#$%",
        "número_español",
        "VeryLongPasswordThatExceedsSeventyTwoCharactersAndWillBeTruncatedByBcryptAlgorithmButShouldStillWorkCorrectly",
        "123456",
        "P@ssw0rd"
    ]

    for password in passwords:
        hashed = get_password_hash(password)
        assert verify_password(password, hashed), f"Failed for password: {password}"
        # For very long passwords, bcrypt truncates at 72 bytes
        # So adding "wrong" to an already 72+ byte password might still match
        if len(password.encode('utf-8')) < 70:
            assert not verify_password(password + "wrong", hashed)


def test_create_multiple_tokens_for_different_users():
    """Test creating tokens for multiple users"""
    users = ["user1@example.com", "user2@example.com", "user3@example.com"]
    tokens = []

    for user in users:
        token = create_access_token(subject=user)
        tokens.append(token)

        # Verify each token
        result = verify_token(token)
        assert result == user

    # All tokens should be different
    assert len(set(tokens)) == len(tokens)


def test_token_contains_correct_fields():
    """Test that token payload contains all required fields"""
    subject = "testuser@example.com"
    token = create_access_token(subject=subject)

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    # Check all required fields
    assert "sub" in payload
    assert "exp" in payload
    assert "type" in payload

    assert payload["sub"] == subject
    assert payload["type"] == "access"
    assert isinstance(payload["exp"], int)


def test_verify_password_with_bytes_hash():
    """Test verifying password when hash is in bytes format"""
    password = "testPassword"
    hashed_str = get_password_hash(password)

    # Convert to bytes (simulating database storage as bytes)
    hashed_bytes = hashed_str.encode('utf-8')

    # Should work with bytes
    result = verify_password(password, hashed_bytes)
    assert result is True


def test_password_hash_empty_password():
    """Test hashing empty password"""
    password = ""
    hashed = get_password_hash(password)

    assert hashed is not None
    assert verify_password("", hashed) is True
    assert verify_password("notEmpty", hashed) is False
