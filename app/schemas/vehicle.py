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