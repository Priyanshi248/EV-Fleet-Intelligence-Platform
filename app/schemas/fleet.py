from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VehicleResponse(BaseModel):
    id: int
    make: str
    model: str
    battery_capacity_kwh: float | None
    range_km: float | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TelemetryResponse(BaseModel):
    id: int
    vehicle_id: int
    recorded_at: datetime
    battery_voltage_v: float | None
    battery_temperature_c: float | None
    battery_current_a: float | None
    state_of_charge_percent: float | None

    model_config = ConfigDict(from_attributes=True)


class ChargingSessionResponse(BaseModel):
    id: int
    vehicle_id: int
    started_at: datetime
    ended_at: datetime | None
    energy_charged_kwh: float
    duration_minutes: float

    model_config = ConfigDict(from_attributes=True)