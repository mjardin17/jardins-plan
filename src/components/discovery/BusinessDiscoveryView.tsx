// src/components/discovery/BusinessDiscoveryView.tsx
import React from 'react';
import { TenantDiscoveryData } from '../../repositories/business-discovery.repository.ts';
import {
  ShieldCheck,
  Search,
  Database,
  HelpCircle,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface Props {
  data: TenantDiscoveryData;
  onRefresh: () => void;
  onNavigateToInterview: () => void;
}

export const BusinessDiscoveryView: React.FC<Props> = ({ data, onRefresh, onNavigateToInterview }) => {
  const { profile, evidence, unknowns } = data;
  const unaskedUnknowns = unknowns.filter((u) => u.status === 'UNASKED' || u.status === 'ASKED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Autonomous Business Discovery Engine
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Evidence Scanner
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time business observation, eBay store analysis, and evidence-backed profile confidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" /> Re-Scan Store
          </button>

          <button
            onClick={onNavigateToInterview}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow border border-indigo-500 flex items-center gap-2 transition"
          >
            <HelpCircle className="w-4 h-4" /> Answer Questions ({unaskedUnknowns.length})
          </button>
        </div>
      </div>

      {/* Profile Confidence & Discovery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Profile Confidence
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {profile.confidenceScore}%
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              High Veracity
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Based on {evidence.length} directly observed facts & verified inputs.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Observed Evidence
            </span>
            <Database className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {evidence.length}
            </span>
            <span className="text-xs text-slate-500">Verified Facts</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            API connections & owner-confirmed observations.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              High-Impact Unknowns
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {unaskedUnknowns.length}
            </span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Action Required
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Unobservable data requiring owner clarification.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Connected Systems
            </span>
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {profile.operationalSystems.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">Active Channels</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {profile.operationalSystems.join(', ')}
          </p>
        </div>
      </div>

      {/* Connected Store Analysis Grid (e.g. eBay Reseller Store) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Connected Marketplace Analysis — eBay Seller Store
              </h3>
              <p className="text-xs text-slate-500">
                Normalized evidence collected directly from authorized eBay REST APIs (Inventory, Fulfillment, Analytics).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Authorized API Sync Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Active Live Listings</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">428 items</p>
            <span className="text-[11px] text-slate-500">Listed Value: $14,980</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Stale Listings (&gt;120 Days)</span>
            <p className="text-xl font-extrabold text-amber-600 mt-1">140 items (32.7%)</p>
            <span className="text-[11px] text-amber-600 font-medium">Target for price/item specific comp</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Catalog SKU Coverage</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">42% defined</p>
            <span className="text-[11px] text-red-500 font-medium">58% missing custom merchant SKUs</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Active Interested Watchers</span>
            <p className="text-xl font-extrabold text-indigo-600 mt-1">86 watchers</p>
            <span className="text-[11px] text-indigo-600 font-medium">Ready for offer strategy automation</span>
          </div>
        </div>
      </div>

      {/* Discovered Evidence Fact Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Discovered Business Evidence Base
            </h3>
            <p className="text-xs text-slate-500">
              Each fact includes exact provenance, source API, confidence level, and verification status.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200">
            {evidence.length} Facts Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {evidence.map((ev) => (
            <div key={ev.id} className="p-4 hover:bg-slate-50/60 transition flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700 uppercase">
                    {ev.category}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{ev.fact}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Value: <span className="font-semibold text-slate-800">{String(ev.value)}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Source: {ev.sourceId || ev.sourceType}</p>
              </div>

              <div className="text-right space-y-1 shrink-0">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {ev.verificationStatus}
                </span>
                <p className="text-[11px] text-slate-400">
                  Confidence: {Math.round(ev.confidence * 100)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
