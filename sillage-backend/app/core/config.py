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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()