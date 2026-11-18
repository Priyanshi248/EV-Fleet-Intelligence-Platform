"""Raw telemetry -> model-ready CSV, plus a report of everything that was changed.

Run:  python -m battery_ml.clean
"""
import json

import numpy as np
import pandas as pd

from . import config as C

# physically plausible ranges; anything outside is a sensor glitch, not a measurement
RANGES = {"avg_temp_c": (-20, 80), "max_temp_c": (-20, 90), "voltage_v": (200, 500),
          "current_a": (0, 300), "resistance_mohm": (10, 300), "cell_delta_mv": (0, 200),
          "fast_charge_ratio": (0, 1), "avg_dod": (0.05, 1), "soh_pct": (40, 105)}
SENSOR_COLS = ["avg_temp_c", "max_temp_c", "voltage_v", "current_a", "resistance_mohm"]


def clean(raw: pd.DataFrame):
    rep = {"rows_in": int(len(raw))}
    df = raw.drop_duplicates(subset=["vehicle_id", "cycle"]).copy()
    rep["duplicates_removed"] = rep["rows_in"] - len(df)

    # 1) range check: impossible values -> NaN
    rep["out_of_range_masked"] = {}
    for col, (lo, hi) in RANGES.items():
        bad = df[col].notna() & ~df[col].between(lo, hi)
        rep["out_of_range_masked"][col] = int(bad.sum())
        df.loc[bad, col] = np.nan

    # 2) missing sensor values: interpolate within a vehicle's own timeline (<=3 gaps), then fleet median
    df = df.sort_values(["vehicle_id", "cycle"]).reset_index(drop=True)
    rep["missing_before_imputation"] = {c: int(df[c].isna().sum()) for c in SENSOR_COLS}
    for col in SENSOR_COLS:
        df[col] = df.groupby("vehicle_id")[col].transform(lambda s: s.interpolate(limit=3, limit_direction="both"))
        df[col] = df[col].fillna(df[col].median())

    # 3) labels cannot be imputed: drop rows without them
    before = len(df)
    df = df.dropna(subset=["soh_pct", "rul_cycles", "next_fault"])
    rep["rows_dropped_missing_labels"] = before - len(df)

    # 4) measurement noise can push SOH marginally above 100 -> cap
    df["soh_pct"] = df["soh_pct"].clip(upper=100)
    rep["rows_out"] = int(len(df))
    rep["vehicles"] = int(df["vehicle_id"].nunique())
    return df, rep


def main():
    df, rep = clean(pd.read_csv(C.RAW_CSV))
    C.CLEAN_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(C.CLEAN_CSV, index=False)
    C.CLEAN_REPORT.parent.mkdir(parents=True, exist_ok=True)
    C.CLEAN_REPORT.write_text(json.dumps(rep, indent=2))
    print(json.dumps(rep, indent=2))


if __name__ == "__main__":
    main()
