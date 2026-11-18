
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.NetZeroScenario import NetZeroScenario


router = APIRouter(
    prefix="/api/v1/net-zero",
    tags=["Net-Zero"],
)


# ---------------------------------------------------------
# 1. Request schema
# ---------------------------------------------------------

class NetZeroScenarioCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    baseline_emissions_kg_co2e: float = Field(gt=0)
    projected_emissions_kg_co2e: float = Field(ge=0)
    assumptions: dict = Field(default_factory=dict)


# ---------------------------------------------------------
# 2. Serialize scenario
# ---------------------------------------------------------

def serialize_scenario(scenario: NetZeroScenario) -> dict:
    return {
        "id": scenario.id,
        "name": scenario.name,
        "baseline_emissions_kg_co2e": (
            scenario.baseline_emissions_kg_co2e
        ),
        "projected_emissions_kg_co2e": (
            scenario.projected_emissions_kg_co2e
        ),
        "avoided_emissions_kg_co2e": round(
            scenario.baseline_emissions_kg_co2e
            - scenario.projected_emissions_kg_co2e,
            2,
        ),
        "reduction_percent": scenario.reduction_percent,
        "assumptions": scenario.assumptions,
        "created_at": (
            scenario.created_at.isoformat()
            if scenario.created_at
            else None
        ),
    }


# ---------------------------------------------------------
# 3. Get all saved scenarios
# ---------------------------------------------------------

@router.get("/scenarios")
def get_net_zero_scenarios(
    db: Session = Depends(get_db),
):
    scenarios = (
        db.query(NetZeroScenario)
        .order_by(NetZeroScenario.created_at.desc())
        .all()
    )

    return {
        "count": len(scenarios),
        "scenarios": [
            serialize_scenario(scenario)
            for scenario in scenarios
        ],
        "data_source": "PostgreSQL",
    }


# ---------------------------------------------------------
# 4. Net-Zero summary
# ---------------------------------------------------------

@router.get("/summary")
def get_net_zero_summary(
    db: Session = Depends(get_db),
):
    scenarios = (
        db.query(NetZeroScenario)
        .order_by(NetZeroScenario.reduction_percent.desc())
        .all()
    )

    if not scenarios:
        return {
            "scenario_count": 0,
            "baseline_emissions_kg_co2e": None,
            "projected_emissions_kg_co2e": None,
            "avoided_emissions_kg_co2e": None,
            "reduction_percent": None,
            "selected_scenario": None,
            "data_source": "PostgreSQL",
        }

    # Select the scenario with the highest calculated reduction.
    best_scenario = scenarios[0]

    baseline = best_scenario.baseline_emissions_kg_co2e
    projected = best_scenario.projected_emissions_kg_co2e

    return {
        "scenario_count": len(scenarios),
        "baseline_emissions_kg_co2e": baseline,
        "projected_emissions_kg_co2e": projected,
        "avoided_emissions_kg_co2e": round(
            baseline - projected, 2
        ),
        "reduction_percent": best_scenario.reduction_percent,
        "selected_scenario": best_scenario.name,
        "data_source": "PostgreSQL",
        "assumptions": best_scenario.assumptions,
    }


# ---------------------------------------------------------
# 5. Calculate and save a new scenario
# ---------------------------------------------------------

@router.post("/scenarios", status_code=201)
def create_net_zero_scenario(
    payload: NetZeroScenarioCreate,
    db: Session = Depends(get_db),
):
    baseline = payload.baseline_emissions_kg_co2e
    projected = payload.projected_emissions_kg_co2e

    if projected > baseline:
        raise HTTPException(
            status_code=422,
            detail=(
                "Projected emissions cannot exceed baseline emissions "
                "for a reduction scenario."
            ),
        )

    reduction = round(
        ((baseline - projected) / baseline) * 100,
        2,
    )

    scenario = NetZeroScenario(
        name=payload.name,
        baseline_emissions_kg_co2e=baseline,
        projected_emissions_kg_co2e=projected,
        reduction_percent=reduction,
        assumptions={
            **payload.assumptions,
            "calculation": (
                "(baseline - projected) / baseline * 100"
            ),
            "source": payload.assumptions.get(
                "source", "user_defined"
            ),
        },
    )

    try:
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Net-Zero scenario saved successfully",
        "scenario": serialize_scenario(scenario),
    }
