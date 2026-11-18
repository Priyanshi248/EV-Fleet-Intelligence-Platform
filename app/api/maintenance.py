
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.MaintenanceAlert import MaintenanceAlert
from app.models.Vehicle import Vehicle
from app.schemas.maintenance import (
    MaintenanceAlertResponse,
    MaintenanceAlertStatusUpdate,
)


router = APIRouter(
    prefix="/api/v1/maintenance",
    tags=["Maintenance"],
)


# Get maintenance alerts with optional filters
@router.get(
    "/alerts",
    response_model=list[MaintenanceAlertResponse],
)
def get_maintenance_alerts(
    vehicle_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = select(MaintenanceAlert)

    if vehicle_id is not None:
        vehicle = db.get(Vehicle, vehicle_id)

        if vehicle is None:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

        query = query.where(
            MaintenanceAlert.vehicle_id == vehicle_id
        )

    if status:
        query = query.where(
            MaintenanceAlert.status == status.lower()
        )

    if severity:
        query = query.where(
            MaintenanceAlert.severity == severity.lower()
        )

    query = query.order_by(
        MaintenanceAlert.created_at.desc()
    )

    return db.scalars(query).all()


# Update maintenance alert status
@router.patch(
    "/alerts/{alert_id}",
    response_model=MaintenanceAlertResponse,
)
def update_maintenance_alert_status(
    alert_id: int,
    payload: MaintenanceAlertStatusUpdate,
    db: Session = Depends(get_db),
):
    alert = db.get(MaintenanceAlert, alert_id)

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance alert not found",
        )

    alert.status = payload.status

    if payload.status == "resolved":
        if alert.resolved_at is None:
            alert.resolved_at = datetime.now(timezone.utc)
    else:
        alert.resolved_at = None

    db.commit()
    db.refresh(alert)

    return alert
