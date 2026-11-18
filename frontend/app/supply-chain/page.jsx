
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Globe,
  Building2,
  Layers,
  Info,
  RefreshCw,
} from 'lucide-react';

import {
  getSupplyChainSummary,
  getSupplyChainSuppliers,
  getBatteryMaterials,
  getSupplyChainAssessments,
} from '@/lib/api';

import { riskFactorsData } from '@/data/mockData';

export default function SupplyChainRiskPage() {
  const [activeTab, setActiveTab] = useState('Suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [lastAssessedAt, setLastAssessedAt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -------------------------------------------------------
  // 1. Load Supply Chain data from FastAPI/PostgreSQL
  // -------------------------------------------------------

  const loadSupplyChainData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        summaryResult,
        suppliersResult,
        materialsResult,
        assessmentsResult,
      ] = await Promise.all([
        getSupplyChainSummary(),
        getSupplyChainSuppliers(),
        getBatteryMaterials(),
        getSupplyChainAssessments(),
      ]);

      setSummary(summaryResult);

      setSuppliers(
        (suppliersResult.suppliers || []).map((record) => ({
          id: record.id,
          supplier: record.supplier,
          material: record.material,
          country: record.country,
          riskScore: record.risk_score,
          riskLevel: record.risk_level || 'Not assessed',
          keyConcerns: record.key_concerns,
          assessedAt: record.assessed_at,
          dataSource: record.data_source,
        }))
      );

      setMaterials(
        (materialsResult.materials || []).map((record) => ({
          id: record.id,
          name: record.name,
          country: record.origin_country,
          priceIndicator: record.price_indicator,
          volatilityIndicator: record.price_volatility_indicator,
          sustainabilityIndicator: record.sustainability_indicator,
          riskScore: record.risk_score,
          riskLevel: record.risk_level || 'Not assessed',
          supplier: record.supplier,
          dataSource: record.data_source,
        }))
      );

      setAssessmentCount(assessmentsResult.count || 0);

      const latestAssessment = assessmentsResult.assessments?.[0];

      setLastAssessedAt(
        latestAssessment?.assessed_at
          ? new Date(latestAssessment.assessed_at).toLocaleString()
          : null
      );
    } catch (err) {
      console.error('Unable to load Supply Chain data:', err);
      setError(
        err.message || 'Unable to load Supply Chain information.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupplyChainData();
  }, [loadSupplyChainData]);

  // -------------------------------------------------------
  // 2. Filter suppliers
  // -------------------------------------------------------

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.supplier.toLowerCase().includes(query) ||
        supplier.material.toLowerCase().includes(query) ||
        supplier.country.toLowerCase().includes(query) ||
        (supplier.keyConcerns || '').toLowerCase().includes(query);

      const matchesRisk =
        riskFilter === 'All' ||
        supplier.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [suppliers, searchQuery, riskFilter]);

  // -------------------------------------------------------
  // 3. Risk score badge
  // -------------------------------------------------------

  const getRiskScoreBadge = (score) => {
    if (score == null) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">
          —
        </span>
      );
    }

    let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (score >= 70) {
      color = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (score >= 45) {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${color}`}>
        {Math.round(score)}
      </span>
    );
  };

  // -------------------------------------------------------
  // 4. Risk level badge
  // -------------------------------------------------------

  const getRiskLevelBadge = (level) => {
    switch (String(level || '').toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            High
          </span>
        );

      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Medium
          </span>
        );

      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Low
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Not assessed
          </span>
        );
    }
  };

  // -------------------------------------------------------
  // 5. Format numeric indicators
  // -------------------------------------------------------

  const formatIndicator = (value) => {
    if (value == null || !Number.isFinite(Number(value))) {
      return 'Not available';
    }

    return Number(value).toFixed(1);
  };

  // -------------------------------------------------------
  // 6. Summary values
  // -------------------------------------------------------

  const suppliersAnalyzed = summary?.suppliers_analyzed ?? 0;
  const highRisk = summary?.high_risk ?? 0;
  const mediumRisk = summary?.medium_risk ?? 0;
  const lowRisk = summary?.low_risk ?? 0;

  // -------------------------------------------------------
  // 7. Page UI
  // -------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Supply Chain Risk Analysis
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Monitor battery material suppliers, risk assessments and supply chain exposure.
          </p>
        </div>

        <button
          onClick={loadSupplyChainData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Data loading/error */}
      {loading && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
          Loading supplier and battery material records from PostgreSQL...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          <strong>Unable to load Supply Chain data:</strong> {error}
          <button
            onClick={loadSupplyChainData}
            className="ml-2 underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {['Suppliers', 'Battery Materials', 'Risk Factors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Suppliers Analysed
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '—' : suppliersAnalyzed}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              High Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {loading ? '—' : highRisk}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Medium Risk
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
              {loading ? '—' : mediumRisk}
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
              {loading ? '—' : lowRisk}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'Suppliers' && (
        <div className="space-y-4">

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search supplier, material or country..."
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
                <option value="Not assessed">Not assessed</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
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

                  {!loading && !error && filteredSuppliers.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">

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

                      <td className="py-3.5 px-4 text-slate-500 text-xs leading-relaxed max-w-md">
                        {row.keyConcerns || 'Not recorded in database'}
                      </td>
                    </tr>
                  ))}

                  {!loading && !error && filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No suppliers match the current filters.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        Loading supplier records...
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
                {assessmentCount} stored risk assessments
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Battery Materials Tab */}
      {activeTab === 'Battery Materials' && (
        <div className="space-y-4">

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">

            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Battery Materials & Risk Assessment
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Material records and their associated supplier risk assessments.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {materials.length} materials
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">

                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-4">Origin Country</th>
                    <th className="py-3.5 px-4 text-center">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Price Indicator</th>
                    <th className="py-3.5 px-4">Volatility Indicator</th>
                    <th className="py-3.5 px-4">Sustainability Indicator</th>
                    <th className="py-3.5 px-4">Supplier</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {!loading && !error && materials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-50/80">

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {material.name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {material.country || 'Not available'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getRiskScoreBadge(material.riskScore)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRiskLevelBadge(material.riskLevel)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {formatIndicator(material.priceIndicator)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {formatIndicator(material.volatilityIndicator)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {formatIndicator(material.sustainabilityIndicator)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {material.supplier}
                      </td>
                    </tr>
                  ))}

                  {!loading && !error && materials.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No battery materials are available.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        Loading battery material records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Price, volatility and sustainability fields are simulated database indicators.
                Their units and scales are not specified in the current data model.
                They should not be interpreted as live market prices or verified sustainability ratings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors Tab */}
      {activeTab === 'Risk Factors' && (
        <div className="space-y-4">

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              This tab presents the platform's configured supply-chain risk assessment framework.
              These factor weights are static reference values, not live database assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {riskFactorsData.map((factor, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Weight: {factor.weight}
                    </span>

                    {getRiskLevelBadge(factor.impact)}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    {factor.factor}
                  </h4>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {factor.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  Configured assessment framework reference
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:justify-between gap-1">
        <span>
          Supplier and material data source: PostgreSQL via FastAPI
        </span>

        <span>
          {lastAssessedAt
            ? `Latest stored assessment: ${lastAssessedAt}`
            : 'Assessment date unavailable'}
        </span>
      </div>
    </div>
  );
}
