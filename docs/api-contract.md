
# EV Fleet Intelligence Platform — API Contract

## Base Configuration
- Local base URL: http://127.0.0.1:8000
- API prefix: /api
- Format: JSON
- Units: km, kWh, kW, INR, kg CO2e
- Missing optional values: null

## 1. Health
GET /health

Response:
- status: string

## 2. Fleet
GET /api/fleet/vehicles

Response:
- id: integer
- make: string
- model: string
- battery_capacity_kwh: number
- range_km: number
- status: string

## 3. Dashboard
GET /api/dashboard/summary

Response:
- total_vehicles: integer
- active_vehicles: integer
- maintenance_alerts: integer
- average_battery_soh_percent: number or null

## 4. Telemetry
GET /api/telemetry/{vehicle_id}

Response:
- vehicle_id: integer
- recorded_at: datetime
- battery_voltage_v: number or null
- battery_temperature_c: number or null

## 5. Charging
GET /api/charging/sessions

Response:
- session_id: integer
- vehicle_id: integer
- energy_charged_kwh: number
- duration_minutes: number

## 6. Battery
GET /api/battery/{vehicle_id}

Response:
- vehicle_id: integer
- soh_percent: number or null
- rul_cycles: integer or null
- prediction_status: string

## 7. Maintenance
GET /api/maintenance/alerts

Response:
- alert_id: integer
- vehicle_id: integer
- severity: string
- description: string
- status: string

## 8. Procurement
GET /api/procurement/recommendations

Response:
- vehicle_id: integer
- score: number
- reasons: array of strings

## 9. Supply Chain
GET /api/supply-chain/risks

Response:
- supplier_id: integer
- material: string
- risk_level: string
- risk_score: number

## 10. Net-Zero
GET /api/net-zero/scenarios

Response:
- scenario_id: integer
- name: string
- baseline_emissions_kg_co2e: number
- projected_emissions_kg_co2e: number
- reduction_percent: number

## 11. AI Assistant
POST /api/assistant/chat

Request:
- message: string

Response:
- answer: string
