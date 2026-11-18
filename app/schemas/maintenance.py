
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from typing import Literal


class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    alert_type: str
    severity: str
    description: str
    status: str
    created_at: datetime
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class MaintenanceAlertStatusUpdate(BaseModel):
    status: Literal["open", "resolved"]
