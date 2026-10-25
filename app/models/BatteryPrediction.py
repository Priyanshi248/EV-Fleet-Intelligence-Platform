
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class BatteryPrediction(Base):
    __tablename__ = "battery_predictions"

    __table_args__ = (
        CheckConstraint(
            "soh_percent IS NULL OR "
            "(soh_percent >= 0 AND soh_percent <= 100)",
            name="ck_battery_soh_percent_range",
        ),
        CheckConstraint(
            "rul_cycles IS NULL OR rul_cycles >= 0",
            name="ck_battery_rul_nonnegative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    soh_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    rul_cycles: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    prediction_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="completed"
    )
    model_version: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(
        back_populates="battery_predictions"
    )
