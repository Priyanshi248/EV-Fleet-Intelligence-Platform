from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ChargingSession import ChargingSession
from app.models.Vehicle import Vehicle
from app.schemas.dashboard import DashboardSummaryResponse


router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
):
    # Get total number of vehicles
    total_vehicles = db.scalar(
        select(func.count()).select_from(Vehicle)
    ) or 0

    # Get vehicle counts grouped by status
    status_results = db.execute(
        select(
            Vehicle.status,
            func.count(Vehicle.id),
        ).group_by(Vehicle.status)
    ).all()

    vehicle_status_counts = {
        status: count
        for status, count in status_results
    }

    # Get total energy charged across all charging sessions
    total_energy_charged_kwh = db.scalar(
        select(func.sum(ChargingSession.energy_charged_kwh))
    )

    return DashboardSummaryResponse(
        total_vehicles=total_vehicles,
        vehicle_status_counts=vehicle_status_counts,
        total_energy_charged_kwh=total_energy_charged_kwh,
    )