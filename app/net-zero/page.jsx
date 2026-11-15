'use client';

import { useState } from 'react';
import { 
  Leaf, 
  Target, 
  Car, 
  TrendingDown, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Fuel,
  IndianRupee
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  netZeroStats, 
  emissionsComparisonData, 
  topVehiclesForReplacement as initialReplacements 
} from '@/data/mockData';

export default function NetZeroTrackingPage() {
  const [replacements, setReplacements] = useState(initialReplacements);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Net-Zero Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Calculate emissions reduction and identify high-impact vehicles for replacement.</p>
      </div>

      {/* 2. Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* CO2 Savings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CO₂ Savings</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{netZeroStats.co2Savings}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {netZeroStats.co2SavingsChange}
            </span>
            <span className="text-xs text-slate-400">vs last year</span>
          </div>
        </div>

        {/* Reduction Progress (With circular / progress meter) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reduction Progress</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{netZeroStats.reductionProgress}%</h3>
            </div>
            {/* Visual Circular Gauge */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.5" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${netZeroStats.reductionProgress}, 100`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-700">
                68%
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Target milestone 2027</span>
            <span className="text-xs text-slate-400">on track</span>
          </div>
        </div>

        {/* Target Reduction */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Reduction</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{netZeroStats.targetReduction}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-500">Milestone deadline:</span>
            <span className="text-xs font-semibold text-slate-800">Q4 2027</span>
          </div>
        </div>

        {/* EVs Planned for Replacement */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">EVs Planned for Replacement</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{netZeroStats.evsPlannedReplacement}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Phase 2 Transition
            </span>
            <span className="text-xs text-slate-400">active pipeline</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Two Main Sections: Emissions Comparison (Left) & Top Vehicles for Replacement (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Emissions Comparison Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 md:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Emissions Comparison</h2>
              <p className="text-xs text-slate-500 mt-0.5">Annual CO₂ emissions trajectory (tons)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-slate-500 inline-block"></span>
                Diesel Fleet
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-[#10b981] inline-block"></span>
                EV Fleet
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={emissionsComparisonData} 
                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tickLine={false} stroke="#94a3b8" fontSize={12} dy={5} />
                <YAxis tickLine={false} stroke="#94a3b8" fontSize={12} domain={[0, 350]} />
                <Tooltip 
                  formatter={(val, name) => [`${val} tons`, name === 'dieselFleet' ? 'Diesel Fleet' : 'EV Fleet']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="dieselFleet" 
                  name="dieselFleet" 
                  fill="#64748b" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={28}
                />
                <Bar 
                  dataKey="evFleet" 
                  name="evFleet" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Projection: <strong className="text-emerald-600 font-semibold">-89% Net Fleet Emissions by 2028</strong></span>
            <span>Grid Factor: 0.71 kg CO₂/kWh</span>
          </div>
        </div>

        {/* Right: Top Vehicles for Replacement Table (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 md:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Vehicles for Replacement</h2>
              <p className="text-xs text-slate-500 mt-0.5">High-impact legacy ICE commercial vehicles</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Highest ROI
            </span>
          </div>

          <div className="overflow-x-auto py-2">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Vehicle ID</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-right">Current Emissions (tons/yr)</th>
                  <th className="py-2.5 px-3 text-right">Potential Savings (tons/yr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {replacements.map((v) => (
                  <tr 
                    key={v.id}
                    onClick={() => setSelectedReplacement(v)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {v.id}
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {v.model}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {v.currentEmissions}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {v.potentialSavings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cumulative replacement impact: <strong className="text-slate-800">83.6 tons/yr</strong></span>
            <span className="text-emerald-600 font-semibold">Click row for ROI analysis</span>
          </div>
        </div>
      </div>

      {/* 4. Replacement ROI Breakdown Modal */}
      {selectedReplacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedReplacement.id} - {selectedReplacement.model}</h3>
                <p className="text-xs text-slate-500">Electrification Impact Assessment</p>
              </div>
              <button 
                onClick={() => setSelectedReplacement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Carbon Reduction</span>
                  <span className="text-xl font-extrabold text-emerald-900">-{selectedReplacement.potentialSavings} t/yr</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Net Annual Savings</span>
                  <span className="text-xl font-extrabold text-emerald-900">{selectedReplacement.netAnnualBenefit}</span>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-lg text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Diesel Expenditure:</span>
                  <span className="font-semibold text-rose-600">{selectedReplacement.annualFuelCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Electric Charging Cost:</span>
                  <span className="font-semibold text-emerald-600">{selectedReplacement.estEvCost}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span>Payback Period on Tata Ace EV:</span>
                  <span className="text-slate-900">~2.2 Years</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReplacement(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Procurement proposal initiated to replace ${selectedReplacement.id} with Tata Ace EV.`);
                  setSelectedReplacement(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm"
              >
                Approve for Replacement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

