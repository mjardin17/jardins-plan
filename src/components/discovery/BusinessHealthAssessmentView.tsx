// src/components/discovery/BusinessHealthAssessmentView.tsx
import React from 'react';
import { BusinessHealthAssessment, BusinessDiagnosticDimension } from '../../types/business-discovery.ts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Search,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface Props {
  health: BusinessHealthAssessment;
}

export const BusinessHealthAssessmentView: React.FC<Props> = ({ health }) => {
  const dimensionsList = Object.values(health.dimensions) as BusinessDiagnosticDimension[];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL_BOTTLENECK':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-600" /> Critical Bottleneck
          </span>
        );
      case 'ATTENTION_REQUIRED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Attention Required
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Optimal Condition
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              15-Dimension Business Health & Root-Cause Assessment
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Diagnostic Matrix
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            {health.summary}
          </p>
        </div>

        <div className="bg-slate-800/80 px-5 py-3 rounded-xl border border-slate-700/80 text-right shrink-0">
          <p className="text-xs text-slate-400 font-medium">Overall Health Score</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-white">{health.overallScorePct}%</span>
            <span className="text-xs font-bold text-amber-400">{health.overallStatus}</span>
          </div>
        </div>
      </div>

      {/* 15 Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dimensionsList.map((dim) => (
          <div
            key={dim.key}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{dim.title}</h3>
                {getStatusBadge(dim.status)}
              </div>

              {/* Observed Condition */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Observed Condition
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {dim.observedCondition}
                </p>
              </div>

              {/* Root Cause Analysis */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Suspected Root Cause:</span>
                <p className="text-slate-600 bg-red-50/50 p-2 rounded border border-red-100/60 leading-relaxed">
                  {dim.suspectedRootCause}
                </p>
              </div>

              {/* Business Impact */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Business Impact:</span>
                <p className="text-slate-600">{dim.businessImpact}</p>
              </div>

              {/* Recommended Next Investigation */}
              <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-xs text-indigo-950 space-y-0.5">
                <span className="font-bold text-indigo-900 flex items-center gap-1">
                  <Search className="w-3 h-3 text-indigo-600" /> Recommended Action
                </span>
                <p className="text-[11px] leading-tight">{dim.recommendedNextInvestigation}</p>
              </div>
            </div>

            {/* Card Footer Metrics */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Confidence: {Math.round(dim.confidence * 100)}%</span>
              <span className="font-semibold text-slate-700">Score: {dim.scorePct}/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
