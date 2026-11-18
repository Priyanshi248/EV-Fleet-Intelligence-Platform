
'use client';

import { useEffect, useState } from 'react';

import {
  BatteryCharging,
  Calendar,
  TrendingDown,
  Thermometer,
  Zap,
  Gauge,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Info,
  Activity,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

import { initialVehicles } from '@/data/mockData';
import { getBatteryHealth } from '@/lib/api';

function formatValue(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(digits);
}

function formatInteger(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }

  return Number(value).toLocaleString();
}

export default function BatteryIntelligencePage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState('EV-001');
  const [timeRange, setTimeRange] = useState('1Y');

  const [batteryHealth, setBatteryHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  const selectedVehicle =
    initialVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ||
    initialVehicles[0];

  // --------------------------------------------------
  // Load vehicle-specific ML battery health data
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadBatteryHealth() {
      setIsLoadingHealth(true);
      setHealthError('');
      setBatteryHealth(null);

      try {
        const result = await getBatteryHealth(selectedVehicleId);

        if (!cancelled) {
          setBatteryHealth(result);
        }
      } catch (error) {
        if (!cancelled) {
          setHealthError(
            error.message || 'Unable to load battery health information.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHealth(false);
        }
      }
    }

    loadBatteryHealth();

    return () => {
      cancelled = true;
    };
  }, [selectedVehicleId, refreshKey]);

  // --------------------------------------------------
  // API response values
  // --------------------------------------------------

  const soh = batteryHealth?.soh_pct;
  const measuredSoh = batteryHealth?.soh_measured_pct;

  const rul = batteryHealth?.rul || {};
  const degradation = batteryHealth?.degradation || {};
  const canBus = batteryHealth?.can_bus || {};
  const risk = batteryHealth?.risk || {};

  const trendData = Array.isArray(batteryHealth?.trend)
    ? batteryHealth.trend
    : [];

  const analysisData = Array.isArray(batteryHealth?.analysis)
    ? batteryHealth.analysis
    : [];

  // The API provides monthly history, so the filters use monthly records.
  const visibleTrendData =
    timeRange === '3M'
      ? trendData.slice(-3)
      : timeRange === '6M'
        ? trendData.slice(-6)
        : trendData;

  // Compare model-estimated SOH with the fleet benchmark.
  const benchmarkSoh = degradation.benchmark_soh_pct;

  const benchmarkDifference =
    soh != null && benchmarkSoh != null
      ? Number(soh) - Number(benchmarkSoh)
      : null;

  const riskLevel = risk.risk_level || 'Unavailable';
  const normalizedRiskLevel = String(riskLevel).toLowerCase();

  const isLowRisk = ['none', 'low'].includes(normalizedRiskLevel);

  const riskStyles = isLowRisk
    ? {
        container: 'bg-emerald-50/80 border-emerald-200',
        icon: 'bg-emerald-500',
        title: 'text-emerald-950',
        text: 'text-emerald-800',
        value: 'text-emerald-700',
      }
    : normalizedRiskLevel === 'moderate'
      ? {
          container: 'bg-amber-50 border-amber-200',
          icon: 'bg-amber-500',
          title: 'text-amber-950',
          text: 'text-amber-800',
          value: 'text-amber-700',
        }
      : {
          container: 'bg-rose-50 border-rose-200',
          icon: 'bg-rose-500',
          title: 'text-rose-950',
          text: 'text-rose-800',
          value: 'text-rose-700',
        };

  const riskMessage =
    normalizedRiskLevel === 'none'
      ? 'No elevated battery failure risk was detected by the ML model.'
      : normalizedRiskLevel === 'low'
        ? 'The ML model currently indicates a low battery failure risk.'
        : risk.predicted_issue || `Battery risk level: ${riskLevel}.`;

  const stressDrivers = Array.isArray(degradation.stress_drivers)
    ? degradation.stress_drivers
    : [];

  // --------------------------------------------------
  // Refresh the ML analysis for the selected vehicle
  // --------------------------------------------------

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <div className="space-y-6">

      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Battery Intelligence
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Analyse vehicle-specific battery health, degradation and remaining useful life.
        </p>
      </div>

      {/* 2. Vehicle Selector and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label
            htmlFor="battery-vehicle"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
          >
            Select Vehicle:
          </label>

          <div className="relative flex-1 sm:w-72">
            <select
              id="battery-vehicle"
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {initialVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.id} - {vehicle.model} ({vehicle.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">

          {/* Monthly history filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
            {['3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Refresh ML analysis */}
          <button
            onClick={handleRefresh}
            disabled={isLoadingHealth}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingHealth ? 'animate-spin' : ''
              }`}
            />

            <span>
              {isLoadingHealth ? 'Loading...' : 'Refresh Analysis'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Loading State */}
      {isLoadingHealth && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
          Loading Battery ML analysis for {selectedVehicleId}...
        </div>
      )}

      {/* 4. API Error */}
      {healthError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />

          <div>
            <p className="font-bold">Unable to load battery analysis</p>
            <p className="mt-1">{healthError}</p>

            <button
              onClick={handleRefresh}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* 5. ML Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* State of Health */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Predicted State of Health
              </p>

              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                {isLoadingHealth ? '...' : `${formatValue(soh)}%`}
              </h3>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BatteryCharging className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              Measured: {formatValue(measuredSoh)}%
            </span>

            <span className="text-xs text-slate-400">
              Model-estimated SOH
            </span>
          </div>

          {benchmarkDifference !== null && (
            <p className="text-xs text-slate-500 mt-2">
              {Math.abs(benchmarkDifference).toFixed(1)} percentage points{' '}
              {benchmarkDifference >= 0 ? 'above' : 'below'} benchmark
            </p>
          )}
        </div>

        {/* Remaining Useful Life */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estimated Remaining Useful Life
              </p>

              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                {isLoadingHealth
                  ? '...'
                  : rul.rul_years != null
                    ? `${formatValue(rul.rul_years, 2)} years`
                    : '—'}
              </h3>
            </div>

            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              (~{formatInteger(rul.rul_cycles)} cycles)
            </span>

            <span className="text-xs text-slate-400">
              Until 70% SOH threshold
            </span>
          </div>
        </div>

        {/* Degradation Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Degradation Rate
              </p>

              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                {isLoadingHealth
                  ? '...'
                  : `${formatValue(
                      degradation.degradation_rate_pct_per_month
                    )}% / month`}
              </h3>
            </div>

            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {degradation.vs_benchmark || 'Benchmark unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Battery Trend and Degradation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SOH Trend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Battery SOH Trend
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Historical health trajectory for {selectedVehicleId}
              </p>
            </div>

            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
              {timeRange} View
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            {visibleTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={visibleTrendData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={12}
                    dy={5}
                  />

                  <YAxis
                    domain={[60, 100]}
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={12}
                    unit="%"
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `${formatValue(value)}%`,
                      name === 'benchmark' ? 'Benchmark SOH' : 'Measured SOH',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="soh"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, fill: '#059669' }}
                    name="Measured SOH"
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Fleet Benchmark"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                {isLoadingHealth
                  ? 'Loading historical data...'
                  : 'No historical SOH records available.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between gap-3 flex-wrap">
            <span>
              First recorded SOH:{' '}
              <strong>
                {trendData.length > 0
                  ? `${formatValue(trendData[0].soh)}%`
                  : '—'}
              </strong>
            </span>

            <span>
              Latest measured SOH:{' '}
              <strong className="text-emerald-600">
                {formatValue(measuredSoh)}%
              </strong>
            </span>
          </div>
        </div>

        {/* Degradation Analysis */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Battery Degradation Analysis
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Historical actuals and vehicle-specific ML forecast
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            {analysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analysisData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={11}
                    dy={5}
                  />

                  <YAxis
                    domain={[60, 100]}
                    tickLine={false}
                    stroke="#94a3b8"
                    fontSize={12}
                    unit="%"
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      value == null ? '—' : `${formatValue(value)}%`,
                      name === 'actual' ? 'Actual SOH' : 'Predicted SOH',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: '#3b82f6',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    name="Actual SOH"
                    connectNulls={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{
                      r: 4,
                      fill: '#f59e0b',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    name="Predicted SOH"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                {isLoadingHealth
                  ? 'Loading degradation analysis...'
                  : 'No degradation analysis available.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between gap-3 flex-wrap">
            <span>
              Model: <strong>Battery ML prediction service</strong>
            </span>

            <span>
              RUL Interval Confidence:{' '}
              <strong className="text-emerald-600">
                {rul.interval_confidence != null
                  ? `${formatValue(Number(rul.interval_confidence) * 100, 0)}%`
                  : '—'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 7. Latest Battery Parameters and Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Latest Model Input Parameters */}
        <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Latest Battery Parameters
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Latest model input snapshot for {selectedVehicleId}
              </p>
            </div>

            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-full font-medium">
              ML data
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">

            {/* Temperature */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  Temperature
                </p>

                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  {canBus.temperature_c != null
                    ? `${formatValue(canBus.temperature_c)}°C`
                    : '—'}
                </h4>

                <span className="text-[10px] text-slate-400">
                  Average pack temperature
                </span>
              </div>
            </div>

            {/* Voltage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  Voltage
                </p>

                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  {canBus.voltage_v != null
                    ? `${formatValue(canBus.voltage_v, 0)} V`
                    : '—'}
                </h4>

                <span className="text-[10px] text-slate-400">
                  Battery pack voltage
                </span>
              </div>
            </div>

            {/* Current */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  Current
                </p>

                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  {canBus.current_a != null
                    ? `${formatValue(canBus.current_a)} A`
                    : '—'}
                </h4>

                <span className="text-[10px] text-slate-400">
                  Battery current
                </span>
              </div>
            </div>

            {/* Cycles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">
                  Charge Cycles
                </p>

                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatInteger(canBus.cycles)}
                </h4>

                <span className="text-[10px] text-slate-400">
                  Recorded cycles
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />

            <span>
              Values are returned by the vehicle-specific Battery ML service.
              They are not a live sensor stream.
            </span>
          </div>
        </div>

        {/* Health Status */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div>
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Health Status
            </h2>

            <div
              className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${riskStyles.container}`}
            >
              <div
                className={`w-9 h-9 rounded-full text-white flex items-center justify-center flex-shrink-0 mt-0.5 ${riskStyles.icon}`}
              >
                {isLowRisk ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>

              <div>
                <h4 className={`text-sm font-bold ${riskStyles.title}`}>
                  {isLoadingHealth
                    ? 'Loading health status...'
                    : healthError
                      ? 'Health status unavailable'
                      : normalizedRiskLevel === 'none'
                        ? 'No elevated risk detected'
                        : `Battery risk: ${riskLevel}`}
                </h4>

                <p className={`text-xs mt-1 leading-relaxed ${riskStyles.text}`}>
                  {isLoadingHealth
                    ? 'Retrieving the selected vehicle analysis.'
                    : healthError
                      ? 'The ML health service could not be reached.'
                      : riskMessage}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-600">

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">
                  Failure Probability:
                </span>

                <span className={`font-semibold ${riskStyles.value}`}>
                  {risk.failure_probability_pct != null
                    ? `${formatValue(risk.failure_probability_pct)}%`
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 gap-3">
                <span className="text-slate-500">
                  Fleet Benchmark:
                </span>

                <span className="font-semibold text-slate-800 text-right">
                  {degradation.vs_benchmark || 'Unavailable'}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">
                  End-of-Life Threshold:
                </span>

                <span className="font-semibold text-slate-800">
                  {rul.eol_threshold_soh_pct != null
                    ? `${formatValue(rul.eol_threshold_soh_pct, 0)}% SOH`
                    : '—'}
                </span>
              </div>
            </div>

            {stressDrivers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Identified Stress Drivers
                </p>

                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  {stressDrivers.slice(0, 4).map((driver, index) => (
                    <li key={index}>
                      {typeof driver === 'string'
                        ? driver
                        : JSON.stringify(driver)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Vehicle-specific assessment from the Battery ML service.
          </div>
        </div>
      </div>

      {/* 8. Model Information */}
      {batteryHealth && (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Activity className="w-4 h-4 shrink-0" />

          <p>
            Showing Battery ML results for{' '}
            <strong className="text-slate-700">{selectedVehicleId}</strong>.
            Predicted SOH, measured SOH, RUL, degradation, historical readings
            and risk are provided by the backend model service.
          </p>
        </div>
      )}

    </div>
  );
}
