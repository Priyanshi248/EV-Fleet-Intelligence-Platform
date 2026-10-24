
# Database Design

## 1. vehicles
- id: primary key
- make: required string
- model: required string
- battery_capacity_kwh: numeric
- range_km: numeric
- status: required string

## 2. telemetry_records
- id: primary key
- vehicle_id: foreign key -> vehicles.id
- recorded_at: timestamp with timezone
- battery_voltage_v: numeric, nullable
- battery_temperature_c: numeric, nullable

## 3. charging_sessions
- id: primary key
- vehicle_id: foreign key -> vehicles.id
- started_at: timestamp with timezone
- ended_at: timestamp with timezone, nullable
- energy_charged_kwh: numeric

## 4. battery_predictions
- id: primary key
- vehicle_id: foreign key -> vehicles.id
- soh_percent: numeric, nullable
- rul_cycles: integer, nullable
- predicted_at: timestamp with timezone
- model_version: string, nullable

## 5. maintenance_alerts
- id: primary key
- vehicle_id: foreign key -> vehicles.id
- severity: string
- description: string
- status: string
- created_at: timestamp with timezone

## 6. ev_catalog
- id: primary key
- make: string
- model: string
- purchase_price_inr: numeric
- usable_range_km: numeric
- payload_kg: numeric
- energy_consumption_kwh_per_km: numeric
- charging_time_hours: numeric

## 7. procurement_recommendations
- id: primary key
- ev_id: foreign key -> ev_catalog.id
- score: numeric
- reasons: JSON
- created_at: timestamp with timezone

## 8. suppliers
- id: primary key
- name: string
- origin_country: string

## 9. battery_materials
- id: primary key
- name: string
- price_indicator: numeric, nullable
- sustainability_indicator: numeric, nullable

## 10. supplier_risk_assessments
- id: primary key
- supplier_id: foreign key -> suppliers.id
- material_id: foreign key -> battery_materials.id
- risk_score: numeric
- risk_level: string
- assessed_at: timestamp with timezone

## 11. net_zero_scenarios
- id: primary key
- name: string
- baseline_emissions_kg_co2e: numeric
- projected_emissions_kg_co2e: numeric
- reduction_percent: numeric
- assumptions: JSON
