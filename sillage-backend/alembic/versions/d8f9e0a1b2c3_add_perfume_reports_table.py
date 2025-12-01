"""Add perfume_reports table

Revision ID: d8f9e0a1b2c3
Revises: c7f8e9d0a1b2
Create Date: 2024-11-30 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd8f9e0a1b2c3'
down_revision = 'c7f8e9d0a1b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Crear tabla perfume_reports
    op.create_table('perfume_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('marca', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_perfume_reports_id'), 'perfume_reports', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_perfume_reports_id'), table_name='perfume_reports')
    op.drop_table('perfume_reports')
