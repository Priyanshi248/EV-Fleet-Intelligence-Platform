
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.Vehicle import Vehicle
from app.models.ChargingSession import ChargingSession
from app.models.BatteryPrediction import BatteryPrediction
from app.models.MaintenanceAlert import MaintenanceAlert
from app.models.NetZeroScenario import NetZeroScenario

from app.schemas.dashboard import (
    DashboardSummaryResponse,
    BatteryDashboardResponse,
    MaintenanceDashboardResponse,
    SustainabilityDashboardResponse,
)


router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):

    # --------------------------------------------------
    # 1. Fleet metrics
    # --------------------------------------------------

    total_vehicles = db.scalar(
        select(func.count()).select_from(Vehicle)
    ) or 0

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

    # --------------------------------------------------
    # 2. Charging metrics
    # --------------------------------------------------

    total_energy_charged_kwh = db.scalar(
        select(func.sum(ChargingSession.energy_charged_kwh))
    )

    # --------------------------------------------------
    # 3. Battery metrics
    # --------------------------------------------------

    battery_results = db.execute(
        select(
            func.count(BatteryPrediction.id),
            func.count(func.distinct(BatteryPrediction.vehicle_id)),
            func.avg(BatteryPrediction.soh_percent),
            func.avg(BatteryPrediction.rul_cycles),
        )
    ).one()

    (
        total_predictions,
        vehicles_with_predictions,
        average_soh,
        average_rul,
    ) = battery_results

    battery_data_exists = total_predictions > 0

    battery_summary = BatteryDashboardResponse(
        status="available" if battery_data_exists else "no_data",
        total_predictions=total_predictions if battery_data_exists else None,
        vehicles_with_predictions=(
            vehicles_with_predictions if battery_data_exists else None
        ),
        average_soh_percent=(
            float(average_soh) if average_soh is not None else None
        ),
        average_rul_cycles=(
            float(average_rul) if average_rul is not None else None
        ),
    )

    # --------------------------------------------------
    # 4. Maintenance metrics
    # --------------------------------------------------

    total_alerts = db.scalar(
        select(func.count()).select_from(MaintenanceAlert)
    ) or 0

    severity_results = db.execute(
        select(
            MaintenanceAlert.severity,
            func.count(MaintenanceAlert.id),
        ).group_by(MaintenanceAlert.severity)
    ).all()

    maintenance_severity_counts = {
        severity: count
        for severity, count in severity_results
    }

    maintenance_status_results = db.execute(
        select(
            MaintenanceAlert.status,
            func.count(MaintenanceAlert.id),
        ).group_by(MaintenanceAlert.status)
    ).all()

    maintenance_status_counts = {
        status: count
        for status, count in maintenance_status_results
    }

    maintenance_data_exists = total_alerts > 0

    maintenance_summary = MaintenanceDashboardResponse(
        status="available" if maintenance_data_exists else "no_data",
        total_alerts=total_alerts if maintenance_data_exists else None,
        severity_counts=maintenance_severity_counts,
        status_counts=maintenance_status_counts,
    )

    # --------------------------------------------------
    # 5. Sustainability / Net-zero metrics
    # --------------------------------------------------

    net_zero_results = db.execute(
        select(
            func.count(NetZeroScenario.id),
            func.avg(NetZeroScenario.baseline_emissions_kg_co2e),
            func.avg(NetZeroScenario.projected_emissions_kg_co2e),
            func.avg(NetZeroScenario.reduction_percent),
        )
    ).one()

    (
        total_scenarios,
        average_baseline,
        average_projected,
        average_reduction,
    ) = net_zero_results

    sustainability_data_exists = total_scenarios > 0

    sustainability_summary = SustainabilityDashboardResponse(
        status=(
            "available" if sustainability_data_exists else "no_data"
        ),
        total_scenarios=(
            total_scenarios if sustainability_data_exists else None
        ),
        average_baseline_emissions_kg_co2e=(
            float(average_baseline)
            if average_baseline is not None else None
        ),
        average_projected_emissions_kg_co2e=(
            float(average_projected)
            if average_projected is not None else None
        ),
        average_reduction_percent=(
            float(average_reduction)
            if average_reduction is not None else None
        ),
    )

    # --------------------------------------------------
    # 6. Final dashboard response
    # --------------------------------------------------

    return DashboardSummaryResponse(
        total_vehicles=total_vehicles,
        vehicle_status_counts=vehicle_status_counts,
        total_energy_charged_kwh=(
            float(total_energy_charged_kwh)
            if total_energy_charged_kwh is not None
            else None
        ),
        battery=battery_summary,
        maintenance=maintenance_summary,
        sustainability=sustainability_summary,
    )
