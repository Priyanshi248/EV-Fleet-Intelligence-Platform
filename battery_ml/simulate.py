"""Synthetic EV battery fleet generator.

WHY SYNTHETIC: no real fleet dataset was available. The generator uses standard battery-aging
relationships (Arrhenius-style temperature acceleration, depth-of-discharge and fast-charge stress,
a "knee" where fade accelerates) so that models have real structure to learn. Metrics from this data
describe the pipeline, NOT real-world accuracy. To use real data, produce a CSV with the same columns
as data/raw/battery_cycles_raw.csv and run clean + train unchanged.

Run:  python -m battery_ml.simulate
"""
from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

from . import config as C

INF = float("inf")


@dataclass
class Spec:
    vehicle_id: str
    chemistry: str
    t_mean: float
    fast: float
    dod: float
    r0: float
    v_nom: float
    i_mean: float
    vfactor: float = 1.0
    delta0: float = 4.0
    random_faults: bool = True
    thermal_start: float = INF
    imbalance_start: float = INF
    comm_start: float = INF
    stop_cycle: Optional[int] = None   # demo vehicles stop here instead of running to end-of-life


def random_spec(i: int, rng: np.random.Generator) -> Spec:
    lfp = rng.random() < 0.3
    return Spec(
        vehicle_id=f"B-{i:03d}",
        chemistry="LFP" if lfp else "NMC",
        t_mean=float(np.clip(rng.normal(31, 4), 22, 40)),
        fast=float(rng.beta(2, 3.5)),
        dod=float(np.clip(rng.normal(0.6, 0.1), 0.35, 0.9)),
        r0=float(rng.normal(60, 3.6) * (1.15 if lfp else 1.0)),
        v_nom=345.0 if lfp else 380.0,
        i_mean=float(np.clip(rng.normal(18, 4), 8, 35)),
        vfactor=float(rng.lognormal(0, 0.15)),
        delta0=float(rng.uniform(3, 6)),
        thermal_start=_first_start(rng), imbalance_start=_first_start(rng), comm_start=_first_start(rng),
    )


def _first_start(rng):  # ~50% of vehicles will eventually develop each problem type
    return float(rng.uniform(200, 2200)) if rng.random() < 0.5 else INF


def simulate_vehicle(spec: Spec, rng: np.random.Generator, max_cycles: int = 9000):
    base = 0.0035 if spec.chemistry == "LFP" else 0.006      # % SOH lost per cycle at 25C, 60% DoD
    soh, eol, last_fault = 100.0, None, -999
    start = {"thermal": spec.thermal_start, "imbalance": spec.imbalance_start, "comm": spec.comm_start}
    phase = rng.uniform(0, 6.28)
    rows, faults = [], []
    last = spec.stop_cycle if spec.stop_cycle is not None else max_cycles

    for c in range(0, last + 1):
        # ---- latent problem episodes (ramp up until a fault triggers service) ----
        therm_off = min(12.0, 0.03 * (c - start["thermal"])) if c >= start["thermal"] else 0.0
        imb_extra = min(60.0, 0.08 * (c - start["imbalance"])) if c >= start["imbalance"] else 0.0
        comm_lam = 0.3 + (min(8.0, 0.03 * (c - start["comm"])) if c >= start["comm"] else 0.0)

        temp = spec.t_mean + 4 * np.sin(2 * np.pi * c / 730 + phase) + therm_off
        # ---- capacity fade ----
        knee = 1 + 1.8 / (1 + np.exp((soh - 78) / 2.5))
        fade = (base * 2 ** ((temp - 25) / 12) * (spec.dod / 0.6) ** 1.4 * (1 + 0.8 * spec.fast)
                * knee * spec.vfactor * (1 + rng.normal(0, 0.04)))
        soh -= max(fade, 0)

        r = spec.r0 * (1 + 1.0 * (100 - soh) / 30) * (1 + 0.012 * (25 - temp))
        delta = spec.delta0 + 0.004 * c + imb_extra
        tmax = temp + 4

        # ---- faults: hazard rises with stress; label source for the maintenance model ----
        if spec.random_faults and c - last_fault > 30:
            terms = {"thermal": 0.5 * max(0, tmax - C.THERMAL_ALARM_C),
                     "imbalance": 0.12 * max(0, delta - C.CELL_DELTA_MAX_MV),
                     "comm": 0.6 * max(0, comm_lam - 2),
                     "aging": 0.25 * max(0, 78 - soh) + 0.05 * max(0, (r / spec.r0 - 1.5) * 20)}
            if rng.random() < 0.00015 * np.exp(sum(terms.values())):
                ftype = max(terms, key=terms.get) if max(terms.values()) > 0.3 else rng.choice(list(terms))
                faults.append((c, str(ftype)))
                last_fault = c
                for k in start:   # service resets episodes; new ones may appear later
                    start[k] = c + rng.exponential(1500) if rng.random() < 0.5 else INF

        if c % C.RECORD_EVERY == 0:
            i_avg = max(2.0, spec.i_mean + rng.normal(0, 2))
            rows.append({
                "vehicle_id": spec.vehicle_id, "cycle": c, "chemistry": spec.chemistry,
                "avg_temp_c": temp + rng.normal(0, 1.5),
                "max_temp_c": tmax + abs(rng.normal(0, 2.5)),
                "voltage_v": spec.v_nom * (1 - 0.02 * (100 - soh) / 30) - i_avg * r / 1000 + rng.normal(0, 3),
                "current_a": i_avg,
                "resistance_mohm": r * (1 + rng.normal(0, 0.03)),
                "cell_delta_mv": max(0.5, delta + rng.normal(0, 1.5)),
                "fast_charge_ratio": float(np.clip(spec.fast + rng.normal(0, 0.05), 0, 1)),
                "avg_dod": float(np.clip(spec.dod + rng.normal(0, 0.04), 0.1, 1)),
                "comm_errors": int(rng.poisson(comm_lam)),
                "soh_pct": soh + rng.normal(0, 0.25),     # "labelled" SOH from a capacity check
            })
        if soh <= C.EOL_SOH and eol is None and spec.stop_cycle is None:
            eol = c
            break

    df = pd.DataFrame(rows)
    if spec.stop_cycle is None:
        df["rul_cycles"] = (eol if eol is not None else np.nan) - df["cycle"]
        fc = np.array([f[0] for f in faults]) if faults else np.array([])
        ft = [f[1] for f in faults]
        lab = []
        for cyc in df["cycle"]:
            hit = np.where((fc > cyc) & (fc <= cyc + C.HORIZON_CYCLES))[0] if len(fc) else []
            lab.append(ft[hit[0]] if len(hit) else "none")
        df["next_fault"] = lab
    return df


def inject_dirt(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """Make the raw file look like real telemetry: gaps, sensor glitches, duplicate uploads."""
    df = df.copy()
    n = len(df)
    for col in ["avg_temp_c", "max_temp_c", "voltage_v", "current_a", "resistance_mohm"]:
        df.loc[rng.random(n) < 0.02, col] = np.nan
    glitch = {"avg_temp_c": 150.0, "max_temp_c": -99.0, "voltage_v": 0.0, "current_a": 9999.0, "resistance_mohm": -5.0}
    for col, bad in glitch.items():
        df.loc[rng.random(n) < 0.004, col] = bad
    dups = df.sample(frac=0.003, random_state=C.SEED)
    return pd.concat([df, dups], ignore_index=True).sample(frac=1, random_state=C.SEED).reset_index(drop=True)


# (id, cycles so far, mean temp, fast-charge ratio, DoD, chemistry, problem episode, cycles-ago it started)
DEMO = [
    ("EV-001", 1240, 32, 0.40, 0.65, "NMC", None, 0), ("EV-002", 890, 34, 0.45, 0.60, "NMC", None, 0),
    ("EV-003", 420, 29, 0.30, 0.55, "NMC", None, 0), ("EV-004", 1650, 38, 0.35, 0.65, "LFP", "thermal", 450),
    ("EV-005", 1320, 33, 0.35, 0.70, "NMC", None, 0), ("EV-006", 980, 31, 0.30, 0.60, "NMC", None, 0),
    ("EV-007", 510, 30, 0.50, 0.50, "NMC", None, 0), ("EV-008", 310, 28, 0.20, 0.50, "NMC", None, 0),
    ("EV-009", 1400, 32, 0.40, 0.65, "NMC", None, 0), ("EV-010", 1150, 35, 0.35, 0.60, "NMC", "imbalance", 450),
    ("EV-011", 920, 34, 0.55, 0.70, "NMC", "comm", 120), ("EV-012", 1900, 30, 0.30, 0.60, "NMC", None, 0),
]


def build_demo_fleet(rng: np.random.Generator) -> pd.DataFrame:
    """12 vehicles that mirror the frontend's EV-001..EV-012. Never used for training."""
    parts = []
    for vid, cyc, t, fast, dod, chem, ep, ago in DEMO:
        lfp = chem == "LFP"
        s = Spec(vid, chem, t, fast, dod, r0=float(rng.normal(60, 3) * (1.15 if lfp else 1)),
                 v_nom=345.0 if lfp else 380.0, i_mean=float(rng.uniform(10, 25)),
                 random_faults=False, stop_cycle=cyc)
        if ep:
            setattr(s, f"{ep}_start", float(cyc - ago))
        parts.append(simulate_vehicle(s, rng))
    return pd.concat(parts, ignore_index=True)


def main(n_vehicles: int = 150):
    rng = np.random.default_rng(C.SEED)
    fleet = pd.concat([simulate_vehicle(random_spec(i, rng), rng) for i in range(n_vehicles)], ignore_index=True)
    raw = inject_dirt(fleet, rng)
    C.RAW_CSV.parent.mkdir(parents=True, exist_ok=True)
    raw.to_csv(C.RAW_CSV, index=False)
    demo = build_demo_fleet(np.random.default_rng(C.SEED + 1))
    C.FLEET_CSV.parent.mkdir(parents=True, exist_ok=True)
    demo.to_csv(C.FLEET_CSV, index=False)
    pos = (fleet["next_fault"] != "none").mean()
    print(f"raw rows={len(raw)} vehicles={n_vehicles} fault-within-{C.HORIZON_CYCLES}-cycles rate={pos:.1%}")
    print(fleet["next_fault"].value_counts().to_dict())


if __name__ == "__main__":
    main()
