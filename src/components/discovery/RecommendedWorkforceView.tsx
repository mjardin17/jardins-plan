// src/components/discovery/RecommendedWorkforceView.tsx
import React, { useState } from 'react';
import { WorkerAutonomyControl, AutonomyLevel } from '../../types/business-discovery.ts';
import {
  Bot,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Props {
  workers: WorkerAutonomyControl[];
  onUpdateAutonomy: (
    workerId: string,
    autonomyLevel: AutonomyLevel,
    approved: boolean
  ) => Promise<void>;
}

export const RecommendedWorkforceView: React.FC<Props> = ({ workers, onUpdateAutonomy }) => {
  const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});

  const autonomyLevelsList: AutonomyLevel[] = [
    'LEVEL 0 - Observe only',
    'LEVEL 1 - Recommend',
    'LEVEL 2 - Prepare drafts',
    'LEVEL 3 - Execute after approval',
    'LEVEL 4 - Execute within approved limits',
    'LEVEL 5 - Autonomous operation with exception escalation'
  ];

  const handleToggle = async (worker: WorkerAutonomyControl) => {
    setUpdatingMap((prev) => ({ ...prev, [worker.workerId]: true }));
    const newApproved = !worker.approvedByOwner;
    await onUpdateAutonomy(worker.workerId, worker.autonomyLevel, newApproved);
    setUpdatingMap((prev) => ({ ...prev, [worker.workerId]: false }));
  };

  const handleLevelChange = async (worker: WorkerAutonomyControl, newLevel: AutonomyLevel) => {
    setUpdatingMap((prev) => ({ ...prev, [worker.workerId]: true }));
    await onUpdateAutonomy(worker.workerId, newLevel, worker.approvedByOwner);
    setUpdatingMap((prev) => ({ ...prev, [worker.workerId]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Recommended AI Workforce & Autonomy Controls
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Governance & Policies
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Consequential actions (publishing, price cuts, offers, refunds) require explicit owner policy approval and autonomy level configuration.
          </p>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tenant Isolation & Credentials Encrypted</span>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {workers.map((worker) => {
          const isLoading = updatingMap[worker.workerId];

          return (
            <div
              key={worker.workerId}
              className={`bg-white rounded-xl border shadow-sm p-6 space-y-4 transition ${
                worker.approvedByOwner ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{worker.workerName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{worker.role}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleToggle(worker)}
                  className="flex items-center gap-1.5 transition text-indigo-600 hover:text-indigo-800"
                >
                  {worker.approvedByOwner ? (
                    <ToggleRight className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{worker.description}</p>

              {/* Projected Benefit Callout */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Projected Benefit: </span>
                  <span>{worker.projectedBenefit}</span>
                </div>
              </div>

              {/* Required Connections */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Required Connections: </span>
                <span className="font-semibold text-slate-700">
                  {worker.requiredConnections.join(', ')}
                </span>
              </div>

              {/* Autonomy Level Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Configured Autonomy Level
                </label>
                <select
                  value={worker.autonomyLevel}
                  onChange={(e) => handleLevelChange(worker, e.target.value as AutonomyLevel)}
                  disabled={isLoading}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {autonomyLevelsList.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
