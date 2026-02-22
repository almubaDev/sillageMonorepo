from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, RedisDsn


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "local"
    
    # Database
    DATABASE_URL: PostgresDsn
    
    # Redis
    REDIS_URL: RedisDsn
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Default (backwards compatibility)
    ACCESS_TOKEN_EXPIRE_MINUTES_WEB: int = 10080  # 7 días para web (7 * 24 * 60)
    ACCESS_TOKEN_EXPIRE_MINUTES_MOBILE: int = 10080  # 7 días para mobile (7 * 24 * 60)
    
    # APIs externas
    OPENWEATHER_API_KEY: str
    GEMINI_API_KEY: str
    GOOGLE_MAPS_API_KEY: str
    
    # Flow
    FLOW_API_KEY: str
    FLOW_SECRET_KEY: str
    FLOW_API_URL: str
    FLOW_SANDBOX: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # App
    PROJECT_NAME: str = "Sillage API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: str = "*"  # Comma-separated list of allowed origins

    # Email (legacy SMTP)
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USE_TLS: bool = True
    EMAIL_HOST_USER: str
    EMAIL_HOST_PASSWORD: str
    DEFAULT_FROM_EMAIL: str

    # Resend (email transaccional)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@services.sillage.pro"

    # PayPal
    PAYPAL_BUSINESS_EMAIL: str
    PAYPAL_MODE: str = "production"  # "production" o "sandbox"

    # Backend URL (para redirecciones de PayPal)
    BACKEND_URL: str = "http://localhost:8000"

    @property
    def PAYPAL_URL(self) -> str:
        """Retorna la URL de PayPal según el modo (sandbox o production)"""
        if self.PAYPAL_MODE == "sandbox":
            return "https://www.sandbox.paypal.com/cgi-bin/webscr"
        return "https://www.paypal.com/cgi-bin/webscr"

    @property
    def cors_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into a list"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()