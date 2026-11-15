'use client';

import { useState } from 'react';
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
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  initialVehicles, 
  batteryTrendData, 
  batteryDegradationAnalysis 
} from '@/data/mockData';

export default function BatteryIntelligencePage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState('EV-001');
  const [timeRange, setTimeRange] = useState('1Y');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const selectedVehicle = initialVehicles.find(v => v.id === selectedVehicleId) || initialVehicles[0];

  const handleRunDiagnostics = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        soh: selectedVehicle.soh,
        cellDelta: selectedVehicle.soh > 80 ? '6 mV' : '44 mV',
        thermalStatus: selectedVehicle.temp < 40 ? 'Optimal' : 'Elevated',
        imbalance: selectedVehicle.soh > 80 ? 'None detected' : 'Module 2 drift'
      });
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Battery Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Analyse battery health, degradation and remaining useful life.</p>
      </div>

      {/* 2. Vehicle Selector & Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Select Vehicle:
          </label>
          <div className="relative flex-1 sm:w-72">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {initialVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} - {v.model} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Range Pills & Diagnostic Scan */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
            {['7D', '30D', '3M', '1Y'].map((range) => (
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

          <button
            onClick={handleRunDiagnostics}
            disabled={isScanning}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Analyzing CAN BMS...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Scan Feedback Banner */}
      {scanResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm shadow-sm flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Diagnostic Scan Complete for {selectedVehicle.id} ({selectedVehicle.model}):</p>
              <p className="text-xs text-slate-700 mt-1">
                Cell Voltage Delta: <strong className="text-emerald-700">{scanResult.cellDelta}</strong> • Thermal Loop: <strong className="text-emerald-700">{scanResult.thermalStatus}</strong> • Anomaly: <strong className="text-emerald-700">{scanResult.imbalance}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setScanResult(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Top Metric Cards (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* State of Health (SOH) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">State of Health (SOH)</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{selectedVehicle.soh}%</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BatteryCharging className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              +0.5% vs benchmark
            </span>
            <span className="text-xs text-slate-400">capacity retained</span>
          </div>
        </div>

        {/* Estimated RUL */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estimated RUL</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{selectedVehicle.rulYears} years</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              (~{selectedVehicle.rulCycles?.toLocaleString()} cycles)
            </span>
            <span className="text-xs text-slate-400">until 70% threshold</span>
          </div>
        </div>

        {/* Degradation Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Degradation Rate</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{selectedVehicle.degradationRate}% / month</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Normal
            </span>
            <span className="text-xs text-slate-400">safe aging curve</span>
          </div>
        </div>
      </div>

      {/* 4. Two Main Line Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Battery SOH Trend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Battery SOH Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Historical health trajectory over time</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
              {timeRange} View
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={batteryTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} stroke="#94a3b8" fontSize={12} dy={5} />
                <YAxis domain={[80, 100]} tickLine={false} stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'State of Health']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="soh" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                  name="Recorded SOH"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Baseline starting SOH: <strong>96.0%</strong></span>
            <span>Current recorded SOH: <strong className="text-emerald-600">{selectedVehicle.soh}%</strong></span>
          </div>
        </div>

        {/* Right Chart: Battery Degradation Analysis (Actual vs Predicted) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Battery Degradation Analysis</h2>
              <p className="text-xs text-slate-500 mt-0.5">ML model forecast vs historical actuals</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Actual SOH
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Predicted SOH
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={batteryDegradationAnalysis} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} stroke="#94a3b8" fontSize={11} dy={5} />
                <YAxis domain={[80, 100]} tickLine={false} stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip 
                  formatter={(val, name) => [`${val}%`, name === 'actual' ? 'Actual SOH' : 'Predicted SOH']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Actual SOH"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Predicted SOH"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Regression Model: <strong>XGBoost + Arrhenius Deg.</strong></span>
            <span>Forecast Confidence: <strong className="text-emerald-600">96.4%</strong></span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Battery Parameters (Latest) + Health Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Battery Parameters (Latest) (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Battery Parameters (Latest)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time CAN-bus BMS readings for {selectedVehicle.id}</p>
            </div>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Live BMS Stream
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            {/* Temperature */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">Temperature</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{selectedVehicle.temp || 32}°C</h4>
                <span className="text-[10px] text-emerald-600 font-medium">Optimal (&lt;45°C)</span>
              </div>
            </div>

            {/* Voltage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">Voltage</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{selectedVehicle.voltage || 380} V</h4>
                <span className="text-[10px] text-slate-400 font-medium">Nominal: 384V</span>
              </div>
            </div>

            {/* Current */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">Current</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{selectedVehicle.current || 12} A</h4>
                <span className="text-[10px] text-slate-400 font-medium">Discharging</span>
              </div>
            </div>

            {/* Charge Cycles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase">Charge Cycles</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{selectedVehicle.chargeCycles?.toLocaleString() || '1,240'}</h4>
                <span className="text-[10px] text-emerald-600 font-medium">Rating: 3000 max</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Telemetry calibrated via vehicle edge gateway every 30 seconds.</span>
          </div>
        </div>

        {/* Right: Health Status Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Health Status
            </h2>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Battery is performing well.
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Degradation is within normal range. Cell impedance balance is stable across all 96 series cells.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cooling Loop Health:</span>
                <span className="font-semibold text-emerald-600">Normal (Flow 4.2 L/min)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Max Cell Delta:</span>
                <span className="font-semibold text-slate-800">7 mV (Safe &lt; 20mV)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Warranty Status:</span>
                <span className="font-semibold text-slate-800">Active (Year 2 of 8)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Next automated diagnostic cycle scheduled in 48 hours.
          </div>
        </div>
      </div>
    </div>
  );
}

