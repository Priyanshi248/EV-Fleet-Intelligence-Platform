"""All prediction logic behind the API. Framework-free so it can be tested without FastAPI."""
import json
from datetime import date, timedelta
from functools import lru_cache

import numpy as np
import pandas as pd

from . import config as C
from .features import RISK_FEATURES, RUL_FEATURES, SOH_FEATURES, add_features


@lru_cache(maxsize=1)
def _bundle():
    if not C.MODEL_PATH.exists():
        raise FileNotFoundError("Models not trained. Run: python -m battery_ml.train")
    import joblib
    return joblib.load(C.MODEL_PATH)


@lru_cache(maxsize=1)
def _fleet():
    return add_features(pd.read_csv(C.FLEET_CSV))


def _frame(reading: dict) -> pd.DataFrame:
    """One reading -> one-row DataFrame; optional fields fall back to training medians."""
    b = _bundle()
    d = dict(b["defaults"])
    d.update({k: v for k, v in reading.items() if v is not None})
    if reading.get("max_temp_c") is None:
        d["max_temp_c"] = d["avg_temp_c"] + 5.0           # typical gap between avg and peak pack temperature
    d["is_lfp"] = int(str(d.get("chemistry", "NMC")).upper() == "LFP")
    return pd.DataFrame([d])


def _soh(df: pd.DataFrame) -> float:
    return float(np.clip(_bundle()["soh"].predict(df[SOH_FEATURES])[0], 0, 100))


def _with_soh(reading: dict):
    """Returns (frame with soh_pct + derived features, soh_source)."""
    df = _frame(reading)
    source = "measured" if reading.get("soh_pct") is not None else "predicted"
    if source == "predicted":
        df["soh_pct"] = _soh(df)
    return add_features(df), source


# ------------------------------------------------------------------ SOH
def predict_soh(reading: dict) -> dict:
    df = _frame(reading)
    return {"soh_pct": round(_soh(df), 1), "model": type(_bundle()["soh"]).__name__}


# ------------------------------------------------------------------ RUL
def predict_rul(reading: dict) -> dict:
    df, source = _with_soh(reading)
    b = _bundle()
    cpd = reading.get("cycles_per_day") or C.CYCLES_PER_DAY
    soh = float(df["soh_pct"].iloc[0])
    if soh <= C.EOL_SOH:
        point = lo = hi = 0.0
    else:
        point = max(float(b["rul"].predict(df[RUL_FEATURES])[0]), 0.0)
        q_lo, q_hi, scale = b["rul_interval"]
        lo = max(point + q_lo * (point + scale), 0.0)
        hi = point + q_hi * (point + scale)
    yrs = lambda cyc: round(cyc / (cpd * 365), 2)  # noqa: E731
    return {"rul_cycles": round(point), "rul_cycles_low": round(lo), "rul_cycles_high": round(hi),
            "rul_years": yrs(point), "rul_years_low": yrs(lo), "rul_years_high": yrs(hi),
            "interval_confidence": 0.8, "eol_threshold_soh_pct": C.EOL_SOH, "cycles_per_day": cpd,
            "soh_pct_used": round(soh, 1), "soh_source": source}


# ------------------------------------------------------------------ degradation
def _benchmark(chem: str, cycle: float):
    bench = _bundle()["benchmark"]
    cur = bench.get(chem.upper()) or next(iter(bench.values()))
    x, y = np.array(cur["cycle"], float), np.array(cur["soh"], float)
    soh = float(np.interp(cycle, x, y))
    rate100 = float(-(np.interp(cycle + 200, x, y) - np.interp(max(cycle - 200, 0), x, y)) / (cycle + 200 - max(cycle - 200, 0)) * 100)
    return soh, rate100


def analyze_degradation(reading: dict, history=None, horizon_months: int = 4, today: date = None) -> dict:
    """history: [{'cycle': int, 'soh': float}, ...] measured SOH points (optional)."""
    today = today or date.today()
    df, source = _with_soh(reading)
    soh, cycle = float(df["soh_pct"].iloc[0]), float(df["cycle"].iloc[0])
    cpd = reading.get("cycles_per_day") or C.CYCLES_PER_DAY

    pts = sorted([(h["cycle"], h["soh"]) for h in (history or [])])[-8:]
    if len(pts) >= 2 and pts[-1][0] > pts[0][0]:
        slope = float(np.polyfit([p[0] for p in pts], [p[1] for p in pts], 1)[0])   # % per cycle (negative)
        basis = f"linear fit of last {len(pts)} measured points"
    else:
        slope = -(100 - soh) / max(cycle, 10)
        basis = "average since new"
    per100 = max(-slope * 100, 0.0)
    per_month = per100 / 100 * cpd * C.DAYS_PER_MONTH

    bench_soh, bench_rate = _benchmark(str(reading.get("chemistry", "NMC")), cycle)
    ratio = per100 / bench_rate if bench_rate > 1e-6 else 1.0
    verdict = "faster than fleet benchmark" if ratio > 1.25 else "slower than fleet benchmark" if ratio < 0.8 else "in line with fleet benchmark"

    d = df.iloc[0]
    med = _bundle()["defaults"]
    drivers = []
    if d["avg_temp_c"] >= med["avg_temp_c"] + 4:
        drivers.append(f"High operating temperature ({d['avg_temp_c']:.0f}°C vs fleet median {med['avg_temp_c']:.0f}°C)")
    if d["fast_charge_ratio"] >= 0.5:
        drivers.append(f"Frequent fast charging ({d['fast_charge_ratio']*100:.0f}% of charges)")
    if d["avg_dod"] >= 0.75:
        drivers.append(f"Deep discharges (average DoD {d['avg_dod']*100:.0f}%)")
    if d["cell_delta_mv"] > C.CELL_DELTA_MAX_MV:
        drivers.append(f"Cell imbalance ({d['cell_delta_mv']:.0f} mV)")

    rul = predict_rul(reading)
    forecast = []
    if rul["rul_cycles"] > 0:
        per_cycle = (soh - C.EOL_SOH) / rul["rul_cycles"]      # average decline implied by the RUL model
        for k in range(1, horizon_months + 1):
            m = today + timedelta(days=C.DAYS_PER_MONTH * k)
            forecast.append({"month": m.strftime("%b %Y"), "predicted_soh": round(max(C.EOL_SOH, soh - per_cycle * cpd * C.DAYS_PER_MONTH * k), 1)})
    return {"soh_pct": round(soh, 1), "soh_source": source,
            "degradation_rate_pct_per_100_cycles": round(per100, 2), "degradation_rate_pct_per_month": round(per_month, 2),
            "rate_basis": basis, "benchmark_soh_pct": round(bench_soh, 1),
            "benchmark_rate_pct_per_100_cycles": round(bench_rate, 2), "vs_benchmark": verdict,
            "stress_drivers": drivers, "rul": rul, "forecast": forecast}


# ------------------------------------------------------------------ maintenance risk
def _level(p: float) -> str:
    t = _bundle()["risk_levels"]
    return "High" if p >= t["high"] else "Medium" if p >= t["medium"] else "Low" if p >= t["low"] else "None"


def assess_risk(reading: dict) -> dict:
    df, source = _with_soh(reading)
    b = _bundle()
    clf = b["risk"]
    proba = clf.predict_proba(df[RISK_FEATURES])[0]
    by_class = dict(zip(clf.classes_, proba))
    risk = float(1 - by_class["none"])
    level = _level(risk)
    d = df.iloc[0]
    out = {"risk_level": level, "failure_probability_pct": round(risk * 100, 1), "horizon_cycles": C.HORIZON_CYCLES,
           "soh_pct_used": round(float(d["soh_pct"]), 1), "soh_source": source,
           "issue_probabilities": {k: round(float(v), 3) for k, v in by_class.items() if k != "none"},
           "predicted_issue": None, "recommendation": "No action needed", "recommended_action": None, "root_cause": None}
    if level == "None":
        return out
    kind = max((k for k in by_class if k != "none"), key=by_class.get)
    issue, rec, action = C.ISSUES[kind]
    cause = {"thermal": f"Peak pack temperature {d['max_temp_c']:.0f}°C vs {C.THERMAL_ALARM_C:.0f}°C alarm threshold (average {d['avg_temp_c']:.0f}°C).",
             "imbalance": f"Cell voltage delta {d['cell_delta_mv']:.0f} mV vs {C.CELL_DELTA_MAX_MV:.0f} mV limit.",
             "comm": f"{int(d['comm_errors'])} charging/BMS communication errors in the latest window.",
             "aging": f"SOH {d['soh_pct']:.0f}% with internal resistance {d['resistance_mohm']:.0f} mΩ."}[kind]
    out.update(predicted_issue=issue, recommendation=rec, recommended_action=action, root_cause=cause, issue_type=kind)
    return out


# ------------------------------------------------------------------ demo fleet (battery + maintenance pages)
def _vehicle_rows(vehicle_id: str) -> pd.DataFrame:
    rows = _fleet()
    rows = rows[rows["vehicle_id"] == vehicle_id].sort_values("cycle")
    if rows.empty:
        raise KeyError(vehicle_id)
    return rows


def _reading_from_row(r: pd.Series) -> dict:
    keep = ["cycle", "avg_temp_c", "max_temp_c", "voltage_v", "current_a", "resistance_mohm", "cell_delta_mv",
            "fast_charge_ratio", "avg_dod", "comm_errors"]
    d = {k: float(r[k]) for k in keep}
    d["cycle"] = int(d["cycle"])
    d["chemistry"] = r["chemistry"]
    return d


def vehicle_health(vehicle_id: str, today: date = None) -> dict:
    today = today or date.today()
    rows = _vehicle_rows(vehicle_id)
    latest = rows.iloc[-1]
    reading = _reading_from_row(latest)
    per_month = C.CYCLES_PER_DAY * C.DAYS_PER_MONTH

    # one point per month going back from the latest record (up to 10 months)
    picks = []
    for k in range(9, -1, -1):
        target = latest["cycle"] - k * per_month
        if target < 0:
            continue
        picks.append((k, rows.iloc[(rows["cycle"] - target).abs().argmin()]))
    history, trend, analysis = [], [], []
    for k, r in picks:
        when = today - timedelta(days=C.DAYS_PER_MONTH * k)
        label = when.strftime("%b")
        pred = _soh(_frame(_reading_from_row(r)))
        bench, _ = _benchmark(r["chemistry"], r["cycle"])
        history.append({"cycle": int(r["cycle"]), "soh": float(r["soh_pct"])})
        trend.append({"month": label, "soh": round(float(r["soh_pct"]), 1), "benchmark": round(bench, 1)})
        analysis.append({"month": label, "actual": round(float(r["soh_pct"]), 1), "predicted": round(pred, 1)})

    deg = analyze_degradation(reading, history, horizon_months=4, today=today)
    for f in deg["forecast"]:
        analysis.append({"month": f["month"], "actual": None, "predicted": f["predicted_soh"]})
    risk = assess_risk(reading)
    return {"vehicle_id": vehicle_id, "model": C.DEMO_MODELS.get(vehicle_id), "soh_pct": deg["soh_pct"],
            "soh_measured_pct": round(float(latest["soh_pct"]), 1), "rul": deg["rul"],
            "degradation": {k: deg[k] for k in ["degradation_rate_pct_per_month", "degradation_rate_pct_per_100_cycles",
                                                "rate_basis", "benchmark_soh_pct", "benchmark_rate_pct_per_100_cycles",
                                                "vs_benchmark", "stress_drivers"]},
            "trend": trend, "analysis": analysis,
            "can_bus": {"temperature_c": round(reading["avg_temp_c"], 1), "voltage_v": round(reading["voltage_v"], 0),
                        "current_a": round(reading["current_a"], 1), "cycles": reading["cycle"]},
            "risk": {k: risk[k] for k in ["risk_level", "failure_probability_pct", "predicted_issue"]}}


def fleet_alerts(today: date = None) -> dict:
    today = today or date.today()
    alerts = []
    for vid in _fleet()["vehicle_id"].unique():
        r = assess_risk(_reading_from_row(_vehicle_rows(vid).iloc[-1]))
        if r["risk_level"] == "None":
            continue
        alerts.append({"id": f"ALT-{vid}", "vehicle_id": vid, "model": C.DEMO_MODELS.get(vid), "risk_level": r["risk_level"],
                       "predicted_issue": r["predicted_issue"], "recommendation": r["recommendation"], "status": "Pending",
                       "detected_date": today.isoformat(), "root_cause": r["root_cause"],
                       "recommended_action": r["recommended_action"], "failure_probability_pct": r["failure_probability_pct"]})
    alerts.sort(key=lambda a: -a["failure_probability_pct"])
    n = lambda lvl: sum(a["risk_level"] == lvl for a in alerts)  # noqa: E731
    return {"stats": {"vehicles_at_risk": len(alerts), "high_risk": n("High"), "medium_risk": n("Medium"), "low_risk": n("Low"),
                      "vehicles_monitored": int(_fleet()["vehicle_id"].nunique())},
            "alerts": alerts}


def model_metrics() -> dict:
    return json.loads(C.METRICS_JSON.read_text())
