
# EV Fleet Intelligence Platform — API Contract

## 1. General conventions

- Base URL: `http://127.0.0.1:8000`
- API prefix: `/api/v1` for versioned application endpoints
- Health endpoint: `/health`
- Format: JSON
- IDs: integer primary keys
- Timestamps: ISO 8601 with timezone
- Distance: km
- Energy: kWh
- Power: kW
- Battery voltage: V
- Battery current: A
- Battery temperature: °C
- Battery SOH: percent, 0–100
- RUL: remaining useful life in cycles
- Purchase price: INR
- Payload: kg
- Emissions: kg CO2e
- Optional fields: `null` when unavailable
- Lists: JSON arrays
- Errors: JSON with `detail` describing the error

## 2. Health

### GET /health

Response:
- `status`: string
- `message`: string

Success example:

{
  "status": "ok",
  "message": "Backend is running"
}

## 3. Dashboard


### GET /api/v1/dashboard/summary

**Description:** Returns aggregated fleet, charging, battery, maintenance, and sustainability metrics based on stored database records.

**Authentication:** Not required (current implementation).

**Request parameters:** None.

**Success Response: 200 OK**

```json
{
  "total_vehicles": 3,
  "vehicle_status_counts": {
    "active": 1,
    "charging": 1,
    "maintenance": 1
  },
  "total_energy_charged_kwh": 75,
  "battery": {
    "status": "available",
    "total_predictions": 3,
    "vehicles_with_predictions": 3,
    "average_soh_percent": 88,
    "average_rul_cycles": 700
  },
  "maintenance": {
    "status": "available",
    "total_alerts": 2,
    "severity_counts": {
      "medium": 1,
      "high": 1
    },
    "status_counts": {
      "open": 2
    }
  },
  "sustainability": {
    "status": "available",
    "total_scenarios": 3,
    "average_baseline_emissions_kg_co2e": 100000,
    "average_projected_emissions_kg_co2e": 70000,
    "average_reduction_percent": 30
  }
}
```

**Response field definitions:**

| Field | Type | Description |
|---|---|---|
| total_vehicles | integer | Total number of registered vehicles |
| vehicle_status_counts | object | Number of vehicles grouped by status |
| total_energy_charged_kwh | number or null | Total energy charged, in kWh |
| battery.status | string | Battery data availability |
| battery.total_predictions | integer or null | Total battery prediction records |
| battery.vehicles_with_predictions | integer or null | Distinct vehicles with predictions |
| battery.average_soh_percent | number or null | Average state of health (%) |
| battery.average_rul_cycles | number or null | Average remaining useful life (cycles) |
| maintenance.status | string | Maintenance data availability |
| maintenance.total_alerts | integer or null | Total maintenance alerts |
| maintenance.severity_counts | object | Alert counts grouped by severity |
| maintenance.status_counts | object | Alert counts grouped by status |
| sustainability.status | string | Sustainability data availability |
| sustainability.total_scenarios | integer or null | Number of net-zero scenarios |
| sustainability.average_baseline_emissions_kg_co2e | number or null | Average baseline emissions (kg CO2e) |
| sustainability.average_projected_emissions_kg_co2e | number or null | Average projected emissions (kg CO2e) |
| sustainability.average_reduction_percent | number or null | Average scenario reduction percentage |

**Availability status values:**
- `available`: Records exist and metrics are calculated.
- `no_data`: The table exists but contains no records. Metrics are null where applicable, and count breakdowns are empty objects.
- `unavailable`: The module or data source is not integrated.

**Notes:**
- Dashboard metrics are calculated from PostgreSQL records.
- Battery averages use non-null prediction values.
- Vehicles with predictions are counted distinctly.
- Sustainability metrics are averages across scenarios, not total fleet emissions.
- Energy charged is measured in kWh.

If no charging data is available, `total_energy_charged_kwh` is `null`.

## 4. Fleet

Query parameters:
- `status`: string, optional
- `search`: string, optional

Returns registered fleet vehicles.

Response: array of:
- `id`: integer
- `make`: string
- `model`: string
- `battery_capacity_kwh`: number or null
- `range_km`: number or null
- `status`: string
- `created_at`: datetime

### GET /api/v1/fleet/vehicles/{vehicle_id}

Returns one vehicle by ID.

Response: one vehicle object with the fields listed above.

## 5. Telemetry

### GET /api/v1/fleet/vehicles/{vehicle_id}/telemetry
- `limit`: integer, default 100, minimum 1, maximum 500
Returns telemetry records for a vehicle.

Response: array of:
- `id`: integer
- `vehicle_id`: integer
- `recorded_at`: datetime
- `battery_voltage_v`: number or null
- `battery_temperature_c`: number or null
- `battery_current_a`: number or null
- `state_of_charge_percent`: number or null

Query parameters:
- `limit`: integer, default 50, maximum 200
- `offset`: integer, default 0

The `vehicle_id` must reference an existing vehicle.

## 6. Charging

### GET /api/v1/fleet/vehicles/{vehicle_id}/charging-sessions
- `limit`: integer, default 100, minimum 1, maximum 500

Returns charging sessions.

Response: array of:
- `id`: integer
- `vehicle_id`: integer
- `started_at`: datetime
- `ended_at`: datetime or null
- `energy_charged_kwh`: number
- `duration_minutes`: number

Query parameters:
- `vehicle_id`: integer, optional
- `limit`: integer, default 50, maximum 200
- `offset`: integer, default 0

## 7. Battery

### GET /api/battery/{vehicle_id}

Returns the latest battery prediction for a vehicle.

Response:
- `vehicle_id`: integer
- `soh_percent`: number or null
- `rul_cycles`: integer or null
- `prediction_status`: string
- `model_version`: string or null
- `predicted_at`: datetime

If no prediction exists, return HTTP 404 or a documented empty result.

## 8. Maintenance

### GET /api/maintenance/alerts

Returns maintenance alerts.

Response: array of:
- `id`: integer
- `vehicle_id`: integer
- `alert_type`: string
- `severity`: string
- `description`: string
- `status`: string
- `created_at`: datetime
- `resolved_at`: datetime or null

Query parameters:
- `vehicle_id`: integer, optional
- `status`: string, optional
- `severity`: string, optional

## 9. Procurement

### GET /api/procurement/catalog

Returns available EV catalogue entries.

Response: array of:
- `id`: integer
- `make`: string
- `model`: string
- `purchase_price_inr`: number
- `usable_range_km`: number
- `payload_kg`: number
- `energy_consumption_kwh_per_km`: number
- `charging_time_hours`: number
- `data_source`: string

### GET /api/procurement/recommendations

Returns saved procurement recommendations.

Response: array of:
- `id`: integer
- `ev_id`: integer
- `score`: number
- `reasons`: array
- `status`: string
- `created_at`: datetime

## 10. Supply chain

### GET /api/supply-chain/suppliers

Returns suppliers.

Response: array of:
- `id`: integer
- `name`: string
- `origin_country`: string
- `data_source`: string
- `created_at`: datetime

### GET /api/supply-chain/materials

Returns battery materials.

Response: array of:
- `id`: integer
- `name`: string
- `origin_country`: string or null
- `price_indicator`: number or null
- `price_volatility_indicator`: number or null
- `sustainability_indicator`: number or null
- `data_source`: string

### GET /api/supply-chain/risks

Returns supplier risk assessments.

Response: array of:
- `id`: integer
- `supplier_id`: integer
- `material_id`: integer
- `risk_score`: number, 0–100
- `risk_level`: string
- `assessed_at`: datetime

## 11. Net-zero

### GET /api/net-zero/scenarios

Returns emissions scenarios.

Response: array of:
- `id`: integer
- `name`: string
- `baseline_emissions_kg_co2e`: number
- `projected_emissions_kg_co2e`: number
- `reduction_percent`: number, 0–100
- `assumptions`: object
- `created_at`: datetime

## 12. AI Assistant

### POST /api/assistant/chat

Request:
- `message`: string, required and non-empty

Response:
- `answer`: string

Request example:
```json
{
  "message": "Which vehicles need maintenance?"
}
```

Response example:
```json
{
  "answer": "The response will be generated by the assistant."
}
```

## 13. Common error responses

- `400 Bad Request`: invalid input
- `404 Not Found`: requested vehicle or resource does not exist
- `422 Unprocessable Entity`: request validation failed
- `500 Internal Server Error`: unexpected server failure

Error example:
```json
{
  "detail": "Vehicle not found"
}
```

## 14. Implementation status

Implemented and tested:

- GET /health
- GET /api/v1/fleet/vehicles
- GET /api/v1/fleet/vehicles/{vehicle_id}
- GET /api/v1/fleet/vehicles/{vehicle_id}/telemetry
- GET /api/v1/fleet/vehicles/{vehicle_id}/charging-sessions
- GET /api/v1/dashboard/summary

Planned endpoints:

- Battery
- Maintenance
- Procurement
- Supply Chain
- Net-Zero
- AI Assistant

An endpoint is not considered implemented until it exists in FastAPI,
has request/response schemas, and has been tested.
