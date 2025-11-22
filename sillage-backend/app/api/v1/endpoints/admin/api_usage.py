# sillage-backend/app/api/v1/endpoints/admin/api_usage.py
"""
Endpoints de administración para monitoreo de uso de APIs externas
(Gemini, OpenWeather, Google Maps)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import date

from app.core.database import get_db
from app.core.permissions import require_superuser
from app.models.user import User
from app.services.api_tracker import APITracker, DEFAULT_API_CONFIGS

router = APIRouter(prefix="/admin/api-usage", tags=["Admin - API Usage"])


# ========================================================================
# SCHEMAS
# ========================================================================

class UsageLimitInfo(BaseModel):
    calls: int
    limit: int
    percentage: float
    tokens_input: int = 0
    tokens_output: int = 0
    cost_usd: Optional[float] = None


class APIAlerts(BaseModel):
    level: str
    message: str


class APISummary(BaseModel):
    is_paid_tier: bool
    today: UsageLimitInfo
    month: UsageLimitInfo
    alerts: list[APIAlerts]


class APIUsageSummaryResponse(BaseModel):
    gemini: Optional[APISummary] = None
    openweather: Optional[APISummary] = None
    google_maps: Optional[APISummary] = None


class SetTierModeRequest(BaseModel):
    api_name: str
    is_paid: bool


class SetTierModeResponse(BaseModel):
    api_name: str
    is_paid_tier: bool
    message: str


class ChartDataPoint(BaseModel):
    date: str
    gemini: Optional[dict] = None
    openweather: Optional[dict] = None
    google_maps: Optional[dict] = None


class APIConfigInfo(BaseModel):
    api_name: str
    is_paid_tier: bool
    free_daily_limit: int
    free_monthly_limit: int
    cost_per_call: float
    cost_per_1m_tokens_input: float
    cost_per_1m_tokens_output: float


# ========================================================================
# ENDPOINTS
# ========================================================================

@router.get("/summary", response_model=APIUsageSummaryResponse)
async def get_api_usage_summary(
    api_name: Optional[str] = Query(None, description="Filtrar por API específica (gemini, openweather, google_maps)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener resumen de uso de APIs con comparación contra límites del free tier.
    Muestra el uso diario y mensual con alertas cuando se acerca a los límites.
    """
    tracker = APITracker(db)
    summary = await tracker.get_usage_summary(api_name)

    if api_name:
        # Si se pidió una API específica, envolver en el formato esperado
        return {api_name: summary}

    return summary


@router.get("/chart-data", response_model=list[ChartDataPoint])
async def get_api_usage_chart_data(
    api_name: Optional[str] = Query(None, description="Filtrar por API específica"),
    days: int = Query(30, ge=1, le=90, description="Número de días a incluir"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener datos históricos para gráficos de uso de APIs.
    Retorna datos diarios agregados para los últimos N días.
    """
    tracker = APITracker(db)
    data = await tracker.get_daily_chart_data(api_name, days)
    return data


@router.post("/set-tier", response_model=SetTierModeResponse)
async def set_api_tier_mode(
    request: SetTierModeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Cambiar entre modo gratuito y de pago para una API.
    Esto afecta cómo se calculan los costos y se muestran los límites.
    """
    if request.api_name not in DEFAULT_API_CONFIGS:
        raise HTTPException(
            status_code=400,
            detail=f"API no reconocida: {request.api_name}. APIs válidas: {list(DEFAULT_API_CONFIGS.keys())}"
        )

    tracker = APITracker(db)
    config = await tracker.set_tier_mode(request.api_name, request.is_paid)

    tier_name = "pago" if request.is_paid else "gratuito"
    return SetTierModeResponse(
        api_name=request.api_name,
        is_paid_tier=request.is_paid,
        message=f"API {request.api_name} configurada en modo {tier_name}"
    )


@router.get("/configs", response_model=list[APIConfigInfo])
async def get_api_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """
    Obtener la configuración actual de todas las APIs (límites y costos).
    """
    tracker = APITracker(db)
    configs = []

    for api_name in DEFAULT_API_CONFIGS.keys():
        config = await tracker._get_config(api_name)
        if config:
            configs.append(APIConfigInfo(
                api_name=config.api_name,
                is_paid_tier=config.is_paid_tier,
                free_daily_limit=config.free_daily_limit,
                free_monthly_limit=config.free_monthly_limit,
                cost_per_call=float(config.cost_per_call),
                cost_per_1m_tokens_input=float(config.cost_per_1m_tokens_input),
                cost_per_1m_tokens_output=float(config.cost_per_1m_tokens_output)
            ))

    return configs


@router.get("/free-tier-limits")
async def get_free_tier_limits(
    current_user: User = Depends(require_superuser)
):
    """
    Obtener los límites del free tier de todas las APIs.
    Información de referencia para el dashboard.
    """
    return {
        "gemini": {
            "provider": "Google",
            "model": "Gemini 2.0 Flash",
            "free_daily_limit": 200,
            "free_monthly_limit": 6000,
            "pricing_paid": {
                "input": "$0.10 por 1M tokens",
                "output": "$0.40 por 1M tokens"
            },
            "notes": "Límite de 200 requests/día en free tier"
        },
        "openweather": {
            "provider": "OpenWeather",
            "service": "5-Day Forecast API",
            "free_daily_limit": 1000,
            "free_monthly_limit": 30000,
            "pricing_paid": "$0.0015 por llamada",
            "notes": "Plan gratuito: 1000 calls/día"
        },
        "google_maps": {
            "provider": "Google Cloud",
            "service": "Geocoding API",
            "free_daily_limit": 0,
            "free_monthly_limit": 10000,
            "pricing_paid": "$5.00 por 1000 llamadas",
            "notes": "Se usa desde el cliente móvil. $200 de crédito mensual gratis"
        }
    }
