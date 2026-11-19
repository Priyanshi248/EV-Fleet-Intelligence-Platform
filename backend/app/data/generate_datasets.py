"""
Dataset Generator for EV Fleet Intelligence:
Generates realistic baseline datasets for:
1. Commercial EV Catalog (Specs, Battery, Range, Payload, Costs)
2. Battery Critical Raw Materials (Geopolitical concentration, Volatility, ESG)
3. Battery Cell & Material Suppliers (Capacity, Quality Defect Rate, Risk Scores)
"""

import os
import pandas as pd

# Ensure output directory exists
SEEDS_DIR = os.path.join(os.path.dirname(__file__), "seeds")
os.makedirs(SEEDS_DIR, exist_ok=True)


def generate_ev_catalog():
    """Generates specifications for commercial electric delivery vans and trucks."""
    data = [
        {
            "vehicle_id": "EV-001",
            "make": "Ford",
            "model": "E-Transit Cargo Van",
            "category": "Light Van",
            "battery_capacity_kwh": 68.0,
            "usable_battery_kwh": 64.0,
            "battery_chemistry": "NMC",
            "nominal_range_km": 203.0,
            "max_payload_kg": 1616.0,
            "cargo_volume_m3": 11.3,
            "charging_peak_kw_dc": 115.0,
            "charging_time_10_to_80_mins": 34.0,
            "energy_consumption_kwh_per_km": 0.33,
            "purchase_cost_usd": 53000.0,
            "annual_maintenance_usd": 1200.0,
            "warranty_years": 8,
        },
        {
            "vehicle_id": "EV-002",
            "make": "Rivian",
            "model": "Commercial Van 700",
            "category": "Light Van",
            "battery_capacity_kwh": 100.0,
            "usable_battery_kwh": 95.0,
            "battery_chemistry": "LFP",
            "nominal_range_km": 240.0,
            "max_payload_kg": 1250.0,
            "cargo_volume_m3": 18.7,
            "charging_peak_kw_dc": 150.0,
            "charging_time_10_to_80_mins": 45.0,
            "energy_consumption_kwh_per_km": 0.41,
            "purchase_cost_usd": 83000.0,
            "annual_maintenance_usd": 1100.0,
            "warranty_years": 8,
        },
        {
            "vehicle_id": "EV-003",
            "make": "BYD",
            "model": "T5 Urban Delivery",
            "category": "Medium Truck",
            "battery_capacity_kwh": 106.0,
            "usable_battery_kwh": 100.0,
            "battery_chemistry": "LFP",
            "nominal_range_km": 200.0,
            "max_payload_kg": 3100.0,
            "cargo_volume_m3": 18.0,
            "charging_peak_kw_dc": 120.0,
            "charging_time_10_to_80_mins": 40.0,
            "energy_consumption_kwh_per_km": 0.53,
            "purchase_cost_usd": 68000.0,
            "annual_maintenance_usd": 1400.0,
            "warranty_years": 6,
        },
        {
            "vehicle_id": "EV-004",
            "make": "Mercedes-Benz",
            "model": "eSprinter Van",
            "category": "Light Van",
            "battery_capacity_kwh": 81.0,
            "usable_battery_kwh": 76.0,
            "battery_chemistry": "LFP",
            "nominal_range_km": 250.0,
            "max_payload_kg": 1400.0,
            "cargo_volume_m3": 14.0,
            "charging_peak_kw_dc": 115.0,
            "charging_time_10_to_80_mins": 32.0,
            "energy_consumption_kwh_per_km": 0.32,
            "purchase_cost_usd": 71000.0,
            "annual_maintenance_usd": 1300.0,
            "warranty_years": 8,
        },
        {
            "vehicle_id": "EV-005",
            "make": "Volvo",
            "model": "FL Electric",
            "category": "Heavy Duty",
            "battery_capacity_kwh": 280.0,
            "usable_battery_kwh": 265.0,
            "battery_chemistry": "NMC",
            "nominal_range_km": 300.0,
            "max_payload_kg": 8500.0,
            "cargo_volume_m3": 40.0,
            "charging_peak_kw_dc": 150.0,
            "charging_time_10_to_80_mins": 90.0,
            "energy_consumption_kwh_per_km": 0.93,
            "purchase_cost_usd": 195000.0,
            "annual_maintenance_usd": 3200.0,
            "warranty_years": 5,
        },
        {
            "vehicle_id": "EV-006",
            "make": "Scania",
            "model": "25P Urban Hauler",
            "category": "Heavy Duty",
            "battery_capacity_kwh": 300.0,
            "usable_battery_kwh": 280.0,
            "battery_chemistry": "NMC",
            "nominal_range_km": 250.0,
            "max_payload_kg": 11000.0,
            "cargo_volume_m3": 52.0,
            "charging_peak_kw_dc": 130.0,
            "charging_time_10_to_80_mins": 100.0,
            "energy_consumption_kwh_per_km": 1.20,
            "purchase_cost_usd": 230000.0,
            "annual_maintenance_usd": 3800.0,
            "warranty_years": 5,
        },
    ]
    df = pd.DataFrame(data)
    filepath = os.path.join(SEEDS_DIR, "ev_catalog.csv")
    df.to_csv(filepath, index=False)
    print(f"Generated {len(df)} EV models -> {filepath}")


def generate_battery_materials():
    """Generates key battery raw materials data with market volatility & geopolitical risks."""
    data = [
        {
            "material_id": "MAT-LI",
            "name": "Lithium Hydroxide",
            "dominant_countries": "Australia, Chile, China",
            "top_country_share_pct": 79.0,
            "market_price_usd_per_kg": 18.5,
            "price_volatility_score": 82.0,
            "carbon_intensity_kg_co2_per_kg": 15.2,
            "criticality_tier": "Critical",
        },
        {
            "material_id": "MAT-CO",
            "name": "Refined Cobalt",
            "dominant_countries": "DR Congo, China",
            "top_country_share_pct": 74.0,
            "market_price_usd_per_kg": 32.0,
            "price_volatility_score": 88.0,
            "carbon_intensity_kg_co2_per_kg": 24.5,
            "criticality_tier": "Critical",
        },
        {
            "material_id": "MAT-NI",
            "name": "Class 1 Nickel",
            "dominant_countries": "Indonesia, Philippines, Russia",
            "top_country_share_pct": 62.0,
            "market_price_usd_per_kg": 16.8,
            "price_volatility_score": 65.0,
            "carbon_intensity_kg_co2_per_kg": 18.0,
            "criticality_tier": "High",
        },
        {
            "material_id": "MAT-GR",
            "name": "Natural Spherical Graphite",
            "dominant_countries": "China, Mozambique",
            "top_country_share_pct": 85.0,
            "market_price_usd_per_kg": 1.8,
            "price_volatility_score": 70.0,
            "carbon_intensity_kg_co2_per_kg": 8.4,
            "criticality_tier": "High",
        },
        {
            "material_id": "MAT-FE",
            "name": "Iron Phosphate (LFP Precursor)",
            "dominant_countries": "China, Morocco",
            "top_country_share_pct": 88.0,
            "market_price_usd_per_kg": 4.2,
            "price_volatility_score": 35.0,
            "carbon_intensity_kg_co2_per_kg": 4.1,
            "criticality_tier": "Moderate",
        },
    ]
    df = pd.DataFrame(data)
    filepath = os.path.join(SEEDS_DIR, "battery_materials.csv")
    df.to_csv(filepath, index=False)
    print(f"Generated {len(df)} battery materials -> {filepath}")


def generate_suppliers_risk():
    """Generates battery cell & raw material suppliers with multi-dimensional risk scores."""
    data = [
        {
            "supplier_id": "SUP-01",
            "supplier_name": "CATL",
            "headquarters_country": "China",
            "material_id": "MAT-LI",
            "annual_capacity_gwh": 180.0,
            "geopolitical_risk": 68.0,
            "price_volatility_risk": 45.0,
            "supplier_concentration_hhi": 78.0,
            "quality_defect_ppm": 12.0,
            "esg_sustainability_score": 72.0,
        },
        {
            "supplier_id": "SUP-02",
            "supplier_name": "LG Energy Solution",
            "headquarters_country": "South Korea",
            "material_id": "MAT-NI",
            "annual_capacity_gwh": 95.0,
            "geopolitical_risk": 30.0,
            "price_volatility_risk": 42.0,
            "supplier_concentration_hhi": 55.0,
            "quality_defect_ppm": 18.0,
            "esg_sustainability_score": 85.0,
        },
        {
            "supplier_id": "SUP-03",
            "supplier_name": "Panasonic Energy",
            "headquarters_country": "Japan",
            "material_id": "MAT-CO",
            "annual_capacity_gwh": 50.0,
            "geopolitical_risk": 25.0,
            "price_volatility_risk": 52.0,
            "supplier_concentration_hhi": 60.0,
            "quality_defect_ppm": 9.0,
            "esg_sustainability_score": 88.0,
        },
        {
            "supplier_id": "SUP-04",
            "supplier_name": "Albemarle",
            "headquarters_country": "USA",
            "material_id": "MAT-LI",
            "annual_capacity_gwh": 40.0,
            "geopolitical_risk": 15.0,
            "price_volatility_risk": 60.0,
            "supplier_concentration_hhi": 45.0,
            "quality_defect_ppm": 14.0,
            "esg_sustainability_score": 80.0,
        },
        {
            "supplier_id": "SUP-05",
            "supplier_name": "Glencore",
            "headquarters_country": "Switzerland/DRC",
            "material_id": "MAT-CO",
            "annual_capacity_gwh": 25.0,
            "geopolitical_risk": 82.0,
            "price_volatility_risk": 85.0,
            "supplier_concentration_hhi": 88.0,
            "quality_defect_ppm": 35.0,
            "esg_sustainability_score": 52.0,
        },
    ]
    df = pd.DataFrame(data)
    filepath = os.path.join(SEEDS_DIR, "suppliers_risk.csv")
    df.to_csv(filepath, index=False)
    print(f"Generated {len(df)} suppliers -> {filepath}")


if __name__ == "__main__":
    print("🚀 Starting synthetic dataset generation...")
    generate_ev_catalog()
    generate_battery_materials()
    generate_suppliers_risk()
    print("✅ All 3 seed datasets created successfully in backend/app/data/seeds/!")