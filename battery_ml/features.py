"""Feature lists + derivation. Used by training AND the API so they cannot drift apart."""
import numpy as np
import pandas as pd

BASE = ["cycle", "avg_temp_c", "max_temp_c", "voltage_v", "current_a",
        "resistance_mohm", "cell_delta_mv", "fast_charge_ratio", "avg_dod", "is_lfp"]

# SOH is estimated WITHOUT measured capacity (capacity would make it a direct calculation, not ML).
SOH_FEATURES = BASE
RUL_FEATURES = BASE + ["soh_pct", "avg_fade_per_100"]
RISK_FEATURES = BASE + ["soh_pct", "comm_errors"]


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    if "is_lfp" not in out and "chemistry" in out:
        out["is_lfp"] = (out["chemistry"].astype(str).str.upper() == "LFP").astype(int)
    if "soh_pct" in out:
        # average fade rate so far (percentage points per 100 cycles)
        out["avg_fade_per_100"] = (100.0 - out["soh_pct"]) / np.maximum(out["cycle"], 10) * 100.0
    return out
