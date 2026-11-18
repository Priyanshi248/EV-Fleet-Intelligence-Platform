
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class BatteryMaterial(Base):
    __tablename__ = "battery_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    origin_country: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    price_indicator: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    price_volatility_indicator: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    sustainability_indicator: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    data_source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="simulated"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    risk_assessments: Mapped[list["SupplierRiskAssessment"]] = relationship(
        back_populates="material"
    )
