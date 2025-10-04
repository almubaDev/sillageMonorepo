"""Add private perfume fields"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "25772214108d"
down_revision: Union[str, Sequence[str], None] = "b7ecbdfcd3bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("perfumes") as batch_op:
        batch_op.add_column(
            sa.Column(
                "is_private",
                sa.Boolean(),
                nullable=True,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(
            sa.Column("created_by", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_perfumes_created_by_users",
            "users",
            ["created_by"],
            ["id"],
            ondelete="SET NULL",
        )

    op.execute("UPDATE perfumes SET is_private = FALSE WHERE is_private IS NULL")

    with op.batch_alter_table("perfumes") as batch_op:
        batch_op.alter_column(
            "is_private", nullable=False, existing_type=sa.Boolean()
        )

    with op.batch_alter_table("perfumes") as batch_op:
        batch_op.alter_column(
            "is_private", server_default=None, existing_type=sa.Boolean()
        )

    with op.batch_alter_table("perfume_collections") as batch_op:
        batch_op.add_column(
            sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("perfume_collections") as batch_op:
        batch_op.drop_column("removed_at")

    with op.batch_alter_table("perfumes") as batch_op:
        batch_op.drop_constraint(
            "fk_perfumes_created_by_users", type_="foreignkey"
        )
        batch_op.drop_column("created_by")
        batch_op.drop_column("is_private")
