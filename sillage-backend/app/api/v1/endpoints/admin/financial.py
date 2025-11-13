"""
Endpoints para reportes financieros del panel administrativo
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract, desc
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
import logging

from app.core.database import get_db
from app.core.permissions import require_superuser
from app.models.payment import PagoConsultas, PaqueteConsultas
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/summary", dependencies=[Depends(require_superuser)])
async def get_financial_summary(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Obtener resumen financiero general

    Returns:
        - total_revenue: Ingresos totales históricos
        - monthly_revenue: Ingresos del mes actual
        - daily_revenue: Ingresos de hoy
        - total_transactions: Total de transacciones completadas
        - avg_ticket: Ticket promedio
    """
    try:
        # Total de ingresos históricos
        result_total = await db.execute(
            select(
                func.sum(PagoConsultas.monto).label('total'),
                func.count(PagoConsultas.id).label('count'),
                func.avg(PagoConsultas.monto).label('avg')
            ).where(PagoConsultas.estado == 'completado')
        )
        total_data = result_total.first()

        # Ingresos del mes actual
        now = datetime.utcnow()
        first_day_month = datetime(now.year, now.month, 1)

        result_monthly = await db.execute(
            select(func.sum(PagoConsultas.monto))
            .where(
                and_(
                    PagoConsultas.estado == 'completado',
                    PagoConsultas.created_at >= first_day_month
                )
            )
        )
        monthly_revenue = result_monthly.scalar() or 0

        # Ingresos de hoy
        today_start = datetime(now.year, now.month, now.day)

        result_daily = await db.execute(
            select(func.sum(PagoConsultas.monto))
            .where(
                and_(
                    PagoConsultas.estado == 'completado',
                    PagoConsultas.created_at >= today_start
                )
            )
        )
        daily_revenue = result_daily.scalar() or 0

        return {
            'total_revenue': float(total_data.total or 0),
            'monthly_revenue': float(monthly_revenue),
            'daily_revenue': float(daily_revenue),
            'total_transactions': total_data.count or 0,
            'avg_ticket': float(total_data.avg or 0)
        }

    except Exception as e:
        logger.error(f"Error obteniendo resumen financiero: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo resumen financiero: {str(e)}"
        )


@router.get("/by-package", dependencies=[Depends(require_superuser)])
async def get_revenue_by_package(
    period: str = Query('all', regex='^(all|month|day)$'),
    date_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Obtener ingresos por paquete

    Args:
        period: 'all' (todos los tiempos), 'month' (mes específico), 'day' (día específico)
        date_filter: Fecha en formato YYYY-MM-DD (para month o day)

    Returns:
        Lista con ingresos por cada paquete
    """
    try:
        # Base query
        query = (
            select(
                PaqueteConsultas.nombre,
                PaqueteConsultas.precio,
                func.count(PagoConsultas.id).label('sales_count'),
                func.sum(PagoConsultas.monto).label('total_revenue')
            )
            .join(PagoConsultas, PaqueteConsultas.id == PagoConsultas.paquete_consultas_id)
            .where(PagoConsultas.estado == 'completado')
            .group_by(PaqueteConsultas.id, PaqueteConsultas.nombre, PaqueteConsultas.precio)
            .order_by(desc('total_revenue'))
        )

        # Aplicar filtros de fecha
        if period == 'month' and date_filter:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d')
            first_day = datetime(filter_date.year, filter_date.month, 1)
            if filter_date.month == 12:
                last_day = datetime(filter_date.year + 1, 1, 1)
            else:
                last_day = datetime(filter_date.year, filter_date.month + 1, 1)

            query = query.where(
                and_(
                    PagoConsultas.created_at >= first_day,
                    PagoConsultas.created_at < last_day
                )
            )
        elif period == 'day' and date_filter:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d')
            next_day = filter_date + timedelta(days=1)

            query = query.where(
                and_(
                    PagoConsultas.created_at >= filter_date,
                    PagoConsultas.created_at < next_day
                )
            )

        result = await db.execute(query)
        packages = result.all()

        return [
            {
                'name': pkg.nombre,
                'price': float(pkg.precio),
                'sales_count': pkg.sales_count,
                'total_revenue': float(pkg.total_revenue or 0),
                'avg_per_sale': float(pkg.total_revenue / pkg.sales_count if pkg.sales_count > 0 else 0)
            }
            for pkg in packages
        ]

    except Exception as e:
        logger.error(f"Error obteniendo ingresos por paquete: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo ingresos por paquete: {str(e)}"
        )


@router.get("/top-customers", dependencies=[Depends(require_superuser)])
async def get_top_customers(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Obtener top clientes por ingresos generados

    Args:
        limit: Número de clientes a retornar (default 10, máx 100)

    Returns:
        Lista de clientes ordenados por total gastado
    """
    try:
        query = (
            select(
                User.id,
                User.email,
                User.first_name,
                User.last_name,
                func.count(PagoConsultas.id).label('purchases_count'),
                func.sum(PagoConsultas.monto).label('total_spent'),
                func.max(PagoConsultas.created_at).label('last_purchase')
            )
            .join(PagoConsultas, User.id == PagoConsultas.user_id)
            .where(PagoConsultas.estado == 'completado')
            .group_by(User.id, User.email, User.first_name, User.last_name)
            .order_by(desc('total_spent'))
            .limit(limit)
        )

        result = await db.execute(query)
        customers = result.all()

        return [
            {
                'user_id': customer.id,
                'email': customer.email,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'full_name': f"{customer.first_name} {customer.last_name}",
                'purchases_count': customer.purchases_count,
                'total_spent': float(customer.total_spent or 0),
                'last_purchase': customer.last_purchase.isoformat() if customer.last_purchase else None
            }
            for customer in customers
        ]

    except Exception as e:
        logger.error(f"Error obteniendo top clientes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo top clientes: {str(e)}"
        )


@router.get("/daily-chart", dependencies=[Depends(require_superuser)])
async def get_daily_revenue_chart(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Obtener datos para gráfico de ingresos diarios

    Args:
        days: Número de días hacia atrás (default 30, máx 365)

    Returns:
        Lista de ingresos por día
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)

        query = (
            select(
                func.date(PagoConsultas.created_at).label('date'),
                func.sum(PagoConsultas.monto).label('revenue'),
                func.count(PagoConsultas.id).label('transactions')
            )
            .where(
                and_(
                    PagoConsultas.estado == 'completado',
                    PagoConsultas.created_at >= start_date
                )
            )
            .group_by(func.date(PagoConsultas.created_at))
            .order_by('date')
        )

        result = await db.execute(query)
        daily_data = result.all()

        return [
            {
                'date': day.date.isoformat() if day.date else None,
                'revenue': float(day.revenue or 0),
                'transactions': day.transactions
            }
            for day in daily_data
        ]

    except Exception as e:
        logger.error(f"Error obteniendo datos diarios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo datos diarios: {str(e)}"
        )


@router.get("/monthly-chart", dependencies=[Depends(require_superuser)])
async def get_monthly_revenue_chart(
    months: int = Query(12, ge=1, le=24),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Obtener datos para gráfico de ingresos mensuales

    Args:
        months: Número de meses hacia atrás (default 12, máx 24)

    Returns:
        Lista de ingresos por mes
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=months * 30)

        query = (
            select(
                extract('year', PagoConsultas.created_at).label('year'),
                extract('month', PagoConsultas.created_at).label('month'),
                func.sum(PagoConsultas.monto).label('revenue'),
                func.count(PagoConsultas.id).label('transactions')
            )
            .where(
                and_(
                    PagoConsultas.estado == 'completado',
                    PagoConsultas.created_at >= start_date
                )
            )
            .group_by('year', 'month')
            .order_by('year', 'month')
        )

        result = await db.execute(query)
        monthly_data = result.all()

        return [
            {
                'year': int(month.year),
                'month': int(month.month),
                'month_name': datetime(int(month.year), int(month.month), 1).strftime('%B'),
                'date': f"{int(month.year)}-{int(month.month):02d}",
                'revenue': float(month.revenue or 0),
                'transactions': month.transactions
            }
            for month in monthly_data
        ]

    except Exception as e:
        logger.error(f"Error obteniendo datos mensuales: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo datos mensuales: {str(e)}"
        )
