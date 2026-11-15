'use client';

import { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Search, 
  Globe, 
  Building2, 
  Layers, 
  TrendingUp, 
  Sliders, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  supplyChainStats, 
  suppliersList, 
  batteryMaterialsData, 
  riskFactorsData 
} from '@/data/mockData';

export default function SupplyChainRiskPage() {
  const [activeTab, setActiveTab] = useState('Suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  const filteredSuppliers = suppliersList.filter((s) => {
    const matchesSearch = 
      s.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keyConcerns.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'All' || s.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getRiskScoreBadge = (score) => {
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 70) {
      color = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (score >= 45) {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${color}`}>
        {score}
      </span>
    );
  };

  const getRiskLevelBadge = (level) => {
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

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Supply Chain Risk Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">Assess battery material and supplier risks based on multiple factors.</p>
      </div>

      {/* 2. Top Tabs (Suppliers, Battery Materials, Risk Factors) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {['Suppliers', 'Battery Materials', 'Risk Factors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
        {/* Suppliers Analysed */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suppliers Analysed</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{supplyChainStats.suppliersAnalyzed}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{supplyChainStats.highRisk}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Medium Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{supplyChainStats.mediumRisk}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Risk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{supplyChainStats.lowRisk}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Tab Content: Suppliers Tab */}
      {activeTab === 'Suppliers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search supplier, material, country or concern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

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
            </div>

            <div className="text-xs text-slate-400">
              Showing {filteredSuppliers.length} of {suppliersList.length} suppliers
            </div>
          </div>

          {/* Supplier Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-4">Country</th>
                    <th className="py-3.5 px-4 text-center">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Key Concerns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {row.supplier}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {row.material}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {row.country}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getRiskScoreBadge(row.riskScore)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRiskLevelBadge(row.riskLevel)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs leading-relaxed max-w-md">
                        {row.keyConcerns}
                      </td>
                    </tr>
                  ))}

                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No suppliers match the current query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Risk Scoring Model: <strong>Geopolitical + ESG + Concentration Index</strong></span>
              <span className="text-[11px] text-slate-400">Data refreshed weekly</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Battery Materials Tab */}
      {activeTab === 'Battery Materials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Key Battery Materials & Geopolitical Exposure</h3>
              <span className="text-xs text-slate-400">Global benchmark pricing & risk rating</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-4">Cost Share in Pack</th>
                    <th className="py-3.5 px-4">Risk Rating</th>
                    <th className="py-3.5 px-4">Benchmark Price</th>
                    <th className="py-3.5 px-4">Price Volatility Forecast</th>
                    <th className="py-3.5 px-4">Top Refining Nation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batteryMaterialsData.map((mat, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{mat.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{mat.share}</td>
                      <td className="py-3.5 px-4">{getRiskLevelBadge(mat.risk)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">{mat.avgPrice}</td>
                      <td className="py-3.5 px-4 text-slate-600">{mat.forecast}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{mat.topCountry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab Content: Risk Factors Tab */}
      {activeTab === 'Risk Factors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riskFactorsData.map((rf, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Weight: {rf.weight}
                  </span>
                  {getRiskLevelBadge(rf.impact)}
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">{rf.factor}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{rf.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Audited against international trade datasets & commodity indexes.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

