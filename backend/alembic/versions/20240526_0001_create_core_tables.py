"""Create initial core tables for Seoul Now"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20240526_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codename", sa.String(length=255), nullable=True),
        sa.Column("guname", sa.String(length=255), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("date", sa.String(length=255), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("place", sa.String(length=255), nullable=True),
        sa.Column("org_name", sa.String(length=255), nullable=True),
        sa.Column("use_trgt", sa.String(length=255), nullable=True),
        sa.Column("use_fee", sa.Text(), nullable=True),
        sa.Column("player", sa.Text(), nullable=True),
        sa.Column("program", sa.Text(), nullable=True),
        sa.Column("etc_desc", sa.Text(), nullable=True),
        sa.Column("ticket", sa.String(length=255), nullable=True),
        sa.Column("theme_code", sa.String(length=255), nullable=True),
        sa.Column("org_link", sa.Text(), nullable=True),
        sa.Column("main_img", sa.Text(), nullable=True),
        sa.Column("hmpg_addr", sa.Text(), nullable=True),
        sa.Column("rgst_date", sa.Date(), nullable=True),
        sa.Column("lot", sa.Float(), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("is_free", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_events_id", "events", ["id"], unique=False)
    op.create_index("ix_events_guname", "events", ["guname"], unique=False)
    op.create_index("ix_events_start_date", "events", ["start_date"], unique=False)
    op.create_index("ix_events_end_date", "events", ["end_date"], unique=False)
    op.create_index("ix_events_theme_code", "events", ["theme_code"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "weather",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("temp", sa.Float(), nullable=True),
        sa.Column("rain_prob", sa.Float(), nullable=True),
        sa.Column("pm10", sa.Integer(), nullable=True),
        sa.UniqueConstraint("date", "location", name="uq_weather_date_location"),
    )
    op.create_index("ix_weather_id", "weather", ["id"], unique=False)
    op.create_index("ix_weather_date", "weather", ["date"], unique=False)
    op.create_index("ix_weather_location", "weather", ["location"], unique=False)

    op.create_table(
        "user_actions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_user_actions_id", "user_actions", ["id"], unique=False)
    op.create_index("ix_user_actions_user_id", "user_actions", ["user_id"], unique=False)
    op.create_index("ix_user_actions_action_type", "user_actions", ["action_type"], unique=False)
    op.create_index("ix_user_actions_target_id", "user_actions", ["target_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_actions_target_id", table_name="user_actions")
    op.drop_index("ix_user_actions_action_type", table_name="user_actions")
    op.drop_index("ix_user_actions_user_id", table_name="user_actions")
    op.drop_index("ix_user_actions_id", table_name="user_actions")
    op.drop_table("user_actions")

    op.drop_index("ix_weather_location", table_name="weather")
    op.drop_index("ix_weather_date", table_name="weather")
    op.drop_index("ix_weather_id", table_name="weather")
    op.drop_table("weather")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_events_theme_code", table_name="events")
    op.drop_index("ix_events_end_date", table_name="events")
    op.drop_index("ix_events_start_date", table_name="events")
    op.drop_index("ix_events_guname", table_name="events")
    op.drop_index("ix_events_id", table_name="events")
    op.drop_table("events")
