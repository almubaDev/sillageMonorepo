"""Add admin system with roles and permissions

Revision ID: 3a8f4e9c5d2a
Revises: 25772214108d
Create Date: 2025-10-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "3a8f4e9c5d2a"
down_revision: Union[str, Sequence[str], None] = "25772214108d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add admin system."""

    # 1. Add is_admin column to users table
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "is_admin",
                sa.Boolean(),
                nullable=True,
                server_default=sa.false(),
            )
        )

    # Set default value for existing users
    op.execute("UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL")

    # Make column non-nullable
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "is_admin", nullable=False, existing_type=sa.Boolean()
        )
        batch_op.alter_column(
            "is_admin", server_default=None, existing_type=sa.Boolean()
        )

    # 2. Create roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("permissions", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("roles") as batch_op:
        batch_op.create_index(batch_op.f("ix_roles_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_roles_name"), ["name"], unique=True)

    # 3. Create user_roles association table
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["role_id"], ["roles.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )

    # 4. Create admin_logs table
    op.create_table(
        "admin_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("resource", sa.String(length=50), nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["admin_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("admin_logs") as batch_op:
        batch_op.create_index(batch_op.f("ix_admin_logs_id"), ["id"], unique=False)

    # 5. Create gifted_consultations table
    op.create_table(
        "gifted_consultations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["admin_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("gifted_consultations") as batch_op:
        batch_op.create_index(batch_op.f("ix_gifted_consultations_id"), ["id"], unique=False)


def downgrade() -> None:
    """Downgrade schema - Remove admin system."""

    # Drop tables in reverse order (due to foreign keys)
    op.drop_table("gifted_consultations")
    op.drop_table("admin_logs")
    op.drop_table("user_roles")
    op.drop_table("roles")

    # Remove is_admin column from users
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("is_admin")
