'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Wrench, 
  X, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { maintenanceStats, maintenanceAlerts as initialAlerts } from '@/data/mockData';

export default function PredictiveMaintenancePage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      alert.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.predictedIssue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'All' || alert.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'All' || alert.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const highCount = alerts.filter(a => a.riskLevel === 'High').length;
  const mediumCount = alerts.filter(a => a.riskLevel === 'Medium').length;
  const lowCount = alerts.filter(a => a.riskLevel === 'Low').length;
  const totalRiskCount = alerts.length;

  const handleUpdateStatus = (alertId, newStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert(prev => ({ ...prev, status: newStatus }));
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            Scheduled
          </span>
        );
      case 'Completed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Predictive Maintenance</h1>
        <p className="text-sm text-slate-500 mt-1">Identify at-risk vehicles and get AI-powered maintenance recommendations.</p>
      </div>

      {/* 2. Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
        {/* Vehicles at Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicles at Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalRiskCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{highCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Medium Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{mediumCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{lowCount}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vehicle ID or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-auto">
          {filteredAlerts.length} alerts visible
        </div>
      </div>

      {/* 4. Maintenance Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Vehicle ID</th>
                <th className="py-3.5 px-4">Model</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Predicted Issue</th>
                <th className="py-3.5 px-4">Recommendation</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {alert.vehicleId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    {alert.model}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getRiskBadge(alert.riskLevel)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {alert.predictedIssue}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {alert.recommendation}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                      View Details &rarr;
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No maintenance alerts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>AI Predictive Model: <strong>LSTM + Sensor Gradient Analysis</strong></span>
          <span className="text-[11px] text-slate-400">Telemetry evaluated every 10 minutes</span>
        </div>
      </div>

      {/* 5. Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedAlert.vehicleId}</h3>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm font-semibold text-slate-700">{selectedAlert.model}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Detected on {selectedAlert.detectedDate}</p>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Risk Level</span>
                  <div className="mt-1">{getRiskBadge(selectedAlert.riskLevel)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Severity Score</span>
                  <span className="text-base font-bold text-slate-900">{selectedAlert.severityScore}/100</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Predicted Issue</h4>
                <p className="text-sm font-semibold text-rose-600 mt-1">{selectedAlert.predictedIssue}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Root Cause Diagnostics</h4>
                <p className="text-xs text-slate-600 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedAlert.rootCause}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommended Action</h4>
                <p className="text-xs text-slate-700 mt-1 p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 font-medium leading-relaxed">
                  {selectedAlert.recommendedAction}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-600 block mb-2">Update Alert State:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Pending')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedAlert.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Scheduled')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedAlert.status === 'Scheduled'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Schedule Service
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Completed')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedAlert.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

