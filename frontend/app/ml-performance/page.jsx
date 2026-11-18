'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getMLMetrics } from '@/lib/api';

function formatNumber(value, digits = 2) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : 'N/A';
}

function formatPercent(value, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${(value * 100).toFixed(digits)}%`
    : 'N/A';
}

function StatCard({ label, value, helper, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.emerald}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ComparisonBars({ values, lowerIsBetter = true, unit = '' }) {
  const entries = Object.entries(values || {}).filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
  if (!entries.length) {
    return <p className="text-sm text-slate-500">Comparison values are not available.</p>;
  }

  const maximum = Math.max(...entries.map(([, value]) => value), 0.0001);
  const bestValue = lowerIsBetter
    ? Math.min(...entries.map(([, value]) => value))
    : Math.max(...entries.map(([, value]) => value));

  return (
    <div className="space-y-4">
      {entries.map(([name, value]) => {
        const width = Math.max((value / maximum) * 100, 2);
        const isBest = value === bestValue;
        return (
          <div key={name}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium capitalize text-slate-700">{name.replaceAll('_', ' ')}</span>
              <span className="font-semibold tabular-nums text-slate-900">{formatNumber(value, 3)}{unit}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${isBest ? 'bg-emerald-500' : 'bg-slate-400'}`}
                style={{ width: `${width}%` }}
              />
            </div>
            {isBest && <p className="mt-1 text-[10px] font-medium text-emerald-700">Best value in this comparison</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function MLPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMetrics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const result = await getMLMetrics();
      setMetrics(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Unable to load ML model metrics:', err);
      setError(err.message || 'Unable to load model evaluation metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const soh = metrics?.soh;
  const rul = metrics?.rul;
  const risk = metrics?.risk;
  const split = metrics?.split;
  const riskTest = risk?.test;
  const confusion = riskTest?.['confusion_matrix_[[tn,fp],[fn,tp]]'];
  const riskLevels = risk?.test_by_risk_level || {};

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Loading model evaluation metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ML Model Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Evaluation results for the supplied battery intelligence models.</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Metrics could not be loaded</div>
          <p className="mt-1">{error}</p>
          <button onClick={() => loadMetrics()} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">ML Model Performance</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
            Evaluation metrics for battery State of Health, Remaining Useful Life and predictive maintenance risk models.
          </p>
        </div>
        <button
          onClick={() => loadMetrics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh metrics
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Refresh failed; showing the last successfully loaded metrics. {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SOH test R²" value={formatNumber(soh?.test?.r2, 4)} helper="Higher is better" icon={Activity} tone="emerald" />
        <StatCard label="RUL test R²" value={formatNumber(rul?.test?.r2, 4)} helper="Higher is better" icon={TrendingUp} tone="blue" />
        <StatCard label="Maintenance ROC-AUC" value={formatNumber(riskTest?.roc_auc, 4)} helper="Discrimination on test set" icon={Target} tone="violet" />
        <StatCard label="Risk model recall" value={formatPercent(riskTest?.recall, 2)} helper="Share of test faults identified" icon={ShieldCheck} tone="amber" />
      </div>

      <SectionCard title="Dataset split" subtitle="The evaluation report states that the split was performed by vehicle, keeping the test vehicles separate from the training vehicles." icon={Database}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Training rows</p><p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(split?.train_rows, 0)}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Testing rows</p><p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(split?.test_rows, 0)}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Training vehicles</p><p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(split?.train_vehicles, 0)}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Testing vehicles</p><p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(split?.test_vehicles, 0)}</p></div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Split method: <span className="font-semibold capitalize text-slate-700">{split?.split_by || 'Not specified'}</span></p>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Battery State of Health (SOH)" subtitle={`Selected model: ${(soh?.chosen || 'Not specified').replaceAll('_', ' ')}`} icon={Activity}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-emerald-50 p-3"><p className="text-[11px] text-emerald-700">R²</p><p className="mt-1 text-lg font-bold text-emerald-900">{formatNumber(soh?.test?.r2, 4)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">RMSE</p><p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(soh?.test?.rmse, 3)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">MAE</p><p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(soh?.test?.mae, 3)}</p></div>
          </div>
          <div className="mt-5"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cross-validation RMSE comparison · lower is better</h3><ComparisonBars values={soh?.cv_rmse} /></div>
          <div className="mt-4 rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
            Baseline (cycle-only linear): R² <strong>{formatNumber(soh?.baseline_cycle_only_linear?.r2, 3)}</strong>, RMSE <strong>{formatNumber(soh?.baseline_cycle_only_linear?.rmse, 3)}</strong>, MAE <strong>{formatNumber(soh?.baseline_cycle_only_linear?.mae, 3)}</strong>.
          </div>
        </SectionCard>

        <SectionCard title="Remaining Useful Life (RUL)" subtitle={`Selected model: ${(rul?.chosen || 'Not specified').replaceAll('_', ' ')}`} icon={TrendingUp}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-blue-50 p-3"><p className="text-[11px] text-blue-700">R²</p><p className="mt-1 text-lg font-bold text-blue-900">{formatNumber(rul?.test?.r2, 4)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">RMSE</p><p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(rul?.test?.rmse, 2)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-500">MAE</p><p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(rul?.test?.mae, 2)}</p></div>
          </div>
          <div className="mt-5"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cross-validation RMSE comparison · lower is better</h3><ComparisonBars values={rul?.cv_rmse} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 p-3"><p className="text-[11px] text-slate-500">Late-life RUL R² (≤500 cycles)</p><p className="mt-1 font-bold text-slate-900">{formatNumber(rul?.test_late_life_rul_le_500?.r2, 4)}</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><p className="text-[11px] text-slate-500">80% interval coverage</p><p className="mt-1 font-bold text-slate-900">{formatPercent(rul?.interval_80pct_coverage, 1)}</p></div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-600">Baseline linear extrapolation: R² <strong>{formatNumber(rul?.baseline_linear_extrapolation?.r2, 3)}</strong>, RMSE <strong>{formatNumber(rul?.baseline_linear_extrapolation?.rmse, 2)}</strong>, MAE <strong>{formatNumber(rul?.baseline_linear_extrapolation?.mae, 2)}</strong>.</div>
          <p className="mt-3 text-[11px] text-slate-500">RUL is measured in charge cycles. The supplied report converts cycles to years using cycles per day.</p>
        </SectionCard>
      </div>

      <SectionCard title="Predictive maintenance risk model" subtitle={`Prediction horizon: ${formatNumber(risk?.horizon_cycles, 0)} cycles · Positive fault rate in test set: ${formatPercent(risk?.positive_rate_test, 2)}`} icon={ShieldCheck}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ['Accuracy', riskTest?.accuracy],
            ['Precision', riskTest?.precision],
            ['Recall', riskTest?.recall],
            ['F1 score', riskTest?.f1],
            ['ROC-AUC', riskTest?.roc_auc],
            ['PR-AUC', riskTest?.pr_auc],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatPercent(value, 2)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Confusion matrix</h3>
            {Array.isArray(confusion) && confusion.length === 2 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-3 bg-slate-50 text-center text-[11px] font-semibold text-slate-600"><div className="p-2">Actual / Predicted</div><div className="p-2">No fault</div><div className="p-2">Fault</div></div>
                <div className="grid grid-cols-3 text-center text-sm"><div className="bg-slate-50 p-3 text-xs font-semibold text-slate-600">No fault</div><div className="p-3 font-semibold text-slate-900">{formatNumber(confusion[0]?.[0], 0)}</div><div className="p-3 font-semibold text-slate-900">{formatNumber(confusion[0]?.[1], 0)}</div></div>
                <div className="grid grid-cols-3 border-t border-slate-200 text-center text-sm"><div className="bg-slate-50 p-3 text-xs font-semibold text-slate-600">Fault</div><div className="p-3 font-semibold text-slate-900">{formatNumber(confusion[1]?.[0], 0)}</div><div className="p-3 font-semibold text-slate-900">{formatNumber(confusion[1]?.[1], 0)}</div></div>
              </div>
            ) : <p className="text-sm text-slate-500">Confusion matrix is not available.</p>}
            <p className="mt-2 text-[11px] text-slate-500">Rows are actual classes; columns are model predictions.</p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Observed fault rate by predicted risk level</h3>
            <div className="space-y-3">
              {['High', 'Medium', 'Low', 'None'].map((level) => {
                const item = riskLevels[level];
                const rate = item?.observed_fault_rate;
                const width = typeof rate === 'number' ? Math.max(rate * 100, rate > 0 ? 1 : 0) : 0;
                const barTone = level === 'High' ? 'bg-rose-500' : level === 'Medium' ? 'bg-amber-500' : level === 'Low' ? 'bg-emerald-500' : 'bg-slate-400';
                return (
                  <div key={level}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-slate-700">{level} <span className="font-normal text-slate-400">({formatNumber(item?.rows, 0)} rows)</span></span><span className="font-semibold text-slate-900">{formatPercent(rate, 1)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.min(width, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />Interpret metrics in context</div>
          <p className="mt-1">The test set has a low positive fault rate. Accuracy alone can therefore be misleading; review precision, recall, F1, ROC-AUC and the confusion matrix together. The supplied report records a recall of {formatPercent(riskTest?.recall, 2)}, so some test faults were not identified.</p>
        </div>
      </SectionCard>

      <SectionCard title="Model evaluation notes" subtitle="Values shown on this page are read directly from the backend metrics endpoint." icon={BarChart3}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> SOH target</div><p className="mt-1 text-xs leading-relaxed text-slate-500">R², RMSE and MAE summarize how closely the test predictions match the SOH targets in the supplied evaluation dataset.</p></div>
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> RUL target</div><p className="mt-1 text-xs leading-relaxed text-slate-500">RUL errors are measured in cycles. The late-life subset is shown separately because performance differs in that range.</p></div>
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Risk target</div><p className="mt-1 text-xs leading-relaxed text-slate-500">Risk metrics evaluate fault classification over the next {formatNumber(risk?.horizon_cycles, 0)} cycles using the supplied test set.</p></div>
        </div>
      </SectionCard>

      <div className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center">
        <p><span className="font-semibold text-slate-700">Data source:</span> GET /api/v1/ml/metrics · supplied trained-model evaluation report.</p>
        <p>{lastUpdated ? `Last fetched: ${lastUpdated.toLocaleString()}` : 'Not refreshed yet'}</p>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">These are reported test-set metrics for the supplied dataset and trained models. They are not a guarantee of performance on live vehicles or unseen operating conditions.</p>
    </div>
  );
}
