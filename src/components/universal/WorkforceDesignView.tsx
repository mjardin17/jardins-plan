// src/components/universal/WorkforceDesignView.tsx
import React from 'react';
import { RecommendedWorker, CapabilityStatus } from '../../types/universal-onboarding.ts';
import { Bot, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Zap, Settings, Lock } from 'lucide-react';

interface Props {
  workforce: RecommendedWorker[];
}

export const WorkforceDesignView: React.FC<Props> = ({ workforce }) => {
  const getCapabilityBadge = (status: CapabilityStatus) => {
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
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-sky-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Recommended AI Workforce Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Tailored AI worker roles configured specifically for your business model, systems, and approval boundaries.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center min-w-[160px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Workers</div>
          <div className="text-3xl font-black text-slate-900">{workforce.length}</div>
          <div className="text-[11px] font-extrabold text-sky-600">Active Specification</div>
        </div>
      </div>

      {/* Worker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workforce.map((wrk) => (
          <div
            key={wrk.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-5"
          >
            {/* Worker Top Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Bot size={18} className="text-sky-600" /> {wrk.name}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{wrk.role}</span>
                </div>
                {getCapabilityBadge(wrk.status)}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Problem Addressed</span>
                <p className="text-slate-800 font-medium">{wrk.problemAddressed}</p>
              </div>

              {/* Actions List */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Autonomous Actions</span>
                <ul className="space-y-1 pl-1">
                  {wrk.actionsTaken.map((act, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-1.5 text-slate-700 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Approval Boundaries */}
              <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase flex items-center gap-1">
                  <Lock size={12} /> Actions Requiring Human Approval
                </span>
                <ul className="space-y-1 pl-1">
                  {wrk.actionsRequiringApproval.map((appr, apIdx) => (
                    <li key={apIdx} className="flex items-start gap-1.5 text-amber-950 font-semibold">
                      <ShieldCheck size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{appr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Outcome */}
            <div className="pt-3 border-t border-slate-100 text-xs flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Expected Outcome</span>
                <span className="font-extrabold text-slate-900">{wrk.expectedOutcome}</span>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg text-[10px] shrink-0">
                Priority: {wrk.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
