
from pydantic import BaseModel


class BatteryDashboardResponse(BaseModel):
    status: str
    total_predictions: int | None
    vehicles_with_predictions: int | None
    average_soh_percent: float | None
    average_rul_cycles: float | None


class MaintenanceDashboardResponse(BaseModel):
    status: str
    total_alerts: int | None
    severity_counts: dict[str, int]
    status_counts: dict[str, int]


class SustainabilityDashboardResponse(BaseModel):
    status: str
    total_scenarios: int | None
    average_baseline_emissions_kg_co2e: float | None
    average_projected_emissions_kg_co2e: float | None
    average_reduction_percent: float | None


class DashboardSummaryResponse(BaseModel):
    total_vehicles: int
    vehicle_status_counts: dict[str, int]
    total_energy_charged_kwh: float | None

    battery: BatteryDashboardResponse
    maintenance: MaintenanceDashboardResponse
    sustainability: SustainabilityDashboardResponse
