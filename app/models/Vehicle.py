
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    __table_args__ = (
        CheckConstraint(
            "battery_capacity_kwh IS NULL OR battery_capacity_kwh > 0",
            name="ck_vehicle_battery_capacity_positive",
        ),
        CheckConstraint(
            "range_km IS NULL OR range_km > 0",
            name="ck_vehicle_range_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    battery_capacity_kwh: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    range_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="active", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    telemetry_records: Mapped[list["TelemetryRecord"]] = relationship(
        back_populates="vehicle"
    )
    charging_sessions: Mapped[list["ChargingSession"]] = relationship(
        back_populates="vehicle"
    )
    battery_predictions: Mapped[list["BatteryPrediction"]] = relationship(
        back_populates="vehicle"
    )
    maintenance_alerts: Mapped[list["MaintenanceAlert"]] = relationship(
        back_populates="vehicle"
    )
