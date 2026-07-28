// src/components/universal/OpportunityEngineView.tsx
import React from 'react';
import { OpportunityItem, CapabilityStatus } from '../../types/universal-onboarding.ts';
import {
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight,
  Zap, Layers, Info, Check, HelpCircle
} from 'lucide-react';

interface Props {
  opportunities: OpportunityItem[];
}

export const OpportunityEngineView: React.FC<Props> = ({ opportunities }) => {
  const getStatusBadge = (status: CapabilityStatus) => {
    switch (status) {
      case 'VERIFIED WORKING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">VERIFIED WORKING</span>;
      case 'PARTIALLY VERIFIED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300">PARTIALLY VERIFIED</span>;
      case 'WORKING IN SANDBOX':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">WORKING IN SANDBOX</span>;
      case 'IMPLEMENTED BUT UNTESTED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">IMPLEMENTED BUT UNTESTED</span>;
      case 'DESIGN COMPLETE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300">DESIGN COMPLETE</span>;
      case 'RECOMMENDED ONLY':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">RECOMMENDED ONLY</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap size={24} className="text-amber-500" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Ranked Bottleneck & Opportunity Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Prioritized operational improvements ranked by financial impact, time savings, and implementation risk.
          </p>
        </div>
      </div>

      {/* Ranked Opportunities List */}
      <div className="space-y-6">
        {opportunities.map((opp, idx) => (
          <div
            key={opp.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all space-y-5"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{opp.title}</h3>
                  <span className="text-xs font-extrabold text-sky-600">{opp.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(opp.capabilityStatus)}
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                  Impact: {opp.impactScore}/10
                </span>
              </div>
            </div>

            {/* Grid Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Observation</span>
                <p className="text-slate-800 font-medium">{opp.observation}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase">Why It Matters</span>
                <p className="text-amber-950 font-semibold">{opp.whyItMatters}</p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/60 space-y-1">
                <span className="text-[10px] font-extrabold text-sky-900 uppercase">Proposed AI Improvement</span>
                <p className="text-sky-950 font-semibold">{opp.proposedImprovement}</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-900 uppercase">Expected Benefit</span>
                <p className="text-emerald-950 font-bold">{opp.expectedBenefit}</p>
              </div>
            </div>

            {/* Systems & Approvals */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 text-[11px]">Required Systems:</span>
                <div className="flex flex-wrap gap-1">
                  {opp.requiredSystems.map((sys, sIdx) => (
                    <span key={sIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                      {sys}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 text-[11px]">Approval Boundary:</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  opp.humanApprovalRequired
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {opp.humanApprovalRequired ? 'Requires Human Approval' : 'Fully Autonomous Allowed'}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            {opp.disclaimer && (
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-[11px] text-slate-500 font-medium italic flex items-center gap-2">
                <Info size={14} className="text-slate-400 shrink-0" />
                <span>{opp.disclaimer}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
