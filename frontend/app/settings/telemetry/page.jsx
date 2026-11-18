'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sliders, 
  Cpu, 
  Activity, 
  Database, 
  Key, 
  Copy, 
  Check, 
  Save, 
  CheckCircle2, 
  ArrowLeft,
  RefreshCw,
  Zap,
  Thermometer,
  BatteryCharging
} from 'lucide-react';

export default function TelemetryPreferencesPage() {
  const [protocol, setProtocol] = useState('MQTT over TLS');
  const [pollingFrequency, setPollingFrequency] = useState('10');
  const [tempThreshold, setTempThreshold] = useState(45);
  const [lowSocThreshold, setLowSocThreshold] = useState(20);
  const [cellDeltaThreshold, setCellDeltaThreshold] = useState(25);
  const [dataRetentionDays, setDataRetentionDays] = useState('90');
  const [apiKey, setApiKey] = useState('ev_live_sec_89fa430b8c2e99a81b490');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `ev_live_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(newKey);
    alert('New Edge Telemetry API token generated successfully.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Telemetry Preferences</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Configure CAN-bus sampling rates, sensor alert thresholds and IoT API gateways</p>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings/account"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Account Settings
          </Link>
          <Link
            href="/settings/security"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Security & Roles
          </Link>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Telemetry sampling rates and threshold parameters updated across all 120 connected gateway units!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ingestion & Edge Gateway Protocol */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>IoT Ingestion Architecture & Frequency</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transmission Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              >
                <option value="MQTT over TLS">MQTT over TLS (Port 8883 - Recommended)</option>
                <option value="WebSocket Secure">WebSocket Secure (WSS - Port 443)</option>
                <option value="HTTP/2 REST">HTTP/2 REST API Batch Push</option>
                <option value="CoAP UDP">CoAP UDP (Low Bandwidth Narrowband)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Gateway Polling Interval</label>
              <select
                value={pollingFrequency}
                onChange={(e) => setPollingFrequency(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
              >
                <option value="5">Real-time Rapid (Every 5 seconds - DC Fast Charging)</option>
                <option value="10">Active Telemetry (Every 10 seconds - In Operation)</option>
                <option value="30">Standard Rate (Every 30 seconds - City Delivery)</option>
                <option value="60">Battery Conservation (Every 60 seconds - Overnight Sleep)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Sensor Thresholds */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Automated BMS Trigger Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs sm:text-sm">
            {/* Temperature */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  Thermal Alarm
                </span>
                <span className="text-base font-extrabold text-rose-600">{tempThreshold}°C</span>
              </div>
              <input
                type="range"
                min="35"
                max="60"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Flags critical warning and cuts fast-charge current if pack hits {tempThreshold}°C.
              </p>
            </div>

            {/* Low SOC */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-amber-500" />
                  Low SOC Warning
                </span>
                <span className="text-base font-extrabold text-amber-600">{lowSocThreshold}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                value={lowSocThreshold}
                onChange={(e) => setLowSocThreshold(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Notifies depot dispatch when vehicle drops below {lowSocThreshold}% range reserve.
              </p>
            </div>

            {/* Cell Delta */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Max Cell Delta
                </span>
                <span className="text-base font-extrabold text-emerald-600">{cellDeltaThreshold} mV</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={cellDeltaThreshold}
                onChange={(e) => setCellDeltaThreshold(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Schedules cell-balancing maintenance when voltage imbalance exceeds {cellDeltaThreshold} mV.
              </p>
            </div>
          </div>
        </div>

        {/* Data Retention & API Gateway */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            <span>Edge Telemetry Token & Integration API</span>
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Edge API Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                  title="Generate new token"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">External Webhook Gateway URL</label>
              <input
                type="text"
                readOnly
                value="https://telemetry.evfleet.internal/api/v1/telemetry/stream"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Post raw J1939 CAN frame batches to this endpoint with Bearer auth token header.
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Apply Telemetry Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

