from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.permissions import initialize_default_roles
from app.utils.cache import cache
from app.api.v1.api import api_router  # NUEVO


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Sillage API...")
    await cache.connect()
    print("Redis connected")

    # Inicializar roles predeterminados
    try:
        async with AsyncSessionLocal() as db:
            await initialize_default_roles(db)
        print("Default roles initialized")
    except Exception as e:
        print(f"Warning: Could not initialize roles: {e}")

    print("Sillage API started successfully")
    yield
    # Shutdown
    print("Shutting down...")
    await cache.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Configurado desde .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de API v1 - NUEVO
app.include_router(api_router, prefix=settings.API_V1_STR)  # NUEVO

@app.get("/")
async def root():
    return {
        "message": "Welcome to Sillage API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }