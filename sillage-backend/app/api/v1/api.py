from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, perfumes, recommendations  # MODIFICADO

api_router = APIRouter()

# Incluir los routers de cada endpoint
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Autenticación"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Usuarios"]
)

api_router.include_router(
    perfumes.router,
    prefix="/perfumes",
    tags=["Perfumes"]
)

api_router.include_router(  # NUEVO
    recommendations.router,
    prefix="/recommendations",
    tags=["Recomendaciones"]
)

# Aquí agregaremos más routers después:
# api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Suscripciones"])