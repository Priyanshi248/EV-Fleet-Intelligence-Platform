"""
procurement_engine.py
=====================
EV Suitability & Procurement Recommendation Engine
for EV Fleet Intelligence Platform.

Evaluates a fleet manager's operational route requirements against
the EV catalog and returns ranked vehicle recommendations with:
  - Hard constraint filtering (payload, temperature-adjusted range)
  - EV Suitability Score (0-100) across 4 weighted dimensions:
      * Range Margin          (30%)
      * 5-Year TCO Efficiency (35%)
      * Charging Turnaround   (20%)
      * Battery Chemistry     (15%)
"""

import os
import pandas as pd
import numpy as np
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SEEDS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "seeds")

# Suitability score weights (must sum to 1.0)
SUITABILITY_WEIGHTS: dict[str, float] = {
    "range_margin":          0.30,
    "tco_efficiency":        0.35,
    "charging_turnaround":   0.20,
    "battery_chemistry":     0.15,
}

# Temperature range degradation factors
# Based on real-world EV battery thermal performance data
TEMPERATURE_DEGRADATION: dict[str, dict] = {
    "extreme_cold":  {"range": (-50, -10), "factor": 0.60},  # -50 to -10 C -> 60% range
    "cold":          {"range": (-10,   5), "factor": 0.75},  # -10 to  5 C -> 75% range
    "cool":          {"range": (  5,  15), "factor": 0.88},  #   5 to 15 C -> 88% range
    "optimal":       {"range": ( 15,  35), "factor": 1.00},  #  15 to 35 C -> 100% range
    "warm":          {"range": ( 35,  40), "factor": 0.95},  #  35 to 40 C -> 95% range
    "hot":           {"range": ( 40, 100), "factor": 0.88},  #  40+ C      -> 88% range
}

# Battery chemistry cycle life reference values
CHEMISTRY_CYCLE_LIFE: dict[str, int] = {
    "LFP":  3000,   # Lithium Iron Phosphate  — long cycle life, thermally stable
    "NMC":  1500,   # Nickel Manganese Cobalt — higher energy density, shorter life
    "NCA":  1200,   # Nickel Cobalt Aluminium — high power, least durable
    "LTO":  7000,   # Lithium Titanate        — longest life, expensive
}

# Cost assumptions
ELECTRICITY_COST_USD_PER_KWH: float = 0.12
ANNUAL_OPERATING_DAYS: int = 250
TCO_HORIZON_YEARS: int = 5


# ---------------------------------------------------------------------------
# Data Loading
# ---------------------------------------------------------------------------

def load_ev_catalog() -> pd.DataFrame:
    """
    Loads the ev_catalog.csv seed file into a DataFrame.

    Returns:
        pd.DataFrame: EV catalog with all specification columns.

    Raises:
        FileNotFoundError: If the seed CSV file does not exist.
    """
    filepath = os.path.join(SEEDS_DIR, "ev_catalog.csv")
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"EV catalog seed file not found: {filepath}\n"
            "Run generate_datasets.py first."
        )
    return pd.read_csv(filepath)


# ---------------------------------------------------------------------------
# Temperature Degradation
# ---------------------------------------------------------------------------

def get_temperature_degradation_factor(ambient_temp_celsius: float) -> float:
    """
    Returns the range degradation factor for a given ambient temperature.

    Args:
        ambient_temp_celsius: Ambient operating temperature in Celsius.

    Returns:
        float: Degradation factor between 0.0 and 1.0
    """
    for band, config in TEMPERATURE_DEGRADATION.items():
        low, high = config["range"]
        if low <= ambient_temp_celsius < high:
            return config["factor"]
    if ambient_temp_celsius < -50:
        return 0.60
    return 0.88


def calculate_effective_range(
    nominal_range_km: float,
    ambient_temp_celsius: float,
    payload_kg: float,
    max_payload_kg: float,
) -> float:
    """
    Calculates real-world effective range after applying:
      1. Temperature degradation
      2. Payload penalty (every 10% load above 50% capacity reduces range by ~3%)

    Args:
        nominal_range_km:     Manufacturer-rated range at optimal conditions.
        ambient_temp_celsius: Operating temperature.
        payload_kg:           Actual cargo payload being carried.
        max_payload_kg:       Vehicle's maximum payload capacity.

    Returns:
        float: Effective range in km under real-world conditions.
    """
    temp_factor = get_temperature_degradation_factor(ambient_temp_celsius)

    payload_ratio = payload_kg / max_payload_kg if max_payload_kg > 0 else 0.0
    payload_ratio = min(1.0, max(0.0, payload_ratio))

    if payload_ratio > 0.5:
        excess_load = payload_ratio - 0.5
        payload_penalty = 1.0 - (excess_load / 0.1) * 0.03
        payload_penalty = max(0.70, payload_penalty)
    else:
        payload_penalty = 1.0

    return round(nominal_range_km * temp_factor * payload_penalty, 2)


# ---------------------------------------------------------------------------
# Hard Constraint Filter
# ---------------------------------------------------------------------------

def apply_hard_constraints(
    df: pd.DataFrame,
    daily_distance_km: float,
    required_payload_kg: float,
    ambient_temp_celsius: float,
    max_budget_usd: Optional[float] = None,
) -> tuple[pd.DataFrame, list[dict]]:
    """
    Eliminates vehicles that fail mandatory feasibility requirements.

    Hard Constraints:
      1. max_payload_kg >= required_payload_kg
      2. effective_range >= daily_distance_km * 1.25  (25% safety buffer)
      3. purchase_cost_usd <= max_budget_usd          (if budget is provided)

    Returns:
        tuple: (passed_df, rejected_list)
    """
    rejected: list[dict] = []
    passed_indices: list[int] = []

    required_range_with_buffer = daily_distance_km * 1.25

    for idx, row in df.iterrows():
        rejection_reason: Optional[str] = None

        # Constraint 1: Payload
        if row["max_payload_kg"] < required_payload_kg:
            rejection_reason = (
                f"Payload too low: vehicle max {row['max_payload_kg']} kg "
                f"< required {required_payload_kg} kg"
            )
        else:
            # Constraint 2: Range with buffer
            eff_range = calculate_effective_range(
                nominal_range_km=row["nominal_range_km"],
                ambient_temp_celsius=ambient_temp_celsius,
                payload_kg=required_payload_kg,
                max_payload_kg=row["max_payload_kg"],
            )
            if eff_range < required_range_with_buffer:
                rejection_reason = (
                    f"Effective range {eff_range:.1f} km < required "
                    f"{required_range_with_buffer:.1f} km "
                    f"(daily {daily_distance_km} km + 25% buffer)"
                )

        # Constraint 3: Budget
        if rejection_reason is None and max_budget_usd is not None:
            if row["purchase_cost_usd"] > max_budget_usd:
                rejection_reason = (
                    f"Over budget: ${row['purchase_cost_usd']:,.0f} "
                    f"> max ${max_budget_usd:,.0f}"
                )

        if rejection_reason:
            rejected.append({
                "vehicle_id":      row["vehicle_id"],
                "make":            row["make"],
                "model":           row["model"],
                "rejected_reason": rejection_reason,
            })
        else:
            passed_indices.append(idx)

    passed_df = df.loc[passed_indices].copy().reset_index(drop=True)
    return passed_df, rejected


# ---------------------------------------------------------------------------
# TCO Calculation
# ---------------------------------------------------------------------------

def calculate_5yr_tco(
    purchase_cost_usd: float,
    annual_maintenance_usd: float,
    energy_consumption_kwh_per_km: float,
    daily_distance_km: float,
) -> dict:
    """
    Calculates 5-Year Total Cost of Ownership (TCO) for an EV.

    TCO Components:
      - Annualized purchase cost (straight-line over 5 years)
      - Annual electricity cost
      - Annual maintenance cost

    Returns:
        dict: Itemized TCO breakdown.
    """
    annual_km = daily_distance_km * ANNUAL_OPERATING_DAYS

    annualized_purchase     = purchase_cost_usd / TCO_HORIZON_YEARS
    annual_electricity_cost = annual_km * energy_consumption_kwh_per_km * ELECTRICITY_COST_USD_PER_KWH
    annual_total_cost       = annualized_purchase + annual_electricity_cost + annual_maintenance_usd
    total_5yr_cost          = annual_total_cost * TCO_HORIZON_YEARS
    cost_per_km             = total_5yr_cost / (annual_km * TCO_HORIZON_YEARS) if annual_km > 0 else 0.0

    return {
        "annualized_purchase_usd":     round(annualized_purchase, 2),
        "annual_electricity_cost_usd": round(annual_electricity_cost, 2),
        "annual_maintenance_usd":      round(annual_maintenance_usd, 2),
        "annual_total_usd":            round(annual_total_cost, 2),
        "total_5yr_tco_usd":           round(total_5yr_cost, 2),
        "cost_per_km_usd":             round(cost_per_km, 4),
    }


# ---------------------------------------------------------------------------
# Suitability Score Sub-Components
# ---------------------------------------------------------------------------

def _score_range_margin(effective_range_km: float, daily_distance_km: float) -> float:
    """
    Scores how much range buffer the vehicle provides above daily need.
    25% buffer = 50pts baseline, 100%+ buffer = 100pts.
    """
    if daily_distance_km <= 0:
        return 100.0
    buffer_ratio = (effective_range_km - daily_distance_km) / daily_distance_km
    score = 50.0 + (buffer_ratio - 0.25) / (1.0 - 0.25) * 50.0
    return round(min(100.0, max(0.0, score)), 2)


def _score_tco_efficiency(tco_data: dict, all_tco_costs: list[float]) -> float:
    """
    Scores TCO relative to all feasible vehicles. Cheapest = 100, most expensive = 0.
    """
    if not all_tco_costs or max(all_tco_costs) == min(all_tco_costs):
        return 50.0
    cost = tco_data["total_5yr_tco_usd"]
    min_cost = min(all_tco_costs)
    max_cost = max(all_tco_costs)
    score = (1.0 - (cost - min_cost) / (max_cost - min_cost)) * 100.0
    return round(min(100.0, max(0.0, score)), 2)


def _score_charging_turnaround(
    charging_time_10_to_80_mins: float,
    available_charging_window_hours: float,
) -> float:
    """
    Scores how well the vehicle's charge time fits the available shift window.
    Within 50% of window = 100pts, exactly at limit = 50pts, over limit = 0pts.
    """
    available_minutes = available_charging_window_hours * 60.0
    if available_minutes <= 0:
        return 0.0
    ratio = charging_time_10_to_80_mins / available_minutes
    if ratio <= 0.5:
        return 100.0
    elif ratio <= 1.0:
        return round(100.0 - (ratio - 0.5) / 0.5 * 50.0, 2)
    else:
        overage = min(ratio - 1.0, 1.0)
        return round(max(0.0, 50.0 - overage * 50.0), 2)


def _score_battery_chemistry(chemistry: str) -> float:
    """
    Scores battery chemistry based on cycle life durability.
    Higher cycle life = higher score (LFP > NMC > NCA).
    """
    max_cycles = max(CHEMISTRY_CYCLE_LIFE.values())
    cycles = CHEMISTRY_CYCLE_LIFE.get(chemistry.upper(), 1000)
    return round((cycles / max_cycles) * 100.0, 2)


# ---------------------------------------------------------------------------
# Main Recommendation Function
# ---------------------------------------------------------------------------

def recommend_ev_vehicles(
    daily_distance_km: float,
    required_payload_kg: float,
    available_charging_window_hours: float,
    ambient_temp_celsius: float = 20.0,
    max_budget_usd: Optional[float] = None,
    top_n: int = 5,
    df: Optional[pd.DataFrame] = None,
) -> dict:
    """
    Main entry point: filters, scores, and ranks EV vehicles
    based on operational requirements.

    Args:
        daily_distance_km:               Required daily operational distance (km).
        required_payload_kg:             Minimum cargo payload required (kg).
        available_charging_window_hours: Available downtime for charging (hours).
        ambient_temp_celsius:            Operating environment temperature (C).
        max_budget_usd:                  Optional purchase price ceiling (USD).
        top_n:                           Number of top results to return.
        df:                              Optional pre-loaded EV catalog DataFrame.

    Returns:
        dict with recommendations, rejected vehicles, and input summary.
    """
    if df is None:
        df = load_ev_catalog()

    # Step 1: Hard constraint filtering
    passed_df, rejected = apply_hard_constraints(
        df=df,
        daily_distance_km=daily_distance_km,
        required_payload_kg=required_payload_kg,
        ambient_temp_celsius=ambient_temp_celsius,
        max_budget_usd=max_budget_usd,
    )

    if passed_df.empty:
        return {
            "recommendations":   [],
            "rejected_vehicles": rejected,
            "input_summary": {
                "daily_distance_km":               daily_distance_km,
                "required_payload_kg":             required_payload_kg,
                "ambient_temp_celsius":            ambient_temp_celsius,
                "available_charging_window_hours": available_charging_window_hours,
                "max_budget_usd":                  max_budget_usd,
            },
            "total_evaluated": len(df),
            "total_passed":    0,
            "total_rejected":  len(rejected),
            "message": "No vehicles passed the hard constraints for these requirements.",
        }

    # Step 2: Pre-compute TCO and effective range for all passing vehicles
    tco_list: list[dict] = []
    effective_ranges: list[float] = []

    for _, row in passed_df.iterrows():
        tco = calculate_5yr_tco(
            purchase_cost_usd=row["purchase_cost_usd"],
            annual_maintenance_usd=row["annual_maintenance_usd"],
            energy_consumption_kwh_per_km=row["energy_consumption_kwh_per_km"],
            daily_distance_km=daily_distance_km,
        )
        eff_range = calculate_effective_range(
            nominal_range_km=row["nominal_range_km"],
            ambient_temp_celsius=ambient_temp_celsius,
            payload_kg=required_payload_kg,
            max_payload_kg=row["max_payload_kg"],
        )
        tco_list.append(tco)
        effective_ranges.append(eff_range)

    all_tco_costs = [t["total_5yr_tco_usd"] for t in tco_list]

    # Step 3: Score each vehicle across all 4 dimensions
    scored_vehicles: list[dict] = []

    for i, (_, row) in enumerate(passed_df.iterrows()):
        tco_data   = tco_list[i]
        eff_range  = effective_ranges[i]

        s_range    = _score_range_margin(eff_range, daily_distance_km)
        s_tco      = _score_tco_efficiency(tco_data, all_tco_costs)
        s_charging = _score_charging_turnaround(
            row["charging_time_10_to_80_mins"],
            available_charging_window_hours,
        )
        s_chemistry = _score_battery_chemistry(row["battery_chemistry"])

        suitability_score = round(
            s_range     * SUITABILITY_WEIGHTS["range_margin"]         +
            s_tco       * SUITABILITY_WEIGHTS["tco_efficiency"]       +
            s_charging  * SUITABILITY_WEIGHTS["charging_turnaround"]  +
            s_chemistry * SUITABILITY_WEIGHTS["battery_chemistry"],
            2
        )

        scored_vehicles.append({
            "rank":                           0,
            "vehicle_id":                     row["vehicle_id"],
            "make":                           row["make"],
            "model":                          row["model"],
            "category":                       row["category"],
            "battery_chemistry":              row["battery_chemistry"],
            "battery_capacity_kwh":           row["battery_capacity_kwh"],
            "nominal_range_km":               row["nominal_range_km"],
            "effective_range_km":             eff_range,
            "daily_distance_km":              daily_distance_km,
            "range_buffer_pct":               round((eff_range - daily_distance_km) / daily_distance_km * 100, 1),
            "max_payload_kg":                 row["max_payload_kg"],
            "required_payload_kg":            required_payload_kg,
            "payload_margin_kg":              round(row["max_payload_kg"] - required_payload_kg, 1),
            "charging_time_10_to_80_mins":    row["charging_time_10_to_80_mins"],
            "available_window_hours":         available_charging_window_hours,
            "charging_window_utilization_pct": round(
                row["charging_time_10_to_80_mins"] / (available_charging_window_hours * 60) * 100, 1
            ),
            "purchase_cost_usd":              row["purchase_cost_usd"],
            "tco_breakdown":                  tco_data,
            "suitability_score":              suitability_score,
            "score_breakdown": {
                "range_margin":        {"score": s_range,     "weight": SUITABILITY_WEIGHTS["range_margin"],        "contribution": round(s_range * SUITABILITY_WEIGHTS["range_margin"], 2)},
                "tco_efficiency":      {"score": s_tco,       "weight": SUITABILITY_WEIGHTS["tco_efficiency"],      "contribution": round(s_tco * SUITABILITY_WEIGHTS["tco_efficiency"], 2)},
                "charging_turnaround": {"score": s_charging,  "weight": SUITABILITY_WEIGHTS["charging_turnaround"], "contribution": round(s_charging * SUITABILITY_WEIGHTS["charging_turnaround"], 2)},
                "battery_chemistry":   {"score": s_chemistry, "weight": SUITABILITY_WEIGHTS["battery_chemistry"],   "contribution": round(s_chemistry * SUITABILITY_WEIGHTS["battery_chemistry"], 2)},
            },
        })

    # Step 4: Sort by suitability score and assign ranks
    scored_vehicles.sort(key=lambda x: x["suitability_score"], reverse=True)
    for rank, vehicle in enumerate(scored_vehicles, start=1):
        vehicle["rank"] = rank

    return {
        "recommendations":   scored_vehicles[:top_n],
        "rejected_vehicles": rejected,
        "input_summary": {
            "daily_distance_km":               daily_distance_km,
            "required_payload_kg":             required_payload_kg,
            "ambient_temp_celsius":            ambient_temp_celsius,
            "available_charging_window_hours": available_charging_window_hours,
            "max_budget_usd":                  max_budget_usd,
            "temperature_degradation_factor":  get_temperature_degradation_factor(ambient_temp_celsius),
        },
        "total_evaluated": len(df),
        "total_passed":    len(passed_df),
        "total_rejected":  len(rejected),
    }


# ---------------------------------------------------------------------------
# Standalone Verification Test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 65)
    print("  EV Procurement Engine - Quick Verification")
    print("=" * 65)

    # Test 1: Urban delivery route
    print("\n[Test 1] Urban Delivery Route")
    print("  Route: 120 km/day | Payload: 1200 kg | Temp: 10C | Window: 4 hrs")
    print("-" * 65)
    result = recommend_ev_vehicles(
        daily_distance_km=120.0,
        required_payload_kg=1200.0,
        available_charging_window_hours=4.0,
        ambient_temp_celsius=10.0,
        top_n=3,
    )
    print(f"  Evaluated : {result['total_evaluated']} vehicles")
    print(f"  Passed    : {result['total_passed']} vehicles")
    print(f"  Rejected  : {result['total_rejected']} vehicles")
    print("\n  Top Recommendations:")
    for v in result["recommendations"]:
        print(
            f"  #{v['rank']} {v['make']} {v['model']:<30} "
            f"Score: {v['suitability_score']:>5}/100  "
            f"5yr TCO: ${v['tco_breakdown']['total_5yr_tco_usd']:>10,.0f}  "
            f"Range Buffer: +{v['range_buffer_pct']}%"
        )
    if result["rejected_vehicles"]:
        print("\n  Rejected:")
        for r in result["rejected_vehicles"]:
            print(f"  - {r['make']} {r['model']}: {r['rejected_reason']}")

    # Test 2: Heavy freight in cold weather
    print("\n[Test 2] Heavy Freight Route (Winter, -5C)")
    print("  Route: 200 km/day | Payload: 5000 kg | Temp: -5C | Window: 2 hrs")
    print("-" * 65)
    result2 = recommend_ev_vehicles(
        daily_distance_km=200.0,
        required_payload_kg=5000.0,
        available_charging_window_hours=2.0,
        ambient_temp_celsius=-5.0,
        top_n=3,
    )
    print(f"  Passed: {result2['total_passed']} vehicles")
    if result2["recommendations"]:
        for v in result2["recommendations"]:
            print(f"  #{v['rank']} {v['make']} {v['model']:<30} Score: {v['suitability_score']:>5}/100")
    else:
        print(f"  Result: {result2.get('message', 'No recommendations')}")

    # Test 3: Temperature degradation reference
    print("\n[Test 3] Temperature Degradation Reference")
    print("-" * 65)
    for temp in [-20, -5, 10, 25, 38, 45]:
        factor = get_temperature_degradation_factor(temp)
        bar = "#" * int(factor * 20)
        print(f"  {temp:>4}C -> {factor:.0%} range  {bar}")

    print("\n  EV Procurement Engine verification complete.")
