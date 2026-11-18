
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class NetZeroScenario(Base):
    __tablename__ = "net_zero_scenarios"

    __table_args__ = (
        CheckConstraint(
            "baseline_emissions_kg_co2e >= 0",
            name="ck_net_zero_baseline_nonnegative",
        ),
        CheckConstraint(
            "projected_emissions_kg_co2e >= 0",
            name="ck_net_zero_projected_nonnegative",
        ),
        CheckConstraint(
            "reduction_percent >= 0 AND reduction_percent <= 100",
            name="ck_net_zero_reduction_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    baseline_emissions_kg_co2e: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    projected_emissions_kg_co2e: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    reduction_percent: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    assumptions: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
