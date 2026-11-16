'use client';
import {
  getVehicles,
  getVehicleTelemetry,
  getChargingSessions,
  getBatteryPredictions,
} from '@/lib/api';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Car, 
  CheckCircle2, 
  Zap, 
  Wrench, 
  PowerOff, 
  Search, 
  Plus, 
  Filter, 
  X, 
  Battery, 
  MapPin, 
  Calendar, 
  Gauge, 
  User, 
  Shield, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Download
} from 'lucide-react';
import VehicleGraphic from '@/components/VehicleGraphic';


const STATUS_MAP = {
  active: 'In Operation',
  charging: 'Charging',
  maintenance: 'Maintenance',
  offline: 'Offline',
};

function mapVehicle(vehicle, telemetry = []) {
  const latestTelemetry = [...telemetry].sort(
    (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
  )[0];

  return {
    databaseId: vehicle.id,
    id: `EV-${String(vehicle.id).padStart(3, '0')}`,
    make: vehicle.make,
    model: `${vehicle.make} ${vehicle.model}`,
    batteryCapacity: vehicle.battery_capacity_kwh,
    rangeLeft: vehicle.range_km,
    battery: latestTelemetry?.state_of_charge_percent ?? null,
    temperature: latestTelemetry?.battery_temperature_c ?? null,
    voltage: latestTelemetry?.battery_voltage_v ?? null,
    current: latestTelemetry?.battery_current_a ?? null,
    status: STATUS_MAP[vehicle.status] || vehicle.status,
    createdAt: vehicle.created_at,
    depot: null,
    driver: null,
    odometer: null,
    soh: null,
    rulCycles: null,
    chargingSessions: [],
  };
}

function FleetMonitoringContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [fleetError, setFleetError] = useState(null);
  const [selectedChargingSessions, setSelectedChargingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedBatteryPredictions, setSelectedBatteryPredictions] = useState([]);
  const [loadingBatteryPredictions, setLoadingBatteryPredictions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [depotFilter, setDepotFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync search param from URL if present
  useEffect(() => {
    const q = searchParams?.get('search');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Fetch vehicles and their latest available telemetry.
  useEffect(() => {
    let cancelled = false;

    async function loadFleet() {
      try {
        setLoadingVehicles(true);
        setFleetError(null);
        const records = await getVehicles();

        const mappedVehicles = await Promise.all(
          records.map(async (vehicle) => {
            try {
              const telemetry = await getVehicleTelemetry(vehicle.id);
              return mapVehicle(vehicle, telemetry);
            } catch (error) {
              console.error(`Telemetry unavailable for vehicle ${vehicle.id}:`, error);
              return mapVehicle(vehicle);
            }
          })
        );

        if (!cancelled) {
          setVehicles(mappedVehicles);
          setSelectedVehicle(mappedVehicles[0] || null);
        }
      } catch (error) {
        if (!cancelled) {
          setFleetError(error.message || 'Unable to load fleet vehicles.');
        }
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    }

    loadFleet();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch charging history for the selected vehicle.
  useEffect(() => {
    let cancelled = false;

    async function loadChargingSessions() {
      if (!selectedVehicle?.databaseId) {
        setSelectedChargingSessions([]);
        return;
      }

      try {
        setLoadingSessions(true);
        const sessions = await getChargingSessions(selectedVehicle.databaseId);
        if (!cancelled) setSelectedChargingSessions(sessions);
      } catch (error) {
        console.error('Unable to load charging sessions:', error);
        if (!cancelled) setSelectedChargingSessions([]);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    }

    loadChargingSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedVehicle?.databaseId]);

  useEffect(() => {
  let cancelled = false;

  async function loadBatteryPredictions() {
    if (!selectedVehicle?.databaseId) {
      setSelectedBatteryPredictions([]);
      return;
    }

    try {
      setLoadingBatteryPredictions(true);

      const predictions = await getBatteryPredictions(
        selectedVehicle.databaseId
      );

      if (!cancelled) {
        setSelectedBatteryPredictions(predictions);
      }
    } catch (error) {
      console.error('Unable to load battery predictions:', error);

      if (!cancelled) {
        setSelectedBatteryPredictions([]);
      }
    } finally {
      if (!cancelled) {
        setLoadingBatteryPredictions(false);
      }
    }
  }

  loadBatteryPredictions();

  return () => {
    cancelled = true;
  };
}, [selectedVehicle?.databaseId]);

  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    id: `EV-${String(vehicles.length + 1).padStart(3, '0')}`,
    model: 'Tata Ace EV',
    battery: 95,
    status: 'In Operation',
    depot: 'Delhi',
    rangeLeft: 220,
    odometer: 1500,
    consumption: 0.18,
    driver: 'Ramesh Patel'
  });

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.driver?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesDepot = depotFilter === 'All' || v.depot === depotFilter;
    return matchesSearch && matchesStatus && matchesDepot;
  });

  // Calculate status counts
  const totalCount = vehicles.length;
  const inOperationCount = vehicles.filter(v => v.status === 'In Operation').length;
  const chargingCount = vehicles.filter(v => v.status === 'Charging').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;
  const offlineCount = vehicles.filter(v => v.status === 'Offline').length;

  const handleAddVehicle = (e) => {
    e.preventDefault();
    window.alert('Vehicle registration is not connected yet. The backend POST endpoint must be implemented first.');
    setIsAddModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = "Vehicle ID,Model,Battery SOC,Status,Battery Capacity (kWh),Rated Range (km)\\n";
    const rows = filteredVehicles.map(v => `"${v.id}","${v.model}","${v.battery ?? 'N/A'}","${v.status}","${v.batteryCapacity ?? 'N/A'}","${v.rangeLeft ?? 'N/A'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EV_Fleet_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Operation':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          In Operation
        </span>;
      case 'Charging':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Charging
        </span>;
      case 'Maintenance':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          Maintenance
        </span>;
      case 'Offline':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Offline
        </span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fleet Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Track real-time status and performance of all vehicles.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Fleet CSV</span>
        </button>
      </div>

      {/* 2. Top Summary Stat Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Vehicles</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* In Operation */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">In Operation</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{inOperationCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Charging */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Charging</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{chargingCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Maintenance</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{maintenanceCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Offline */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-medium text-slate-500">Offline</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{offlineCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <PowerOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Action Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vehicle ID or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-700"
          >
            <option value="All">All Status</option>
            <option value="In Operation">In Operation</option>
            <option value="Charging">Charging</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Offline">Offline</option>
          </select>

          {/* Depot Dropdown */}
          <select
            value={depotFilter}
            onChange={(e) => setDepotFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-700"
          >
            <option value="All">All Depots</option>

          </select>
        </div>

        {/* Add Vehicle Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {fleetError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {fleetError}
        </div>
      )}

      {/* 4. Split Layout: Vehicle Table (Left) + Detail Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Vehicle List Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vehicle ID</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Battery (SOC)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-3 text-right">Depot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => {
                  const isSelected = selectedVehicle?.id === vehicle.id;
                  return (
                    <tr
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {vehicle.id}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {vehicle.model}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                vehicle.battery > 60 
                                  ? 'bg-emerald-500' 
                                  : vehicle.battery > 30 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${vehicle.battery ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{vehicle.battery == null ? 'N/A' : `${vehicle.battery}%`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-500 whitespace-nowrap">
                        {vehicle.depot || 'N/A'}
                      </td>
                    </tr>
                  );
                })}

                {!loadingVehicles && filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                )}
                {loadingVehicles && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Loading fleet vehicles...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filteredVehicles.length} of {vehicles.length} vehicles</span>
            <span className="text-[11px] text-slate-400">Click any row to inspect vehicle telemetry</span>
          </div>
        </div>

        {/* Right: Selected Vehicle Details Card (5 cols) */}
        {selectedVehicle && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            {/* Header info */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedVehicle.id}</h2>
                  <span className="text-slate-400 font-medium">•</span>
                  <span className="text-sm font-semibold text-slate-700">{selectedVehicle.model}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedVehicle.batteryCapacity == null ? 'Vehicle details' : `${selectedVehicle.batteryCapacity} kWh battery`}</p>
              </div>
              <div>{getStatusBadge(selectedVehicle.status)}</div>
            </div>

            {/* Vehicle Graphic Visual */}
            <VehicleGraphic type={selectedVehicle.model} className="w-full h-32" />

            {/* Tabs (Overview, Battery, Charging, Location) */}
            <div className="flex items-center border-b border-slate-200">
              {['Overview', 'Battery', 'Charging', 'Location'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
                    activeTab === tab
                      ? 'text-emerald-600 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'Overview' && (
              <div className="space-y-4 pt-1">
                {/* 4 Quick Stat Boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Battery (SOC)</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedVehicle.battery == null ? 'N/A' : `${selectedVehicle.battery}%`}</span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedVehicle.battery ?? 0}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Rated Range</span>
                    <span className="text-lg font-bold text-slate-900">{selectedVehicle.rangeLeft == null ? 'N/A' : `${selectedVehicle.rangeLeft} km`}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Rated vehicle range</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Odometer</span>
                    <span className="text-lg font-bold text-slate-900">{selectedVehicle.odometer == null ? 'N/A' : `${selectedVehicle.odometer.toLocaleString()} km`}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Not provided by API</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Status</span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">{selectedVehicle.status}</span>
                    <span className="text-[10px] text-slate-400 font-medium">BMS details unavailable</span>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Depot Location</span>
                    <span className="font-semibold text-slate-800">{selectedVehicle.depot || 'Not available'}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Assigned Driver</span>
                    <span className="font-semibold text-slate-800">{selectedVehicle.driver || 'Not available'}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Added to Fleet</span>
                    <span className="font-semibold text-slate-800">{selectedVehicle.createdAt ? new Date(selectedVehicle.createdAt).toLocaleDateString() : 'Not available'}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Energy Consumption</span>
                    <span className="font-semibold text-emerald-600">Not available</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Battery */}
            {activeTab === 'Battery' && (
              <div className="space-y-3 pt-1 text-xs">
                {loadingBatteryPredictions && (
                  <p className="text-slate-500">
                    Loading battery predictions...
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-medium uppercase">
                      State of Health (SOH)
                    </span>
                    <p className="text-lg font-bold text-emerald-900 mt-0.5">
                      {loadingBatteryPredictions
                        ? 'Loading...'
                        : selectedBatteryPredictions[0]?.soh_percent != null
                          ? `${selectedBatteryPredictions[0].soh_percent}%`
                          : 'N/A'}
                    </p>
                    <span className="text-[10px] text-emerald-600">
                      Expected: &gt;80%
                    </span>
                  </div>

                  <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-700 font-medium uppercase">
                      Remaining Useful Life
                    </span>
                    <p className="text-lg font-bold text-blue-900 mt-0.5">
                      {loadingBatteryPredictions
                        ? 'Loading...'
                        : selectedBatteryPredictions[0]?.rul_cycles != null
                          ? `${selectedBatteryPredictions[0].rul_cycles} cycles`
                          : 'N/A'}
                    </p>
                    <span className="text-[10px] text-blue-600">
                      Predicted remaining charge cycles
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Pack Temp
                    </span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {selectedVehicle.temperature == null
                        ? 'N/A'
                        : `${selectedVehicle.temperature}°C`}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Charge Cycles
                    </span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      N/A
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-xs space-y-2">
                  <p>
                    <strong>Prediction Status:</strong>{' '}
                    {loadingBatteryPredictions
                      ? 'Loading...'
                      : selectedBatteryPredictions[0]?.prediction_status ?? 'Not available'}
                  </p>

                  <p>
                    <strong>Model Version:</strong>{' '}
                    {selectedBatteryPredictions[0]?.model_version ?? 'Not available'}
                  </p>

                  <p>
                    <strong>Predicted At:</strong>{' '}
                    {selectedBatteryPredictions[0]?.predicted_at
                      ? new Date(
                          selectedBatteryPredictions[0].predicted_at
                        ).toLocaleString()
                      : 'Not available'}
                  </p>

                  <p>
                    <strong>Cell Balancing Status:</strong> Not available from the current API.
                  </p>
                </div>
              </div>
            )}


            {/* Tab 3: Charging */}
            {activeTab === 'Charging' && (
              <div className="space-y-3 pt-1 text-xs">
                <p className="text-xs font-semibold text-slate-700">Recent Charging History</p>
                {loadingSessions ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">Loading charging history...</div>
                ) : selectedChargingSessions.length ? (
                  <div className="space-y-2">
                    {selectedChargingSessions.map((session) => (
                      <div key={session.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-800">Charging session</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{session.energy_charged_kwh} kWh</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-500">
                          <div className="flex justify-between gap-3">
                            <span>Started</span>
                            <span className="text-right">
                              {session.started_at
                                ? new Date(session.started_at).toLocaleString()
                                : 'Not available'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span>Ended</span>
                            <span className="text-right">
                              {session.ended_at
                                ? new Date(session.ended_at).toLocaleString()
                                : 'In progress / not recorded'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span>Duration</span>
                            <span>{session.duration_minutes ?? 'N/A'} minutes</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">
                    No charging sessions are available for this vehicle.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Location */}
            {activeTab === 'Location' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-slate-800">Assigned Depot: {selectedVehicle.depot || 'Not available'}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Location and GPS coordinates are not currently provided by the backend.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Geofence Status</span>
                    <span className="text-xs font-semibold text-emerald-900">Geofence data unavailable</span>
                  </div>
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Vehicle to Fleet</h3>
                  <p className="text-xs text-slate-500">Register a new EV for telemetry and tracking</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 pt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle ID</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.id}
                    onChange={(e) => setNewVehicle({...newVehicle, id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model</label>
                  <select
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tata Ace EV">Tata Ace EV</option>
                    <option value="Mahindra eDeliver">Mahindra eDeliver</option>
                    <option value="Tata Nexon EV">Tata Nexon EV</option>
                    <option value="BYD e6">BYD e6</option>
                    <option value="Ashok Leyland EV">Ashok Leyland EV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Battery SOC (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newVehicle.battery}
                    onChange={(e) => setNewVehicle({...newVehicle, battery: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newVehicle.status}
                    onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="In Operation">In Operation</option>
                    <option value="Charging">Charging</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Depot</label>
                  <select
                    value={newVehicle.depot}
                    onChange={(e) => setNewVehicle({...newVehicle, depot: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Range (km)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newVehicle.rangeLeft}
                    onChange={(e) => setNewVehicle({...newVehicle, rangeLeft: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newVehicle.odometer}
                    onChange={(e) => setNewVehicle({...newVehicle, odometer: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.driver}
                    onChange={(e) => setNewVehicle({...newVehicle, driver: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Register EV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FleetMonitoringPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Fleet Telemetry...</div>}>
      <FleetMonitoringContent />
    </Suspense>
  );
}
