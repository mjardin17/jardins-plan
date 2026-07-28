// src/components/universal/MaturityAssessmentView.tsx
import React from 'react';
import { BusinessMaturityAssessment, DimensionAssessment, MaturityStage } from '../../types/universal-onboarding.ts';
import { BarChart3, ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface Props {
  maturity: BusinessMaturityAssessment;
}

export const MaturityAssessmentView: React.FC<Props> = ({ maturity }) => {
  const getStageBadge = (stage: MaturityStage) => {
    switch (stage) {
      case 'Optimized':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Optimized</span>;
      case 'Partially automated':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">Partially Automated</span>;
      case 'Organized':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">Organized</span>;
      case 'Basic':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Basic</span>;
      case 'Manual':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">Manual / Bottleneck</span>;
    }
  };

  const dimensionsList = Object.values(maturity.dimensions);

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Overview Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-sky-400" />
            <h2 className="text-2xl font-black tracking-tight">14-Dimension Business Maturity Assessment</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {maturity.summary}
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl text-center space-y-1 min-w-[180px]">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overall Maturity</div>
          <div className="text-3xl font-black text-amber-400">{maturity.overallScorePct}%</div>
          <div className="text-xs font-bold text-slate-200">{maturity.overallStage}</div>
        </div>
      </div>

      {/* 14 Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensionsList.map((dim: DimensionAssessment) => (
          <div
            key={dim.key}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{dim.title}</h3>
                <span className="text-[11px] text-slate-400 font-medium">Confidence: {Math.round(dim.confidence * 100)}%</span>
              </div>
              {getStageBadge(dim.stage)}
            </div>

            {/* Score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Score</span>
                <span>{dim.scorePct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-500"
                  style={{ width: `${dim.scorePct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Evidence</span>
                <p className="text-slate-700 font-medium">{dim.evidence}</p>
              </div>

              <div>
                <span className="text-rose-600 font-bold block text-[10px] uppercase flex items-center gap-1">
                  <AlertCircle size={10} /> Main Operational Bottleneck
                </span>
                <p className="text-slate-800 font-semibold">{dim.mainWeakness}</p>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <span className="text-sky-700 font-bold block text-[10px] uppercase flex items-center gap-1">
                  <TrendingUp size={10} /> Recommended Step
                </span>
                <p className="text-sky-950 font-bold">{dim.recommendedNextStep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
