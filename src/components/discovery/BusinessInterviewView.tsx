// src/components/discovery/BusinessInterviewView.tsx
import React, { useState } from 'react';
import { BusinessUnknown } from '../../types/business-discovery.ts';
import {
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  SkipForward
} from 'lucide-react';

interface Props {
  questions: BusinessUnknown[];
  remainingCount: number;
  confidencePct: number;
  onSubmitAnswer: (
    questionId: string,
    answer: unknown,
    action: 'ANSWER' | 'I_DONT_KNOW' | 'SKIP'
  ) => Promise<void>;
  contradictionMessage?: string;
}

export const BusinessInterviewView: React.FC<Props> = ({
  questions,
  remainingCount,
  confidencePct,
  onSubmitAnswer,
  contradictionMessage
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [customTextInputs, setCustomTextInputs] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleSelectOption = (qId: string, val: any) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleTextChange = (qId: string, txt: string) => {
    setCustomTextInputs((prev) => ({ ...prev, [qId]: txt }));
    setSelectedAnswers((prev) => ({ ...prev, [qId]: txt }));
  };

  const handleAction = async (qId: string, action: 'ANSWER' | 'I_DONT_KNOW' | 'SKIP') => {
    setLoadingMap((prev) => ({ ...prev, [qId]: true }));
    const ans = selectedAnswers[qId];
    await onSubmitAnswer(qId, ans, action);
    setLoadingMap((prev) => ({ ...prev, [qId]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Adaptive Business Interview Engine
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              3 to 5 High-Impact Questions
            </span>
          </div>
          <p className="text-sm text-slate-300">
            The system asks only questions that connected eBay APIs cannot observe. Every answer updates your business profile dynamically.
          </p>
        </div>

        <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80 text-right">
          <p className="text-xs text-slate-400 font-medium">Profile Confidence</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-indigo-400">{confidencePct}%</span>
            <span className="text-xs text-slate-400">({remainingCount} remaining)</span>
          </div>
        </div>
      </div>

      {/* Contradiction Callout Banner */}
      {contradictionMessage && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-amber-800">
              Contradiction & Clarification Warning
            </span>
            <p className="leading-relaxed">{contradictionMessage}</p>
          </div>
        </div>
      )}

      {/* Question Cards List */}
      {questions.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">All Key Questions Answered!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your business profile has achieved full evidence clarity. View the Business Diagnostic Health Assessment or Improvement Roadmap.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isLoading = loadingMap[q.id];
            const currentSelected = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-indigo-200 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Question #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                        {q.category}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 uppercase">
                        Priority: {q.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{q.question}</h3>
                  </div>
                </div>

                {/* Why This Question Matters Callout */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-950">Why This Matters: </span>
                    <span>{q.reason}</span>
                  </div>
                </div>

                {/* Answer Inputs */}
                <div className="space-y-2 pt-2">
                  {q.answerType === 'yes_no' || q.answerType === 'multiple_choice' || q.answerType === 'numeric' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options?.map((opt) => {
                        const isSelected = currentSelected === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`p-3 text-left text-xs font-medium rounded-lg border transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={customTextInputs[q.id] || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleAction(q.id, 'I_DONT_KNOW')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> I Don't Know / Not Tracked
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleAction(q.id, 'SKIP')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Skip for Now
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading || !currentSelected}
                    onClick={() => handleAction(q.id, 'ANSWER')}
                    className={`px-5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
                      currentSelected
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Save Answer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
