'use client';

import { useState } from 'react';
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
  Car
} from 'lucide-react';
import VehicleGraphic from '@/components/VehicleGraphic';
import { procurementCatalog } from '@/data/mockData';

export default function EVProcurementPage() {
  // User form requirements
  const [requirements, setRequirements] = useState({
    dailyDistance: 150,
    payloadCapacity: 1.5,
    annualMileage: 40000,
    budget: 2000000,
    minRange: 250,
    maxChargingTime: 2.0
  });

  const [sortBy, setSortBy] = useState('score');
  const [recommendations, setRecommendations] = useState(procurementCatalog);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isCalculated, setIsCalculated] = useState(true);

  // Dynamic recommendation calculation based on operational constraints
  const handleCalculateRecommendations = (e) => {
    e.preventDefault();

    const budgetLakhs = requirements.budget / 100000;

    const scored = procurementCatalog.map(ev => {
      let score = 90;

      // Range penalty or bonus
      if (ev.range < requirements.minRange) {
        score -= (requirements.minRange - ev.range) * 0.4;
      } else {
        score += Math.min(10, (ev.range - requirements.minRange) * 0.1);
      }

      // Payload matching
      if (ev.payload < requirements.payloadCapacity) {
        score -= (requirements.payloadCapacity - ev.payload) * 15;
      } else {
        score += 5;
      }

      // Charging time constraint
      if (ev.chargingTime > requirements.maxChargingTime) {
        score -= (ev.chargingTime - requirements.maxChargingTime) * 10;
      }

      // Budget check
      if (ev.costLakh > budgetLakhs) {
        score -= (ev.costLakh - budgetLakhs) * 3;
      }

      const finalScore = Math.max(45, Math.min(98, Math.round(score)));

      return {
        ...ev,
        suitabilityScore: finalScore,
        tagline: finalScore >= 80 ? 'Suitable for your needs' : 'Moderate Match'
      };
    });

    // Sort by suitability score descending
    scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    setRecommendations(scored);
    setIsCalculated(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">EV Procurement Recommendations</h1>
        <p className="text-sm text-slate-500 mt-1">Find the most suitable EVs based on your operational requirements.</p>
      </div>

      {/* 2. Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Requirements Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Requirements</h2>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              Fleet Optimizer
            </span>
          </div>

          <form onSubmit={handleCalculateRecommendations} className="space-y-3.5 text-xs sm:text-sm">
            {/* Daily Route Distance */}
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
                onChange={(e) => setRequirements({...requirements, dailyDistance: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Payload Capacity */}
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
                onChange={(e) => setRequirements({...requirements, payloadCapacity: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Annual Mileage */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Annual Mileage (km)
              </label>
              <input
                type="number"
                step="1000"
                min="5000"
                required
                value={requirements.annualMileage}
                onChange={(e) => setRequirements({...requirements, annualMileage: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Budget */}
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
                onChange={(e) => setRequirements({...requirements, budget: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ₹{(requirements.budget / 100000).toFixed(1)} Lakhs
              </span>
            </div>

            {/* Minimum Range */}
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
                onChange={(e) => setRequirements({...requirements, minRange: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Maximum Charging Time */}
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
                onChange={(e) => setRequirements({...requirements, maxChargingTime: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Recommendations</span>
              </button>
            </div>
          </form>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-start gap-2 border border-slate-100">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Scoring engine evaluates duty-cycle reliability, fast-charging curve suitability, and total cost of ownership (TCO).
            </span>
          </div>
        </div>

        {/* Right Column: Recommended EV Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Recommended EVs</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sort by:</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Suitability Score
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {recommendations.map((ev, index) => (
              <div 
                key={ev.id}
                className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-center justify-between"
              >
                {/* Vehicle Thumbnail */}
                <div className="w-full sm:w-44 flex-shrink-0">
                  <VehicleGraphic type={ev.model} className="w-full h-28" />
                </div>

                {/* Details info */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{ev.model}</h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ev.tagline}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Suitability Score</span>
                      <span className="text-2xl font-black text-emerald-600">{ev.suitabilityScore}%</span>
                    </div>
                  </div>

                  {/* 4-stat specs grid */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Range</span>
                      <span className="text-xs font-bold text-slate-800">{ev.range} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Payload</span>
                      <span className="text-xs font-bold text-slate-800">{ev.payload} tons</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Charging Time</span>
                      <span className="text-xs font-bold text-slate-800">{ev.chargingTime} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Cost</span>
                      <span className="text-xs font-bold text-emerald-600">₹{ev.costLakh} Lakh</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
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
        </div>
      </div>

      {/* 3. Detailed Procurement Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedVehicle.model}</h3>
                <span className="text-xs text-emerald-600 font-semibold">{selectedVehicle.tagline}</span>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs sm:text-sm">
              <VehicleGraphic type={selectedVehicle.model} className="w-full h-32" />

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Suitability Score</span>
                  <span className="text-xl font-extrabold text-emerald-600">{selectedVehicle.suitabilityScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Annual Fuel Savings</span>
                  <span className="text-lg font-bold text-slate-900">{selectedVehicle.annualFuelSaving}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Battery Pack</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedVehicle.batteryCapacity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">OEM Warranty</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedVehicle.warranty}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Key Highlights</h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {selectedVehicle.highlights?.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 text-xs font-medium">
                Procuring this vehicle delivers an estimated <strong>18.4 tons of CO₂ reduction</strong> per year compared to a diesel vehicle of equivalent payload.
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
                onClick={() => {
                  alert(`Procurement RFP request generated for ${selectedVehicle.model}. Procurement department notified.`);
                  setSelectedVehicle(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm"
              >
                Initiate Procurement RFP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

