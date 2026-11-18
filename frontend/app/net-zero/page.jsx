
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  Target,
  TrendingDown,
  Database,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BarChart3,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

import {
  getNetZeroSummary,
  getNetZeroScenarios,
  createNetZeroScenario,
} from '@/lib/api';

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

const kgToTonnes = (value) => Number(value || 0) / 1000;

const formatTonnes = (value) => `${formatNumber(kgToTonnes(value))} t`;

const formatDate = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function NetZeroTrackingPage() {
  const [summary, setSummary] = useState(null);
  const [scenarios, setScenarios] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    baseline: '100000',
    projected: '70000',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResult, scenariosResult] = await Promise.all([
        getNetZeroSummary(),
        getNetZeroScenarios(),
      ]);

      setSummary(summaryResult);

      const scenarioList = Array.isArray(scenariosResult)
        ? scenariosResult
        : scenariosResult?.scenarios || [];

      setScenarios(scenarioList);
    } catch (err) {
      setError(
        err.message || 'Unable to load Net-Zero data. Check the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedScenario = useMemo(() => {
    if (!scenarios.length) return null;

    const selectedName =
      typeof summary?.selected_scenario === 'string'
        ? summary.selected_scenario
        : summary?.selected_scenario?.name;

    if (selectedName) {
      const matchingScenario = scenarios.find(
        (scenario) => scenario.name === selectedName
      );

      if (matchingScenario) return matchingScenario;
    }

    return scenarios.reduce((best, current) =>
      Number(current.reduction_percent || 0) >
      Number(best.reduction_percent || 0)
        ? current
        : best
    );
  }, [scenarios, summary]);

  const chartData = useMemo(
    () =>
      scenarios.map((scenario) => ({
        name:
          scenario.name.length > 20
            ? `${scenario.name.slice(0, 20)}...`
            : scenario.name,
        baseline: kgToTonnes(scenario.baseline_emissions_kg_co2e),
        projected: kgToTonnes(scenario.projected_emissions_kg_co2e),
      })),
    [scenarios]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateScenario = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const baseline = Number(form.baseline);
    const projected = Number(form.projected);

    if (!form.name.trim()) {
      setError('Please enter a scenario name.');
      return;
    }

    if (!Number.isFinite(baseline) || baseline <= 0) {
      setError('Baseline emissions must be greater than zero.');
      return;
    }

    if (!Number.isFinite(projected) || projected < 0) {
      setError('Projected emissions cannot be negative.');
      return;
    }

    if (projected > baseline) {
      setError('Projected emissions cannot exceed baseline emissions.');
      return;
    }

    setSaving(true);

    try {
      await createNetZeroScenario({
        name: form.name.trim(),
        baseline_emissions_kg_co2e: baseline,
        projected_emissions_kg_co2e: projected,
        assumptions: {
          source: 'user_defined_demo',
          note: 'User-entered demonstration scenario. Values are not independently measured.',
        },
      });

      setSuccess('Scenario saved successfully.');

      setForm({
        name: '',
        baseline: '100000',
        projected: '70000',
      });

      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save the scenario.');
    } finally {
      setSaving(false);
    }
  };

  const baseline = selectedScenario?.baseline_emissions_kg_co2e;
  const projected = selectedScenario?.projected_emissions_kg_co2e;
  const avoided = selectedScenario?.avoided_emissions_kg_co2e;
  const reduction = selectedScenario?.reduction_percent;

  const scenarioCount =
    summary?.count ?? summary?.total_scenarios ?? scenarios.length;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Net-Zero Tracking
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Monitor emissions scenarios and evaluate potential carbon
            reduction.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh Data
        </button>
      </div>

      {/* Data notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

        <div>
          <p className="text-sm font-semibold text-amber-900">
            Demonstration data
          </p>
          <p className="text-xs text-amber-800 mt-1">
            These scenarios are stored in the project database, but their
            emissions inputs are simulated or user-entered demonstration
            values. They should not be interpreted as measured fleet emissions.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && !summary && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-3">
            Loading Net-Zero data...
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">
            {success}
          </p>
        </div>
      )}

      {/* Main content */}
      {!loading && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Baseline Emissions
                  </p>

                  <h3 className="text-2xl font-extrabold text-slate-900 mt-3">
                    {baseline != null ? formatTonnes(baseline) : '--'}
                  </h3>
                </div>

                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Selected scenario baseline
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Projected Emissions
                  </p>

                  <h3 className="text-2xl font-extrabold text-slate-900 mt-3">
                    {projected != null ? formatTonnes(projected) : '--'}
                  </h3>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Estimated emissions after reduction
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Emissions Avoided
                  </p>

                  <h3 className="text-2xl font-extrabold text-emerald-700 mt-3">
                    {avoided != null ? formatTonnes(avoided) : '--'}
                  </h3>
                </div>

                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Leaf className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Baseline minus projected emissions
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reduction Percentage
                  </p>

                  <h3 className="text-2xl font-extrabold text-emerald-700 mt-3">
                    {reduction != null
                      ? `${formatNumber(reduction)}%`
                      : '--'}
                  </h3>
                </div>

                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Highest-reduction scenario
              </p>
            </div>
          </div>

          {/* Selected scenario and chart */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Leaf className="w-5 h-5 text-emerald-600" />

                <h2 className="text-base font-bold text-slate-900">
                  Best Reduction Scenario
                </h2>
              </div>

              {selectedScenario ? (
                <div className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Scenario name
                    </p>

                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {selectedScenario.name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs font-medium text-emerald-700">
                      Potential emissions reduction
                    </p>

                    <p className="text-3xl font-extrabold text-emerald-800 mt-1">
                      {formatNumber(selectedScenario.reduction_percent)}%
                    </p>

                    <div className="mt-3 h-2 rounded-full bg-emerald-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(selectedScenario.reduction_percent || 0)
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Baseline</span>
                      <span className="font-semibold text-slate-800">
                        {formatNumber(
                          selectedScenario.baseline_emissions_kg_co2e
                        )}{' '}
                        kg CO₂e
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Projected</span>
                      <span className="font-semibold text-slate-800">
                        {formatNumber(
                          selectedScenario.projected_emissions_kg_co2e
                        )}{' '}
                        kg CO₂e
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                      <span className="text-slate-500">Avoided</span>
                      <span className="font-bold text-emerald-700">
                        {formatNumber(
                          selectedScenario.avoided_emissions_kg_co2e
                        )}{' '}
                        kg CO₂e
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Scenario assumptions
                    </p>

                    {selectedScenario.assumptions &&
                    Object.keys(selectedScenario.assumptions).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(selectedScenario.assumptions).map(
                          ([key, value]) => (
                            <div key={key}>
                              <p className="text-[11px] text-slate-500 capitalize">
                                {key.replaceAll('_', ' ')}
                              </p>

                              <p className="text-xs text-slate-700 break-words">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No assumptions recorded.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No scenarios are available yet.
                </p>
              )}
            </div>

            <div className="xl:col-span-8 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Emissions Scenario Comparison
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Baseline and projected emissions for saved scenarios
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  Unit: tonnes CO₂e
                </span>
              </div>

              {chartData.length > 0 ? (
                <div className="h-80 w-full pt-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 35 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        stroke="#64748b"
                        fontSize={11}
                        angle={-15}
                        textAnchor="end"
                        interval={0}
                      />

                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(value) => `${value} t`}
                      />

                      <Tooltip
                        formatter={(value, name) => [
                          `${formatNumber(value)} tonnes`,
                          name === 'baseline'
                            ? 'Baseline emissions'
                            : 'Projected emissions',
                        ]}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />

                      <Legend
                        verticalAlign="top"
                        height={35}
                        formatter={(value) =>
                          value === 'baseline'
                            ? 'Baseline emissions'
                            : 'Projected emissions'
                        }
                      />

                      <Bar
                        dataKey="baseline"
                        fill="#64748b"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={42}
                      />

                      <Bar
                        dataKey="projected"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={42}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <BarChart3 className="w-9 h-9 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600 mt-3">
                    No scenario data to compare
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Create a scenario to populate this chart.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Create scenario and scenario history */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <PlusCircle className="w-5 h-5 text-emerald-600" />

                <h2 className="text-base font-bold text-slate-900">
                  Create Scenario
                </h2>
              </div>

              <p className="text-xs text-slate-500 mt-3 mb-4">
                Enter emissions values to calculate a new reduction scenario.
                Values must be in kg CO₂e.
              </p>

              <form
                onSubmit={handleCreateScenario}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Scenario Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. 40 Percent Reduction Plan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Baseline Emissions (kg CO₂e)
                  </label>

                  <input
                    type="number"
                    name="baseline"
                    min="1"
                    step="any"
                    value={form.baseline}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Projected Emissions (kg CO₂e)
                  </label>

                  <input
                    type="number"
                    name="projected"
                    min="0"
                    step="any"
                    value={form.projected}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  Reduction is calculated as:
                  <p className="font-semibold text-slate-800 mt-1">
                    ((Baseline - Projected) / Baseline) × 100
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Scenario...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Save Scenario
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="xl:col-span-8 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Saved Emissions Scenarios
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Scenarios retrieved from the PostgreSQL database
                  </p>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  {scenarioCount} Scenarios
                </span>
              </div>

              {scenarios.length > 0 ? (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sm:text-[11px]">
                      <tr>
                        <th className="px-3 py-3 font-semibold">
                          Scenario
                        </th>
                        <th className="px-3 py-3 font-semibold text-right">
                          Baseline (kg)
                        </th>
                        <th className="px-3 py-3 font-semibold text-right">
                          Projected (kg)
                        </th>
                        <th className="px-3 py-3 font-semibold text-right">
                          Reduction
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {scenarios.map((scenario) => (
                        <tr
                          key={scenario.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-3 py-3 font-semibold text-slate-800 min-w-40">
                            {scenario.name}
                          </td>

                          <td className="px-3 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatNumber(
                              scenario.baseline_emissions_kg_co2e
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatNumber(
                              scenario.projected_emissions_kg_co2e
                            )}
                          </td>

                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <span className="font-bold text-emerald-700">
                              {formatNumber(scenario.reduction_percent)}%
                            </span>
                          </td>

                          <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(scenario.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Database className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 mt-3">
                    No saved scenarios
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Create your first scenario using the form.
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Database className="w-4 h-4 text-slate-400" />
                Data retrieved from the Net-Zero API
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
