
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Car,
  BatteryCharging,
  Wrench,
  Leaf,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { getDashboardSummary } from '@/lib/api';

const STATUS_COLORS = {
  active: '#10b981',
  charging: '#3b82f6',
  maintenance: '#f43f5e',
};

const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined) return 'N/A';

  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: digits,
  });
};

const formatStatus = (status) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export default function DashboardOverviewPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data = await getDashboardSummary();

        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const fleetStatusData = Object.entries(
    dashboard?.vehicle_status_counts || {}
  ).map(([status, value]) => ({
    name: formatStatus(status),
    value,
    color: STATUS_COLORS[status.toLowerCase()] || '#94a3b8',
  }));

  const batteryAvailable = dashboard?.battery?.status === 'available';
  const maintenanceAvailable =
    dashboard?.maintenance?.status === 'available';
  const sustainabilityAvailable =
    dashboard?.sustainability?.status === 'available';

  const averageSOH = batteryAvailable
    ? dashboard?.battery?.average_soh_percent
    : null;

  const totalAlerts = maintenanceAvailable
    ? dashboard?.maintenance?.total_alerts
    : null;

  const highRiskAlerts = maintenanceAvailable
    ? dashboard?.maintenance?.severity_counts?.high || 0
    : null;

  const emissionsReduction = sustainabilityAvailable
    ? dashboard?.sustainability?.average_reduction_percent
    : null;

  const totalEnergy = dashboard?.total_energy_charged_kwh;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* 1. Welcome Banner */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100/80 p-6 md:p-8 shadow-sm">

        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none hidden md:block w-96">
          <svg
            viewBox="0 0 400 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M0 180 C120 140, 200 190, 400 130 L400 200 L0 200 Z"
              fill="#10b981"
            />
            <path
              d="M50 190 C180 150, 280 170, 400 110 L400 200 L50 200 Z"
              fill="#059669"
            />
            <circle cx="320" cy="70" r="4" fill="#047857" />
            <line
              x1="320"
              y1="70"
              x2="320"
              y2="150"
              stroke="#047857"
              strokeWidth="3"
            />
            <line
              x1="320"
              y1="70"
              x2="300"
              y2="35"
              stroke="#047857"
              strokeWidth="2"
            />
            <line
              x1="320"
              y1="70"
              x2="345"
              y2="50"
              stroke="#047857"
              strokeWidth="2"
            />
            <line
              x1="320"
              y1="70"
              x2="315"
              y2="105"
              stroke="#047857"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Welcome back, Priyanshi!
              </h1>
              <span className="text-2xl">👋</span>
            </div>

            <p className="text-slate-600 text-sm md:text-base">
              Here&apos;s a quick overview of your EV fleet.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentDate}</span>
            </div>

            <Link
              href="/assistant"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Insights</span>
            </Link>

          </div>
        </div>
      </div>

      {/* API Error */}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            Unable to load dashboard data
          </div>

          <p className="mt-1">{error}</p>

          <p className="mt-1 text-xs">
            Check that the FastAPI backend is running and try refreshing.
          </p>
        </div>
      )}

      {/* 2. Top Metric Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

        {/* Total Vehicles */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Vehicles
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                {loading ? '...' : dashboard?.total_vehicles ?? 'N/A'}
              </h3>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Registered vehicles in database
          </div>
        </div>

        {/* Average Battery SOH */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Average Battery SOH
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                {loading
                  ? '...'
                  : averageSOH !== null && averageSOH !== undefined
                    ? `${formatNumber(averageSOH)}%`
                    : 'No data'}
              </h3>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            {batteryAvailable
              ? `${dashboard.battery.vehicles_with_predictions} vehicles with predictions`
              : 'Battery prediction data unavailable'}
          </div>
        </div>

        {/* Maintenance Alerts */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Maintenance Alerts
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                {loading ? '...' : totalAlerts ?? 'No data'}
              </h3>
            </div>

            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {maintenanceAvailable ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  {highRiskAlerts} High Risk
                </span>

                <span className="text-xs text-slate-400">
                  alerts recorded
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">
                Maintenance data unavailable
              </span>
            )}
          </div>
        </div>

        {/* CO2 Reduction */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Average CO₂ Reduction
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                {loading
                  ? '...'
                  : emissionsReduction !== null &&
                    emissionsReduction !== undefined
                    ? `${formatNumber(emissionsReduction)}%`
                    : 'No data'}
              </h3>
            </div>

            <div className="w-11 h-11 rounded-xl bg-teal-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Average across net-zero scenarios
          </div>
        </div>

      </div>

      {/* 3. Main Charts Section */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Fleet Status Donut */}

        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Fleet Status
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Vehicle distribution by status
              </p>
            </div>

            <Link
              href="/fleet"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              View Details
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Loading fleet data...
            </div>
          ) : fleetStatusData.length > 0 ? (

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6 my-auto">

              <div className="relative w-48 h-48 flex-shrink-0">

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {fleetStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        `${value} Vehicles`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {dashboard.total_vehicles}
                  </span>

                  <span className="text-xs text-slate-500 font-medium">
                    Vehicles
                  </span>
                </div>
              </div>

              {/* Dynamic Status Legend */}

              <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">

                {fleetStatusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between sm:justify-start gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />

                      <span className="text-xs font-medium text-slate-600">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-slate-800">
                      {item.value}
                    </span>
                  </div>
                ))}

              </div>
            </div>

          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              No fleet status data available.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total registered vehicles:{' '}
              <strong className="text-emerald-600 font-semibold">
                {loading ? '...' : dashboard?.total_vehicles ?? 0}
              </strong>
            </span>

            <span>Database summary</span>
          </div>
        </div>

        {/* Energy Consumption */}

        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Energy Consumption
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Total recorded charging energy
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 block">
                  {loading
                    ? '...'
                    : totalEnergy !== null && totalEnergy !== undefined
                      ? `${formatNumber(totalEnergy)} kWh`
                      : 'No data'}
                </span>

                <span className="text-[10px] text-emerald-600 font-medium">
                  All recorded sessions
                </span>
              </div>

              <Link
                href="/battery"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group ml-2"
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center px-4">

            {loading ? (
              <p className="text-sm text-slate-400">
                Loading energy data...
              </p>
            ) : totalEnergy !== null && totalEnergy !== undefined ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <BatteryCharging className="w-8 h-8 text-emerald-600" />
                </div>

                <p className="text-3xl font-bold text-slate-900">
                  {formatNumber(totalEnergy)} kWh
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  Total energy charged across recorded sessions
                </p>

                <p className="text-xs text-slate-400 mt-3 max-w-sm">
                  Monthly historical data is not yet provided by the
                  dashboard API. A monthly trend chart will be enabled
                  when historical aggregation is implemented.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No charging session data available.
              </p>
            )}

          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Energy source:{' '}
              <strong className="text-slate-700">
                Charging sessions
              </strong>
            </span>

            <span>Measured in kWh</span>
          </div>

        </div>
      </div>

      {/* 4. Bottom Summary Cards */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Maintenance Summary */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />

                <h3 className="text-sm font-bold text-slate-900">
                  Maintenance Overview
                </h3>
              </div>

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                {maintenanceAvailable
                  ? `${totalAlerts} Alerts`
                  : 'No data'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {maintenanceAvailable
                ? `${highRiskAlerts} high-severity alerts have been recorded. ${dashboard.maintenance.status_counts?.open || 0} alerts are currently open.`
                : 'Maintenance information is not currently available.'}
            </p>
          </div>

          <Link
            href="/maintenance"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            Review Maintenance
            <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Battery Intelligence */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />

                <h3 className="text-sm font-bold text-slate-900">
                  Battery Intelligence
                </h3>
              </div>

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {averageSOH !== null && averageSOH !== undefined
                  ? `${formatNumber(averageSOH)}% Avg SOH`
                  : 'No data'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {batteryAvailable
                ? `${dashboard.battery.vehicles_with_predictions} vehicles have battery predictions. Average remaining useful life is ${formatNumber(dashboard.battery.average_rul_cycles, 0)} cycles.`
                : 'Battery prediction data is not currently available.'}
            </p>
          </div>

          <Link
            href="/battery"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
          >
            Analyse Battery Intelligence
            <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Net-Zero Summary */}

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />

                <h3 className="text-sm font-bold text-slate-900">
                  Net-Zero Overview
                </h3>
              </div>

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                {emissionsReduction !== null &&
                emissionsReduction !== undefined
                  ? `${formatNumber(emissionsReduction)}% Reduction`
                  : 'No data'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {sustainabilityAvailable
                ? `${dashboard.sustainability.total_scenarios} scenarios recorded. Average baseline emissions: ${formatNumber(dashboard.sustainability.average_baseline_emissions_kg_co2e, 0)} kg CO₂e.`
                : 'Sustainability scenario data is not currently available.'}
            </p>
          </div>

          <Link
            href="/net-zero"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
          >
            View Emissions Summary
            <span className="ml-1">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
