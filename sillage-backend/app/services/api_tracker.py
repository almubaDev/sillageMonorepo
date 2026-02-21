# sillage-backend/app/services/api_tracker.py
"""
Servicio para tracking de uso de APIs externas (Gemini, OpenWeather, Google Maps)
"""

import time
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert

from app.models.api_usage import APIUsageLog, APIDailyUsage, APIUsageConfig


# Configuración por defecto de las APIs - FREE TIER
DEFAULT_API_CONFIGS = {
    'gemini': {
        'free_daily_limit': 500,
        'free_monthly_limit': 15000,
        'cost_per_1m_tokens_input': Decimal('0.30'),
        'cost_per_1m_tokens_output': Decimal('2.50'),
        'cost_per_call': Decimal('0'),
    },
    'openweather': {
        'free_daily_limit': 1000,
        'free_monthly_limit': 30000,
        'cost_per_call': Decimal('0.0015'),
        'cost_per_1m_tokens_input': Decimal('0'),
        'cost_per_1m_tokens_output': Decimal('0'),
    },
    'google_maps': {
        'free_daily_limit': 0,  # No tiene límite diario, solo mensual
        'free_monthly_limit': 10000,
        'cost_per_call': Decimal('0.005'),
        'cost_per_1m_tokens_input': Decimal('0'),
        'cost_per_1m_tokens_output': Decimal('0'),
    },
}

# Configuración de las APIs - PAID TIER (Tier 1)
PAID_API_CONFIGS = {
    'gemini': {
        'paid_daily_limit': 10000,  # Tier 1: 10,000 RPD
        'paid_monthly_limit': 300000,
    },
    'openweather': {
        'paid_daily_limit': 100000,  # Sin limite practico en paid
        'paid_monthly_limit': 3000000,
    },
    'google_maps': {
        'paid_daily_limit': 0,  # Sin limite diario
        'paid_monthly_limit': 1000000,  # Practicamente sin limite
    },
}


class APITracker:
    """Servicio para registrar y consultar uso de APIs"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_api_call(
        self,
        api_name: str,
        endpoint: str = None,
        tokens_input: int = 0,
        tokens_output: int = 0,
        response_time_ms: int = 0,
        success: bool = True,
        error_message: str = None,
        user_id: int = None,
        recommendation_id: int = None
    ) -> APIUsageLog:
        """
        Registrar una llamada a una API externa.
        También actualiza el resumen diario.
        """
        # Calcular costo estimado
        estimated_cost = await self._calculate_cost(
            api_name, tokens_input, tokens_output
        )

        # Crear log individual
        log = APIUsageLog(
            api_name=api_name,
            endpoint=endpoint,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            response_time_ms=response_time_ms,
            estimated_cost_usd=estimated_cost,
            user_id=user_id,
            recommendation_id=recommendation_id,
            success=success,
            error_message=error_message
        )
        self.db.add(log)

        # Actualizar resumen diario
        await self._update_daily_usage(
            api_name=api_name,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            response_time_ms=response_time_ms,
            cost=estimated_cost,
            success=success
        )

        await self.db.commit()
        return log

    async def _calculate_cost(
        self,
        api_name: str,
        tokens_input: int,
        tokens_output: int
    ) -> Decimal:
        """Calcular el costo estimado de una llamada"""
        config = await self._get_config(api_name)

        if not config or not config.is_paid_tier:
            # En free tier, no hay costo
            return Decimal('0')

        if api_name == 'gemini':
            # Costo por tokens
            input_cost = (Decimal(tokens_input) / Decimal('1000000')) * config.cost_per_1m_tokens_input
            output_cost = (Decimal(tokens_output) / Decimal('1000000')) * config.cost_per_1m_tokens_output
            return input_cost + output_cost
        else:
            # Costo por llamada
            return config.cost_per_call

    async def _get_config(self, api_name: str) -> Optional[APIUsageConfig]:
        """Obtener configuración de una API, creándola si no existe"""
        result = await self.db.execute(
            select(APIUsageConfig).where(APIUsageConfig.api_name == api_name)
        )
        config = result.scalar_one_or_none()

        if not config and api_name in DEFAULT_API_CONFIGS:
            # Crear configuración por defecto
            defaults = DEFAULT_API_CONFIGS[api_name]
            config = APIUsageConfig(
                api_name=api_name,
                is_paid_tier=False,
                **defaults
            )
            self.db.add(config)
            await self.db.flush()

        return config

    async def _update_daily_usage(
        self,
        api_name: str,
        tokens_input: int,
        tokens_output: int,
        response_time_ms: int,
        cost: Decimal,
        success: bool
    ):
        """Actualizar o crear el resumen diario"""
        today = date.today()

        # Buscar registro existente
        result = await self.db.execute(
            select(APIDailyUsage).where(
                APIDailyUsage.date == today,
                APIDailyUsage.api_name == api_name
            )
        )
        daily = result.scalar_one_or_none()

        if daily:
            # Actualizar existente
            daily.total_calls += 1
            if success:
                daily.successful_calls += 1
            else:
                daily.failed_calls += 1
            daily.total_tokens_input += tokens_input
            daily.total_tokens_output += tokens_output
            daily.total_cost_usd += cost
            # Calcular promedio de tiempo de respuesta
            if daily.total_calls > 0:
                current_total_time = daily.avg_response_time_ms * (daily.total_calls - 1)
                daily.avg_response_time_ms = int((current_total_time + response_time_ms) / daily.total_calls)
        else:
            # Crear nuevo
            daily = APIDailyUsage(
                date=today,
                api_name=api_name,
                total_calls=1,
                successful_calls=1 if success else 0,
                failed_calls=0 if success else 1,
                total_tokens_input=tokens_input,
                total_tokens_output=tokens_output,
                total_cost_usd=cost,
                avg_response_time_ms=response_time_ms
            )
            self.db.add(daily)

    async def get_usage_summary(self, api_name: str = None) -> dict:
        """
        Obtener resumen de uso actual vs límites.
        Si api_name es None, devuelve todas las APIs.
        """
        today = date.today()
        first_day_of_month = today.replace(day=1)

        apis = [api_name] if api_name else list(DEFAULT_API_CONFIGS.keys())
        summaries = {}

        for api in apis:
            config = await self._get_config(api)

            # Obtener uso de hoy
            result = await self.db.execute(
                select(APIDailyUsage).where(
                    APIDailyUsage.date == today,
                    APIDailyUsage.api_name == api
                )
            )
            daily = result.scalar_one_or_none()

            # Obtener uso del mes
            result = await self.db.execute(
                select(
                    func.sum(APIDailyUsage.total_calls).label('monthly_calls'),
                    func.sum(APIDailyUsage.total_cost_usd).label('monthly_cost'),
                    func.sum(APIDailyUsage.total_tokens_input).label('monthly_tokens_input'),
                    func.sum(APIDailyUsage.total_tokens_output).label('monthly_tokens_output')
                ).where(
                    APIDailyUsage.date >= first_day_of_month,
                    APIDailyUsage.api_name == api
                )
            )
            monthly = result.one()

            daily_calls = daily.total_calls if daily else 0
            monthly_calls = monthly.monthly_calls or 0
            monthly_cost = float(monthly.monthly_cost or 0)

            # Determinar si está en modo pago
            is_paid = config.is_paid_tier if config else False

            # Calcular límites según el tier (free o paid)
            if is_paid and api in PAID_API_CONFIGS:
                daily_limit = PAID_API_CONFIGS[api]['paid_daily_limit']
                monthly_limit = PAID_API_CONFIGS[api]['paid_monthly_limit']
            else:
                daily_limit = config.free_daily_limit if config else DEFAULT_API_CONFIGS[api]['free_daily_limit']
                monthly_limit = config.free_monthly_limit if config else DEFAULT_API_CONFIGS[api]['free_monthly_limit']

            daily_pct = (daily_calls / daily_limit * 100) if daily_limit > 0 else 0
            monthly_pct = (monthly_calls / monthly_limit * 100) if monthly_limit > 0 else 0

            summaries[api] = {
                'is_paid_tier': config.is_paid_tier if config else False,
                'today': {
                    'calls': daily_calls,
                    'limit': daily_limit,
                    'percentage': round(daily_pct, 1),
                    'tokens_input': daily.total_tokens_input if daily else 0,
                    'tokens_output': daily.total_tokens_output if daily else 0,
                },
                'month': {
                    'calls': monthly_calls,
                    'limit': monthly_limit,
                    'percentage': round(monthly_pct, 1),
                    'cost_usd': round(monthly_cost, 4),
                    'tokens_input': monthly.monthly_tokens_input or 0,
                    'tokens_output': monthly.monthly_tokens_output or 0,
                },
                'alerts': self._generate_alerts(daily_pct, monthly_pct, api)
            }

        return summaries if not api_name else summaries.get(api_name)

    def _generate_alerts(self, daily_pct: float, monthly_pct: float, api_name: str) -> list:
        """Generar alertas basadas en el porcentaje de uso"""
        alerts = []

        if daily_pct >= 95:
            alerts.append({
                'level': 'critical',
                'message': f'{api_name}: Límite diario casi alcanzado ({daily_pct:.1f}%)'
            })
        elif daily_pct >= 80:
            alerts.append({
                'level': 'warning',
                'message': f'{api_name}: Uso diario alto ({daily_pct:.1f}%)'
            })

        if monthly_pct >= 95:
            alerts.append({
                'level': 'critical',
                'message': f'{api_name}: Límite mensual casi alcanzado ({monthly_pct:.1f}%)'
            })
        elif monthly_pct >= 80:
            alerts.append({
                'level': 'warning',
                'message': f'{api_name}: Uso mensual alto ({monthly_pct:.1f}%)'
            })

        return alerts

    async def set_tier_mode(self, api_name: str, is_paid: bool) -> APIUsageConfig:
        """Cambiar entre modo gratuito y de pago"""
        config = await self._get_config(api_name)
        if config:
            config.is_paid_tier = is_paid
            await self.db.commit()
        return config

    async def get_daily_chart_data(self, api_name: str = None, days: int = 30) -> list:
        """Obtener datos para gráfico de uso diario"""
        from datetime import timedelta

        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        query = select(APIDailyUsage).where(
            APIDailyUsage.date >= start_date
        ).order_by(APIDailyUsage.date)

        if api_name:
            query = query.where(APIDailyUsage.api_name == api_name)

        result = await self.db.execute(query)
        records = result.scalars().all()

        # Organizar por fecha y API
        data = {}
        for record in records:
            date_str = record.date.isoformat()
            if date_str not in data:
                data[date_str] = {}
            data[date_str][record.api_name] = {
                'calls': record.total_calls,
                'cost': float(record.total_cost_usd),
                'tokens_input': record.total_tokens_input,
                'tokens_output': record.total_tokens_output,
            }

        return [{'date': k, **v} for k, v in sorted(data.items())]


# Función helper para usar el tracker fácilmente
async def track_api_call(
    db: AsyncSession,
    api_name: str,
    **kwargs
) -> APIUsageLog:
    """Helper function para registrar llamadas de forma sencilla"""
    tracker = APITracker(db)
    return await tracker.log_api_call(api_name, **kwargs)
