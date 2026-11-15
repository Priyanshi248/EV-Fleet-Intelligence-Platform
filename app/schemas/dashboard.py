from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_vehicles: int
    vehicle_status_counts: dict[str, int]
    total_energy_charged_kwh: float | None