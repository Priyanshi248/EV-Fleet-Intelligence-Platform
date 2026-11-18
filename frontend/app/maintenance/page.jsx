'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

import {
  getMaintenanceAlerts,
  getVehicles,
  getBatteryHealth,
  updateMaintenanceAlertStatus,
} from '@/lib/api';

export default function PredictiveMaintenancePage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ML assessments are displayed separately from persistent PostgreSQL alerts.
  const [mlAssessments, setMlAssessments] = useState([]);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [updatingAlertId, setUpdatingAlertId] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  // -------------------------------------------------------
  // 1. Fetch persistent PostgreSQL alerts and separate ML assessments
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadMaintenanceData() {
      try {
        setLoading(true);
        setMlLoading(true);
        setError(null);
        setMlError(null);

        const [alertRecords, vehicleRecords] = await Promise.all([
          getMaintenanceAlerts(),
          getVehicles(),
        ]);

        if (cancelled) return;

        const vehicleMap = new Map(
          vehicleRecords.map((vehicle) => [vehicle.id, vehicle])
        );

        // Keep saved alerts sourced from PostgreSQL. Their status remains
        // independently editable through the existing PATCH endpoint.
        const mappedAlerts = alertRecords.map((record) => {
          const vehicle = vehicleMap.get(record.vehicle_id);

          const severity = record.severity
            ? String(record.severity).charAt(0).toUpperCase() +
              String(record.severity).slice(1).toLowerCase()
            : 'Unknown';

          const status = record.status
            ? String(record.status).charAt(0).toUpperCase() +
              String(record.status).slice(1).toLowerCase()
            : 'Unknown';

          return {
            id: record.id,
            vehicleDatabaseId: record.vehicle_id,
            vehicleId: `EV-${String(record.vehicle_id).padStart(3, '0')}`,
            model: vehicle
              ? `${vehicle.make} ${vehicle.model}`
              : `Vehicle ${record.vehicle_id}`,
            riskLevel: severity,
            predictedIssue: record.alert_type || 'Not specified',
            status,
            detectedDate: record.created_at
              ? new Date(record.created_at).toLocaleString()
              : 'Not available',
            resolvedDate: record.resolved_at
              ? new Date(record.resolved_at).toLocaleString()
              : null,
            severityScore: null,
            rootCause: record.description || 'No description available.',
            recommendedAction: null,
          };
        });

        setAlerts(mappedAlerts);
        setLoading(false);
        setMlLoading(true);

        // The ML health endpoint provides risk summaries from the supplied
        // demo-fleet dataset. Use the same EV-### identifier as the Fleet page.
        // Individual failures are captured per vehicle so one missing demo
        // record does not hide successful assessments for other vehicles.
        const assessmentResults = await Promise.all(
          vehicleRecords.map(async (vehicle) => {
            const vehicleId = `EV-${String(vehicle.id).padStart(3, '0')}`;
            const registryModel = `${vehicle.make} ${vehicle.model}`;

            try {
              const health = await getBatteryHealth(vehicleId);
              const risk = health?.risk || {};
              const riskLevel = risk.risk_level
                ? String(risk.risk_level).charAt(0).toUpperCase() +
                  String(risk.risk_level).slice(1).toLowerCase()
                : 'Unknown';

              return {
                vehicleDatabaseId: vehicle.id,
                vehicleId,
                registryModel,
                datasetModel: health?.model || 'Not supplied',
                riskLevel,
                failureProbability: Number.isFinite(Number(risk.failure_probability_pct))
                  ? Number(risk.failure_probability_pct)
                  : null,
                horizonCycles: risk.horizon_cycles ?? null,
                predictedIssue: risk.predicted_issue || null,
                sohPercent: health?.soh_pct ?? null,
                measuredSohPercent: health?.soh_measured_pct ?? null,
                rulCycles: health?.rul?.rul_cycles ?? null,
                rulYears: health?.rul?.rul_years ?? null,
                error: null,
              };
            } catch (mlRequestError) {
              console.error(`Unable to load ML risk for ${vehicleId}:`, mlRequestError);
              return {
                vehicleDatabaseId: vehicle.id,
                vehicleId,
                registryModel,
                datasetModel: null,
                riskLevel: 'Unavailable',
                failureProbability: null,
                horizonCycles: null,
                predictedIssue: null,
                sohPercent: null,
                measuredSohPercent: null,
                rulCycles: null,
                rulYears: null,
                error: mlRequestError.message || 'ML assessment unavailable.',
              };
            }
          })
        );

        if (!cancelled) {
          setMlAssessments(assessmentResults);
          const successfulCount = assessmentResults.filter(
            (assessment) => !assessment.error
          ).length;
          setMlError(
            assessmentResults.length > 0 && successfulCount === 0
              ? 'ML assessments could not be loaded for any vehicle. Check the Battery ML API and vehicle ID mapping.'
              : null
          );
        }
      } catch (err) {
        console.error('Unable to load maintenance data:', err);

        if (!cancelled) {
          setError(err.message || 'Unable to load maintenance alerts.');
          setAlerts([]);
          setMlError(err.message || 'Unable to load vehicle records for ML assessment.');
          setMlAssessments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setMlLoading(false);
        }
      }
    }

    loadMaintenanceData();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------
  // 2. Update alert status in PostgreSQL through PATCH API
  // -------------------------------------------------------

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      setUpdatingAlertId(alertId);
      setUpdateError(null);

      const updatedRecord = await updateMaintenanceAlertStatus(
        alertId,
        newStatus
      );

      const updatedStatus = updatedRecord.status
        ? updatedRecord.status.charAt(0).toUpperCase() +
          updatedRecord.status.slice(1).toLowerCase()
        : 'Unknown';

      const updatedResolvedDate = updatedRecord.resolved_at
        ? new Date(updatedRecord.resolved_at).toLocaleString()
        : null;

      // Update the table using the confirmed API response.
      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                status: updatedStatus,
                resolvedDate: updatedResolvedDate,
              }
            : alert
        )
      );

      // Update the currently opened modal.
      setSelectedAlert((previousAlert) =>
        previousAlert?.id === alertId
          ? {
              ...previousAlert,
              status: updatedStatus,
              resolvedDate: updatedResolvedDate,
            }
          : previousAlert
      );
    } catch (err) {
      console.error('Unable to update maintenance status:', err);

      setUpdateError(
        err.message || 'Unable to update maintenance alert.'
      );
    } finally {
      setUpdatingAlertId(null);
    }
  };

  // -------------------------------------------------------
  // 3. Calculate maintenance statistics
  // -------------------------------------------------------

  const openAlerts = alerts.filter(
    (alert) => alert.status === 'Open'
  );

  const vehiclesAtRiskCount = new Set(
    openAlerts.map((alert) => alert.vehicleDatabaseId)
  ).size;

  const highCount = openAlerts.filter(
    (alert) => alert.riskLevel === 'High'
  ).length;

  const mediumCount = openAlerts.filter(
    (alert) => alert.riskLevel === 'Medium'
  ).length;

  const lowCount = openAlerts.filter(
    (alert) => alert.riskLevel === 'Low'
  ).length;

  // ML risk counts are separate from saved PostgreSQL alert counts.
  const successfulMlAssessments = mlAssessments.filter(
    (assessment) => !assessment.error && assessment.riskLevel !== 'Unavailable'
  );
  const mlVehiclesAtRiskCount = successfulMlAssessments.filter(
    (assessment) => ['High', 'Medium', 'Low'].includes(assessment.riskLevel)
  ).length;
  const mlHighCount = successfulMlAssessments.filter(
    (assessment) => assessment.riskLevel === 'High'
  ).length;
  const mlMediumCount = successfulMlAssessments.filter(
    (assessment) => assessment.riskLevel === 'Medium'
  ).length;
  const mlLowCount = successfulMlAssessments.filter(
    (assessment) => assessment.riskLevel === 'Low'
  ).length;

  // -------------------------------------------------------
  // 4. Search and filter maintenance alerts
  // -------------------------------------------------------

  const filteredAlerts = alerts.filter((alert) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      alert.vehicleId.toLowerCase().includes(query) ||
      alert.model.toLowerCase().includes(query) ||
      alert.predictedIssue.toLowerCase().includes(query) ||
      alert.rootCause.toLowerCase().includes(query);

    const matchesRisk =
      riskFilter === 'All' ||
      alert.riskLevel === riskFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      alert.status === statusFilter;

    return (
      matchesSearch &&
      matchesRisk &&
      matchesStatus
    );
  });

  // -------------------------------------------------------
  // 5. Risk level badge
  // -------------------------------------------------------

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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Low
          </span>
        );

      case 'None':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            No predicted risk
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Unknown
          </span>
        );
    }
  };

  // -------------------------------------------------------
  // 6. Alert status badge
  // -------------------------------------------------------

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Open
          </span>
        );

      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // -------------------------------------------------------
  // 7. Page UI
  // -------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Predictive Maintenance
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Review saved maintenance alerts and separate ML-based battery risk assessments.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Vehicles at Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '—' : vehiclesAtRiskCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              High Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {loading ? '—' : highCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Medium Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
              {loading ? '—' : mediumCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Low Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {loading ? '—' : lowCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filters and Search */}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>

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

      {/* Maintenance Alerts Table */}

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

              {!loading && !error && filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => {
                    setUpdateError(null);
                    setSelectedAlert(alert);
                  }}
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

                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    Not available yet
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(alert.status)}
                  </td>

                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpdateError(null);
                        setSelectedAlert(alert);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                      View Details &rarr;
                    </button>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading maintenance alerts...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-rose-600">
                    Unable to load maintenance alerts: {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No maintenance alerts found matching your criteria.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            Data source: <strong>PostgreSQL via FastAPI</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            Displaying saved maintenance alerts
          </span>
        </div>

      </div>

      {/* ML predictive risk assessments - separate from saved alert records */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ML Predictive Risk Assessments</h2>
            <p className="text-sm text-slate-500 mt-1">
              Risk estimates generated by the supplied battery models for the mapped demo-fleet vehicle IDs.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {mlLoading ? 'Loading ML assessments...' : `${successfulMlAssessments.length} of ${mlAssessments.length} assessments available`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Vehicles Assessed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{mlLoading ? '—' : successfulMlAssessments.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500">High ML Risk</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{mlLoading ? '—' : mlHighCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Medium ML Risk</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{mlLoading ? '—' : mlMediumCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Low ML Risk</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{mlLoading ? '—' : mlLowCount}</p>
          </div>
        </div>

        {mlError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {mlError}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">ML Risk</th>
                  <th className="py-3 px-4">Failure Probability</th>
                  <th className="py-3 px-4">Predicted Issue</th>
                  <th className="py-3 px-4">Predicted SOH</th>
                  <th className="py-3 px-4">RUL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mlLoading && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">Loading ML risk assessments...</td>
                  </tr>
                )}

                {!mlLoading && mlAssessments.map((assessment) => (
                  <tr key={assessment.vehicleDatabaseId}>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{assessment.vehicleId}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Registry: {assessment.registryModel}</p>
                      {assessment.datasetModel && assessment.datasetModel !== assessment.registryModel && (
                        <p className="text-[11px] text-amber-700 mt-0.5">ML dataset: {assessment.datasetModel}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {assessment.error ? (
                        <span className="text-slate-400">Unavailable</span>
                      ) : getRiskBadge(assessment.riskLevel)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {assessment.failureProbability == null ? 'N/A' : `${assessment.failureProbability.toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {assessment.error
                        ? assessment.error
                        : assessment.predictedIssue || 'No issue predicted'}
                    </td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                      {assessment.sohPercent == null ? 'N/A' : `${Number(assessment.sohPercent).toFixed(1)}%`}
                    </td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                      {assessment.rulCycles == null ? 'N/A' : `${assessment.rulCycles.toLocaleString()} cycles`}
                    </td>
                  </tr>
                ))}

                {!mlLoading && mlAssessments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No vehicle ML assessments are available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p><strong>Data source:</strong> Battery ML health API, supplied trained models and demo-fleet dataset.</p>
            <p>These estimates are separate from saved PostgreSQL alerts. They do not create, resolve or modify maintenance records.</p>
            <p>Vehicle IDs are matched using the EV-### convention. Check the registry and ML dataset model names above to confirm that each ID represents the same vehicle. These are not live BMS measurements.</p>
          </div>
        </div>
      </section>

      {/* Alert Details Modal */}

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}

            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedAlert.vehicleId}
                  </h3>

                  <span className="text-slate-400">•</span>

                  <span className="text-sm font-semibold text-slate-700">
                    {selectedAlert.model}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-0.5">
                  Detected on {selectedAlert.detectedDate}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setUpdateError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details */}

            <div className="space-y-4 py-4 text-xs sm:text-sm">

              {/* Risk and Status */}

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Risk Level
                  </span>
                  <div className="mt-1">
                    {getRiskBadge(selectedAlert.riskLevel)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Severity Score
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    Not available
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Current Status
                  </span>
                  <div className="mt-1">
                    {getStatusBadge(selectedAlert.status)}
                  </div>
                </div>

              </div>

              {/* Alert Type */}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alert Type
                </h4>
                <p className="text-sm font-semibold text-rose-600 mt-1">
                  {selectedAlert.predictedIssue}
                </p>
              </div>

              {/* Description */}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alert Description
                </h4>
                <p className="text-xs text-slate-600 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedAlert.rootCause || 'No description available.'}
                </p>
              </div>

              {/* Recommendation */}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Action
                </h4>
                <p className="text-xs text-slate-600 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed">
                  Not provided by the current Maintenance API.
                </p>
              </div>

              {/* Timestamps */}

              <div className="divide-y divide-slate-100 text-xs">

                <div className="py-2 flex justify-between gap-3">
                  <span className="text-slate-500">
                    Created At
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {selectedAlert.detectedDate}
                  </span>
                </div>

                <div className="py-2 flex justify-between gap-3">
                  <span className="text-slate-500">
                    Resolved At
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {selectedAlert.resolvedDate || 'Not resolved'}
                  </span>
                </div>

              </div>

              {/* Update Error */}

              {updateError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700">
                  {updateError}
                </div>
              )}

              {/* Persistent Status Update Controls */}

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-600 block mb-2">
                  Update Alert Status:
                </span>

                {selectedAlert.status === 'Open' ? (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedAlert.id, 'resolved')
                    }
                    disabled={updatingAlertId === selectedAlert.id}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingAlertId === selectedAlert.id
                      ? 'Updating...'
                      : 'Mark Resolved'}
                  </button>
                ) : selectedAlert.status === 'Resolved' ? (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedAlert.id, 'open')
                    }
                    disabled={updatingAlertId === selectedAlert.id}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingAlertId === selectedAlert.id
                      ? 'Updating...'
                      : 'Reopen Alert'}
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">
                    Status update is not available for this alert state.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setUpdateError(null);
                }}
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
