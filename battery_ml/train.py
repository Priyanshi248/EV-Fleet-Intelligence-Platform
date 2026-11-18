"""Train + evaluate SOH, RUL (with 80% interval) and maintenance-risk models.

Run:  python -m battery_ml.train

Evaluation rule: the train/test split is BY VEHICLE. Rows from one battery are highly correlated, so a
random row split would leak and give inflated scores.
"""
import json
import warnings
from datetime import datetime, timezone

import joblib
import matplotlib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import (accuracy_score, average_precision_score, brier_score_loss, confusion_matrix, f1_score,
                             mean_absolute_error, mean_squared_error, precision_recall_curve, precision_score,
                             r2_score, recall_score, roc_auc_score, roc_curve)
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import config as C
from .features import RISK_FEATURES, RUL_FEATURES, SOH_FEATURES, add_features

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

warnings.filterwarnings("ignore", category=UserWarning)
CV = GroupKFold(n_splits=4)
RUL_SCALE = 50.0  # cycles; keeps relative errors finite when RUL is near 0


def reg_metrics(y, p):
    return {"r2": round(float(r2_score(y, p)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y, p))), 3),
            "mae": round(float(mean_absolute_error(y, p)), 3)}


def select_regressor(cands, X, y, groups):
    scores, oof = {}, {}
    for name, est in cands.items():
        oof[name] = cross_val_predict(est, X, y, groups=groups, cv=CV)
        scores[name] = round(float(np.sqrt(mean_squared_error(y, oof[name]))), 3)
    best = min(scores, key=scores.get)
    return best, scores, oof[best]


def regressor_candidates():
    return {
        "ridge": make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
        "random_forest": RandomForestRegressor(n_estimators=80, min_samples_leaf=10, max_features=0.6,
                                               random_state=C.SEED, n_jobs=-1),
        "hist_gradient_boosting": HistGradientBoostingRegressor(max_iter=250, learning_rate=0.06,
                                                                early_stopping=False, random_state=C.SEED),
    }


def main():
    df = add_features(pd.read_csv(C.CLEAN_CSV))
    df["is_fault"] = (df["next_fault"] != "none").astype(int)
    tr_idx, te_idx = next(GroupShuffleSplit(test_size=0.2, random_state=C.SEED).split(df, groups=df["vehicle_id"]))
    tr, te = df.iloc[tr_idx].reset_index(drop=True), df.iloc[te_idx].reset_index(drop=True)
    print(f"train: {len(tr)} rows / {tr.vehicle_id.nunique()} vehicles | test: {len(te)} rows / {te.vehicle_id.nunique()} vehicles")
    M = {"split": {"train_rows": len(tr), "test_rows": len(te), "train_vehicles": int(tr.vehicle_id.nunique()),
                   "test_vehicles": int(te.vehicle_id.nunique()), "split_by": "vehicle"}}
    g = tr["vehicle_id"]

    # ---------------- 1) SOH estimation ----------------
    best, cv, _ = select_regressor(regressor_candidates(), tr[SOH_FEATURES], tr["soh_pct"], g)
    soh_model = regressor_candidates()[best].fit(tr[SOH_FEATURES], tr["soh_pct"])
    base = LinearRegression().fit(tr[["cycle"]], tr["soh_pct"])
    p_soh = soh_model.predict(te[SOH_FEATURES])
    M["soh"] = {"chosen": best, "cv_rmse": cv, "test": reg_metrics(te["soh_pct"], p_soh),
                "baseline_cycle_only_linear": reg_metrics(te["soh_pct"], base.predict(te[["cycle"]]))}
    print("SOH", M["soh"])

    # ---------------- 2) RUL (cycles to SOH = EOL) ----------------
    best, cv, oof_rul = select_regressor(regressor_candidates(), tr[RUL_FEATURES], tr["rul_cycles"], g)
    rul_model = regressor_candidates()[best].fit(tr[RUL_FEATURES], tr["rul_cycles"])
    # 80% interval by split-conformal calibration on out-of-fold (unseen-vehicle) relative errors
    rel = (tr["rul_cycles"].values - oof_rul) / (np.maximum(oof_rul, 0) + RUL_SCALE)
    q_lo, q_hi = (float(np.quantile(rel, 0.10)), float(np.quantile(rel, 0.90)))
    p_rul = np.maximum(rul_model.predict(te[RUL_FEATURES]), 0)
    lo = np.maximum(p_rul + q_lo * (p_rul + RUL_SCALE), 0)
    hi = p_rul + q_hi * (p_rul + RUL_SCALE)
    naive = np.clip((te["soh_pct"] - C.EOL_SOH) / np.maximum(te["avg_fade_per_100"], 1e-3) * 100, 0, 9000)
    late = te["rul_cycles"] <= 500
    M["rul"] = {"chosen": best, "cv_rmse": cv, "test": reg_metrics(te["rul_cycles"], p_rul),
                "test_late_life_rul_le_500": reg_metrics(te.loc[late, "rul_cycles"], p_rul[late]),
                "baseline_linear_extrapolation": reg_metrics(te["rul_cycles"], naive),
                "interval_80pct_coverage": round(float(((te["rul_cycles"] >= lo) & (te["rul_cycles"] <= hi)).mean()), 3),
                "note": "RUL measured in cycles; years = cycles / (cycles_per_day * 365)"}
    print("RUL", {k: v for k, v in M["rul"].items() if k != "note"})

    # ---------------- 3) maintenance / failure risk ----------------
    # Heavily regularised on purpose: an unconstrained booster memorised individual vehicles and output ~0% risk for 75% of
    # unseen rows (out-of-fold log-loss 0.30 vs 0.18 with these settings).
    clf = HistGradientBoostingClassifier(max_iter=80, learning_rate=0.05, max_depth=3, min_samples_leaf=300,
                                         l2_regularization=10.0, early_stopping=False, random_state=C.SEED)
    oof = cross_val_predict(clf, tr[RISK_FEATURES], tr["next_fault"], groups=g, cv=CV, method="predict_proba")
    classes = sorted(tr["next_fault"].unique())
    none_i = classes.index("none")
    oof_risk = 1 - oof[:, none_i]
    prec, rec, thr = precision_recall_curve(tr["is_fault"], oof_risk)
    f1s = 2 * prec[:-1] * rec[:-1] / np.maximum(prec[:-1] + rec[:-1], 1e-9)
    alert_thr = float(thr[int(np.argmax(f1s))])

    def thr_for_precision(target):   # lowest score where >= target of out-of-fold alerts were real faults
        ok = np.where((prec[:-1] >= target) & (rec[:-1] >= 0.05))[0]
        return float(thr[ok[0]]) if len(ok) else 1.0

    high = max(thr_for_precision(0.5), alert_thr)
    levels = {"low": round(alert_thr, 3), "medium": round(float(np.sqrt(alert_thr * high)), 3), "high": round(high, 3)}
    clf.fit(tr[RISK_FEATURES], tr["next_fault"])
    proba = clf.predict_proba(te[RISK_FEATURES])
    risk = 1 - proba[:, list(clf.classes_).index("none")]
    yb, yhat = te["is_fault"], (risk >= alert_thr).astype(int)   # yhat: "any alert" (Low or above)
    rule = ((te.max_temp_c > C.THERMAL_ALARM_C) | (te.cell_delta_mv > C.CELL_DELTA_MAX_MV)
            | (te.comm_errors >= 3) | (te.soh_pct < 75)).astype(int)
    lvl = np.select([risk >= levels["high"], risk >= levels["medium"], risk >= levels["low"]], ["High", "Medium", "Low"], "None")
    by_level = {k: {"rows": int((lvl == k).sum()), "observed_fault_rate": round(float(yb[lvl == k].mean()), 3)}
                for k in ["High", "Medium", "Low", "None"] if (lvl == k).any()}
    fault_rows = te["is_fault"] == 1
    non_none = [i for i, c in enumerate(clf.classes_) if c != "none"]
    type_pred = np.array(clf.classes_)[np.array(non_none)[proba[fault_rows.values][:, non_none].argmax(1)]]
    M["risk"] = {
        "horizon_cycles": C.HORIZON_CYCLES, "positive_rate_test": round(float(yb.mean()), 4),
        "thresholds": levels,
        "test": {"accuracy": round(float(accuracy_score(yb, yhat)), 4), "precision": round(float(precision_score(yb, yhat)), 4),
                 "recall": round(float(recall_score(yb, yhat)), 4), "f1": round(float(f1_score(yb, yhat)), 4),
                 "roc_auc": round(float(roc_auc_score(yb, risk)), 4), "pr_auc": round(float(average_precision_score(yb, risk)), 4),
                 "brier": round(float(brier_score_loss(yb, risk)), 4),
                 "confusion_matrix_[[tn,fp],[fn,tp]]": confusion_matrix(yb, yhat).tolist()},
        "baseline_threshold_rule": {"precision": round(float(precision_score(yb, rule)), 4),
                                    "recall": round(float(recall_score(yb, rule)), 4),
                                    "f1": round(float(f1_score(yb, rule)), 4)},
        "fault_type_accuracy_among_true_faults": round(float(accuracy_score(te.loc[fault_rows, "next_fault"], type_pred)), 4),
        "test_by_risk_level": by_level,
        "classes": list(clf.classes_),
    }
    print("RISK", M["risk"]["test"], "| rule baseline", M["risk"]["baseline_threshold_rule"],
          "| type acc", M["risk"]["fault_type_accuracy_among_true_faults"])

    # ---------------- benchmark SOH curve + defaults for the API ----------------
    bench = {}
    for chem, d in df.groupby("chemistry"):
        d = d.assign(bin=(d["cycle"] // 100) * 100)
        s = d.groupby("bin").agg(soh=("soh_pct", "median"), n=("vehicle_id", "nunique"))
        s = s[s["n"] >= 10]
        bench[chem] = {"cycle": (s.index + 50).tolist(), "soh": s["soh"].round(2).tolist()}
    defaults = {c: float(tr[c].median()) for c in
                ["avg_temp_c", "voltage_v", "current_a", "resistance_mohm", "cell_delta_mv", "fast_charge_ratio", "avg_dod"]}
    defaults["comm_errors"] = 0.0

    joblib.dump({"soh": soh_model, "rul": rul_model, "rul_interval": (q_lo, q_hi, RUL_SCALE), "risk": clf,
                 "risk_levels": levels, "benchmark": bench, "defaults": defaults,
                 "meta": {"trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                          "sklearn": sklearn.__version__, "data": "synthetic"}}, C.MODEL_PATH, compress=3)
    C.METRICS_JSON.write_text(json.dumps(M, indent=2))

    make_figures(tr, te, soh_model, rul_model, clf, p_soh, p_rul, risk, yb, yhat, df)
    print(f"saved {C.MODEL_PATH.name}, metrics.json, figures")


def make_figures(tr, te, soh_model, rul_model, clf, p_soh, p_rul, risk, yb, yhat, df):
    C.FIG_DIR.mkdir(parents=True, exist_ok=True)
    s = te.sample(min(3000, len(te)), random_state=C.SEED).index

    def parity(ax, y, p, title, unit):
        ax.scatter(y.loc[s], p[s], s=4, alpha=0.4)
        lim = [min(y.min(), p.min()), max(y.max(), p.max())]
        ax.plot(lim, lim, "r--", lw=1)
        ax.set(xlabel=f"Actual {unit}", ylabel=f"Predicted {unit}", title=title)

    fig, ax = plt.subplots(1, 2, figsize=(10, 4.2))
    parity(ax[0], te["soh_pct"], pd.Series(p_soh), "SOH: predicted vs actual (held-out vehicles)", "SOH (%)")
    parity(ax[1], te["rul_cycles"], pd.Series(p_rul), "RUL: predicted vs actual (held-out vehicles)", "RUL (cycles)")
    fig.tight_layout(); fig.savefig(C.FIG_DIR / "1_soh_rul_predicted_vs_actual.png", dpi=130); plt.close(fig)

    fig, ax = plt.subplots(figsize=(6.5, 4.2))
    for vid in df["vehicle_id"].drop_duplicates().sample(25, random_state=C.SEED):
        d = df[df.vehicle_id == vid]
        ax.plot(d["cycle"], d["soh_pct"], lw=0.8, alpha=0.7)
    ax.axhline(C.EOL_SOH, color="r", ls="--", label=f"End of life ({C.EOL_SOH:.0f}%)")
    ax.set(xlabel="Charge cycles", ylabel="SOH (%)", title="Degradation curves (25 sample vehicles)"); ax.legend()
    fig.tight_layout(); fig.savefig(C.FIG_DIR / "2_degradation_curves.png", dpi=130); plt.close(fig)

    fig, ax = plt.subplots(1, 3, figsize=(14, 4))
    fpr, tpr, _ = roc_curve(yb, risk)
    ax[0].plot(fpr, tpr); ax[0].plot([0, 1], [0, 1], "k--", lw=0.8)
    ax[0].set(title=f"ROC (AUC={roc_auc_score(yb, risk):.3f})", xlabel="False positive rate", ylabel="True positive rate")
    p, r, _ = precision_recall_curve(yb, risk)
    ax[1].plot(r, p); ax[1].axhline(yb.mean(), color="k", ls="--", lw=0.8)
    ax[1].set(title=f"Precision-Recall (AP={average_precision_score(yb, risk):.3f})", xlabel="Recall", ylabel="Precision")
    cm = confusion_matrix(yb, yhat)
    ax[2].imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax[2].text(j, i, v, ha="center", va="center")
    ax[2].set(title="Confusion matrix (any alert: Low or above)", xticks=[0, 1], yticks=[0, 1],
              xticklabels=["no fault", "fault"], yticklabels=["no fault", "fault"], xlabel="Predicted", ylabel="Actual")
    fig.tight_layout(); fig.savefig(C.FIG_DIR / "3_risk_model_evaluation.png", dpi=130); plt.close(fig)

    sub = te.sample(min(3000, len(te)), random_state=C.SEED)
    fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
    for a, (name, model, feats, y, scoring) in zip(ax, [
            ("SOH model", soh_model, SOH_FEATURES, sub["soh_pct"], "neg_root_mean_squared_error"),
            ("RUL model", rul_model, RUL_FEATURES, sub["rul_cycles"], "neg_root_mean_squared_error"),
            ("Risk model", clf, RISK_FEATURES, sub["next_fault"], "neg_log_loss")]):
        imp = permutation_importance(model, sub[feats], y, scoring=scoring, n_repeats=3, random_state=C.SEED)
        o = np.argsort(imp.importances_mean)
        a.barh(np.array(feats)[o], imp.importances_mean[o]); a.set_title(f"{name}: permutation importance")
    fig.tight_layout(); fig.savefig(C.FIG_DIR / "4_feature_importance.png", dpi=130); plt.close(fig)


if __name__ == "__main__":
    main()
