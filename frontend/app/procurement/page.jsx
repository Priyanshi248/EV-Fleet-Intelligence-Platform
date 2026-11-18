
'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Battery,
  Zap,
  Weight,
  IndianRupee,
  Clock,
  Check,
  X,
  Info,
  Car,
  AlertCircle,
} from 'lucide-react';
import VehicleGraphic from '@/components/VehicleGraphic';
import { generateProcurementRecommendations } from '@/lib/api';

const INITIAL_REQUIREMENTS = {
  dailyDistance: 150,
  payloadCapacity: 1.5,
  annualMileage: 40000,
  budget: 2000000,
  minRange: 250,
  maxChargingTime: 2.0,
};

function toApiRequirements(requirements) {
  return {
    daily_distance: Number(requirements.dailyDistance),
    payload_capacity: Number(requirements.payloadCapacity),
    annual_mileage: Number(requirements.annualMileage),
    budget: Number(requirements.budget),
    min_range: Number(requirements.minRange),
    max_charging_time: Number(requirements.maxChargingTime),
  };
}

function mapRecommendation(record) {
  return {
    id: record.id ?? `PROC-${record.catalog_id}`,
    catalogId: record.catalog_id,
    model: record.model,
    tagline: record.tagline,
    meetsRequirements: Boolean(record.meetsRequirements),
    suitabilityScore: Number(record.suitabilityScore ?? 0),
    range: Number(record.range ?? 0),
    payload: Number(record.payload ?? 0),
    chargingTime: Number(record.chargingTime ?? 0),
    costLakh: Number(record.costLakh ?? 0),
    purchasePriceInr: record.purchasePriceInr,
    energyConsumption: record.energyConsumption,
    estimatedAnnualEnergyKwh: record.estimatedAnnualEnergyKwh,
    annualFuelSaving: record.annualFuelSaving ?? 'Not available',
    batteryCapacity: record.batteryCapacity ?? 'Not provided',
    warranty: record.warranty ?? 'Not provided',
    highlights: Array.isArray(record.highlights) ? record.highlights : [],
    dataSource: record.dataSource ?? 'unknown',
  };
}

export default function EVProcurementPage() {
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [dataSource, setDataSource] = useState(null);

  const requestRecommendations = async (currentRequirements) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateProcurementRecommendations(
        toApiRequirements(currentRequirements)
      );

      const mapped = (result.recommendations ?? []).map(mapRecommendation);
      setRecommendations(mapped);
      setDataSource(result.data_source ?? 'Backend API');
      setIsCalculated(true);

      if (selectedVehicle) {
        const updatedSelection = mapped.find(
          (item) => item.catalogId === selectedVehicle.catalogId
        );
        setSelectedVehicle(updatedSelection ?? null);
      }
    } catch (err) {
      console.error('Unable to generate procurement recommendations:', err);
      setError(err.message || 'Unable to generate procurement recommendations.');
      setRecommendations([]);
      setDataSource(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate initial recommendations from PostgreSQL on page load.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialRecommendations() {
      setLoading(true);
      setError(null);

      try {
        const result = await generateProcurementRecommendations(
          toApiRequirements(INITIAL_REQUIREMENTS)
        );

        if (cancelled) return;

        setRecommendations((result.recommendations ?? []).map(mapRecommendation));
        setDataSource(result.data_source ?? 'Backend API');
        setIsCalculated(true);
      } catch (err) {
        console.error('Unable to load procurement recommendations:', err);

        if (!cancelled) {
          setError(err.message || 'Unable to load procurement recommendations.');
          setRecommendations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCalculateRecommendations = async (event) => {
    event.preventDefault();
    setSelectedVehicle(null);
    await requestRecommendations(requirements);
  };

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) {
      return 'Not available';
    }

    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          EV Procurement Recommendations
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Find suitable EVs using your operational requirements and the registered vehicle catalog.
        </p>
      </div>

      {/* Requirements and recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Requirements form */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4">

          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Your Requirements
            </h2>

            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              Fleet Optimizer
            </span>
          </div>

          <form
            onSubmit={handleCalculateRecommendations}
            className="space-y-3.5 text-xs sm:text-sm"
          >
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Daily Route Distance (km)
              </label>

              <input
                type="number"
                min="10"
                max="800"
                required
                value={requirements.dailyDistance}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    dailyDistance: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payload Capacity (tons)
              </label>

              <input
                type="number"
                step="0.1"
                min="0.2"
                max="10"
                required
                value={requirements.payloadCapacity}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    payloadCapacity: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Annual Mileage (km)
              </label>

              <input
                type="number"
                step="1000"
                min="5000"
                max="300000"
                required
                value={requirements.annualMileage}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    annualMileage: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Budget (₹)
              </label>

              <input
                type="number"
                step="50000"
                min="300000"
                required
                value={requirements.budget}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    budget: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ₹{(requirements.budget / 100000).toFixed(1)} Lakhs
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Range (km)
              </label>

              <input
                type="number"
                min="50"
                max="600"
                required
                value={requirements.minRange}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    minRange: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Charging Time (hrs)
              </label>

              <input
                type="number"
                step="0.1"
                min="0.5"
                max="8"
                required
                value={requirements.maxChargingTime}
                onChange={(event) =>
                  setRequirements({
                    ...requirements,
                    maxChargingTime: Number(event.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />

                <span>
                  {loading ? 'Calculating...' : 'Get Recommendations'}
                </span>
              </button>
            </div>
          </form>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-start gap-2 border border-slate-100">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />

            <span>
              Recommendations use a rule-based suitability score calculated
              from catalog range, payload, charging time, price and energy
              consumption. This is not an ML prediction.
            </span>
          </div>
        </div>

        {/* Recommendation cards */}
        <div className="lg:col-span-7 space-y-4">

          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              Recommended EVs
            </h2>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sorted by:</span>

              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Suitability Score
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-sm text-slate-500">
              Loading recommendations from the procurement API...
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-sm text-slate-500">
              No catalog vehicles are available for recommendation.
            </div>
          )}

          {!loading && recommendations.length > 0 && (
            <div className="space-y-4">
              {recommendations.map((ev) => (
                <div
                  key={ev.catalogId ?? ev.id}
                  className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-center justify-between"
                >

                  <div className="w-full sm:w-44 flex-shrink-0">
                    <VehicleGraphic
                      type={ev.model}
                      className="w-full h-28"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {ev.model}
                        </h3>

                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            ev.meetsRequirements
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ev.tagline}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">
                          Suitability Score
                        </span>

                        <span className="text-2xl font-black text-emerald-600">
                          {ev.suitabilityScore}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Range
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ev.range} km
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Payload
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ev.payload} tons
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Charging
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ev.chargingTime} hrs
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Cost
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          ₹{ev.costLakh} Lakh
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Catalog source: {ev.dataSource}
                    </p>
                  </div>

                  <div className="w-full sm:w-auto flex sm:flex-col justify-end">
                    <button
                      onClick={() => setSelectedVehicle(ev)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCalculated && dataSource && (
            <div className="px-1 text-[11px] text-slate-400">
              Recommendation source: {dataSource}. Catalog records are
              identified as simulated where applicable.
            </div>
          )}
        </div>
      </div>

      {/* Vehicle details modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">

            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedVehicle.model}
                </h3>

                <span
                  className={`text-xs font-semibold ${
                    selectedVehicle.meetsRequirements
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {selectedVehicle.tagline}
                </span>
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close vehicle details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs sm:text-sm">

              <VehicleGraphic
                type={selectedVehicle.model}
                className="w-full h-32"
              />

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Suitability Score
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600">
                    {selectedVehicle.suitabilityScore}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Purchase Price
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(selectedVehicle.purchasePriceInr)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Annual Energy Estimate
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedVehicle.estimatedAnnualEnergyKwh != null
                      ? `${Number(selectedVehicle.estimatedAnnualEnergyKwh).toLocaleString('en-IN')} kWh`
                      : 'Not available'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Energy Consumption
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedVehicle.energyConsumption != null
                      ? `${selectedVehicle.energyConsumption} kWh/km`
                      : 'Not available'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Battery Pack
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedVehicle.batteryCapacity}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    OEM Warranty
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedVehicle.warranty}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Recommendation Factors
                </h4>

                <ul className="space-y-1.5 text-xs text-slate-600">
                  {selectedVehicle.highlights.length > 0
                    ? selectedVehicle.highlights.map((highlight, index) => (
                        <li
                          key={`${index}-${highlight}`}
                          className="flex items-start gap-2"
                        >
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))
                    : (
                        <li>No recommendation factors were returned.</li>
                      )}
                </ul>
              </div>

              {!selectedVehicle.meetsRequirements && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-900 text-xs">
                  This vehicle does not satisfy every mandatory requirement.
                  Review the factors above before considering procurement.
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 text-xs">
                Data source: <strong>{selectedVehicle.dataSource}</strong>.
                Battery capacity, warranty and annual fuel savings were not
                supplied by the current catalog API and are therefore not
                estimated here.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">

              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Close
              </button>

              <button
                onClick={() =>
                  window.alert(
                    'RFP submission is not connected to the backend yet.'
                  )
                }
                className="px-5 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-xs cursor-not-allowed"
              >
                RFP submission unavailable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
