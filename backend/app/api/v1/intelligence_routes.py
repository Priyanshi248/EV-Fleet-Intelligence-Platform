"""
intelligence_routes.py
======================
FastAPI Router for the Intelligence Module.

Endpoints:
  GET  /api/v1/supply-chain/risk-matrix   - Full supplier risk heatmap matrix
  POST /api/v1/supply-chain/evaluate      - Evaluate one supplier's risk score
  POST /api/v1/procurement/recommend      - EV suitability recommendations
  POST /api/v1/emissions/calculate        - Fleet carbon abatement summary
"""

from fastapi import APIRouter, HTTPException, status

# Import schemas
from app.schemas.intelligence_schemas import (
    # Supply chain
    SupplierRiskEvaluateRequest,
    SupplierRiskEvaluateResponse,
    SupplierRiskMatrixResponse,
    SupplierRiskMatrixItem,
    FactorBreakdownItem,
    # Procurement
    ProcurementRecommendRequest,
    ProcurementRecommendResponse,
    RecommendedVehicle,
    RejectedVehicle,
    InputSummary,
    TCOBreakdown,
    ScoreBreakdownDetail,
    # Emissions
    EmissionsCalculateRequest,
    EmissionsCalculateResponse,
    EmissionsScenario,
    EmissionsPerVehicle,
    EmissionsFleetTotals,
    EmissionsCarbonEconomics,
    EmissionsEnvironmentalEquivalents,
    EmissionsNetZeroAssessment,
    # AI Assistant
    AIExplainRequest,
    AIExplainResponse,
    AICarbonImpactSummary,
)

# Import service engines
from app.services.risk_engine import (
    calculate_composite_risk_score,
    categorize_risk,
    get_risk_color,
    get_risk_score_breakdown,
    get_supplier_risk_matrix,
    get_risk_summary_statistics,
)
from app.services.procurement_engine import recommend_ev_vehicles
from app.services.carbon_engine import generate_fleet_sustainability_summary
from app.services.ai_explainer import generate_ai_explanation

# ---------------------------------------------------------------------------
# Router setup
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/v1", tags=["Intelligence Module"])


# ===========================================================================
# SUPPLY CHAIN ENDPOINTS
# ===========================================================================

@router.get(
    "/supply-chain/risk-matrix",
    response_model=SupplierRiskMatrixResponse,
    summary="Get Full Supplier Risk Matrix",
    description=(
        "Returns all suppliers from the dataset ranked by composite risk score. "
        "Powers the risk heatmap visualization on the frontend dashboard."
    ),
)
def get_risk_matrix() -> SupplierRiskMatrixResponse:
    """
    GET /api/v1/supply-chain/risk-matrix

    Loads all suppliers from the seed CSV and computes their composite
    risk scores. Returns them sorted from most to least critical.
    """
    try:
        matrix = get_supplier_risk_matrix()
        stats  = get_risk_summary_statistics(matrix)

        supplier_rows = [
            SupplierRiskMatrixItem(
                supplier_id=s["supplier_id"],
                supplier_name=s["supplier_name"],
                headquarters_country=s["headquarters_country"],
                material_id=s["material_id"],
                annual_capacity_gwh=s["annual_capacity_gwh"],
                geopolitical_risk_raw=s["geopolitical_risk_raw"],
                price_volatility_risk_raw=s["price_volatility_risk_raw"],
                supplier_concentration_hhi_raw=s["supplier_concentration_hhi_raw"],
                quality_defect_ppm_raw=s["quality_defect_ppm_raw"],
                esg_sustainability_score_raw=s["esg_sustainability_score_raw"],
                composite_risk_score=s["composite_risk_score"],
                risk_category=s["risk_category"],
                risk_color=s["risk_color"],
                primary_risk_driver=s["primary_risk_driver"],
            )
            for s in matrix
        ]

        return SupplierRiskMatrixResponse(
            total_suppliers=stats["total_suppliers"],
            average_risk_score=stats["average_risk_score"],
            highest_risk_score=stats["highest_risk_score"],
            lowest_risk_score=stats["lowest_risk_score"],
            most_critical_supplier=stats["most_critical_supplier"],
            category_distribution=stats["category_distribution"],
            suppliers=supplier_rows,
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Seed data not found. Run generate_datasets.py first. Details: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk matrix computation failed: {str(e)}",
        )


@router.post(
    "/supply-chain/evaluate",
    response_model=SupplierRiskEvaluateResponse,
    summary="Evaluate Supplier Risk Score",
    description=(
        "Accepts raw supplier metrics and returns a composite risk score (0-100), "
        "risk category, color, primary risk driver, and per-factor breakdown."
    ),
)
def evaluate_supplier_risk(
    request: SupplierRiskEvaluateRequest,
) -> SupplierRiskEvaluateResponse:
    """
    POST /api/v1/supply-chain/evaluate

    Computes the weighted MCDA composite risk score for a single supplier
    based on the five input factors provided in the request body.
    """
    try:
        composite_score = calculate_composite_risk_score(
            geopolitical_risk=request.geopolitical_risk,
            price_volatility_risk=request.price_volatility_risk,
            supplier_concentration_hhi=request.supplier_concentration_hhi,
            quality_defect_ppm=request.quality_defect_ppm,
            esg_sustainability_score=request.esg_sustainability_score,
        )

        breakdown = get_risk_score_breakdown(
            geopolitical_risk=request.geopolitical_risk,
            price_volatility_risk=request.price_volatility_risk,
            supplier_concentration_hhi=request.supplier_concentration_hhi,
            quality_defect_ppm=request.quality_defect_ppm,
            esg_sustainability_score=request.esg_sustainability_score,
        )

        # Find the primary risk driver
        factor_contributions = {
            k: v["weighted_contribution"]
            for k, v in breakdown.items()
            if isinstance(v, dict) and "weighted_contribution" in v
        }
        primary_driver = max(factor_contributions, key=factor_contributions.get)

        category = categorize_risk(composite_score)
        color    = get_risk_color(category)

        # Build factor breakdown response items
        factor_items = {
            k: FactorBreakdownItem(
                normalized_score=v["normalized_score"],
                weight=v["weight"],
                weighted_contribution=v["weighted_contribution"],
            )
            for k, v in breakdown.items()
            if isinstance(v, dict) and "normalized_score" in v
        }

        return SupplierRiskEvaluateResponse(
            supplier_name=request.supplier_name,
            composite_risk_score=composite_score,
            risk_category=category,
            risk_color=color,
            primary_risk_driver=primary_driver,
            factor_breakdown=factor_items,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk evaluation failed: {str(e)}",
        )


# ===========================================================================
# PROCUREMENT ENDPOINTS
# ===========================================================================

@router.post(
    "/procurement/recommend",
    response_model=ProcurementRecommendResponse,
    summary="Get EV Procurement Recommendations",
    description=(
        "Accepts fleet operational requirements (daily distance, payload, charging window, "
        "temperature) and returns ranked EV recommendations with suitability scores, "
        "TCO breakdown, and hard-constraint rejection reasons."
    ),
)
def get_procurement_recommendations(
    request: ProcurementRecommendRequest,
) -> ProcurementRecommendResponse:
    """
    POST /api/v1/procurement/recommend

    Runs the EV procurement engine:
      1. Filters catalog by payload and temperature-adjusted range (25% buffer).
      2. Scores passing vehicles across Range Margin (30%), TCO (35%),
         Charging Turnaround (20%), and Battery Chemistry (15%).
      3. Returns top N recommendations sorted by suitability score.
    """
    try:
        result = recommend_ev_vehicles(
            daily_distance_km=request.daily_distance_km,
            required_payload_kg=request.required_payload_kg,
            available_charging_window_hours=request.available_charging_window_hours,
            ambient_temp_celsius=request.ambient_temp_celsius,
            max_budget_usd=request.max_budget_usd,
            top_n=request.top_n,
        )

        # Build recommendation objects
        recommendations = []
        for v in result["recommendations"]:
            tco = TCOBreakdown(**v["tco_breakdown"])
            score_bd = {
                k: ScoreBreakdownDetail(
                    score=detail["score"],
                    weight=detail["weight"],
                    contribution=detail["contribution"],
                )
                for k, detail in v["score_breakdown"].items()
            }
            recommendations.append(
                RecommendedVehicle(
                    rank=v["rank"],
                    vehicle_id=v["vehicle_id"],
                    make=v["make"],
                    model=v["model"],
                    category=v["category"],
                    battery_chemistry=v["battery_chemistry"],
                    battery_capacity_kwh=v["battery_capacity_kwh"],
                    nominal_range_km=v["nominal_range_km"],
                    effective_range_km=v["effective_range_km"],
                    daily_distance_km=v["daily_distance_km"],
                    range_buffer_pct=v["range_buffer_pct"],
                    max_payload_kg=v["max_payload_kg"],
                    required_payload_kg=v["required_payload_kg"],
                    payload_margin_kg=v["payload_margin_kg"],
                    charging_time_10_to_80_mins=v["charging_time_10_to_80_mins"],
                    available_window_hours=v["available_window_hours"],
                    charging_window_utilization_pct=v["charging_window_utilization_pct"],
                    purchase_cost_usd=v["purchase_cost_usd"],
                    tco_breakdown=tco,
                    suitability_score=v["suitability_score"],
                    score_breakdown=score_bd,
                )
            )

        rejected = [
            RejectedVehicle(
                vehicle_id=r["vehicle_id"],
                make=r["make"],
                model=r["model"],
                rejected_reason=r["rejected_reason"],
            )
            for r in result["rejected_vehicles"]
        ]

        input_sum = InputSummary(**result["input_summary"])

        return ProcurementRecommendResponse(
            recommendations=recommendations,
            rejected_vehicles=rejected,
            input_summary=input_sum,
            total_evaluated=result["total_evaluated"],
            total_passed=result["total_passed"],
            total_rejected=result["total_rejected"],
            message=result.get("message"),
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"EV catalog data not found. Run generate_datasets.py first. Details: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Procurement recommendation failed: {str(e)}",
        )


# ===========================================================================
# EMISSIONS ENDPOINTS
# ===========================================================================

@router.post(
    "/emissions/calculate",
    response_model=EmissionsCalculateResponse,
    summary="Calculate Fleet Carbon Abatement",
    description=(
        "Accepts fleet electrification parameters and returns a complete "
        "sustainability report including diesel vs EV CO2 comparison, net savings, "
        "carbon abatement cost, payback period, and net-zero assessment."
    ),
)
def calculate_fleet_emissions(
    request: EmissionsCalculateRequest,
) -> EmissionsCalculateResponse:
    """
    POST /api/v1/emissions/calculate

    Runs the carbon abatement engine:
      1. Calculates baseline diesel fleet annual CO2 emissions.
      2. Calculates replacement EV annual emissions (grid-adjusted).
      3. Computes net CO2 saved and percentage reduction.
      4. Computes Carbon Abatement Cost ($/tonne CO2).
      5. Returns executive sustainability summary with equivalents and payback.
    """
    try:
        summary = generate_fleet_sustainability_summary(
            daily_distance_km=request.daily_distance_km,
            diesel_l_per_100km=request.diesel_l_per_100km,
            ev_kwh_per_km=request.ev_kwh_per_km,
            ev_purchase_cost_usd=request.ev_purchase_cost_usd,
            ev_annual_maintenance_usd=request.ev_annual_maintenance_usd,
            fleet_size=request.fleet_size,
            grid_region=request.grid_region,
            custom_grid_factor=request.custom_grid_factor,
            target_replacement_pct=request.target_replacement_pct,
        )

        return EmissionsCalculateResponse(
            scenario=EmissionsScenario(**summary["scenario"]),
            per_vehicle=EmissionsPerVehicle(**summary["per_vehicle"]),
            fleet_totals=EmissionsFleetTotals(**summary["fleet_totals"]),
            carbon_economics=EmissionsCarbonEconomics(**summary["carbon_economics"]),
            environmental_equivalents=EmissionsEnvironmentalEquivalents(
                **summary["environmental_equivalents"]
            ),
            net_zero_assessment=EmissionsNetZeroAssessment(
                **summary["net_zero_assessment"]
            ),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid input parameter: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emissions calculation failed: {str(e)}",
        )


# ===========================================================================
# HEALTH CHECK
# ===========================================================================

@router.get(
    "/intelligence/health",
    summary="Intelligence Module Health Check",
    tags=["Health"],
)
def intelligence_health_check() -> dict:
    """
    GET /api/v1/intelligence/health

    Quick health check to verify the intelligence module is reachable.
    """
    return {
        "status":  "ok",
        "module":  "Intelligence Module",
        "version": "1.0.0",
        "endpoints": [
            "GET  /api/v1/supply-chain/risk-matrix",
            "POST /api/v1/supply-chain/evaluate",
            "POST /api/v1/procurement/recommend",
            "POST /api/v1/emissions/calculate",
        ],
    }


# ===========================================================================
# AI ASSISTANT ENDPOINT
# ===========================================================================

@router.post(
    "/ai/explain",
    response_model=AIExplainResponse,
    summary="AI Assistant: Explain Recommendation & Risk",
    description=(
        "Accepts pre-computed vehicle recommendation, supplier risk, and carbon "
        "savings data. Returns a structured executive explanation in plain English "
        "with three sections: Recommendation Rationale, Supply Chain Risk Assessment, "
        "and Mitigation Action Plan. "
        "Uses Gemini if GEMINI_API_KEY is set, OpenAI if OPENAI_API_KEY is set, "
        "or falls back to a built-in mock engine — no API key required."
    ),
)
def ai_explain(request: AIExplainRequest) -> AIExplainResponse:
    """
    POST /api/v1/ai/explain

    Orchestrates the AI explainer service with three context inputs:
      - vehicle: Recommendation metrics (score, TCO, range buffer, etc.)
      - supplier_risk: Risk score, category, and primary risk driver
      - carbon: CO2 savings, abatement cost, payback period

    Auto-selects the best available LLM backend (Gemini > OpenAI > Mock).
    """
    try:
        result = generate_ai_explanation(
            # Vehicle fields
            vehicle_make=request.vehicle.vehicle_make,
            vehicle_model=request.vehicle.vehicle_model,
            vehicle_category=request.vehicle.vehicle_category,
            battery_chemistry=request.vehicle.battery_chemistry,
            suitability_score=request.vehicle.suitability_score,
            range_buffer_pct=request.vehicle.range_buffer_pct,
            payload_margin_kg=request.vehicle.payload_margin_kg,
            tco_5yr_usd=request.vehicle.tco_5yr_usd,
            cost_per_km_usd=request.vehicle.cost_per_km_usd,
            charging_window_utilization_pct=request.vehicle.charging_window_utilization_pct,
            # Supplier risk fields
            supplier_risk_score=request.supplier_risk.supplier_risk_score,
            supplier_risk_category=request.supplier_risk.supplier_risk_category,
            primary_risk_driver=request.supplier_risk.primary_risk_driver,
            # Carbon fields
            co2_saved_tonnes_yr=request.carbon.co2_saved_tonnes_per_vehicle_yr,
            co2_reduction_pct=request.carbon.co2_reduction_pct,
            carbon_abatement_cost_usd=request.carbon.carbon_abatement_cost_usd,
            cac_verdict=request.carbon.cac_verdict,
            grid_region=request.carbon.grid_region,
            fleet_size=request.carbon.fleet_size,
            payback_years=request.carbon.payback_years,
        )

        return AIExplainResponse(
            explanation=result["explanation"],
            mode=result["mode"],
            generated_at=result["generated_at"],
            vehicle=result["vehicle"],
            risk_category=result["risk_category"],
            co2_impact=AICarbonImpactSummary(
                co2_saved_tonnes_per_vehicle_yr=result["co2_impact"]["co2_saved_tonnes_per_vehicle_yr"],
                co2_reduction_pct=result["co2_impact"]["co2_reduction_pct"],
                fleet_size=result["co2_impact"]["fleet_size"],
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI explanation generation failed: {str(e)}",
        )
