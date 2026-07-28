// src/components/discovery/ImprovementRoadmapView.tsx
import React from 'react';
import { ImprovementRoadmapItem } from '../../types/business-discovery.ts';
import {
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bot,
  UserCheck,
  ArrowRight,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface Props {
  roadmap: ImprovementRoadmapItem[];
}

export const ImprovementRoadmapView: React.FC<Props> = ({ roadmap }) => {
  const phaseColors: Record<string, string> = {
    'Phase 1 - Stabilize': 'bg-red-50 text-red-700 border-red-200',
    'Phase 2 - Gain Visibility': 'bg-amber-50 text-amber-700 border-amber-200',
    'Phase 3 - Improve Current Operations': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Phase 4 - Expand': 'bg-blue-50 text-blue-700 border-blue-200',
    'Phase 5 - Optimize and Scale': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Phased Business Improvement Roadmap
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              5 Sequential Phases
            </span>
          </div>
          <p className="text-sm text-slate-300">
            A structured, risk-managed progression from operational stabilization to autonomous multi-channel scaling.
          </p>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Approval Gates & Rollback Protocols Active</span>
        </div>
      </div>

      {/* 5-Phase Timeline List */}
      <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        {roadmap.map((item, idx) => (
          <div key={item.id} className="relative pl-16 space-y-3">
            {/* Phase Node Marker */}
            <div className="absolute left-4 top-1 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white">
              {idx + 1}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-indigo-200 transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      phaseColors[item.phase] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.phase}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Risk: {item.risk}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.approvalRequirement}
                  </span>
                </div>
              </div>

              {/* Problem & Supporting Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-700">Problem Addressed:</span>
                  <p className="text-slate-600">{item.problemBeingAddressed}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-700">Expected Business Result:</span>
                  <p className="text-emerald-700 font-semibold">{item.expectedResult}</p>
                </div>
              </div>

              {/* Responsible Worker & Approval Gate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-indigo-50/40 p-3 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Responsible AI Worker</span>
                    <span className="font-bold text-slate-800">{item.responsibleWorker}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Required Human Input</span>
                    <span className="font-bold text-slate-800">{item.requiredHumanInput}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-[10px] block">Rollback Strategy</span>
                    <span className="font-semibold text-slate-700">{item.rollbackStrategy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
