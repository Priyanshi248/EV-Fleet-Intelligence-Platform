
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    origin_country: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    data_source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="simulated"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    risk_assessments: Mapped[list["SupplierRiskAssessment"]] = relationship(
        back_populates="supplier"
    )
