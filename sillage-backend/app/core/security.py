from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt
import bcrypt
from app.core.config import settings


def create_access_token(
    subject: str | Any, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Crear JWT token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verificar y decodificar JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")
    except jwt.JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña usando bcrypt directamente"""
    # Convertir strings a bytes
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    
    # Truncar si es necesario
    if len(plain_bytes) > 72:
        plain_bytes = plain_bytes[:72]
    
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """Hashear contraseña usando bcrypt directamente"""
    # Convertir a bytes
    password_bytes = password.encode('utf-8')
    
    # Truncar si es necesario
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Generar salt y hashear
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Retornar como string
    return hashed.decode('utf-8')