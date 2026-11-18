"""FastAPI router: mount in the main app with
        from battery_ml.router import router as battery_router
        app.include_router(battery_router)
Endpoints (all under /api/v1):
    POST /battery/soh            POST /battery/rul          POST /battery/degradation
    POST /maintenance/risk       GET  /battery/{vehicle_id}/health
    GET  /maintenance/alerts     GET  /ml/metrics
"""
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from . import service

router = APIRouter(prefix="/api/v1")


class Reading(BaseModel):
    """One BMS snapshot. The five required fields are the minimum the models need."""
    cycle: int = Field(..., ge=0, description="Charge cycles completed so far")
    avg_temp_c: float = Field(..., ge=-20, le=80)
    voltage_v: float = Field(..., ge=200, le=500)
    current_a: float = Field(..., ge=0, le=300)
    resistance_mohm: float = Field(..., ge=10, le=300, description="Pack internal resistance / impedance from the BMS")
    max_temp_c: Optional[float] = Field(None, ge=-20, le=90)
    cell_delta_mv: Optional[float] = Field(None, ge=0, le=200, description="Max-min cell voltage")
    fast_charge_ratio: Optional[float] = Field(None, ge=0, le=1)
    avg_dod: Optional[float] = Field(None, ge=0.05, le=1)
    comm_errors: Optional[int] = Field(None, ge=0, description="Charging/BMS comms errors in the latest window")
    chemistry: str = Field("NMC", description="NMC or LFP")
    soh_pct: Optional[float] = Field(None, ge=40, le=100, description="Measured SOH if known; otherwise the SOH model is used")
    cycles_per_day: float = Field(2.0, gt=0, le=10, description="Used to convert cycles to months/years")


class HistoryPoint(BaseModel):
    cycle: int = Field(..., ge=0)
    soh: float = Field(..., ge=40, le=100)


class DegradationRequest(BaseModel):
    reading: Reading
    history: Optional[List[HistoryPoint]] = None
    horizon_months: int = Field(4, ge=1, le=24)


def _dict(m) -> dict:
    return m.model_dump() if hasattr(m, "model_dump") else m.dict()   # pydantic v2 / v1


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown vehicle_id")


@router.post("/battery/soh", tags=["battery"])
def battery_soh(reading: Reading):
    return _run(service.predict_soh, _dict(reading))


@router.post("/battery/rul", tags=["battery"])
def battery_rul(reading: Reading):
    return _run(service.predict_rul, _dict(reading))


@router.post("/battery/degradation", tags=["battery"])
def battery_degradation(req: DegradationRequest):
    return _run(service.analyze_degradation, _dict(req.reading), [_dict(h) for h in (req.history or [])], req.horizon_months)


@router.post("/maintenance/risk", tags=["maintenance"])
def maintenance_risk(reading: Reading):
    return _run(service.assess_risk, _dict(reading))


@router.get("/battery/{vehicle_id}/health", tags=["battery"])
def battery_health(vehicle_id: str):
    return _run(service.vehicle_health, vehicle_id)


@router.get("/ml/metrics", tags=["ml"])
def ml_metrics():
    return _run(service.model_metrics)
