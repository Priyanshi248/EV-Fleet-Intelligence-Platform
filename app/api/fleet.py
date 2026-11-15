from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ChargingSession import ChargingSession
from app.models.TelemetryRecord import TelemetryRecord
from app.models.Vehicle import Vehicle
from app.schemas.fleet import (
    ChargingSessionResponse,
    TelemetryResponse,
    VehicleResponse,
)


router = APIRouter(
    prefix="/api/v1/fleet",
    tags=["Fleet"],
)


# Get all vehicles
@router.get("/vehicles", response_model=list[VehicleResponse])
def get_vehicles(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = select(Vehicle)

    if status:
        query = query.where(Vehicle.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Vehicle.make.ilike(search_term)
            | Vehicle.model.ilike(search_term)
        )

    query = query.order_by(Vehicle.id)

    vehicles = db.scalars(query).all()

    return vehicles


# Get a specific vehicle
@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


# Get telemetry records for a vehicle
@router.get(
    "/vehicles/{vehicle_id}/telemetry",
    response_model=list[TelemetryResponse],
)
def get_vehicle_telemetry(
    vehicle_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    query = (
        select(TelemetryRecord)
        .where(TelemetryRecord.vehicle_id == vehicle_id)
        .order_by(TelemetryRecord.recorded_at.asc())
        .limit(limit)
    )

    records = db.scalars(query).all()

    return records


# Get charging sessions for a vehicle
@router.get(
    "/vehicles/{vehicle_id}/charging-sessions",
    response_model=list[ChargingSessionResponse],
)
def get_vehicle_charging_sessions(
    vehicle_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    vehicle = db.get(Vehicle, vehicle_id)

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    query = (
        select(ChargingSession)
        .where(ChargingSession.vehicle_id == vehicle_id)
        .order_by(ChargingSession.started_at.asc())
        .limit(limit)
    )

    sessions = db.scalars(query).all()

    return sessions