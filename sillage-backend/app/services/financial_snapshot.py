# sillage-backend/app/services/financial_snapshot.py
"""
Servicio para gestionar snapshots financieros diarios.
Implementa lazy snapshots: se generan automáticamente cuando se accede al admin.
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
import logging

from app.models.financial_snapshot import DailyFinancialSnapshot
from app.models.payment import PagoConsultas
from app.models.api_usage import APIDailyUsage, APIUsageConfig

logger = logging.getLogger(__name__)

# Costos de APIs (mismo que en frontend)
API_COSTS = {
    'gemini': {
        'cost_per_1m_tokens_input': Decimal('0.10'),
        'cost_per_1m_tokens_output': Decimal('0.40'),
    },
    'openweather': {
        'cost_per_call': Decimal('0.0015'),
    },
    'google_maps': {
        'cost_per_call': Decimal('0.005'),
    },
}


async def get_api_tier_status(db: AsyncSession) -> Dict[str, bool]:
    """Obtener el estado de tier (paid/free) de cada API"""
    result = await db.execute(select(APIUsageConfig))
    configs = result.scalars().all()

    return {config.api_name: config.is_paid_tier for config in configs}


async def calculate_daily_revenue(db: AsyncSession, target_date: date) -> tuple[Decimal, int]:
    """
    Calcular ingresos de un día específico.
    Retorna (revenue, transactions_count)
    """
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())

    result = await db.execute(
        select(
            func.coalesce(func.sum(PagoConsultas.monto), 0).label('total'),
            func.count(PagoConsultas.id).label('count')
        )
        .where(
            and_(
                PagoConsultas.estado == 'completado',
                PagoConsultas.created_at >= start_datetime,
                PagoConsultas.created_at < end_datetime
            )
        )
    )
    data = result.first()

    return (Decimal(str(data.total or 0)), data.count or 0)


async def calculate_daily_api_costs(
    db: AsyncSession,
    target_date: date,
    tier_status: Dict[str, bool]
) -> Dict[str, Decimal]:
    """
    Calcular costos de APIs de un día específico.
    Solo calcula costos si la API está en modo paid.
    """
    costs = {
        'gemini': Decimal('0'),
        'openweather': Decimal('0'),
        'google_maps': Decimal('0'),
        'total': Decimal('0'),
    }

    # Obtener uso diario de cada API
    result = await db.execute(
        select(APIDailyUsage)
        .where(APIDailyUsage.date == target_date)
    )
    daily_usages = result.scalars().all()

    for usage in daily_usages:
        api_name = usage.api_name

        # Solo calcular si está en modo paid
        if not tier_status.get(api_name, False):
            continue

        if api_name == 'gemini':
            input_cost = (Decimal(usage.total_tokens_input or 0) / Decimal('1000000')) * API_COSTS['gemini']['cost_per_1m_tokens_input']
            output_cost = (Decimal(usage.total_tokens_output or 0) / Decimal('1000000')) * API_COSTS['gemini']['cost_per_1m_tokens_output']
            costs['gemini'] = input_cost + output_cost
        elif api_name == 'openweather':
            costs['openweather'] = Decimal(usage.total_calls or 0) * API_COSTS['openweather']['cost_per_call']
        elif api_name == 'google_maps':
            costs['google_maps'] = Decimal(usage.total_calls or 0) * API_COSTS['google_maps']['cost_per_call']

    costs['total'] = costs['gemini'] + costs['openweather'] + costs['google_maps']

    return costs


async def create_snapshot_for_date(db: AsyncSession, target_date: date) -> Optional[DailyFinancialSnapshot]:
    """
    Crear un snapshot financiero para una fecha específica.
    Retorna el snapshot creado o None si ya existía.
    """
    # Verificar si ya existe
    existing = await db.execute(
        select(DailyFinancialSnapshot)
        .where(DailyFinancialSnapshot.date == target_date)
    )
    if existing.scalar_one_or_none():
        logger.debug(f"Snapshot para {target_date} ya existe")
        return None

    # Obtener tier status
    tier_status = await get_api_tier_status(db)

    # Calcular datos
    revenue, transactions = await calculate_daily_revenue(db, target_date)
    api_costs = await calculate_daily_api_costs(db, target_date, tier_status)

    # Calcular margen
    margin = revenue - api_costs['total']

    # Crear snapshot
    snapshot = DailyFinancialSnapshot(
        date=target_date,
        revenue=revenue,
        transactions_count=transactions,
        api_costs_gemini=api_costs['gemini'],
        api_costs_openweather=api_costs['openweather'],
        api_costs_google_maps=api_costs['google_maps'],
        api_costs_total=api_costs['total'],
        margin=margin,
    )

    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)

    logger.info(f"Snapshot creado para {target_date}: revenue=${revenue}, costs=${api_costs['total']}, margin=${margin}")

    return snapshot


async def ensure_yesterday_snapshot(db: AsyncSession) -> Optional[DailyFinancialSnapshot]:
    """
    Asegurar que existe el snapshot de ayer (lazy snapshot).
    Se llama automáticamente cuando un admin accede al panel.
    """
    yesterday = date.today() - timedelta(days=1)
    return await create_snapshot_for_date(db, yesterday)


async def backfill_missing_snapshots(db: AsyncSession, days: int = 30) -> List[DailyFinancialSnapshot]:
    """
    Crear snapshots para los últimos N días que no tengan uno.
    Útil para recuperar datos históricos.
    """
    created = []
    today = date.today()

    for i in range(1, days + 1):
        target_date = today - timedelta(days=i)
        snapshot = await create_snapshot_for_date(db, target_date)
        if snapshot:
            created.append(snapshot)

    return created


async def get_snapshots(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 30
) -> List[DailyFinancialSnapshot]:
    """
    Obtener snapshots financieros en un rango de fechas.
    """
    query = select(DailyFinancialSnapshot).order_by(DailyFinancialSnapshot.date.desc())

    if start_date:
        query = query.where(DailyFinancialSnapshot.date >= start_date)
    if end_date:
        query = query.where(DailyFinancialSnapshot.date <= end_date)

    query = query.limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_snapshot_summary(db: AsyncSession, days: int = 30) -> Dict[str, Any]:
    """
    Obtener resumen de snapshots de los últimos N días.
    """
    start_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(
            func.sum(DailyFinancialSnapshot.revenue).label('total_revenue'),
            func.sum(DailyFinancialSnapshot.api_costs_total).label('total_costs'),
            func.sum(DailyFinancialSnapshot.margin).label('total_margin'),
            func.sum(DailyFinancialSnapshot.transactions_count).label('total_transactions'),
            func.count(DailyFinancialSnapshot.id).label('days_count')
        )
        .where(DailyFinancialSnapshot.date >= start_date)
    )
    data = result.first()

    return {
        'total_revenue': float(data.total_revenue or 0),
        'total_costs': float(data.total_costs or 0),
        'total_margin': float(data.total_margin or 0),
        'total_transactions': data.total_transactions or 0,
        'days_count': data.days_count or 0,
    }
