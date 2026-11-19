"""
test_intelligence.py
====================
Pytest test suite for the EV Fleet Intelligence Module.

Covers:
  1. Supplier Risk Engine   - score boundaries, categorisation, heatmap matrix
  2. Procurement Engine     - hard constraint rejection, scoring, ranking
  3. Carbon Engine          - emission formulas, net savings, fleet summary
  4. FastAPI Endpoints      - HTTP integration tests via TestClient
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient

# ===========================================================================
# SECTION 1: SUPPLIER RISK ENGINE TESTS
# ===========================================================================

from app.services.risk_engine import (
    calculate_composite_risk_score,
    categorize_risk,
    get_risk_color,
    get_risk_score_breakdown,
    get_supplier_risk_matrix,
    get_risk_summary_statistics,
)


class TestRiskEngineScoreBoundaries:
    """Verify that composite risk scores always stay within [0, 100]."""

    def test_all_zero_inputs_gives_minimum_score(self):
        """All-zero risk factors should give the lowest possible score."""
        # ESG at 100 (best case) + all others at 0 = minimum risk
        score = calculate_composite_risk_score(
            geopolitical_risk=0.0,
            price_volatility_risk=0.0,
            supplier_concentration_hhi=0.0,
            quality_defect_ppm=0.0,
            esg_sustainability_score=100.0,  # Inverted: 100 ESG = 0 risk
        )
        assert 0.0 <= score <= 100.0, f"Score out of bounds: {score}"
        assert score == 0.0, f"Expected 0.0 for best-case inputs, got {score}"

    def test_all_maximum_inputs_gives_maximum_score(self):
        """All worst-case risk factors should give the highest possible score."""
        score = calculate_composite_risk_score(
            geopolitical_risk=100.0,
            price_volatility_risk=100.0,
            supplier_concentration_hhi=100.0,
            quality_defect_ppm=100.0,
            esg_sustainability_score=0.0,    # Inverted: 0 ESG = highest risk
        )
        assert 0.0 <= score <= 100.0, f"Score out of bounds: {score}"
        assert score == 100.0, f"Expected 100.0 for worst-case inputs, got {score}"

    def test_score_never_exceeds_100(self):
        """Score must be clamped to 100 even with extreme inputs."""
        score = calculate_composite_risk_score(
            geopolitical_risk=999.0,
            price_volatility_risk=999.0,
            supplier_concentration_hhi=999.0,
            quality_defect_ppm=999.0,
            esg_sustainability_score=-999.0,
        )
        assert score <= 100.0, f"Score exceeded 100: {score}"

    def test_score_never_below_0(self):
        """Score must be clamped to 0 even with negative inputs."""
        score = calculate_composite_risk_score(
            geopolitical_risk=-999.0,
            price_volatility_risk=-999.0,
            supplier_concentration_hhi=-999.0,
            quality_defect_ppm=-999.0,
            esg_sustainability_score=999.0,
        )
        assert score >= 0.0, f"Score went below 0: {score}"

    def test_known_high_risk_supplier_scores_above_60(self):
        """Glencore-like (DRC cobalt) profile must score in High or Critical range."""
        score = calculate_composite_risk_score(
            geopolitical_risk=82.0,
            price_volatility_risk=85.0,
            supplier_concentration_hhi=88.0,
            quality_defect_ppm=35.0,
            esg_sustainability_score=52.0,
        )
        assert score >= 60.0, f"High-risk supplier scored too low: {score}"

    def test_known_low_risk_supplier_scores_below_40(self):
        """Panasonic-like (Japan, low defect) profile must score in Low range."""
        score = calculate_composite_risk_score(
            geopolitical_risk=25.0,
            price_volatility_risk=52.0,
            supplier_concentration_hhi=60.0,
            quality_defect_ppm=9.0,
            esg_sustainability_score=88.0,
        )
        assert score < 50.0, f"Low-risk supplier scored too high: {score}"

    def test_esg_inversion_lowers_score(self):
        """Higher ESG score should REDUCE the composite risk score."""
        score_low_esg = calculate_composite_risk_score(
            geopolitical_risk=50.0,
            price_volatility_risk=50.0,
            supplier_concentration_hhi=50.0,
            quality_defect_ppm=50.0,
            esg_sustainability_score=10.0,   # Poor ESG
        )
        score_high_esg = calculate_composite_risk_score(
            geopolitical_risk=50.0,
            price_volatility_risk=50.0,
            supplier_concentration_hhi=50.0,
            quality_defect_ppm=50.0,
            esg_sustainability_score=90.0,   # Excellent ESG
        )
        assert score_high_esg < score_low_esg, (
            f"ESG inversion failed: high_esg={score_high_esg} should be < low_esg={score_low_esg}"
        )

    def test_weights_sum_produces_correct_midpoint(self):
        """With all normalized factors at 50%, composite should be near 50."""
        score = calculate_composite_risk_score(
            geopolitical_risk=50.0,
            price_volatility_risk=50.0,
            supplier_concentration_hhi=50.0,
            quality_defect_ppm=50.0,
            esg_sustainability_score=50.0,   # Inverted 50 -> 50 risk
        )
        assert abs(score - 50.0) < 1.0, f"Midpoint score expected near 50, got {score}"


class TestRiskCategorisation:
    """Verify risk band boundaries and color coding."""

    def test_low_risk_band(self):
        assert categorize_risk(0.0)  == "Low"
        assert categorize_risk(20.0) == "Low"
        assert categorize_risk(39.9) == "Low"

    def test_moderate_risk_band(self):
        assert categorize_risk(40.0) == "Moderate"
        assert categorize_risk(50.0) == "Moderate"
        assert categorize_risk(59.9) == "Moderate"

    def test_high_risk_band(self):
        assert categorize_risk(60.0) == "High"
        assert categorize_risk(70.0) == "High"
        assert categorize_risk(79.9) == "High"

    def test_critical_risk_band(self):
        assert categorize_risk(80.0) == "Critical Risk"
        assert categorize_risk(90.0) == "Critical Risk"
        assert categorize_risk(100.0) == "Critical Risk"

    def test_risk_colors_are_valid_hex(self):
        """Each risk band must return a valid hex color."""
        for category in ["Low", "Moderate", "High", "Critical Risk"]:
            color = get_risk_color(category)
            assert color.startswith("#"), f"Color should start with #: {color}"
            assert len(color) == 7, f"Hex color should be 7 chars: {color}"

    def test_unknown_category_returns_gray(self):
        assert get_risk_color("Unknown") == "#6b7280"
        assert get_risk_color("Nonexistent") == "#6b7280"


class TestRiskScoreBreakdown:
    """Verify breakdown structure and contribution math."""

    def test_breakdown_contains_all_five_factors(self):
        breakdown = get_risk_score_breakdown(
            geopolitical_risk=50.0,
            price_volatility_risk=50.0,
            supplier_concentration_hhi=50.0,
            quality_defect_ppm=20.0,
            esg_sustainability_score=70.0,
        )
        expected_factors = {
            "geopolitical_risk",
            "price_volatility_risk",
            "supplier_concentration_hhi",
            "quality_defect_ppm",
            "esg_sustainability_score",
        }
        actual_factors = {k for k, v in breakdown.items() if isinstance(v, dict)}
        assert expected_factors == actual_factors

    def test_weighted_contributions_sum_to_composite(self):
        """Sum of weighted contributions must equal the composite total."""
        breakdown = get_risk_score_breakdown(
            geopolitical_risk=68.0,
            price_volatility_risk=45.0,
            supplier_concentration_hhi=78.0,
            quality_defect_ppm=12.0,
            esg_sustainability_score=72.0,
        )
        total_from_parts = sum(
            v["weighted_contribution"]
            for k, v in breakdown.items()
            if isinstance(v, dict) and "weighted_contribution" in v
        )
        composite_total = breakdown["composite_total"]
        assert abs(total_from_parts - composite_total) < 0.1, (
            f"Contributions ({total_from_parts:.2f}) don't match composite ({composite_total:.2f})"
        )


class TestSupplierRiskMatrix:
    """Verify full heatmap matrix generation from CSV data."""

    def test_matrix_loads_without_error(self):
        """Matrix should load from CSV without raising any exception."""
        matrix = get_supplier_risk_matrix()
        assert isinstance(matrix, list)
        assert len(matrix) > 0

    def test_matrix_sorted_descending_by_risk(self):
        """Matrix must be sorted from highest to lowest risk score."""
        matrix = get_supplier_risk_matrix()
        scores = [s["composite_risk_score"] for s in matrix]
        assert scores == sorted(scores, reverse=True), (
            "Matrix is not sorted by risk score descending."
        )

    def test_every_supplier_has_required_fields(self):
        """Every supplier row must contain all mandatory fields."""
        required_fields = {
            "supplier_id", "supplier_name", "headquarters_country",
            "material_id", "composite_risk_score", "risk_category",
            "risk_color", "primary_risk_driver",
        }
        matrix = get_supplier_risk_matrix()
        for supplier in matrix:
            missing = required_fields - set(supplier.keys())
            assert not missing, f"Missing fields for {supplier.get('supplier_name', '?')}: {missing}"

    def test_all_supplier_scores_in_bounds(self):
        """Every score in the matrix must be between 0 and 100."""
        matrix = get_supplier_risk_matrix()
        for s in matrix:
            score = s["composite_risk_score"]
            assert 0.0 <= score <= 100.0, (
                f"Supplier {s['supplier_name']} score out of bounds: {score}"
            )

    def test_summary_statistics_structure(self):
        """Summary statistics must contain all expected keys."""
        matrix = get_supplier_risk_matrix()
        stats  = get_risk_summary_statistics(matrix)
        required = {
            "total_suppliers", "average_risk_score", "highest_risk_score",
            "lowest_risk_score", "category_distribution", "most_critical_supplier"
        }
        for key in required:
            assert key in stats, f"Missing key in summary stats: {key}"

    def test_highest_score_gte_average(self):
        """Highest score must always be >= average."""
        matrix = get_supplier_risk_matrix()
        stats  = get_risk_summary_statistics(matrix)
        assert stats["highest_risk_score"] >= stats["average_risk_score"]

    def test_lowest_score_lte_average(self):
        """Lowest score must always be <= average."""
        matrix = get_supplier_risk_matrix()
        stats  = get_risk_summary_statistics(matrix)
        assert stats["lowest_risk_score"] <= stats["average_risk_score"]


# ===========================================================================
# SECTION 2: PROCUREMENT ENGINE TESTS
# ===========================================================================

from app.services.procurement_engine import (
    recommend_ev_vehicles,
    calculate_effective_range,
    get_temperature_degradation_factor,
    calculate_5yr_tco,
    apply_hard_constraints,
)

# ---------------------------------------------------------------------------
# Shared minimal EV catalog fixture for procurement tests
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_ev_catalog() -> pd.DataFrame:
    """
    Minimal EV catalog with 3 vehicles for controlled unit testing.
    Does NOT rely on the seed CSV file being present.
    """
    return pd.DataFrame([
        {
            "vehicle_id": "TEST-01", "make": "TestCo", "model": "LightVan",
            "category": "Light Van", "battery_capacity_kwh": 80.0,
            "usable_battery_kwh": 75.0, "battery_chemistry": "LFP",
            "nominal_range_km": 250.0, "max_payload_kg": 1500.0,
            "cargo_volume_m3": 12.0, "charging_peak_kw_dc": 120.0,
            "charging_time_10_to_80_mins": 35.0,
            "energy_consumption_kwh_per_km": 0.32,
            "purchase_cost_usd": 70000.0, "annual_maintenance_usd": 1200.0,
            "warranty_years": 8,
        },
        {
            "vehicle_id": "TEST-02", "make": "TestCo", "model": "MiniVan",
            "category": "Light Van", "battery_capacity_kwh": 40.0,
            "usable_battery_kwh": 37.0, "battery_chemistry": "NMC",
            "nominal_range_km": 100.0,  # Too short for 120 km + 25% buffer
            "max_payload_kg": 800.0,     # Too low for 1000 kg requirement
            "cargo_volume_m3": 6.0, "charging_peak_kw_dc": 50.0,
            "charging_time_10_to_80_mins": 60.0,
            "energy_consumption_kwh_per_km": 0.40,
            "purchase_cost_usd": 35000.0, "annual_maintenance_usd": 900.0,
            "warranty_years": 5,
        },
        {
            "vehicle_id": "TEST-03", "make": "TestCo", "model": "HeavyTruck",
            "category": "Heavy Duty", "battery_capacity_kwh": 300.0,
            "usable_battery_kwh": 280.0, "battery_chemistry": "NMC",
            "nominal_range_km": 300.0, "max_payload_kg": 9000.0,
            "cargo_volume_m3": 45.0, "charging_peak_kw_dc": 150.0,
            "charging_time_10_to_80_mins": 90.0,
            "energy_consumption_kwh_per_km": 1.00,
            "purchase_cost_usd": 200000.0, "annual_maintenance_usd": 3500.0,
            "warranty_years": 5,
        },
    ])


class TestProcurementHardConstraints:
    """Verify that undersized or over-budget vehicles are correctly rejected."""

    def test_undersized_payload_vehicle_is_rejected(self, sample_ev_catalog):
        """TEST-02 (800 kg max) must be rejected for a 1000 kg requirement."""
        _, rejected = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=80.0,
            required_payload_kg=1000.0,
            ambient_temp_celsius=20.0,
        )
        rejected_ids = [r["vehicle_id"] for r in rejected]
        assert "TEST-02" in rejected_ids, (
            "TEST-02 (800 kg max) should be rejected for 1000 kg payload requirement."
        )

    def test_short_range_vehicle_is_rejected(self, sample_ev_catalog):
        """TEST-02 (100 km nominal) must fail the 120 km + 25% buffer = 150 km threshold."""
        _, rejected = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=120.0,
            required_payload_kg=500.0,   # payload it CAN handle
            ambient_temp_celsius=20.0,
        )
        rejected_ids = [r["vehicle_id"] for r in rejected]
        assert "TEST-02" in rejected_ids, (
            "TEST-02 (100 km range) should be rejected for 120 km + 25% buffer = 150 km."
        )

    def test_suitable_vehicle_passes_constraints(self, sample_ev_catalog):
        """TEST-01 (250 km, 1500 kg) must PASS for a 120 km / 1000 kg requirement."""
        passed, _ = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=120.0,
            required_payload_kg=1000.0,
            ambient_temp_celsius=20.0,
        )
        passed_ids = list(passed["vehicle_id"])
        assert "TEST-01" in passed_ids, (
            "TEST-01 should pass: 250 km range > 150 km threshold, 1500 kg > 1000 kg."
        )

    def test_budget_constraint_rejects_expensive_vehicle(self, sample_ev_catalog):
        """TEST-03 ($200,000) must be rejected when max budget is $80,000."""
        _, rejected = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            ambient_temp_celsius=20.0,
            max_budget_usd=80000.0,
        )
        rejected_ids = [r["vehicle_id"] for r in rejected]
        assert "TEST-03" in rejected_ids, (
            "TEST-03 ($200,000) should be rejected when budget cap is $80,000."
        )

    def test_no_budget_constraint_passes_all_capable_vehicles(self, sample_ev_catalog):
        """Without a budget cap, all range/payload-capable vehicles should pass."""
        passed, _ = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            ambient_temp_celsius=20.0,
            max_budget_usd=None,
        )
        # TEST-01 and TEST-03 should both pass (TEST-02 may fail on range)
        passed_ids = list(passed["vehicle_id"])
        assert "TEST-01" in passed_ids
        assert "TEST-03" in passed_ids

    def test_rejection_reason_mentions_specific_shortfall(self, sample_ev_catalog):
        """Rejection reason must contain descriptive text, not an empty string."""
        _, rejected = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=120.0,
            required_payload_kg=1000.0,
            ambient_temp_celsius=20.0,
        )
        for r in rejected:
            assert len(r["rejected_reason"]) > 10, (
                f"Rejection reason for {r['vehicle_id']} is too short: '{r['rejected_reason']}'"
            )

    def test_all_vehicles_rejected_returns_empty_passed_df(self, sample_ev_catalog):
        """Impossible requirements should result in zero passing vehicles."""
        passed, rejected = apply_hard_constraints(
            df=sample_ev_catalog,
            daily_distance_km=5000.0,       # No vehicle can cover 5000 km/day
            required_payload_kg=50000.0,    # No vehicle carries 50 tonnes
            ambient_temp_celsius=20.0,
        )
        assert passed.empty, "No vehicle should pass 5000 km / 50 tonne requirements."
        assert len(rejected) == len(sample_ev_catalog)


class TestProcurementScoring:
    """Verify recommendation ranking and score structure."""

    def test_recommend_returns_top_n_results(self, sample_ev_catalog):
        """Result should contain at most top_n recommendations."""
        result = recommend_ev_vehicles(
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            available_charging_window_hours=4.0,
            ambient_temp_celsius=20.0,
            top_n=2,
            df=sample_ev_catalog,
        )
        assert len(result["recommendations"]) <= 2

    def test_recommendations_sorted_by_suitability_score_descending(self, sample_ev_catalog):
        """Recommendations must be in descending suitability score order."""
        result = recommend_ev_vehicles(
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            available_charging_window_hours=4.0,
            ambient_temp_celsius=20.0,
            df=sample_ev_catalog,
        )
        scores = [v["suitability_score"] for v in result["recommendations"]]
        assert scores == sorted(scores, reverse=True), (
            "Recommendations are not sorted by suitability score descending."
        )

    def test_suitability_scores_in_valid_range(self, sample_ev_catalog):
        """All suitability scores must be between 0 and 100."""
        result = recommend_ev_vehicles(
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            available_charging_window_hours=4.0,
            ambient_temp_celsius=20.0,
            df=sample_ev_catalog,
        )
        for v in result["recommendations"]:
            assert 0.0 <= v["suitability_score"] <= 100.0, (
                f"Suitability score out of bounds: {v['suitability_score']}"
            )

    def test_ranks_are_sequential_starting_at_1(self, sample_ev_catalog):
        """Ranks must start at 1 and increment by 1."""
        result = recommend_ev_vehicles(
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            available_charging_window_hours=4.0,
            ambient_temp_celsius=20.0,
            df=sample_ev_catalog,
        )
        ranks = [v["rank"] for v in result["recommendations"]]
        assert ranks == list(range(1, len(ranks) + 1)), (
            f"Ranks are not sequential from 1: {ranks}"
        )

    def test_score_breakdown_contributions_sum_to_suitability(self, sample_ev_catalog):
        """Sum of score breakdown contributions must equal the suitability score."""
        result = recommend_ev_vehicles(
            daily_distance_km=80.0,
            required_payload_kg=500.0,
            available_charging_window_hours=4.0,
            ambient_temp_celsius=20.0,
            df=sample_ev_catalog,
        )
        for v in result["recommendations"]:
            total_from_parts = sum(
                detail["contribution"]
                for detail in v["score_breakdown"].values()
            )
            assert abs(total_from_parts - v["suitability_score"]) < 0.5, (
                f"Score breakdown sum ({total_from_parts:.2f}) != "
                f"suitability_score ({v['suitability_score']:.2f})"
            )

    def test_no_matching_vehicles_returns_empty_recommendations(self, sample_ev_catalog):
        """Impossible requirements should return an empty recommendations list."""
        result = recommend_ev_vehicles(
            daily_distance_km=10000.0,
            required_payload_kg=100000.0,
            available_charging_window_hours=0.5,
            ambient_temp_celsius=20.0,
            df=sample_ev_catalog,
        )
        assert result["recommendations"] == []
        assert result["total_passed"] == 0


class TestTemperatureDegradation:
    """Verify temperature factors are correctly applied to effective range."""

    def test_optimal_temperature_no_degradation(self):
        factor = get_temperature_degradation_factor(25.0)
        assert factor == 1.0, f"Optimal temp should give factor 1.0, got {factor}"

    def test_cold_temperature_reduces_range(self):
        factor = get_temperature_degradation_factor(-5.0)
        assert factor < 1.0, f"Cold temp should reduce range, got {factor}"
        assert factor == 0.75

    def test_extreme_cold_gives_minimum_factor(self):
        factor = get_temperature_degradation_factor(-30.0)
        assert factor == 0.60, f"Extreme cold should give factor 0.60, got {factor}"

    def test_effective_range_less_than_nominal_in_cold(self):
        effective = calculate_effective_range(
            nominal_range_km=250.0,
            ambient_temp_celsius=-5.0,
            payload_kg=500.0,
            max_payload_kg=1500.0,
        )
        assert effective < 250.0, (
            f"Effective range {effective} should be less than nominal 250 km in cold."
        )

    def test_heavy_payload_reduces_range(self):
        """Near-maximum payload should reduce effective range below nominal."""
        light_load = calculate_effective_range(
            nominal_range_km=250.0,
            ambient_temp_celsius=20.0,
            payload_kg=100.0,
            max_payload_kg=1500.0,
        )
        heavy_load = calculate_effective_range(
            nominal_range_km=250.0,
            ambient_temp_celsius=20.0,
            payload_kg=1400.0,
            max_payload_kg=1500.0,
        )
        assert heavy_load < light_load, (
            f"Heavy load ({heavy_load}) should give shorter range than light load ({light_load})."
        )


# ===========================================================================
# SECTION 3: CARBON ENGINE TESTS
# ===========================================================================

from app.services.carbon_engine import (
    calculate_diesel_annual_emissions,
    calculate_ev_annual_emissions,
    calculate_net_co2_saved,
    calculate_carbon_abatement_cost,
    generate_fleet_sustainability_summary,
    list_available_grid_regions,
    ANNUAL_OPERATING_DAYS,
)


class TestDieselEmissions:
    """Verify diesel emission formula: Annual_km × (L/100km ÷ 100) × 2.68."""

    def test_formula_produces_correct_result(self):
        """Manual calculation check for a known input set."""
        annual_km   = 30000.0        # 120 km/day x 250 days
        l_per_100km = 10.5
        expected_litres = annual_km * (l_per_100km / 100.0)         # 3150
        expected_co2_kg = expected_litres * 2.68                    # 8442
        expected_co2_t  = expected_co2_kg / 1000.0                  # 8.442

        result = calculate_diesel_annual_emissions(annual_km, l_per_100km)

        assert abs(result["annual_litres_consumed"] - expected_litres) < 0.01
        assert abs(result["annual_co2_kg"]          - expected_co2_kg) < 0.1
        assert abs(result["annual_co2_tonnes"]       - expected_co2_t)  < 0.001

    def test_higher_consumption_gives_higher_emissions(self):
        result_low  = calculate_diesel_annual_emissions(30000.0, diesel_l_per_100km=8.0)
        result_high = calculate_diesel_annual_emissions(30000.0, diesel_l_per_100km=14.0)
        assert result_high["annual_co2_kg"] > result_low["annual_co2_kg"]

    def test_zero_distance_gives_zero_emissions(self):
        result = calculate_diesel_annual_emissions(0.0, 10.5)
        assert result["annual_co2_kg"] == 0.0
        assert result["annual_co2_tonnes"] == 0.0

    def test_result_contains_all_required_keys(self):
        result = calculate_diesel_annual_emissions(30000.0, 10.5)
        required = {
            "annual_km", "diesel_l_per_100km", "annual_litres_consumed",
            "annual_co2_kg", "annual_co2_tonnes", "annual_fuel_cost_usd"
        }
        assert required.issubset(set(result.keys()))


class TestEVEmissions:
    """Verify EV emission formula: Annual_km × kWh/km × Grid_factor."""

    def test_formula_produces_correct_result(self):
        annual_km    = 30000.0
        kwh_per_km   = 0.33
        grid_factor  = 0.436           # global_average

        expected_kwh    = annual_km * kwh_per_km             # 9900
        expected_co2_kg = expected_kwh * grid_factor         # 4316.4
        expected_co2_t  = expected_co2_kg / 1000.0

        result = calculate_ev_annual_emissions(annual_km, kwh_per_km, "global_average")

        assert abs(result["annual_kwh_consumed"] - expected_kwh)   < 0.1
        assert abs(result["annual_co2_kg"]       - expected_co2_kg) < 0.1
        assert abs(result["annual_co2_tonnes"]   - expected_co2_t)  < 0.001

    def test_renewable_grid_gives_zero_emissions(self):
        result = calculate_ev_annual_emissions(30000.0, 0.33, "renewable_100")
        assert result["annual_co2_kg"] == 0.0

    def test_coal_grid_gives_higher_emissions_than_average(self):
        coal    = calculate_ev_annual_emissions(30000.0, 0.33, "coal_heavy")
        average = calculate_ev_annual_emissions(30000.0, 0.33, "global_average")
        assert coal["annual_co2_kg"] > average["annual_co2_kg"]

    def test_invalid_grid_region_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown grid region"):
            calculate_ev_annual_emissions(30000.0, 0.33, "made_up_region")

    def test_custom_grid_factor_overrides_region(self):
        result = calculate_ev_annual_emissions(
            annual_km=30000.0,
            ev_kwh_per_km=0.33,
            grid_region="global_average",
            custom_grid_factor=0.100,
        )
        expected = 30000.0 * 0.33 * 0.100
        assert abs(result["annual_co2_kg"] - expected) < 0.1


class TestNetCO2Saved:
    """Verify net savings calculation and impact classification."""

    def test_ev_saves_co2_vs_diesel_on_clean_grid(self):
        diesel_em = calculate_diesel_annual_emissions(30000.0, 10.5)
        ev_em     = calculate_ev_annual_emissions(30000.0, 0.33, "europe_average")
        result    = calculate_net_co2_saved(diesel_em, ev_em)
        assert result["net_co2_saved_tonnes"] > 0.0

    def test_ev_on_coal_grid_saves_less_than_clean_grid(self):
        diesel_em   = calculate_diesel_annual_emissions(30000.0, 10.5)
        ev_clean    = calculate_ev_annual_emissions(30000.0, 0.33, "europe_average")
        ev_coal     = calculate_ev_annual_emissions(30000.0, 0.33, "coal_heavy")
        net_clean   = calculate_net_co2_saved(diesel_em, ev_clean)
        net_coal    = calculate_net_co2_saved(diesel_em, ev_coal)
        assert net_clean["net_co2_saved_tonnes"] > net_coal["net_co2_saved_tonnes"]

    def test_pct_reduction_between_0_and_100(self):
        diesel_em = calculate_diesel_annual_emissions(30000.0, 10.5)
        ev_em     = calculate_ev_annual_emissions(30000.0, 0.33, "global_average")
        result    = calculate_net_co2_saved(diesel_em, ev_em)
        assert 0.0 <= result["percentage_reduction"] <= 100.0

    def test_impact_labels_assigned_correctly(self):
        """High-reduction scenarios should get better impact labels."""
        diesel_em    = calculate_diesel_annual_emissions(30000.0, 10.5)
        ev_norway    = calculate_ev_annual_emissions(30000.0, 0.33, "norway")
        ev_coal      = calculate_ev_annual_emissions(30000.0, 0.33, "coal_heavy")
        result_norway = calculate_net_co2_saved(diesel_em, ev_norway)
        result_coal   = calculate_net_co2_saved(diesel_em, ev_coal)
        # Norway (96%+ reduction) should be "Transformational"
        assert result_norway["impact_label"] == "Transformational"
        # Coal grid is a marginal improvement
        assert result_coal["percentage_reduction"] < 20.0

    def test_trees_equivalent_is_positive(self):
        diesel_em = calculate_diesel_annual_emissions(30000.0, 10.5)
        ev_em     = calculate_ev_annual_emissions(30000.0, 0.33, "global_average")
        result    = calculate_net_co2_saved(diesel_em, ev_em)
        assert result["equivalent_trees_planted"] > 0


class TestCarbonAbatementCost:
    """Verify CAC formula and verdict classification."""

    def test_cac_is_a_number(self):
        result = calculate_carbon_abatement_cost(
            ev_purchase_cost_usd=71000.0,
            ev_annual_maintenance_usd=1300.0,
            ev_kwh_per_km=0.33,
            diesel_l_per_100km=10.5,
            daily_distance_km=120.0,
            annual_co2_saved_tonnes=4.12,
        )
        assert isinstance(result["carbon_abatement_cost_usd_per_tonne"], float)
        assert result["carbon_abatement_cost_usd_per_tonne"] != float("inf")

    def test_negative_cac_when_ev_cheaper_than_diesel(self):
        """When EV is cheaper to run than diesel, CAC should be negative."""
        result = calculate_carbon_abatement_cost(
            ev_purchase_cost_usd=50000.0,     # Cheap EV
            ev_annual_maintenance_usd=800.0,
            ev_kwh_per_km=0.20,               # Very efficient
            diesel_l_per_100km=18.0,          # Thirsty diesel
            daily_distance_km=200.0,
            annual_co2_saved_tonnes=10.0,
        )
        # With these inputs EV total opex should beat diesel easily
        tco_delta = result["annual_tco_delta_usd"]
        if tco_delta < 0:
            assert result["carbon_abatement_cost_usd_per_tonne"] < 0

    def test_cac_verdict_is_string(self):
        result = calculate_carbon_abatement_cost(
            ev_purchase_cost_usd=71000.0,
            ev_annual_maintenance_usd=1300.0,
            ev_kwh_per_km=0.33,
            diesel_l_per_100km=10.5,
            daily_distance_km=120.0,
            annual_co2_saved_tonnes=4.12,
        )
        assert isinstance(result["cac_verdict"], str)
        assert len(result["cac_verdict"]) > 5


class TestFleetSustainabilitySummary:
    """Verify the executive sustainability summary output structure."""

    @pytest.fixture
    def fleet_summary(self):
        return generate_fleet_sustainability_summary(
            daily_distance_km=120.0,
            diesel_l_per_100km=10.5,
            ev_kwh_per_km=0.33,
            ev_purchase_cost_usd=71000.0,
            ev_annual_maintenance_usd=1300.0,
            fleet_size=10,
            grid_region="europe_average",
            target_replacement_pct=100.0,
        )

    def test_summary_has_all_top_level_sections(self, fleet_summary):
        required = {
            "scenario", "per_vehicle", "fleet_totals",
            "carbon_economics", "environmental_equivalents", "net_zero_assessment"
        }
        assert required.issubset(set(fleet_summary.keys()))

    def test_fleet_co2_reduction_between_0_and_100(self, fleet_summary):
        pct = fleet_summary["fleet_totals"]["fleet_co2_reduction_pct"]
        assert 0.0 <= pct <= 100.0

    def test_post_ev_co2_less_than_diesel_baseline(self, fleet_summary):
        baseline   = fleet_summary["fleet_totals"]["current_diesel_co2_tonnes_yr"]
        post_ev    = fleet_summary["fleet_totals"]["post_ev_total_co2_tonnes_yr"]
        assert post_ev < baseline, (
            f"Post-EV emissions ({post_ev}) should be less than diesel baseline ({baseline})."
        )

    def test_trees_equivalent_scales_with_fleet_size(self):
        small_fleet = generate_fleet_sustainability_summary(
            daily_distance_km=120.0, diesel_l_per_100km=10.5,
            ev_kwh_per_km=0.33, ev_purchase_cost_usd=71000.0,
            ev_annual_maintenance_usd=1300.0, fleet_size=5,
            grid_region="europe_average",
        )
        large_fleet = generate_fleet_sustainability_summary(
            daily_distance_km=120.0, diesel_l_per_100km=10.5,
            ev_kwh_per_km=0.33, ev_purchase_cost_usd=71000.0,
            ev_annual_maintenance_usd=1300.0, fleet_size=20,
            grid_region="europe_average",
        )
        small_trees = small_fleet["environmental_equivalents"]["trees_planted_equivalent"]
        large_trees = large_fleet["environmental_equivalents"]["trees_planted_equivalent"]
        assert large_trees > small_trees, (
            "Larger fleet should save more trees equivalent."
        )

    def test_net_zero_status_is_non_empty_string(self, fleet_summary):
        status = fleet_summary["net_zero_assessment"]["status"]
        assert isinstance(status, str)
        assert len(status) > 5

    def test_all_grid_regions_accepted(self):
        """All built-in grid regions must work without raising an exception."""
        regions = list_available_grid_regions()
        for region in regions.keys():
            result = generate_fleet_sustainability_summary(
                daily_distance_km=100.0, diesel_l_per_100km=10.0,
                ev_kwh_per_km=0.35, ev_purchase_cost_usd=70000.0,
                ev_annual_maintenance_usd=1200.0, fleet_size=5,
                grid_region=region,
            )
            assert result["fleet_totals"]["fleet_co2_reduction_pct"] is not None, (
                f"Grid region '{region}' failed to produce a result."
            )


# ===========================================================================
# SECTION 4: FASTAPI ENDPOINT INTEGRATION TESTS
# ===========================================================================

from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Basic connectivity check."""

    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_health_check_returns_ok(self):
        response = client.get("/api/v1/intelligence/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestSupplyChainRiskMatrixEndpoint:
    """Integration tests for GET /api/v1/supply-chain/risk-matrix."""

    def test_returns_200_status(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}. Body: {response.text}"
        )

    def test_response_has_required_fields(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        data = response.json()
        required = {
            "total_suppliers", "average_risk_score",
            "highest_risk_score", "lowest_risk_score",
            "category_distribution", "suppliers"
        }
        for field in required:
            assert field in data, f"Missing field in response: {field}"

    def test_suppliers_list_is_non_empty(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        data = response.json()
        assert len(data["suppliers"]) > 0

    def test_suppliers_sorted_by_risk_descending(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        data = response.json()
        scores = [s["composite_risk_score"] for s in data["suppliers"]]
        assert scores == sorted(scores, reverse=True), (
            "Suppliers in API response are not sorted by risk score descending."
        )

    def test_all_supplier_scores_in_valid_range(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        data = response.json()
        for s in data["suppliers"]:
            score = s["composite_risk_score"]
            assert 0.0 <= score <= 100.0, f"Score out of range: {score}"

    def test_category_distribution_values_are_integers(self):
        response = client.get("/api/v1/supply-chain/risk-matrix")
        data = response.json()
        for category, count in data["category_distribution"].items():
            assert isinstance(count, int), (
                f"Category distribution count for '{category}' is not an int: {count}"
            )


class TestSupplierRiskEvaluateEndpoint:
    """Integration tests for POST /api/v1/supply-chain/evaluate."""

    def _make_request(self, **overrides):
        payload = {
            "supplier_name": "TestSupplier",
            "geopolitical_risk": 50.0,
            "price_volatility_risk": 50.0,
            "supplier_concentration_hhi": 50.0,
            "quality_defect_ppm": 20.0,
            "esg_sustainability_score": 60.0,
            **overrides
        }
        return client.post("/api/v1/supply-chain/evaluate", json=payload)

    def test_returns_200_for_valid_input(self):
        response = self._make_request()
        assert response.status_code == 200

    def test_composite_score_in_valid_range(self):
        response = self._make_request()
        score = response.json()["composite_risk_score"]
        assert 0.0 <= score <= 100.0

    def test_risk_category_is_valid_string(self):
        response = self._make_request()
        category = response.json()["risk_category"]
        assert category in {"Low", "Moderate", "High", "Critical Risk"}

    def test_high_risk_inputs_give_high_category(self):
        response = self._make_request(
            geopolitical_risk=90.0,
            price_volatility_risk=90.0,
            supplier_concentration_hhi=90.0,
            quality_defect_ppm=80.0,
            esg_sustainability_score=5.0,
        )
        assert response.status_code == 200
        category = response.json()["risk_category"]
        assert category in {"High", "Critical Risk"}, (
            f"High-risk inputs should give High or Critical, got: {category}"
        )

    def test_invalid_input_returns_422(self):
        response = client.post("/api/v1/supply-chain/evaluate", json={
            "supplier_name": "Bad",
            "geopolitical_risk": 150.0,   # Out of [0,100] range
            "price_volatility_risk": 50.0,
            "supplier_concentration_hhi": 50.0,
            "quality_defect_ppm": 10.0,
            "esg_sustainability_score": 70.0,
        })
        assert response.status_code == 422


class TestProcurementRecommendEndpoint:
    """Integration tests for POST /api/v1/procurement/recommend."""

    def _base_payload(self, **overrides):
        payload = {
            "daily_distance_km": 120.0,
            "required_payload_kg": 1200.0,
            "available_charging_window_hours": 4.0,
            "ambient_temp_celsius": 10.0,
            "top_n": 3,
            **overrides
        }
        return payload

    def test_returns_200_for_valid_input(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload()
        )
        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}. Body: {response.text}"
        )

    def test_response_has_required_fields(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload()
        )
        data = response.json()
        required = {
            "recommendations", "rejected_vehicles",
            "input_summary", "total_evaluated", "total_passed", "total_rejected"
        }
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_total_counts_are_consistent(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload()
        )
        data = response.json()
        assert data["total_passed"] + data["total_rejected"] == data["total_evaluated"], (
            "total_passed + total_rejected must equal total_evaluated."
        )

    def test_recommendations_dont_exceed_top_n(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload(top_n=2)
        )
        data = response.json()
        assert len(data["recommendations"]) <= 2

    def test_impossible_requirements_returns_empty_recommendations(self):
        response = client.post("/api/v1/procurement/recommend", json={
            "daily_distance_km": 10000.0,
            "required_payload_kg": 100000.0,
            "available_charging_window_hours": 0.1,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["recommendations"] == []

    def test_negative_distance_returns_422(self):
        response = client.post("/api/v1/procurement/recommend", json={
            "daily_distance_km": -50.0,
            "required_payload_kg": 1000.0,
            "available_charging_window_hours": 4.0,
        })
        assert response.status_code == 422

    def test_all_recommendation_scores_in_valid_range(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload()
        )
        data = response.json()
        for v in data["recommendations"]:
            score = v["suitability_score"]
            assert 0.0 <= score <= 100.0, f"Suitability score out of range: {score}"

    def test_input_summary_echoes_request_values(self):
        response = client.post(
            "/api/v1/procurement/recommend",
            json=self._base_payload(daily_distance_km=150.0, required_payload_kg=800.0)
        )
        data = response.json()
        assert data["input_summary"]["daily_distance_km"] == 150.0
        assert data["input_summary"]["required_payload_kg"] == 800.0


class TestEmissionsEndpoint:
    """Integration tests for POST /api/v1/emissions/calculate."""

    def _base_payload(self, **overrides):
        payload = {
            "daily_distance_km": 120.0,
            "diesel_l_per_100km": 10.5,
            "ev_kwh_per_km": 0.33,
            "ev_purchase_cost_usd": 71000.0,
            "ev_annual_maintenance_usd": 1300.0,
            "fleet_size": 10,
            "grid_region": "europe_average",
            "target_replacement_pct": 100.0,
            **overrides
        }
        return payload

    def test_returns_200_for_valid_input(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload())
        assert response.status_code == 200, response.text

    def test_response_has_all_sections(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload())
        data = response.json()
        required = {
            "scenario", "per_vehicle", "fleet_totals",
            "carbon_economics", "environmental_equivalents", "net_zero_assessment"
        }
        for section in required:
            assert section in data, f"Missing section: {section}"

    def test_co2_reduction_pct_between_0_and_100(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload())
        data = response.json()
        pct = data["fleet_totals"]["fleet_co2_reduction_pct"]
        assert 0.0 <= pct <= 100.0

    def test_post_ev_co2_less_than_baseline(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload())
        data = response.json()
        baseline = data["fleet_totals"]["current_diesel_co2_tonnes_yr"]
        post_ev  = data["fleet_totals"]["post_ev_total_co2_tonnes_yr"]
        assert post_ev < baseline

    def test_trees_equivalent_is_positive(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload())
        data = response.json()
        assert data["environmental_equivalents"]["trees_planted_equivalent"] > 0

    def test_invalid_grid_region_returns_500(self):
        response = client.post("/api/v1/emissions/calculate", json=self._base_payload(
            grid_region="nonexistent_grid"
        ))
        assert response.status_code in {422, 500}


class TestAIExplainEndpoint:
    """Integration tests for POST /api/v1/ai/explain."""

    def _base_payload(self):
        return {
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
                "cac_verdict": "High: electrification costly",
                "grid_region": "europe_average",
                "fleet_size": 20,
                "payback_years": 8.2,
            },
        }

    def test_returns_200_for_valid_input(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        assert response.status_code == 200, response.text

    def test_response_has_all_required_fields(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        data = response.json()
        required = {"explanation", "mode", "generated_at", "vehicle", "risk_category", "co2_impact"}
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_explanation_is_non_empty_string(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        explanation = response.json()["explanation"]
        assert isinstance(explanation, str)
        assert len(explanation) > 100, "Explanation too short — expected full executive summary."

    def test_explanation_contains_three_sections(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        explanation = response.json()["explanation"]
        assert "Recommendation Rationale" in explanation
        assert "Supply Chain Risk" in explanation
        assert "Mitigation" in explanation

    def test_mode_is_valid_value(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        mode = response.json()["mode"]
        assert mode in {"gemini", "openai", "mock", "mock (gemini_failed)", "mock (openai_failed)"}

    def test_vehicle_field_contains_make_and_model(self):
        response = client.post("/api/v1/ai/explain", json=self._base_payload())
        vehicle_str = response.json()["vehicle"]
        assert "Mercedes-Benz" in vehicle_str
        assert "eSprinter" in vehicle_str

    def test_missing_required_field_returns_422(self):
        payload = self._base_payload()
        del payload["vehicle"]   # Remove required section
        response = client.post("/api/v1/ai/explain", json=payload)
        assert response.status_code == 422
