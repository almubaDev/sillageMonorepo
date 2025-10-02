from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.utils.cache import cache
from app.api.v1.api import api_router  # NUEVO


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Sillage API...")
    await cache.connect()
    print("✅ Redis connected")
    yield
    # Shutdown
    print("👋 Shutting down...")
    await cache.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
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