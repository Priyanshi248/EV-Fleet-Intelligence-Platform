
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ProcurementRecommendation(Base):
    __tablename__ = "procurement_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    ev_id: Mapped[int] = mapped_column(
        ForeignKey("ev_catalog.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="recommended"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
