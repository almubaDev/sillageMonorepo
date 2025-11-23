"""add_daily_financial_snapshots

Revision ID: c7f8e9d0a1b2
Revises: b6ddc54be32b
Create Date: 2025-11-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7f8e9d0a1b2'
down_revision: Union[str, Sequence[str], None] = 'b6ddc54be32b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('daily_financial_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('revenue', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('transactions_count', sa.Integer(), nullable=True),
        sa.Column('api_costs_gemini', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('api_costs_openweather', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('api_costs_google_maps', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('api_costs_total', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('margin', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', name='unique_snapshot_date')
    )
    op.create_index(op.f('ix_daily_financial_snapshots_date'), 'daily_financial_snapshots', ['date'], unique=True)
    op.create_index(op.f('ix_daily_financial_snapshots_id'), 'daily_financial_snapshots', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_daily_financial_snapshots_id'), table_name='daily_financial_snapshots')
    op.drop_index(op.f('ix_daily_financial_snapshots_date'), table_name='daily_financial_snapshots')
    op.drop_table('daily_financial_snapshots')
