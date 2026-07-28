// src/components/discovery/ExperimentResultsCenterView.tsx
import React, { useState } from 'react';
import { BusinessExperiment } from '../../types/business-discovery.ts';
import {
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Props {
  experiments: BusinessExperiment[];
  onUpdateExperiment: (
    experimentId: string,
    actualOutcome: string,
    decision: 'EXPAND' | 'MODIFY' | 'STOPPED' | 'ROLLED_BACK',
    lessonsLearned: string
  ) => Promise<void>;
}

export const ExperimentResultsCenterView: React.FC<Props> = ({
  experiments,
  onUpdateExperiment
}) => {
  const [outcomeInputs, setOutcomeInputs] = useState<Record<string, string>>({});
  const [lessonsInputs, setLessonsInputs] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleAction = async (
    expId: string,
    decision: 'EXPAND' | 'MODIFY' | 'STOPPED' | 'ROLLED_BACK'
  ) => {
    setLoadingMap((prev) => ({ ...prev, [expId]: true }));
    const outcome = outcomeInputs[expId] || 'Measured positive pilot results';
    const lessons = lessonsInputs[expId] || 'Draft generation meets accuracy threshold';
    await onUpdateExperiment(expId, outcome, decision, lessons);
    setLoadingMap((prev) => ({ ...prev, [expId]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Experiment & Results Center
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Pilot Measurement Engine
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Measures actual operational outcomes against baselines before expanding worker policies or rolling back changes.
          </p>
        </div>
      </div>

      {/* Experiments List */}
      <div className="space-y-6">
        {experiments.map((exp) => {
          const isLoading = loadingMap[exp.id];

          return (
            <div
              key={exp.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Status: {exp.status}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{exp.title}</h3>
                </div>

                <span className="text-xs text-slate-400">Started: {new Date(exp.startDate).toLocaleDateString()}</span>
              </div>

              {/* Experiment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-700">Change Performed:</span>
                  <p className="text-slate-600">{exp.changePerformed}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">Pilot Group: {exp.pilotGroup}</p>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-1">
                  <span className="font-bold text-indigo-900">Expected Outcome:</span>
                  <p className="text-indigo-950 font-semibold">{exp.expectedOutcome}</p>
                </div>
              </div>

              {/* Baseline Metrics */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700">Baseline Metrics:</span>
                <p className="font-mono text-slate-600">{JSON.stringify(exp.baselineMetrics)}</p>
              </div>

              {/* Outcome Input & Lessons Learned */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Actual Measured Outcome
                  </label>
                  <input
                    type="text"
                    placeholder="Enter measured results (e.g., Draft creation time dropped from 20 mins to 1.8 mins per item)..."
                    value={outcomeInputs[exp.id] || exp.actualOutcome || ''}
                    onChange={(e) =>
                      setOutcomeInputs((prev) => ({ ...prev, [exp.id]: e.target.value }))
                    }
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Lessons Learned & Next Steps
                  </label>
                  <input
                    type="text"
                    placeholder="Key takeaway (e.g., AI item specifics accuracy is 95%+)..."
                    value={lessonsInputs[exp.id] || exp.lessonsLearned || ''}
                    onChange={(e) =>
                      setLessonsInputs((prev) => ({ ...prev, [exp.id]: e.target.value }))
                    }
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(exp.id, 'ROLLED_BACK')}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rollback Change
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(exp.id, 'STOPPED')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Stop Experiment
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(exp.id, 'MODIFY')}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition flex items-center gap-1.5"
                >
                  Modify & Re-Test
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleAction(exp.id, 'EXPAND')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Expand Worker Policy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
