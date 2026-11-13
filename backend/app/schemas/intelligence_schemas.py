"""
intelligence_schemas.py
=======================
Pydantic Request and Response schemas for the Intelligence Module API.

Covers four domain areas:
  1. Supply Chain & Supplier Risk
  2. EV Procurement Recommendations
  3. Carbon Emission & Net-Zero Abatement
  4. AI Assistant Explanation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ===========================================================================
# SECTION 1: SUPPLY CHAIN & SUPPLIER RISK SCHEMAS
# ===========================================================================

# ---------------------------------------------------------------------------
# Request: Evaluate a single supplier's risk
# ---------------------------------------------------------------------------

class SupplierRiskEvaluateRequest(BaseModel):
    """
    Request body for POST /api/v1/supply-chain/evaluate
    Provide raw metric values for a supplier to get a composite risk score.
    """
    supplier_name: str = Field(
        ...,
        example="CATL",
        description="Name of the supplier being evaluated."
    )
    geopolitical_risk: float = Field(
        ...,
        ge=0.0, le=100.0,
        example=68.0,
        description="Country-level political stability risk score (0=safe, 100=extreme risk)."
    )
    price_volatility_risk: float = Field(
        ...,
        ge=0.0, le=100.0,
        example=45.0,
        description="Historical commodity price variance index (0=stable, 100=highly volatile)."
    )
    supplier_concentration_hhi: float = Field(
        ...,
        ge=0.0, le=100.0,
        example=78.0,
        description="Herfindahl-Hirschman Index for market concentration (0=diverse, 100=monopoly)."
    )
    quality_defect_ppm: float = Field(
        ...,
        ge=0.0,
        example=12.0,
        description="Quality defect rate in parts per million (lower is better)."
    )
    esg_sustainability_score: float = Field(
        ...,
        ge=0.0, le=100.0,
        example=72.0,
        description="ESG sustainability score (0=poor, 100=excellent). Higher = safer."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "supplier_name": "CATL",
                "geopolitical_risk": 68.0,
                "price_volatility_risk": 45.0,
                "supplier_concentration_hhi": 78.0,
                "quality_defect_ppm": 12.0,
                "esg_sustainability_score": 72.0,
            }
        }
    }


# ---------------------------------------------------------------------------
# Response: Single supplier risk evaluation result
# ---------------------------------------------------------------------------

class FactorBreakdownItem(BaseModel):
    """Breakdown of a single risk factor's contribution."""
    normalized_score:      float
    weight:                float
    weighted_contribution: float


class SupplierRiskEvaluateResponse(BaseModel):
    """
    Response for POST /api/v1/supply-chain/evaluate
    Contains composite score, category, color, and per-factor breakdown.
    """
    supplier_name:        str
    composite_risk_score: float = Field(..., description="Overall risk score (0-100). Higher = riskier.")
    risk_category:        str   = Field(..., description="Low / Moderate / High / Critical Risk")
    risk_color:           str   = Field(..., description="Hex color for frontend heatmap rendering.")
    primary_risk_driver:  str   = Field(..., description="The factor contributing most to the risk score.")
    factor_breakdown: dict[str, FactorBreakdownItem]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Response: Full supplier risk matrix (all suppliers)
# ---------------------------------------------------------------------------

class SupplierRiskMatrixItem(BaseModel):
    """A single row in the supplier risk heatmap matrix."""
    supplier_id:                      str
    supplier_name:                    str
    headquarters_country:             str
    material_id:                      str
    annual_capacity_gwh:              float
    geopolitical_risk_raw:            float
    price_volatility_risk_raw:        float
    supplier_concentration_hhi_raw:   float
    quality_defect_ppm_raw:           float
    esg_sustainability_score_raw:     float
    composite_risk_score:             float
    risk_category:                    str
    risk_color:                       str
    primary_risk_driver:              str


class SupplierRiskMatrixResponse(BaseModel):
    """
    Response for GET /api/v1/supply-chain/risk-matrix
    Returns all suppliers ranked by composite risk score.
    """
    total_suppliers:       int
    average_risk_score:    float
    highest_risk_score:    float
    lowest_risk_score:     float
    most_critical_supplier: Optional[str]
    category_distribution: dict[str, int]
    suppliers:             list[SupplierRiskMatrixItem]


# ===========================================================================
# SECTION 2: EV PROCUREMENT RECOMMENDATION SCHEMAS
# ===========================================================================

# ---------------------------------------------------------------------------
# Request: EV procurement recommendation
# ---------------------------------------------------------------------------

class ProcurementRecommendRequest(BaseModel):
    """
    Request body for POST /api/v1/procurement/recommend
    Provide route and operational requirements to get EV recommendations.
    """
    daily_distance_km: float = Field(
        ...,
        gt=0.0,
        example=120.0,
        description="Required daily operational driving distance in kilometres."
    )
    required_payload_kg: float = Field(
        ...,
        gt=0.0,
        example=1200.0,
        description="Minimum cargo payload the vehicle must carry in kilograms."
    )
    available_charging_window_hours: float = Field(
        ...,
        gt=0.0,
        example=4.0,
        description="Available downtime window for charging between operational shifts (hours)."
    )
    ambient_temp_celsius: float = Field(
        default=20.0,
        example=10.0,
        description="Average ambient operating temperature in Celsius. Affects range calculation."
    )
    max_budget_usd: Optional[float] = Field(
        default=None,
        gt=0.0,
        example=100000.0,
        description="Optional maximum vehicle purchase price in USD."
    )
    top_n: int = Field(
        default=5,
        ge=1, le=20,
        example=3,
        description="Number of top vehicle recommendations to return."
    )

    @field_validator("daily_distance_km")
    @classmethod
    def distance_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("daily_distance_km must be greater than 0.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "daily_distance_km": 120.0,
                "required_payload_kg": 1200.0,
                "available_charging_window_hours": 4.0,
                "ambient_temp_celsius": 10.0,
                "max_budget_usd": None,
                "top_n": 3,
            }
        }
    }


# ---------------------------------------------------------------------------
# Response: EV procurement recommendation
# ---------------------------------------------------------------------------

class ScoreBreakdownDetail(BaseModel):
    """Score, weight, and weighted contribution for one suitability factor."""
    score:        float
    weight:       float
    contribution: float


class TCOBreakdown(BaseModel):
    """Five-year total cost of ownership breakdown."""
    annualized_purchase_usd:     float
    annual_electricity_cost_usd: float
    annual_maintenance_usd:      float
    annual_total_usd:            float
    total_5yr_tco_usd:           float
    cost_per_km_usd:             float


class RecommendedVehicle(BaseModel):
    """A single recommended EV with full suitability breakdown."""
    rank:                            int
    vehicle_id:                      str
    make:                            str
    model:                           str
    category:                        str
    battery_chemistry:               str
    battery_capacity_kwh:            float
    nominal_range_km:                float
    effective_range_km:              float
    daily_distance_km:               float
    range_buffer_pct:                float
    max_payload_kg:                  float
    required_payload_kg:             float
    payload_margin_kg:               float
    charging_time_10_to_80_mins:     float
    available_window_hours:          float
    charging_window_utilization_pct: float
    purchase_cost_usd:               float
    tco_breakdown:                   TCOBreakdown
    suitability_score:               float
    score_breakdown: dict[str, ScoreBreakdownDetail]


class RejectedVehicle(BaseModel):
    """A vehicle that was eliminated by hard constraint filtering."""
    vehicle_id:      str
    make:            str
    model:           str
    rejected_reason: str


class InputSummary(BaseModel):
    """Echo of the request parameters used for recommendation."""
    daily_distance_km:               float
    required_payload_kg:             float
    ambient_temp_celsius:            float
    available_charging_window_hours: float
    max_budget_usd:                  Optional[float]
    temperature_degradation_factor:  Optional[float] = None


class ProcurementRecommendResponse(BaseModel):
    """
    Response for POST /api/v1/procurement/recommend
    Returns ranked EV recommendations, rejected vehicles, and summary stats.
    """
    recommendations:   list[RecommendedVehicle]
    rejected_vehicles: list[RejectedVehicle]
    input_summary:     InputSummary
    total_evaluated:   int
    total_passed:      int
    total_rejected:    int
    message:           Optional[str] = None


# ===========================================================================
# SECTION 3: CARBON EMISSION & NET-ZERO ABATEMENT SCHEMAS
# ===========================================================================

# ---------------------------------------------------------------------------
# Request: Emissions calculation
# ---------------------------------------------------------------------------

class EmissionsCalculateRequest(BaseModel):
    """
    Request body for POST /api/v1/emissions/calculate
    Provide fleet profile to get a full carbon abatement sustainability report.
    """
    daily_distance_km: float = Field(
        ...,
        gt=0.0,
        example=120.0,
        description="Average daily operational distance per vehicle (km)."
    )
    diesel_l_per_100km: float = Field(
        ...,
        gt=0.0,
        example=10.5,
        description="Current diesel vehicle fuel consumption (litres per 100 km)."
    )
    ev_kwh_per_km: float = Field(
        ...,
        gt=0.0,
        example=0.33,
        description="Replacement EV energy consumption (kWh per km)."
    )
    ev_purchase_cost_usd: float = Field(
        ...,
        gt=0.0,
        example=71000.0,
        description="Purchase price of replacement EV (USD)."
    )
    ev_annual_maintenance_usd: float = Field(
        ...,
        ge=0.0,
        example=1300.0,
        description="Annual EV maintenance and service costs (USD)."
    )
    fleet_size: int = Field(
        ...,
        ge=1,
        example=20,
        description="Total number of diesel vehicles in the fleet."
    )
    grid_region: str = Field(
        default="global_average",
        example="europe_average",
        description=(
            "Electricity grid region for emission factor. "
            "Options: global_average, europe_average, india, usa_average, "
            "china, australia, uk, germany, canada, norway, coal_heavy, renewable_100"
        )
    )
    custom_grid_factor: Optional[float] = Field(
        default=None,
        ge=0.0,
        example=None,
        description="Optional override: custom grid emission factor (kg CO2/kWh)."
    )
    target_replacement_pct: float = Field(
        default=100.0,
        ge=1.0, le=100.0,
        example=100.0,
        description="Percentage of the diesel fleet to electrify (1-100%)."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "daily_distance_km": 120.0,
                "diesel_l_per_100km": 10.5,
                "ev_kwh_per_km": 0.33,
                "ev_purchase_cost_usd": 71000.0,
                "ev_annual_maintenance_usd": 1300.0,
                "fleet_size": 20,
                "grid_region": "europe_average",
                "custom_grid_factor": None,
                "target_replacement_pct": 100.0,
            }
        }
    }


# ---------------------------------------------------------------------------
# Response: Emissions calculation
# ---------------------------------------------------------------------------

class EmissionsScenario(BaseModel):
    fleet_size:             int
    vehicles_to_replace:    int
    target_replacement_pct: float
    daily_distance_km:      float
    annual_km_per_vehicle:  float
    grid_region:            str
    grid_emission_factor:   float


class EmissionsPerVehicle(BaseModel):
    diesel_annual_co2_tonnes: float
    ev_annual_co2_tonnes:     float
    co2_saved_tonnes:         float
    pct_reduction:            float
    impact_label:             str
    diesel_fuel_cost_usd:     float
    ev_electricity_cost_usd:  float
    annual_opex_saving_usd:   float


class EmissionsFleetTotals(BaseModel):
    current_diesel_co2_tonnes_yr:  float
    post_ev_total_co2_tonnes_yr:   float
    fleet_net_co2_saved_tonnes_yr: float
    fleet_co2_reduction_pct:       float
    total_ev_investment_usd:       float
    annual_fuel_opex_saving_usd:   float
    investment_payback_years:      float


class EmissionsCarbonEconomics(BaseModel):
    carbon_abatement_cost_usd_per_tonne: float
    cac_verdict:                         str
    ev_annual_tco_usd:                   float
    diesel_annual_tco_usd:               float
    annual_tco_delta_usd:                float


class EmissionsEnvironmentalEquivalents(BaseModel):
    trees_planted_equivalent: int
    short_flights_avoided:    int
    homes_powered_days:       int


class EmissionsNetZeroAssessment(BaseModel):
    status:                      str
    current_fleet_reduction_pct: float
    remaining_gap_to_100pct:     float
    paris_target_year:           int


class EmissionsCalculateResponse(BaseModel):
    """
    Response for POST /api/v1/emissions/calculate
    Returns the full fleet electrification sustainability report.
    """
    scenario:                   EmissionsScenario
    per_vehicle:                EmissionsPerVehicle
    fleet_totals:               EmissionsFleetTotals
    carbon_economics:           EmissionsCarbonEconomics
    environmental_equivalents:  EmissionsEnvironmentalEquivalents
    net_zero_assessment:        EmissionsNetZeroAssessment


# ===========================================================================
# SECTION 4: AI ASSISTANT EXPLANATION SCHEMAS
# ===========================================================================

# ---------------------------------------------------------------------------
# Request: AI explanation
# ---------------------------------------------------------------------------

class AICarbonImpact(BaseModel):
    """Carbon savings context for the AI request."""
    co2_saved_tonnes_per_vehicle_yr: float = Field(
        ...,
        example=4.12,
        description="Net CO2 saved per vehicle per year (tonnes)."
    )
    co2_reduction_pct: float = Field(
        ...,
        example=67.6,
        description="Percentage CO2 reduction versus diesel baseline."
    )
    carbon_abatement_cost_usd: float = Field(
        ...,
        example=2418.75,
        description="Carbon abatement cost in USD per tonne of CO2 saved."
    )
    cac_verdict: str = Field(
        ...,
        example="Cost-Saving: EV is CHEAPER to operate AND cleaner",
        description="Human-readable verdict on the abatement cost."
    )
    grid_region: str = Field(
        default="global_average",
        example="europe_average",
        description="Electricity grid region used for emission factor."
    )
    fleet_size: int = Field(
        ...,
        ge=1,
        example=20,
        description="Total number of vehicles in the fleet."
    )
    payback_years: float = Field(
        ...,
        example=8.2,
        description="Investment payback period in years."
    )


class AIVehicleContext(BaseModel):
    """Vehicle recommendation context for the AI request."""
    vehicle_make: str = Field(..., example="Mercedes-Benz")
    vehicle_model: str = Field(..., example="eSprinter Van")
    vehicle_category: str = Field(..., example="Light Van")
    battery_chemistry: str = Field(..., example="LFP")
    suitability_score: float = Field(..., ge=0.0, le=100.0, example=87.5)
    range_buffer_pct: float = Field(..., example=83.1)
    payload_margin_kg: float = Field(..., example=200.0)
    tco_5yr_usd: float = Field(..., example=101400.0)
    cost_per_km_usd: float = Field(..., example=0.338)
    charging_window_utilization_pct: float = Field(..., example=11.1)


class AISupplierRiskContext(BaseModel):
    """Supplier risk context for the AI request."""
    supplier_risk_score: float = Field(..., ge=0.0, le=100.0, example=68.0)
    supplier_risk_category: str = Field(..., example="High")
    primary_risk_driver: str = Field(..., example="geopolitical_risk")


class AIExplainRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/explain

    Accepts pre-computed metrics from the three service engines and
    returns a structured executive explanation in plain English.
    """
    vehicle: AIVehicleContext
    supplier_risk: AISupplierRiskContext
    carbon: AICarbonImpact

    model_config = {
        "json_schema_extra": {
            "example": {
                "vehicle": {
                    "vehicle_make": "Mercedes-Benz",
                    "vehicle_model": "eSprinter Van",
                    "vehicle_category": "Light Van",
                    "battery_chemistry": "LFP",
                    "suitability_score": 87.5,
                    "range_buffer_pct": 83.1,
                    "payload_margin_kg": 200.0,
                    "tco_5yr_usd": 101400.0,
                    "cost_per_km_usd": 0.338,
                    "charging_window_utilization_pct": 11.1,
                },
                "supplier_risk": {
                    "supplier_risk_score": 68.0,
                    "supplier_risk_category": "High",
                    "primary_risk_driver": "geopolitical_risk",
                },
                "carbon": {
                    "co2_saved_tonnes_per_vehicle_yr": 4.12,
                    "co2_reduction_pct": 67.6,
                    "carbon_abatement_cost_usd": 2418.75,
                    "cac_verdict": "High: electrification costly — reassess route or vehicle choice",
                    "grid_region": "europe_average",
                    "fleet_size": 20,
                    "payback_years": 8.2,
                },
            }
        }
    }


# ---------------------------------------------------------------------------
# Response: AI explanation
# ---------------------------------------------------------------------------

class AICarbonImpactSummary(BaseModel):
    """Brief CO2 impact summary in the AI response."""
    co2_saved_tonnes_per_vehicle_yr: float
    co2_reduction_pct:               float
    fleet_size:                      int


class AIExplainResponse(BaseModel):
    """
    Response for POST /api/v1/ai/explain

    Returns a structured executive explanation with metadata about
    which AI engine was used to generate it.
    """
    explanation:   str   = Field(..., description="Full markdown-formatted executive explanation (3 sections).")
    mode:          str   = Field(..., description="AI engine used: gemini | openai | mock | mock (fallback).")
    generated_at:  str   = Field(..., description="ISO 8601 UTC timestamp of generation.")
    vehicle:       str   = Field(..., description="Vehicle identifier (make + model).")
    risk_category: str   = Field(..., description="Supplier risk band for context.")
    co2_impact:    AICarbonImpactSummary
