
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.EVCatalog import EVCatalog
from app.models.ProcurementRecommendation import ProcurementRecommendation


router = APIRouter(
    prefix="/api/v1/procurement",
    tags=["Procurement"],
)


# ---------------------------------------------------------
# 1. Procurement requirements schema
# ---------------------------------------------------------

class ProcurementRequirements(BaseModel):
    daily_distance: float = Field(ge=10, le=800)
    payload_capacity: float = Field(ge=0.2, le=10)
    annual_mileage: float = Field(ge=5000, le=300000)
    budget: float = Field(gt=0)
    min_range: float = Field(ge=50, le=600)
    max_charging_time: float = Field(ge=0.5, le=8)


# ---------------------------------------------------------
# 2. Serialize EV catalog records
# ---------------------------------------------------------

def serialize_vehicle(vehicle: EVCatalog) -> dict:
    return {
        "id": vehicle.id,
        "make": vehicle.make,
        "model": vehicle.model,
        "purchase_price_inr": vehicle.purchase_price_inr,
        "range": vehicle.usable_range_km,
        "payload": round(vehicle.payload_kg / 1000, 2),
        "charging_time": vehicle.charging_time_hours,
        "energy_consumption": vehicle.energy_consumption_kwh_per_km,
        "data_source": vehicle.data_source,
    }


# ---------------------------------------------------------
# 3. Get EV catalog
# ---------------------------------------------------------

@router.get("/catalog")
def get_procurement_catalog(db: Session = Depends(get_db)):

    vehicles = (
        db.query(EVCatalog)
        .order_by(EVCatalog.id)
        .all()
    )

    return {
        "count": len(vehicles),
        "vehicles": [
            serialize_vehicle(vehicle)
            for vehicle in vehicles
        ],
    }


# ---------------------------------------------------------
# 4. Generate EV procurement recommendations
# ---------------------------------------------------------

@router.post("/recommendations")
def generate_recommendations(
    requirements: ProcurementRequirements,
    db: Session = Depends(get_db),
):

    vehicles = db.query(EVCatalog).all()

    if not vehicles:
        raise HTTPException(
            status_code=404,
            detail="EV catalog is empty. Add vehicles before generating recommendations.",
        )

    scored_vehicles = []

    max_consumption = max(
        vehicle.energy_consumption_kwh_per_km
        for vehicle in vehicles
    )

    # Daily route distance and minimum range both matter.
    required_range = max(
        requirements.daily_distance,
        requirements.min_range,
    )

    for vehicle in vehicles:

        score = 90.0
        reasons = []

        payload_tons = vehicle.payload_kg / 1000
        cost_lakhs = vehicle.purchase_price_inr / 100000

        # -------------------------------------------------
        # Range suitability
        # -------------------------------------------------

        if vehicle.usable_range_km < required_range:

            penalty = (
                required_range - vehicle.usable_range_km
            ) * 0.4

            score -= penalty

            reasons.append(
                f"Range is below the required {required_range:g} km"
            )

        else:

            bonus = min(
                10,
                (
                    vehicle.usable_range_km - required_range
                ) * 0.1,
            )

            score += bonus

            reasons.append(
                "Meets the driving range requirement"
            )

        # -------------------------------------------------
        # Payload suitability
        # -------------------------------------------------

        if payload_tons < requirements.payload_capacity:

            penalty = (
                requirements.payload_capacity - payload_tons
            ) * 15

            score -= penalty

            reasons.append(
                f"Payload capacity is below the required "
                f"{requirements.payload_capacity:g} tons"
            )

        else:

            score += 5

            reasons.append(
                "Meets the required payload capacity"
            )

        # -------------------------------------------------
        # Charging time suitability
        # -------------------------------------------------

        if (
            vehicle.charging_time_hours
            > requirements.max_charging_time
        ):

            penalty = (
                vehicle.charging_time_hours
                - requirements.max_charging_time
            ) * 10

            score -= penalty

            reasons.append(
                "Charging time exceeds the specified limit"
            )

        else:

            reasons.append(
                "Meets the charging time requirement"
            )

        # -------------------------------------------------
        # Budget suitability
        # -------------------------------------------------

        if vehicle.purchase_price_inr > requirements.budget:

            excess_lakhs = (
                vehicle.purchase_price_inr
                - requirements.budget
            ) / 100000

            score -= excess_lakhs * 3

            reasons.append(
                "Vehicle price exceeds the available budget"
            )

        else:

            reasons.append(
                "Within the available procurement budget"
            )

        # -------------------------------------------------
        # Energy efficiency bonus
        # -------------------------------------------------

        if max_consumption > 0:

            efficiency_bonus = (
                (
                    max_consumption
                    - vehicle.energy_consumption_kwh_per_km
                ) / max_consumption
            ) * 5

            score += max(0, efficiency_bonus)

        # -------------------------------------------------
        # Final suitability score
        # -------------------------------------------------

        final_score = round(
            max(0, min(98, score))
        )

        # -------------------------------------------------
        # Verify all mandatory requirements
        # -------------------------------------------------

        meets_requirements = (
            vehicle.usable_range_km >= required_range
            and payload_tons >= requirements.payload_capacity
            and vehicle.charging_time_hours
                <= requirements.max_charging_time
            and vehicle.purchase_price_inr
                <= requirements.budget
        )

        tagline = (
            "Meets all key requirements"
            if meets_requirements
            else "Partial match — some requirements are not met"
        )

        # -------------------------------------------------
        # Estimated annual energy consumption
        # -------------------------------------------------

        estimated_annual_energy = round(
            requirements.annual_mileage
            * vehicle.energy_consumption_kwh_per_km,
            2,
        )

        scored_vehicles.append({
            "vehicle": vehicle,
            "score": final_score,
            "reasons": reasons,
            "annual_energy_kwh": estimated_annual_energy,
            "tagline": tagline,
            "meets_requirements": meets_requirements,
        })

    # Highest suitability score first.

    scored_vehicles.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    # -----------------------------------------------------
    # 5. Save recommendations in PostgreSQL
    # -----------------------------------------------------

    recommendations = []

    try:

        for item in scored_vehicles:

            vehicle = item["vehicle"]

            saved = ProcurementRecommendation(
                ev_id=vehicle.id,
                score=float(item["score"]),
                reasons=item["reasons"],
                status="recommended",
            )

            db.add(saved)

            recommendations.append({

                "id": f"PROC-{vehicle.id:03d}",

                "catalog_id": vehicle.id,

                "model": f"{vehicle.make} {vehicle.model}",

                "tagline": item["tagline"],

                "meetsRequirements": item["meets_requirements"],

                "suitabilityScore": item["score"],

                "range": vehicle.usable_range_km,

                "payload": round(
                    vehicle.payload_kg / 1000, 2
                ),

                "chargingTime": vehicle.charging_time_hours,

                "costLakh": round(
                    vehicle.purchase_price_inr / 100000,
                    2,
                ),

                "purchasePriceInr": vehicle.purchase_price_inr,

                "energyConsumption": (
                    vehicle.energy_consumption_kwh_per_km
                ),

                "estimatedAnnualEnergyKwh": (
                    item["annual_energy_kwh"]
                ),

                "annualFuelSaving": "Not available",

                "batteryCapacity": "Not provided",

                "warranty": "Not provided",

                "highlights": item["reasons"],

                "dataSource": vehicle.data_source,

            })

        db.commit()

    except Exception:

        db.rollback()
        raise

    # -----------------------------------------------------
    # 6. Return recommendations
    # -----------------------------------------------------

    return {
        "message": "Procurement recommendations generated successfully",
        "data_source": "PostgreSQL EV catalog",
        "required_range_km": required_range,
        "recommendations": recommendations,
    }


# ---------------------------------------------------------
# 7. Get recommendation history
# ---------------------------------------------------------

@router.get("/recommendations/history")
def get_recommendation_history(
    limit: int = 20,
    db: Session = Depends(get_db),
):

    if limit < 1 or limit > 100:

        raise HTTPException(
            status_code=422,
            detail="Limit must be between 1 and 100",
        )

    records = (
        db.query(ProcurementRecommendation)
        .order_by(
            ProcurementRecommendation.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return {
        "count": len(records),

        "recommendations": [
            {
                "id": record.id,
                "vehicle_id": record.ev_id,
                "score": record.score,
                "reasons": record.reasons,
                "status": record.status,
                "created_at": record.created_at,
            }
            for record in records
        ],
    }
