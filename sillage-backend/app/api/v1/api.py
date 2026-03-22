from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, perfumes, recommendations, password, payments, coupons, admin_payments, perfume_reports, coleccion, public_perfumes, reviews
from app.api.v1.endpoints.admin import users as admin_users
from app.api.v1.endpoints.admin import perfumes as admin_perfumes
from app.api.v1.endpoints.admin import consultations as admin_consultations
from app.api.v1.endpoints.admin import dashboard as admin_dashboard
from app.api.v1.endpoints.admin import financial as admin_financial
from app.api.v1.endpoints.admin import coupons as admin_coupons
from app.api.v1.endpoints.admin import api_usage as admin_api_usage
from app.api.v1.endpoints.admin import tools as admin_tools

api_router = APIRouter()

# Incluir los routers de cada endpoint
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Autenticación"]
)

api_router.include_router(
    password.router,
    prefix="/password",
    tags=["Contraseñas"]
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

api_router.include_router(
    recommendations.router,
    prefix="/recommendations",
    tags=["Recomendaciones"]
)

api_router.include_router(
    payments.router,
    prefix="/payments",
    tags=["Pagos"]
)

api_router.include_router(
    coupons.router,
    prefix="/coupons",
    tags=["Cupones"]
)

api_router.include_router(
    perfume_reports.router,
    prefix="/perfume-reports",
    tags=["Reportes de Perfumes"]
)

api_router.include_router(
    coleccion.router,
    prefix="/coleccion",
    tags=["Coleccion"]
)

api_router.include_router(
    reviews.router,
    prefix="/reviews",
    tags=["Reviews"]
)

# Admin endpoints
api_router.include_router(
    admin_users.router,
    tags=["Admin - Users"]
)

api_router.include_router(
    admin_perfumes.router,
    tags=["Admin - Perfumes"]
)

api_router.include_router(
    admin_consultations.router,
    tags=["Admin - Consultations"]
)

api_router.include_router(
    admin_dashboard.router,
    tags=["Admin - Dashboard"]
)

api_router.include_router(
    admin_financial.router,
    prefix="/admin/financial",
    tags=["Admin - Financial"]
)

api_router.include_router(
    admin_coupons.router,
    tags=["Admin - Coupons"]
)

api_router.include_router(
    admin_payments.router,
    tags=["Admin - Payments"]
)

api_router.include_router(
    admin_api_usage.router,
    tags=["Admin - API Usage"]
)

api_router.include_router(
    admin_tools.router,
    tags=["Admin - Tools"]
)

# Public API Usage endpoint (para reportar uso de Maps desde frontend)
api_router.include_router(
    admin_api_usage.public_router,
    tags=["API Usage"]
)

# API pública (autenticación por API key)
api_router.include_router(
    public_perfumes.router,
    prefix="/public/perfumes",
    tags=["API Pública - Perfumes"]
)