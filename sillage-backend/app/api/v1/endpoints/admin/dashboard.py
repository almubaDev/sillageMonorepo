from typing import List, Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract

from app.api.deps import get_db
from app.models.user import User
from app.models.perfume import Perfume
from app.models.recommendation import Recomendacion
from app.models.role import GiftedConsultation
from app.core.permissions import (
    Permission,
    require_permission,
    require_admin
)
from app.schemas.admin import (
    DashboardStats,
    DashboardCharts,
    UserGrowthData,
    RecommendationStats
)

router = APIRouter(prefix="/admin/dashboard", tags=["Admin - Dashboard"])


@router.get("/stats", response_model=DashboardStats, dependencies=[Depends(require_permission(Permission.DASHBOARD_STATS))])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener estadísticas generales para el dashboard.
    Requiere permiso: DASHBOARD_STATS
    """
    # Total de usuarios
    total_users_stmt = select(func.count()).select_from(User)
    total_users_result = await db.execute(total_users_stmt)
    total_users = total_users_result.scalar_one()

    # Usuarios activos
    active_users_stmt = select(func.count()).select_from(User).where(User.is_active == True)
    active_users_result = await db.execute(active_users_stmt)
    active_users = active_users_result.scalar_one()

    # Usuarios suscritos
    subscribed_users_stmt = select(func.count()).select_from(User).where(User.suscrito == True)
    subscribed_users_result = await db.execute(subscribed_users_stmt)
    subscribed_users = subscribed_users_result.scalar_one()

    # Total de perfumes
    total_perfumes_stmt = select(func.count()).select_from(Perfume)
    total_perfumes_result = await db.execute(total_perfumes_stmt)
    total_perfumes = total_perfumes_result.scalar_one()

    # Total de recomendaciones
    total_recommendations_stmt = select(func.count()).select_from(Recomendacion)
    total_recommendations_result = await db.execute(total_recommendations_stmt)
    total_recommendations = total_recommendations_result.scalar_one()

    # Total de consultas regaladas
    total_gifted_stmt = select(func.sum(GiftedConsultation.quantity))
    total_gifted_result = await db.execute(total_gifted_stmt)
    total_consultations_gifted = total_gifted_result.scalar_one() or 0

    # Nuevos usuarios este mes
    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_stmt = select(func.count()).select_from(User).where(
        User.created_at >= first_day_of_month
    )
    new_users_result = await db.execute(new_users_stmt)
    new_users_this_month = new_users_result.scalar_one()

    # Nuevas suscripciones este mes (usuarios que se suscribieron este mes)
    # Asumimos que si suscrito=True y created_at es de este mes, es una nueva suscripción
    new_subscriptions_stmt = select(func.count()).select_from(User).where(
        and_(
            User.suscrito == True,
            User.created_at >= first_day_of_month
        )
    )
    new_subscriptions_result = await db.execute(new_subscriptions_stmt)
    new_subscriptions_this_month = new_subscriptions_result.scalar_one()

    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        subscribed_users=subscribed_users,
        total_perfumes=total_perfumes,
        total_recommendations=total_recommendations,
        total_consultations_gifted=int(total_consultations_gifted),
        new_users_this_month=new_users_this_month,
        new_subscriptions_this_month=new_subscriptions_this_month
    )


@router.get("/charts", response_model=DashboardCharts, dependencies=[Depends(require_permission(Permission.DASHBOARD_VIEW))])
async def get_dashboard_charts(
    months: int = Query(12, ge=1, le=24, description="Número de meses de histórico"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener datos para gráficos del dashboard.
    Requiere permiso: DASHBOARD_VIEW
    """
    # Calcular fecha de inicio
    start_date = datetime.now() - timedelta(days=months * 30)

    # User Growth Data - Usuarios por mes
    user_growth = []
    for i in range(months):
        month_start = datetime.now().replace(day=1) - timedelta(days=i * 30)
        month_start = month_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        # Total usuarios hasta ese mes
        total_stmt = select(func.count()).select_from(User).where(
            User.created_at < next_month
        )
        total_result = await db.execute(total_stmt)
        total = total_result.scalar_one()

        # Nuevos usuarios ese mes
        new_stmt = select(func.count()).select_from(User).where(
            and_(
                User.created_at >= month_start,
                User.created_at < next_month
            )
        )
        new_result = await db.execute(new_stmt)
        new = new_result.scalar_one()

        # Suscritos ese mes
        subscribed_stmt = select(func.count()).select_from(User).where(
            and_(
                User.created_at < next_month,
                User.suscrito == True
            )
        )
        subscribed_result = await db.execute(subscribed_stmt)
        subscribed = subscribed_result.scalar_one()

        user_growth.append(UserGrowthData(
            month=month_start.strftime("%Y-%m"),
            total_users=total,
            new_users=new,
            subscribed_users=subscribed
        ))

    # Revertir para que el más antiguo esté primero
    user_growth.reverse()

    # Recommendation Stats
    # Total recomendaciones
    total_recs_stmt = select(func.count()).select_from(Recomendacion)
    total_recs_result = await db.execute(total_recs_stmt)
    total_recs = total_recs_result.scalar_one()

    # Recomendaciones por género (esto depende de cómo guardes el género en la recomendación)
    # Asumiendo que hay un campo 'genero' o similar en el modelo
    by_gender: Dict[str, int] = {
        "masculino": 0,
        "femenino": 0,
        "unisex": 0
    }

    # Recomendaciones por temporada
    by_season: Dict[str, int] = {
        "primavera": 0,
        "verano": 0,
        "otoño": 0,
        "invierno": 0
    }

    # Promedio de recomendaciones por usuario
    users_with_recs_stmt = select(func.count(func.distinct(Recomendacion.user_id)))
    users_with_recs_result = await db.execute(users_with_recs_stmt)
    users_with_recs = users_with_recs_result.scalar_one()

    avg_per_user = round(total_recs / users_with_recs, 2) if users_with_recs > 0 else 0.0

    recommendation_stats = RecommendationStats(
        total=total_recs,
        by_gender=by_gender,
        by_season=by_season,
        average_per_user=avg_per_user
    )

    # Tasa de suscripción
    total_users_stmt = select(func.count()).select_from(User)
    total_users_result = await db.execute(total_users_stmt)
    total_users = total_users_result.scalar_one()

    subscribed_users_stmt = select(func.count()).select_from(User).where(User.suscrito == True)
    subscribed_users_result = await db.execute(subscribed_users_stmt)
    subscribed_users = subscribed_users_result.scalar_one()

    subscription_rate = round((subscribed_users / total_users * 100), 2) if total_users > 0 else 0.0

    return DashboardCharts(
        user_growth=user_growth,
        recommendation_stats=recommendation_stats,
        subscription_rate=subscription_rate
    )


@router.get("/recent-activity", dependencies=[Depends(require_permission(Permission.DASHBOARD_VIEW))])
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener actividad reciente del sistema.
    Requiere permiso: DASHBOARD_VIEW
    """
    # Últimos usuarios registrados
    recent_users_stmt = select(User).order_by(User.created_at.desc()).limit(limit)
    recent_users_result = await db.execute(recent_users_stmt)
    recent_users = recent_users_result.scalars().all()

    # Últimas recomendaciones
    recent_recs_stmt = select(Recomendacion).order_by(Recomendacion.created_at.desc()).limit(limit)
    recent_recs_result = await db.execute(recent_recs_stmt)
    recent_recommendations = recent_recs_result.scalars().all()

    # Últimas consultas regaladas
    recent_gifts_stmt = select(GiftedConsultation).order_by(GiftedConsultation.created_at.desc()).limit(limit)
    recent_gifts_result = await db.execute(recent_gifts_stmt)
    recent_gifts = recent_gifts_result.scalars().all()

    return {
        "recent_users": [
            {
                "id": u.id,
                "email": u.email,
                "name": f"{u.first_name} {u.last_name}",
                "created_at": u.created_at
            }
            for u in recent_users
        ],
        "recent_recommendations": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "created_at": r.created_at
            }
            for r in recent_recommendations
        ],
        "recent_gifts": [
            {
                "id": g.id,
                "user_id": g.user_id,
                "admin_id": g.admin_id,
                "quantity": g.quantity,
                "created_at": g.created_at
            }
            for g in recent_gifts
        ]
    }
