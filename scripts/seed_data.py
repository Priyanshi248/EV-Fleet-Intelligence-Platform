
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import (
    Vehicle,
    TelemetryRecord,
    ChargingSession,
    BatteryPrediction,
    MaintenanceAlert,
    EVCatalog,
    ProcurementRecommendation,
    Supplier,
    BatteryMaterial,
    SupplierRiskAssessment,
    NetZeroScenario,
)


SEED_TIME = datetime(2026, 10, 25, 8, 0, tzinfo=timezone.utc)


def get_or_create(db, model, lookup, defaults):
    """Return an existing record or create a new one."""
    record = db.scalar(select(model).filter_by(**lookup))

    if record is None:
        record = model(**lookup, **defaults)
        db.add(record)
        db.flush()

    return record


def seed_data():
    with SessionLocal() as db:
        # 1. Vehicles
        vehicle_specs = [
            ("Tata", "Fleet EV 1", 40.0, 250.0, "active"),
            ("Mahindra", "Fleet EV 2", 55.0, 320.0, "charging"),
            ("MG", "Fleet EV 3", 50.0, 290.0, "maintenance"),
        ]

        vehicles = []
        for make, model, capacity, range_km, status in vehicle_specs:
            vehicle = get_or_create(
                db,
                Vehicle,
                {"make": make, "model": model},
                {
                    "battery_capacity_kwh": capacity,
                    "range_km": range_km,
                    "status": status,
                },
            )
            vehicles.append(vehicle)

        # 2. Telemetry: deterministic timestamps prevent duplicates.
        for i, vehicle in enumerate(vehicles):
            recorded_at = SEED_TIME - timedelta(hours=i)

            get_or_create(
                db,
                TelemetryRecord,
                {
                    "vehicle_id": vehicle.id,
                    "recorded_at": recorded_at,
                },
                {
                    "battery_voltage_v": 350.0 + i * 5,
                    "battery_temperature_c": 27.0 + i * 2,
                    "battery_current_a": 10.0 + i,
                    "state_of_charge_percent": 80.0 - i * 15,
                },
            )

        # 3. Charging sessions
        for i, vehicle in enumerate(vehicles):
            started_at = SEED_TIME - timedelta(days=i + 1)

            get_or_create(
                db,
                ChargingSession,
                {
                    "vehicle_id": vehicle.id,
                    "started_at": started_at,
                },
                {
                    "ended_at": started_at + timedelta(minutes=60 + i * 15),
                    "energy_charged_kwh": 20.0 + i * 5,
                    "duration_minutes": float(60 + i * 15),
                },
            )

        # 4. Battery predictions
        for i, vehicle in enumerate(vehicles):
            get_or_create(
                db,
                BatteryPrediction,
                {
                    "vehicle_id": vehicle.id,
                    "model_version": "seed-v1",
                },
                {
                    "soh_percent": 96.0 - i * 8,
                    "rul_cycles": 900 - i * 200,
                    "prediction_status": "completed",
                    "predicted_at": SEED_TIME,
                },
            )

        # 5. Maintenance alerts
        alert_specs = [
            (vehicles[2], "Battery inspection", "high"),
            (vehicles[1], "Charging connector inspection", "medium"),
        ]

        for vehicle, alert_type, severity in alert_specs:
            get_or_create(
                db,
                MaintenanceAlert,
                {
                    "vehicle_id": vehicle.id,
                    "alert_type": alert_type,
                },
                {
                    "severity": severity,
                    "description": f"Simulated alert: {alert_type}",
                    "status": "open",
                    "created_at": SEED_TIME,
                },
            )

        # 6. EV catalogue
        ev_specs = [
            ("Tata", "Demo EV A", 1200000.0, 250.0, 500.0, 0.16, 1.0),
            ("Mahindra", "Demo EV B", 1500000.0, 320.0, 650.0, 0.19, 1.2),
            ("MG", "Demo EV C", 1800000.0, 290.0, 550.0, 0.17, 0.9),
        ]

        evs = []
        for make, model, price, distance, payload, consumption, charge_time in ev_specs:
            ev = get_or_create(
                db,
                EVCatalog,
                {"make": make, "model": model},
                {
                    "purchase_price_inr": price,
                    "usable_range_km": distance,
                    "payload_kg": payload,
                    "energy_consumption_kwh_per_km": consumption,
                    "charging_time_hours": charge_time,
                    "data_source": "simulated",
                },
            )
            evs.append(ev)

        # 7. Procurement recommendations
        for i, ev in enumerate(evs):
            get_or_create(
                db,
                ProcurementRecommendation,
                {"ev_id": ev.id, "status": "seed-demo"},
                {
                    "score": 90.0 - i * 10,
                    "reasons": [
                        "Simulated demonstration score",
                        "Review price, range, and payload before procurement",
                    ],
                    "created_at": SEED_TIME,
                },
            )

        # 8. Suppliers
        supplier_specs = [
            ("Demo Supplier India", "India"),
            ("Demo Supplier Australia", "Australia"),
            ("Demo Supplier Chile", "Chile"),
        ]

        suppliers = []
        for name, country in supplier_specs:
            supplier = get_or_create(
                db,
                Supplier,
                {"name": name},
                {
                    "origin_country": country,
                    "data_source": "simulated",
                },
            )
            suppliers.append(supplier)

        # 9. Battery materials
        material_specs = [
            ("Demo Lithium", "Australia", 100.0, 20.0, 75.0),
            ("Demo Nickel", "Indonesia", 80.0, 35.0, 60.0),
            ("Demo Cobalt", "Chile", 120.0, 45.0, 40.0),
        ]

        materials = []
        for name, country, price, volatility, sustainability in material_specs:
            material = get_or_create(
                db,
                BatteryMaterial,
                {"name": name},
                {
                    "origin_country": country,
                    "price_indicator": price,
                    "price_volatility_indicator": volatility,
                    "sustainability_indicator": sustainability,
                    "data_source": "simulated",
                },
            )
            materials.append(material)

        # 10. Supplier risk assessments
        risk_specs = [
            (0, 0, 25.0, "low"),
            (1, 1, 55.0, "medium"),
            (2, 2, 85.0, "high"),
        ]

        for supplier_i, material_i, score, level in risk_specs:
            supplier = suppliers[supplier_i]
            material = materials[material_i]

            get_or_create(
                db,
                SupplierRiskAssessment,
                {
                    "supplier_id": supplier.id,
                    "material_id": material.id,
                },
                {
                    "risk_score": score,
                    "risk_level": level,
                    "assessed_at": SEED_TIME,
                },
            )

        # 11. Net-zero scenarios
        scenarios = [
            ("Demo baseline", 100000.0, 100000.0, 0.0),
            ("Demo 30 percent reduction", 100000.0, 70000.0, 30.0),
            ("Demo 60 percent reduction", 100000.0, 40000.0, 60.0),
        ]

        for name, baseline, projected, reduction in scenarios:
            get_or_create(
                db,
                NetZeroScenario,
                {"name": name},
                {
                    "baseline_emissions_kg_co2e": baseline,
                    "projected_emissions_kg_co2e": projected,
                    "reduction_percent": reduction,
                    "assumptions": {
                        "source": "simulated",
                        "note": "Demonstration values, not measured emissions",
                    },
                    "created_at": SEED_TIME,
                },
            )

        db.commit()
        print("Seed data inserted or already exists.")
        print("All 11 application tables have seed-data logic.")


if __name__ == "__main__":
    seed_data()
