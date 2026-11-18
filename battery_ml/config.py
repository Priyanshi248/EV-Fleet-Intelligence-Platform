"""Shared constants. Everything tunable lives here so train/serve stay consistent."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_CSV = ROOT / "data" / "raw" / "battery_cycles_raw.csv"
CLEAN_CSV = ROOT / "data" / "processed" / "battery_cycles_clean.csv"
FLEET_CSV = ROOT / "data" / "processed" / "demo_fleet.csv"
CLEAN_REPORT = ROOT / "reports" / "cleaning_report.json"
METRICS_JSON = ROOT / "reports" / "metrics.json"
FIG_DIR = ROOT / "reports" / "figures"
MODEL_PATH = ROOT / "models" / "battery_models.joblib"

SEED = 42
EOL_SOH = 70.0            # battery end-of-life threshold (% SOH); matches the frontend's EV-011 (70%) still having RUL
HORIZON_CYCLES = 100      # "maintenance needed within the next N cycles"
CYCLES_PER_DAY = 2.0      # default usage when the caller does not say (frontend: ~1800 cycles ~ 2.5 yrs)
DAYS_PER_MONTH = 30.4
RECORD_EVERY = 10         # one dataset row per 10 cycles

# Frontend telemetry defaults (settings/telemetry page)
THERMAL_ALARM_C = 45.0
CELL_DELTA_MAX_MV = 25.0

FAULT_CLASSES = ["none", "thermal", "imbalance", "comm", "aging"]

# text shown on the maintenance page, keyed by predicted fault class
ISSUES = {
    "thermal": ("Battery temperature high", "Check cooling system & coolant pumps",
                "Flush thermal coolant loop, inspect high-voltage relay wiring, recalibrate BMS thermocouples."),
    "imbalance": ("Cell voltage imbalance", "Cell balancing & cycle recalibration",
                  "Run a long AC equalisation charge; if delta persists, run a cell-level scan."),
    "comm": ("Charging / BMS communication errors", "Check connectors & CAN bus wiring",
             "Clean contact pins, inspect CAN harness and 120-ohm termination, review charger handshake logs."),
    "aging": ("Accelerated capacity fade / high resistance", "Battery inspection & cell level scan",
              "Schedule a full capacity test and evaluate module replacement under warranty."),
}

# Demo fleet: same ids/models as the frontend's mockData.js (EV-001..EV-012)
DEMO_MODELS = {
    "EV-001": "Tata Fleet EV 1",
    "EV-002": "Mahindra Fleet EV 2",
    "EV-003": "MG Fleet EV 3",
    "EV-004": "BYD e6",
    "EV-005": "Ashok Leyland EV",
    "EV-006": "Tata Ace EV",
    "EV-007": "Tata Tiago EV",
    "EV-008": "MG ZS EV",
    "EV-009": "Hyundai Kona",
    "EV-010": "Mahindra XUV400",
    "EV-011": "Tata Punch EV",
    "EV-012": "Switch Mobility EiV",
}
