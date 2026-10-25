
from sqlalchemy import CheckConstraint, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EVCatalog(Base):
    __tablename__ = "ev_catalog"

    __table_args__ = (
        CheckConstraint(
            "purchase_price_inr > 0",
            name="ck_ev_price_positive",
        ),
        CheckConstraint(
            "usable_range_km > 0",
            name="ck_ev_range_positive",
        ),
        CheckConstraint(
            "payload_kg >= 0",
            name="ck_ev_payload_nonnegative",
        ),
        CheckConstraint(
            "energy_consumption_kwh_per_km > 0",
            name="ck_ev_energy_consumption_positive",
        ),
        CheckConstraint(
            "charging_time_hours > 0",
            name="ck_ev_charging_time_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    purchase_price_inr: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    usable_range_km: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    payload_kg: Mapped[float] = mapped_column(Float, nullable=False)
    energy_consumption_kwh_per_km: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    charging_time_hours: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    data_source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="simulated"
    )
