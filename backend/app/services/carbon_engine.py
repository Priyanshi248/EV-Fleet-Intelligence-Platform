"""
carbon_engine.py
================
Net-Zero & Carbon Abatement Engine
for EV Fleet Intelligence Platform.

Calculates fleet electrification emissions reductions and sustainability
impact across five core calculations:

  1. Baseline diesel fleet annual CO2 emissions
  2. Replacement EV annual CO2 emissions (grid-adjusted)
  3. Net CO2 saved (tons/year) and percentage reduction
  4. Carbon Abatement Cost (USD per ton CO2 saved)
  5. Executive sustainability summary for a given fleet size
"""

import os
from typing import Optional

# ---------------------------------------------------------------------------
# Emission Constants
# ---------------------------------------------------------------------------

# CO2 emission factor for diesel combustion
DIESEL_CO2_KG_PER_LITRE: float = 2.68

# Default diesel consumption if not provided by user
DEFAULT_DIESEL_L_PER_100KM: float = 10.5

# Grid emission factors by region (kg CO2 per kWh of electricity consumed)
# Source: IEA World Energy Outlook 2023 / Our World in Data
GRID_EMISSION_FACTORS: dict[str, float] = {
    "global_average":   0.436,
    "europe_average":   0.276,
    "india":            0.708,
    "usa_average":      0.386,
    "china":            0.581,
    "australia":        0.510,
    "uk":               0.233,
    "germany":          0.350,
    "canada":           0.130,
    "norway":           0.028,
    "coal_heavy":       0.820,
    "renewable_100":    0.000,
}

# Cost assumptions
DIESEL_FUEL_COST_USD_PER_L: float   = 1.35
ELECTRICITY_COST_USD_PER_KWH: float = 0.12
ANNUAL_OPERATING_DAYS: int          = 250
TCO_HORIZON_YEARS: int              = 5

PARIS_AGREEMENT_NET_ZERO_YEAR: int  = 2050


# ---------------------------------------------------------------------------
# Diesel Baseline Calculations
# ---------------------------------------------------------------------------

def calculate_diesel_annual_emissions(
    annual_km: float,
    diesel_l_per_100km: float = DEFAULT_DIESEL_L_PER_100KM,
) -> dict:
    """
    Calculates the annual CO2 emissions of a single diesel vehicle.

    Formula:
        CO2 (kg/year) = Annual_km * (Diesel_L_per_100km / 100) * 2.68 kg/L

    Args:
        annual_km:           Total kilometres driven per year.
        diesel_l_per_100km:  Fuel consumption in litres per 100 km.

    Returns:
        dict: Annual fuel consumption and CO2 emissions in kg and tonnes.
    """
    annual_litres_consumed = annual_km * (diesel_l_per_100km / 100.0)
    annual_co2_kg          = annual_litres_consumed * DIESEL_CO2_KG_PER_LITRE
    annual_co2_tonnes      = annual_co2_kg / 1000.0

    return {
        "annual_km":              round(annual_km, 1),
        "diesel_l_per_100km":     diesel_l_per_100km,
        "annual_litres_consumed": round(annual_litres_consumed, 2),
        "annual_co2_kg":          round(annual_co2_kg, 2),
        "annual_co2_tonnes":      round(annual_co2_tonnes, 4),
        "annual_fuel_cost_usd":   round(annual_litres_consumed * DIESEL_FUEL_COST_USD_PER_L, 2),
    }


def calculate_diesel_fleet_emissions(
    daily_distance_km: float,
    diesel_l_per_100km: float,
    fleet_size: int,
) -> dict:
    """
    Calculates total annual CO2 emissions for the entire diesel fleet.

    Args:
        daily_distance_km:   Average daily distance per vehicle (km).
        diesel_l_per_100km:  Fuel consumption per vehicle (L/100 km).
        fleet_size:          Number of diesel vehicles in the fleet.

    Returns:
        dict: Fleet-level emissions and fuel costs.
    """
    annual_km_per_vehicle = daily_distance_km * ANNUAL_OPERATING_DAYS
    per_vehicle           = calculate_diesel_annual_emissions(annual_km_per_vehicle, diesel_l_per_100km)

    return {
        "fleet_size":                  fleet_size,
        "annual_km_per_vehicle":       per_vehicle["annual_km"],
        "diesel_l_per_100km":          diesel_l_per_100km,
        "per_vehicle_co2_tonnes":      per_vehicle["annual_co2_tonnes"],
        "fleet_total_co2_tonnes":      round(per_vehicle["annual_co2_tonnes"] * fleet_size, 4),
        "per_vehicle_fuel_cost_usd":   per_vehicle["annual_fuel_cost_usd"],
        "fleet_total_fuel_cost_usd":   round(per_vehicle["annual_fuel_cost_usd"] * fleet_size, 2),
        "fleet_total_litres_consumed": round(per_vehicle["annual_litres_consumed"] * fleet_size, 2),
    }


# ---------------------------------------------------------------------------
# EV Replacement Calculations
# ---------------------------------------------------------------------------

def calculate_ev_annual_emissions(
    annual_km: float,
    ev_kwh_per_km: float,
    grid_region: str = "global_average",
    custom_grid_factor: Optional[float] = None,
) -> dict:
    """
    Calculates annual CO2 emissions of a single EV, adjusted for
    the electricity grid's carbon intensity.

    Formula:
        CO2 (kg/year) = Annual_km * EV_kWh_per_km * Grid_factor (kg CO2/kWh)

    Args:
        annual_km:           Total kilometres driven per year.
        ev_kwh_per_km:       Vehicle energy consumption (kWh/km).
        grid_region:         Region key from GRID_EMISSION_FACTORS.
        custom_grid_factor:  Override with a custom kg CO2/kWh value (optional).

    Returns:
        dict: Annual electricity consumption and CO2 emissions.
    """
    if custom_grid_factor is not None:
        grid_factor  = custom_grid_factor
        region_label = f"Custom ({custom_grid_factor} kg/kWh)"
    elif grid_region in GRID_EMISSION_FACTORS:
        grid_factor  = GRID_EMISSION_FACTORS[grid_region]
        region_label = grid_region
    else:
        available = ", ".join(GRID_EMISSION_FACTORS.keys())
        raise ValueError(
            f"Unknown grid region: '{grid_region}'. "
            f"Available options: {available}"
        )

    annual_kwh_consumed = annual_km * ev_kwh_per_km
    annual_co2_kg       = annual_kwh_consumed * grid_factor
    annual_co2_tonnes   = annual_co2_kg / 1000.0

    return {
        "annual_km":                       round(annual_km, 1),
        "ev_kwh_per_km":                   ev_kwh_per_km,
        "grid_region":                     region_label,
        "grid_emission_factor_kg_per_kwh": grid_factor,
        "annual_kwh_consumed":             round(annual_kwh_consumed, 2),
        "annual_co2_kg":                   round(annual_co2_kg, 2),
        "annual_co2_tonnes":               round(annual_co2_tonnes, 4),
        "annual_electricity_cost_usd":     round(annual_kwh_consumed * ELECTRICITY_COST_USD_PER_KWH, 2),
    }


# ---------------------------------------------------------------------------
# Net CO2 Abatement
# ---------------------------------------------------------------------------

def calculate_net_co2_saved(
    diesel_emissions: dict,
    ev_emissions: dict,
) -> dict:
    """
    Calculates the net annual CO2 reduction from replacing one
    diesel vehicle with an EV.

    Args:
        diesel_emissions: Output from calculate_diesel_annual_emissions().
        ev_emissions:     Output from calculate_ev_annual_emissions().

    Returns:
        dict: Net CO2 saved in kg, tonnes, percentage reduction,
              and tangible equivalents.
    """
    baseline_kg   = diesel_emissions["annual_co2_kg"]
    ev_kg         = ev_emissions["annual_co2_kg"]
    net_saved_kg  = baseline_kg - ev_kg
    net_saved_t   = net_saved_kg / 1000.0
    pct_reduction = (net_saved_kg / baseline_kg * 100.0) if baseline_kg > 0 else 0.0

    if pct_reduction >= 80:
        impact_label = "Transformational"
    elif pct_reduction >= 50:
        impact_label = "High Impact"
    elif pct_reduction >= 25:
        impact_label = "Moderate Impact"
    elif pct_reduction > 0:
        impact_label = "Low Impact"
    else:
        impact_label = "No Benefit (grid too carbon-intensive)"

    return {
        "baseline_co2_kg":            round(baseline_kg, 2),
        "ev_co2_kg":                  round(ev_kg, 2),
        "net_co2_saved_kg":           round(net_saved_kg, 2),
        "net_co2_saved_tonnes":       round(net_saved_t, 4),
        "percentage_reduction":       round(pct_reduction, 2),
        "impact_label":               impact_label,
        "equivalent_trees_planted":   round(net_saved_kg / 21.77, 0),
        "equivalent_flights_avoided": round(net_saved_kg / 255.0, 1),
    }


# ---------------------------------------------------------------------------
# Carbon Abatement Cost
# ---------------------------------------------------------------------------

def calculate_carbon_abatement_cost(
    ev_purchase_cost_usd: float,
    ev_annual_maintenance_usd: float,
    ev_kwh_per_km: float,
    diesel_l_per_100km: float,
    daily_distance_km: float,
    annual_co2_saved_tonnes: float,
) -> dict:
    """
    Calculates Carbon Abatement Cost (CAC):
    How much extra it costs (or saves) per tonne of CO2 avoided.

    Formula:
        CAC ($/tonne) = (EV Annualized TCO - Diesel Annualized TCO)
                        / Annual CO2 Saved (tonnes)

    A NEGATIVE CAC means electrification saves money AND reduces emissions.
    A POSITIVE CAC means there is a cost premium per tonne of CO2 saved.

    Returns:
        dict: Annualized TCO comparison and carbon abatement cost.
    """
    annual_km = daily_distance_km * ANNUAL_OPERATING_DAYS

    # EV annualized costs
    ev_annualized_purchase = ev_purchase_cost_usd / TCO_HORIZON_YEARS
    ev_annual_electricity  = annual_km * ev_kwh_per_km * ELECTRICITY_COST_USD_PER_KWH
    ev_annual_tco          = ev_annualized_purchase + ev_annual_electricity + ev_annual_maintenance_usd

    # Diesel annualized costs
    diesel_annual_fuel        = annual_km * (diesel_l_per_100km / 100.0) * DIESEL_FUEL_COST_USD_PER_L
    diesel_annual_maintenance = 2800.0    # Typical ICE commercial vehicle annual maintenance (USD)
    diesel_annual_tco         = diesel_annual_fuel + diesel_annual_maintenance

    # CAC calculation
    tco_delta = ev_annual_tco - diesel_annual_tco
    cac        = tco_delta / annual_co2_saved_tonnes if annual_co2_saved_tonnes > 0 else float("inf")

    if cac < 0:
        cac_verdict = "Cost-Saving: EV is CHEAPER to operate AND cleaner"
    elif cac <= 50:
        cac_verdict = "Very Attractive: low premium per tonne CO2 saved"
    elif cac <= 150:
        cac_verdict = "Acceptable: within typical carbon market price range"
    elif cac <= 300:
        cac_verdict = "Moderate: consider subsidies or incentives to close gap"
    else:
        cac_verdict = "High: electrification costly — reassess route or vehicle choice"

    return {
        "ev_annual_tco_usd":                   round(ev_annual_tco, 2),
        "diesel_annual_tco_usd":               round(diesel_annual_tco, 2),
        "annual_tco_delta_usd":                round(tco_delta, 2),
        "annual_co2_saved_tonnes":             round(annual_co2_saved_tonnes, 4),
        "carbon_abatement_cost_usd_per_tonne": round(cac, 2),
        "cac_verdict":                         cac_verdict,
        "ev_annual_electricity_usd":           round(ev_annual_electricity, 2),
        "diesel_annual_fuel_usd":              round(diesel_annual_fuel, 2),
    }


# ---------------------------------------------------------------------------
# Executive Fleet Sustainability Summary
# ---------------------------------------------------------------------------

def generate_fleet_sustainability_summary(
    daily_distance_km: float,
    diesel_l_per_100km: float,
    ev_kwh_per_km: float,
    ev_purchase_cost_usd: float,
    ev_annual_maintenance_usd: float,
    fleet_size: int,
    grid_region: str = "global_average",
    custom_grid_factor: Optional[float] = None,
    target_replacement_pct: float = 100.0,
) -> dict:
    """
    Generates a complete executive sustainability report for a fleet
    electrification scenario.

    Args:
        daily_distance_km:          Average daily distance per vehicle (km).
        diesel_l_per_100km:         Diesel consumption per vehicle (L/100 km).
        ev_kwh_per_km:              Replacement EV energy consumption (kWh/km).
        ev_purchase_cost_usd:       Replacement EV purchase price (USD).
        ev_annual_maintenance_usd:  Replacement EV annual maintenance (USD).
        fleet_size:                 Total number of diesel vehicles in the fleet.
        grid_region:                Electricity grid region for emission factor.
        custom_grid_factor:         Optional override for grid kg CO2/kWh.
        target_replacement_pct:     Percentage of fleet to electrify (default 100%).

    Returns:
        dict: Complete executive sustainability summary.
    """
    annual_km_per_vehicle = daily_distance_km * ANNUAL_OPERATING_DAYS
    vehicles_to_replace   = max(1, round(fleet_size * target_replacement_pct / 100.0))

    # Per-vehicle calculations
    diesel_per_vehicle = calculate_diesel_annual_emissions(
        annual_km=annual_km_per_vehicle,
        diesel_l_per_100km=diesel_l_per_100km,
    )
    ev_per_vehicle = calculate_ev_annual_emissions(
        annual_km=annual_km_per_vehicle,
        ev_kwh_per_km=ev_kwh_per_km,
        grid_region=grid_region,
        custom_grid_factor=custom_grid_factor,
    )
    net_per_vehicle = calculate_net_co2_saved(diesel_per_vehicle, ev_per_vehicle)

    # Carbon Abatement Cost
    cac_data = calculate_carbon_abatement_cost(
        ev_purchase_cost_usd=ev_purchase_cost_usd,
        ev_annual_maintenance_usd=ev_annual_maintenance_usd,
        ev_kwh_per_km=ev_kwh_per_km,
        diesel_l_per_100km=diesel_l_per_100km,
        daily_distance_km=daily_distance_km,
        annual_co2_saved_tonnes=net_per_vehicle["net_co2_saved_tonnes"],
    )

    # Fleet-level totals
    fleet_diesel_co2_total = diesel_per_vehicle["annual_co2_tonnes"] * fleet_size
    fleet_ev_co2_total     = ev_per_vehicle["annual_co2_tonnes"] * vehicles_to_replace
    fleet_remaining_diesel = diesel_per_vehicle["annual_co2_tonnes"] * (fleet_size - vehicles_to_replace)
    fleet_net_co2_saved    = net_per_vehicle["net_co2_saved_tonnes"] * vehicles_to_replace
    fleet_pct_reduction    = (fleet_net_co2_saved / fleet_diesel_co2_total * 100.0) if fleet_diesel_co2_total > 0 else 0.0

    annual_opex_saving = (
        diesel_per_vehicle["annual_fuel_cost_usd"] -
        ev_per_vehicle["annual_electricity_cost_usd"]
    ) * vehicles_to_replace

    total_ev_investment      = ev_purchase_cost_usd * vehicles_to_replace
    investment_payback_years = total_ev_investment / annual_opex_saving if annual_opex_saving > 0 else float("inf")

    # Tangible equivalents
    trees_equivalent  = round(fleet_net_co2_saved * 1000 / 21.77, 0)
    flights_avoided   = round(fleet_net_co2_saved * 1000 / 255.0, 0)
    homes_powered_days = round(fleet_net_co2_saved * 1000 / (3.5 / 365), 0)

    # Net-zero status
    if fleet_pct_reduction >= 100:
        netzero_status = "Fleet is Net-Zero for operational emissions"
    elif fleet_pct_reduction >= 80:
        netzero_status = "On track for Net-Zero - replace remaining diesel vehicles"
    elif fleet_pct_reduction >= 50:
        netzero_status = "Significant progress - accelerate electrification to meet 2050 target"
    else:
        netzero_status = "Early stage - prioritise high-mileage vehicles for replacement first"

    return {
        "scenario": {
            "fleet_size":             fleet_size,
            "vehicles_to_replace":    vehicles_to_replace,
            "target_replacement_pct": target_replacement_pct,
            "daily_distance_km":      daily_distance_km,
            "annual_km_per_vehicle":  annual_km_per_vehicle,
            "grid_region":            ev_per_vehicle["grid_region"],
            "grid_emission_factor":   ev_per_vehicle["grid_emission_factor_kg_per_kwh"],
        },
        "per_vehicle": {
            "diesel_annual_co2_tonnes": diesel_per_vehicle["annual_co2_tonnes"],
            "ev_annual_co2_tonnes":     ev_per_vehicle["annual_co2_tonnes"],
            "co2_saved_tonnes":         net_per_vehicle["net_co2_saved_tonnes"],
            "pct_reduction":            net_per_vehicle["percentage_reduction"],
            "impact_label":             net_per_vehicle["impact_label"],
            "diesel_fuel_cost_usd":     diesel_per_vehicle["annual_fuel_cost_usd"],
            "ev_electricity_cost_usd":  ev_per_vehicle["annual_electricity_cost_usd"],
            "annual_opex_saving_usd":   round(
                diesel_per_vehicle["annual_fuel_cost_usd"] -
                ev_per_vehicle["annual_electricity_cost_usd"], 2
            ),
        },
        "fleet_totals": {
            "current_diesel_co2_tonnes_yr":  round(fleet_diesel_co2_total, 2),
            "post_ev_total_co2_tonnes_yr":   round(fleet_ev_co2_total + fleet_remaining_diesel, 2),
            "fleet_net_co2_saved_tonnes_yr": round(fleet_net_co2_saved, 2),
            "fleet_co2_reduction_pct":       round(fleet_pct_reduction, 2),
            "total_ev_investment_usd":        round(total_ev_investment, 2),
            "annual_fuel_opex_saving_usd":   round(annual_opex_saving, 2),
            "investment_payback_years":       round(investment_payback_years, 1),
        },
        "carbon_economics": {
            "carbon_abatement_cost_usd_per_tonne": cac_data["carbon_abatement_cost_usd_per_tonne"],
            "cac_verdict":                         cac_data["cac_verdict"],
            "ev_annual_tco_usd":                   cac_data["ev_annual_tco_usd"],
            "diesel_annual_tco_usd":               cac_data["diesel_annual_tco_usd"],
            "annual_tco_delta_usd":                cac_data["annual_tco_delta_usd"],
        },
        "environmental_equivalents": {
            "trees_planted_equivalent": int(trees_equivalent),
            "short_flights_avoided":    int(flights_avoided),
            "homes_powered_days":       int(homes_powered_days),
        },
        "net_zero_assessment": {
            "status":                      netzero_status,
            "current_fleet_reduction_pct": round(fleet_pct_reduction, 2),
            "remaining_gap_to_100pct":     round(max(0, 100 - fleet_pct_reduction), 2),
            "paris_target_year":           PARIS_AGREEMENT_NET_ZERO_YEAR,
        },
    }


# ---------------------------------------------------------------------------
# Grid Region Helper
# ---------------------------------------------------------------------------

def list_available_grid_regions() -> dict[str, float]:
    """
    Returns all available electricity grid regions and their
    emission factors (kg CO2/kWh).
    """
    return GRID_EMISSION_FACTORS.copy()


# ---------------------------------------------------------------------------
# Standalone Verification Test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 70)
    print("  Carbon Abatement Engine - Quick Verification")
    print("=" * 70)

    annual_km = 120 * ANNUAL_OPERATING_DAYS   # 120 km/day x 250 days

    # Test 1: Single vehicle comparison
    print("\n[Test 1] Single Vehicle: Diesel vs EV (Global Average Grid)")
    print("-" * 70)
    diesel_em = calculate_diesel_annual_emissions(annual_km, diesel_l_per_100km=10.5)
    ev_em     = calculate_ev_annual_emissions(annual_km, ev_kwh_per_km=0.33, grid_region="global_average")
    net       = calculate_net_co2_saved(diesel_em, ev_em)

    print(f"  Annual km              : {annual_km:,} km")
    print(f"  Diesel CO2             : {diesel_em['annual_co2_tonnes']:.2f} tonnes/year")
    print(f"  EV CO2 (global grid)   : {ev_em['annual_co2_tonnes']:.2f} tonnes/year")
    print(f"  Net CO2 Saved          : {net['net_co2_saved_tonnes']:.2f} tonnes/year")
    print(f"  Reduction              : {net['percentage_reduction']:.1f}%")
    print(f"  Impact Label           : {net['impact_label']}")
    print(f"  Trees Equivalent       : {int(net['equivalent_trees_planted']):,} trees/year")
    print(f"  Flights Avoided        : {net['equivalent_flights_avoided']:.0f} short-haul flights")

    # Test 2: Grid region comparison
    print("\n[Test 2] Same EV, Different Electricity Grids")
    print("-" * 70)
    print(f"  {'Region':<20} {'Factor':>8}  {'EV CO2 t/yr':>12}  {'Reduction':>10}")
    print(f"  {'-'*20} {'-'*8}  {'-'*12}  {'-'*10}")
    for region in ["norway", "europe_average", "usa_average", "india", "coal_heavy"]:
        ev_r  = calculate_ev_annual_emissions(annual_km, 0.33, grid_region=region)
        net_r = calculate_net_co2_saved(diesel_em, ev_r)
        print(
            f"  {region:<20} {ev_r['grid_emission_factor_kg_per_kwh']:>8.3f}  "
            f"{ev_r['annual_co2_tonnes']:>12.2f}  "
            f"{net_r['percentage_reduction']:>9.1f}%"
        )

    # Test 3: Carbon Abatement Cost
    print("\n[Test 3] Carbon Abatement Cost Analysis")
    print("-" * 70)
    cac = calculate_carbon_abatement_cost(
        ev_purchase_cost_usd=71000.0,
        ev_annual_maintenance_usd=1300.0,
        ev_kwh_per_km=0.33,
        diesel_l_per_100km=10.5,
        daily_distance_km=120.0,
        annual_co2_saved_tonnes=net["net_co2_saved_tonnes"],
    )
    print(f"  EV Annual TCO          : ${cac['ev_annual_tco_usd']:>10,.2f}")
    print(f"  Diesel Annual TCO      : ${cac['diesel_annual_tco_usd']:>10,.2f}")
    print(f"  Annual TCO Delta       : ${cac['annual_tco_delta_usd']:>10,.2f}")
    print(f"  CO2 Saved              :  {cac['annual_co2_saved_tonnes']:.2f} tonnes/year")
    print(f"  Abatement Cost         : ${cac['carbon_abatement_cost_usd_per_tonne']:>10,.2f} / tonne CO2")
    print(f"  Verdict                :  {cac['cac_verdict']}")

    # Test 4: Full fleet summary
    print("\n[Test 4] Executive Fleet Summary (20-vehicle fleet, Europe grid)")
    print("-" * 70)
    summary = generate_fleet_sustainability_summary(
        daily_distance_km=120.0,
        diesel_l_per_100km=10.5,
        ev_kwh_per_km=0.33,
        ev_purchase_cost_usd=71000.0,
        ev_annual_maintenance_usd=1300.0,
        fleet_size=20,
        grid_region="europe_average",
        target_replacement_pct=100.0,
    )
    s = summary
    print(f"  Fleet Size             : {s['scenario']['fleet_size']} vehicles")
    print(f"  Grid Region            : {s['scenario']['grid_region']}")
    print(f"  Diesel Fleet CO2/yr    : {s['fleet_totals']['current_diesel_co2_tonnes_yr']:.1f} tonnes")
    print(f"  Post-EV CO2/yr         : {s['fleet_totals']['post_ev_total_co2_tonnes_yr']:.1f} tonnes")
    print(f"  Fleet CO2 Saved/yr     : {s['fleet_totals']['fleet_net_co2_saved_tonnes_yr']:.1f} tonnes")
    print(f"  Fleet CO2 Reduction    : {s['fleet_totals']['fleet_co2_reduction_pct']:.1f}%")
    print(f"  Total EV Investment    : ${s['fleet_totals']['total_ev_investment_usd']:,.0f}")
    print(f"  Annual Fuel Saving     : ${s['fleet_totals']['annual_fuel_opex_saving_usd']:,.0f}")
    print(f"  Payback Period         : {s['fleet_totals']['investment_payback_years']} years")
    print(f"  Abatement Cost         : ${s['carbon_economics']['carbon_abatement_cost_usd_per_tonne']:.2f}/tonne")
    print(f"  Trees Equivalent       : {s['environmental_equivalents']['trees_planted_equivalent']:,} trees")
    print(f"  Net-Zero Status        : {s['net_zero_assessment']['status']}")

    # Test 5: Grid regions reference
    print("\n[Test 5] Available Grid Regions (kg CO2/kWh)")
    print("-" * 70)
    for region, factor in list_available_grid_regions().items():
        bar = "#" * int(factor * 20)
        print(f"  {region:<20} {factor:.3f}  {bar}")

    print("\n  Carbon Abatement Engine verification complete.")
