
# EV Fleet Intelligence Platform — Database Design

## 1. Database configuration

- Database: PostgreSQL 16
- ORM: SQLAlchemy 2.x
- Migration tool: Alembic
- Primary key convention: integer `id`
- Timestamp convention: timezone-aware timestamps
- Missing optional values: SQL NULL
- Energy: kWh
- Distance: km
- Temperature: °C
- Battery voltage: V
- Battery current: A
- Emissions: kg CO2e
- Currency: INR

All tables are managed through Alembic migrations.
Do not create or alter application tables manually.

## 2. Entity relationships

- `vehicles` 1-to-many `telemetry_records`
- `vehicles` 1-to-many `charging_sessions`
- `vehicles` 1-to-many `battery_predictions`
- `vehicles` 1-to-many `maintenance_alerts`
- `ev_catalog` 1-to-many `procurement_recommendations`
- `suppliers` 1-to-many `supplier_risk_assessments`
- `battery_materials` 1-to-many `supplier_risk_assessments`

A vehicle's `id` is the shared identifier used by its telemetry,
charging, battery prediction and maintenance records.

## 3. Table definitions

### 3.1 vehicles

Purpose: registered fleet vehicles.

- `id`: integer, primary key
- `make`: string, required
- `model`: string, required
- `battery_capacity_kwh`: float, nullable, must be positive if present
- `range_km`: float, nullable, must be positive if present
- `status`: string, required, default `active`
- `created_at`: timezone-aware timestamp, required, database-generated

### 3.2 telemetry_records

Purpose: time-series measurements from each vehicle.

- `id`: integer, primary key
- `vehicle_id`: integer, required, foreign key to `vehicles.id`
- `recorded_at`: timezone-aware timestamp, required
- `battery_voltage_v`: float, nullable
- `battery_temperature_c`: float, nullable
- `battery_current_a`: float, nullable
- `state_of_charge_percent`: float, nullable
- `created_at`: timezone-aware timestamp, required, database-generated

### 3.3 charging_sessions

Purpose: vehicle charging history.

- `id`: integer, primary key
- `vehicle_id`: integer, required, foreign key to `vehicles.id`
- `started_at`: timezone-aware timestamp, required
- `ended_at`: timezone-aware timestamp, nullable
- `energy_charged_kwh`: float, required, non-negative
- `duration_minutes`: float, required, non-negative
- `created_at`: timezone-aware timestamp, required, database-generated

Constraint: if `ended_at` is present, it must not precede `started_at`.

### 3.4 battery_predictions

Purpose: historical battery-health model predictions.

- `id`: integer, primary key
- `vehicle_id`: integer, required, foreign key to `vehicles.id`
- `soh_percent`: float, nullable, 0–100
- `rul_cycles`: integer, nullable, non-negative
- `prediction_status`: string, required, default `completed`
- `model_version`: string, nullable
- `predicted_at`: timezone-aware timestamp, required, database-generated

SOH means State of Health.
RUL means Remaining Useful Life, measured in cycles for this model contract.

### 3.5 maintenance_alerts

Purpose: maintenance issues and their resolution status.

- `id`: integer, primary key
- `vehicle_id`: integer, required, foreign key to `vehicles.id`
- `alert_type`: string, required
- `severity`: string, required, default `medium`
- `description`: text, required
- `status`: string, required, default `open`
- `created_at`: timezone-aware timestamp, required, database-generated
- `resolved_at`: timezone-aware timestamp, nullable

### 3.6 ev_catalog

Purpose: electric vehicle options for procurement.

- `id`: integer, primary key
- `make`: string, required
- `model`: string, required
- `purchase_price_inr`: float, required, positive
- `usable_range_km`: float, required, positive
- `payload_kg`: float, required, non-negative
- `energy_consumption_kwh_per_km`: float, required, positive
- `charging_time_hours`: float, required, positive
- `data_source`: string, required, default `simulated`

### 3.7 procurement_recommendations

Purpose: saved procurement ranking results.

- `id`: integer, primary key
- `ev_id`: integer, required, foreign key to `ev_catalog.id`
- `score`: float, required
- `reasons`: JSON array, required, default empty array
- `status`: string, required, default `recommended`
- `created_at`: timezone-aware timestamp, required, database-generated

### 3.8 suppliers

Purpose: suppliers of battery materials.

- `id`: integer, primary key
- `name`: string, required, unique
- `origin_country`: string, required
- `data_source`: string, required, default `simulated`
- `created_at`: timezone-aware timestamp, required, database-generated

### 3.9 battery_materials

Purpose: materials used in battery supply chains.

- `id`: integer, primary key
- `name`: string, required, unique
- `origin_country`: string, nullable
- `price_indicator`: float, nullable
- `price_volatility_indicator`: float, nullable
- `sustainability_indicator`: float, nullable
- `data_source`: string, required, default `simulated`
- `created_at`: timezone-aware timestamp, required, database-generated

The units and scales for indicator fields must be documented
by the data owner before those values are compared.

### 3.10 supplier_risk_assessments

Purpose: risk evaluations for a supplier and material combination.

- `id`: integer, primary key
- `supplier_id`: integer, required, foreign key to `suppliers.id`
- `material_id`: integer, required, foreign key to `battery_materials.id`
- `risk_score`: float, required, 0–100
- `risk_level`: string, required
- `assessed_at`: timezone-aware timestamp, required, database-generated

### 3.11 net_zero_scenarios

Purpose: emissions reduction scenarios.

- `id`: integer, primary key
- `name`: string, required
- `baseline_emissions_kg_co2e`: float, required, non-negative
- `projected_emissions_kg_co2e`: float, required, non-negative
- `reduction_percent`: float, required, 0–100
- `assumptions`: JSON object, required, default empty object
- `created_at`: timezone-aware timestamp, required, database-generated

## 4. Indexes and constraints

- Primary keys uniquely identify every record.
- Vehicle-dependent tables reference `vehicles.id`.
- Procurement recommendations reference `ev_catalog.id`.
- Risk assessments reference supplier and material IDs.
- Frequently filtered foreign keys are indexed.
- Vehicle battery capacity and range must be positive when provided.
- Charging energy and duration cannot be negative.
- Battery SOH and risk scores must be between 0 and 100.
- Net-zero emission values cannot be negative.
- Net-zero reduction percentage must be between 0 and 100.

## 5. Data integrity and deletion

Vehicle-dependent records use cascading deletion in the current model.
Deleting a vehicle therefore deletes its associated telemetry, charging,
battery prediction and maintenance records.

Supplier risk assessments cascade when their supplier or material is deleted.
Procurement recommendations cascade when their EV catalogue entry is deleted.

These deletion rules must be reviewed by the team before production use.
For operational history, deactivation or soft deletion may be preferable.

## 6. Migration policy

- Alembic is the source of truth for schema changes.
- Review autogenerated migrations before applying them.
- Commit migration files to GitHub.
- Never commit `.env` or real database credentials.
- A fresh database must be reproducible using `alembic upgrade head`.

## 7. Known design decisions to confirm

- Agree on allowed vehicle status values.
- Agree on allowed maintenance severity and status values.
- Confirm indicator scales for supplier and material risk.
- Decide whether EV catalogue make/model pairs must be unique.
- Decide whether historical operational records should be retained
  rather than cascaded away.
- Confirm whether all numeric measurements need explicit bounds.
