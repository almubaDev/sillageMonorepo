"""
Schemas para gestión de contraseñas
"""
from pydantic import BaseModel, EmailStr, Field, validator


class PasswordResetRequest(BaseModel):
    """Schema para solicitar recuperación de contraseña"""
    email: EmailStr = Field(..., description="Email del usuario")


class PasswordResetVerify(BaseModel):
    """Schema para verificar token de recuperación"""
    email: EmailStr = Field(..., description="Email del usuario")
    token: str = Field(..., min_length=20, description="Token de recuperación")
    new_password: str = Field(..., min_length=8, max_length=100, description="Nueva contraseña")

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isupper() for char in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        return v


class PasswordChange(BaseModel):
    """Schema para cambiar contraseña (usuario autenticado)"""
    current_password: str = Field(..., description="Contraseña actual")
    new_password: str = Field(..., min_length=8, max_length=100, description="Nueva contraseña")

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isupper() for char in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        return v


class PasswordResetResponse(BaseModel):
    """Schema de respuesta para solicitud de recuperación"""
    message: str
    email: str


class PasswordChangeResponse(BaseModel):
    """Schema de respuesta para cambio de contraseña"""
    message: str
