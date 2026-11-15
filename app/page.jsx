'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Car, 
  BatteryCharging, 
  Wrench, 
  Leaf, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp, 
  AlertTriangle,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { 
  overviewStats, 
  fleetStatusData, 
  monthlyEnergyConsumption,
  maintenanceAlerts,
  procurementCatalog
} from '@/data/mockData';

export default function DashboardOverviewPage() {
  const [activeDonutIndex, setActiveDonutIndex] = useState(null);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100/80 p-6 md:p-8 shadow-sm">
        {/* Subtle decorative background SVGs */}
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none hidden md:block w-96">
          <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 180 C120 140, 200 190, 400 130 L400 200 L0 200 Z" fill="#10b981" />
            <path d="M50 190 C180 150, 280 170, 400 110 L400 200 L50 200 Z" fill="#059669" />
            {/* Wind turbine blades */}
            <circle cx="320" cy="70" r="4" fill="#047857" />
            <line x1="320" y1="70" x2="320" y2="150" stroke="#047857" strokeWidth="3" />
            <line x1="320" y1="70" x2="300" y2="35" stroke="#047857" strokeWidth="2" />
            <line x1="320" y1="70" x2="345" y2="50" stroke="#047857" strokeWidth="2" />
            <line x1="320" y1="70" x2="315" y2="105" stroke="#047857" strokeWidth="2" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sun, 26 Oct 2026</span>
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

      {/* 2. Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Vehicles */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Vehicles</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">120</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Average Battery SOH */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Battery SOH</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">92%</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +3%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Maintenance Alerts</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">8</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              2 High Risk
            </span>
            <span className="text-xs text-slate-400">action required</span>
          </div>
        </div>

        {/* CO2 Savings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CO₂ Savings</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">245 tons</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +18%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        </div>
      </div>

      {/* 3. Main Charts Section (Fleet Status Donut & Monthly Energy Consumption Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Fleet Status Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fleet Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time vehicle availability</p>
            </div>
            <Link 
              href="/fleet"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              View Details 
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6 my-auto">
            {/* Donut Chart with Centered Text */}
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [`${val} Vehicles`, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900">120</span>
                <span className="text-xs text-slate-500 font-medium">Vehicles</span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
              {fleetStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between sm:justify-start gap-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                    <span className="text-[11px] text-slate-400">({item.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fleet health index: <strong className="text-emerald-600 font-semibold">94.8% Operational</strong></span>
            <span>Synced 2m ago</span>
          </div>
        </div>

        {/* Right: Monthly Energy Consumption Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Energy Consumption</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fleet total charging consumption (kWh)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 block">12,450 kWh</span>
                <span className="text-[10px] text-emerald-600 font-medium">Oct 2026</span>
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

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEnergyConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  dy={5}
                />
                <YAxis 
                  tickLine={false} 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  formatter={(val) => [`${val.toLocaleString()} kWh`, 'Energy Consumption']}
                  labelFormatter={(lbl) => `Month: ${lbl} 2026`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="kwh" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#energyGradient)"
                  dot={{ r: 3, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Average efficiency: <strong className="text-slate-700">0.18 kWh / km</strong>
            </span>
            <span>Total Cost Oct: <strong className="text-slate-800">₹87,150</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Quick Action & Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Urgent Maintenance Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-slate-900">Urgent Maintenance</h3>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              <strong>EV-004 (BYD e6)</strong> reported battery temperature 48°C during peak fast charge. Coolant flush recommended.
            </p>
          </div>
          <Link
            href="/maintenance"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            Review 8 Maintenance Alerts &rarr;
          </Link>
        </div>

        {/* Battery Health Intelligence */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Battery Intelligence</h3>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Healthy (92% Avg)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              112 of 120 vehicles have battery State of Health (SOH) &gt; 85%. Fleet degradation rate is averaging 0.8%/month.
            </p>
          </div>
          <Link
            href="/battery"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
          >
            Analyse Battery SOH Trends &rarr;
          </Link>
        </div>

        {/* Net-Zero Carbon Savings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Net-Zero Milestone</h3>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                68% of Target
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              245 tons CO₂ avoided compared to diesel baselines. Top candidate for electrification: <strong>DV-101 (Tata 407)</strong>.
            </p>
          </div>
          <Link
            href="/net-zero"
            className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
          >
            View Emissions Reduction Plan &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

