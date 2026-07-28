// src/components/universal/UniversalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2, ShieldCheck, BarChart3, Zap, Bot, Layers,
  RefreshCw, Link as LinkIcon, Cpu
} from 'lucide-react';
import { UniversalOnboardingWizard } from './UniversalOnboardingWizard.tsx';
import { BusinessProfileReview } from './BusinessProfileReview.tsx';
import { MaturityAssessmentView } from './MaturityAssessmentView.tsx';
import { OpportunityEngineView } from './OpportunityEngineView.tsx';
import { WorkforceDesignView } from './WorkforceDesignView.tsx';
import { UniversalityStudio } from './UniversalityStudio.tsx';
import { ConnectionHubView } from './ConnectionHubView.tsx';
import { WorkerActivationView } from './WorkerActivationView.tsx';

import { OnboardingAnswers, FactVerificationStatus } from '../../types/universal-onboarding.ts';

type DashboardTab = 'onboarding' | 'profile' | 'maturity' | 'opportunities' | 'workforce' | 'connection_hub' | 'worker_activation' | 'universality';

export const UniversalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('onboarding');
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load default preset on mount (Joshua Jardin)
  useEffect(() => {
    loadPreset('joshua_jardin');
  }, []);

  const loadPreset = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/universal/demo-profiles/${key}`, { method: 'POST' });
      const json = await res.json();
      if (json.data) {
        setAnalysisData(json.data);
      }
    } catch (err) {
      console.error('Failed to load demo preset:', err);
    } fontinally: {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (answers: OnboardingAnswers) => {
    setLoading(true);
    try {
      const res = await fetch('/api/universal/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      const json = await res.json();
      if (json.data) {
        setAnalysisData(json.data);
        setActiveTab('profile');
      }
    } catch (err) {
      console.error('Failed to process onboarding answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFactCorrection = async (fieldPath: string, newValue: any, status: FactVerificationStatus) => {
    if (!analysisData?.profile?.id) return;
    try {
      const res = await fetch('/api/universal/correct-fact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: analysisData.profile.id,
          fieldPath,
          newValue,
          status
        })
      });
      const json = await res.json();
      if (json.data) {
        setAnalysisData(json.data);
      }
    } catch (err) {
      console.error('Failed to correct fact:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-16 font-sans">
      {/* Top Banner & Header Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">AI Workforce</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Universal Architecture v3.5
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Universal Connection Hub & Worker Activation Engine
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-slate-400 font-bold shrink-0 text-[11px]">Load Profile:</span>
            <button
              type="button"
              onClick={() => loadPreset('joshua_jardin')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold rounded-xl border border-amber-200 transition-all cursor-pointer shrink-0"
            >
              Joshua Jardin
            </button>
            <button
              type="button"
              onClick={() => loadPreset('ricardos_restaurant')}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-950 font-bold rounded-xl border border-sky-200 transition-all cursor-pointer shrink-0"
            >
              Ricardo's
            </button>
            <button
              type="button"
              onClick={() => loadPreset('apex_plumbing')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer shrink-0"
            >
              Apex Plumbing
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'onboarding', label: '1. Onboarding', icon: Building2 },
            { id: 'profile', label: '2. Fact Audit', icon: ShieldCheck },
            { id: 'maturity', label: '3. Maturity', icon: BarChart3 },
            { id: 'opportunities', label: '4. Opportunities', icon: Zap },
            { id: 'workforce', label: '5. Workforce', icon: Bot },
            { id: 'connection_hub', label: '6. Connection Hub', icon: LinkIcon },
            { id: 'worker_activation', label: '7. Worker Activation', icon: Cpu },
            { id: 'universality', label: '8. Universality Studio', icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`py-3 px-3.5 font-extrabold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon size={15} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3 font-bold text-sm">
            <RefreshCw size={20} className="animate-spin text-sky-600" />
            <span>Processing universal engine analysis...</span>
          </div>
        )}

        {!loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'onboarding' && (
              <UniversalOnboardingWizard
                onComplete={handleOnboardingSubmit}
                initialAnswers={analysisData?.answers}
              />
            )}

            {activeTab === 'profile' && analysisData?.profile && (
              <BusinessProfileReview
                profile={analysisData.profile}
                onFactCorrect={handleFactCorrection}
              />
            )}

            {activeTab === 'maturity' && analysisData?.maturity && (
              <MaturityAssessmentView maturity={analysisData.maturity} />
            )}

            {activeTab === 'opportunities' && analysisData?.opportunities && (
              <OpportunityEngineView opportunities={analysisData.opportunities} />
            )}

            {activeTab === 'workforce' && analysisData?.workforce && (
              <WorkforceDesignView workforce={analysisData.workforce} />
            )}

            {activeTab === 'connection_hub' && (
              <ConnectionHubView tenantId={analysisData?.profile?.id || 'default_tenant'} />
            )}

            {activeTab === 'worker_activation' && (
              <WorkerActivationView tenantId={analysisData?.profile?.id || 'default_tenant'} />
            )}

            {activeTab === 'universality' && <UniversalityStudio />}
          </motion.div>
        )}
      </main>
    </div>
  );
};
