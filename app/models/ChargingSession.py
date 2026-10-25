
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    __table_args__ = (
        CheckConstraint(
            "energy_charged_kwh >= 0",
            name="ck_charging_energy_nonnegative",
        ),
        CheckConstraint(
            "duration_minutes >= 0",
            name="ck_charging_duration_nonnegative",
        ),
        CheckConstraint(
            "ended_at IS NULL OR ended_at >= started_at",
            name="ck_charging_end_after_start",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    energy_charged_kwh: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    duration_minutes: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(
        back_populates="charging_sessions"
    )
