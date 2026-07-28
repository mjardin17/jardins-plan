// src/components/discovery/AutonomousBusinessOSContainer.tsx
import React, { useState, useEffect } from 'react';
import { TenantDiscoveryData } from '../../repositories/business-discovery.repository.ts';
import { BusinessDiscoveryView } from './BusinessDiscoveryView.tsx';
import { BusinessInterviewView } from './BusinessInterviewView.tsx';
import { BusinessHealthAssessmentView } from './BusinessHealthAssessmentView.tsx';
import { ImprovementRoadmapView } from './ImprovementRoadmapView.tsx';
import { RecommendedWorkforceView } from './RecommendedWorkforceView.tsx';
import { ExperimentResultsCenterView } from './ExperimentResultsCenterView.tsx';
import { AutonomyLevel } from '../../types/business-discovery.ts';
import {
  Search,
  HelpCircle,
  Activity,
  MapPin,
  Bot,
  FlaskConical,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';

export const AutonomousBusinessOSContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'discovery' | 'interview' | 'health' | 'roadmap' | 'workforce' | 'experiments'
  >('discovery');

  const [data, setData] = useState<TenantDiscoveryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contradictionMsg, setContradictionMsg] = useState<string | undefined>(undefined);

  const fetchDiscoveryData = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/discovery/data?tenantId=joshua_jardin${refresh ? '&refresh=true' : ''}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load discovery engine data');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, []);

  const handleSubmitAnswer = async (
    questionId: string,
    answer: unknown,
    action: 'ANSWER' | 'I_DONT_KNOW' | 'SKIP'
  ) => {
    try {
      const res = await fetch('/api/discovery/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          questionId,
          answer,
          action
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.contradictionDetected) {
          setContradictionMsg(json.contradictionDetected);
        } else {
          setContradictionMsg(undefined);
        }
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleUpdateAutonomy = async (
    workerId: string,
    autonomyLevel: AutonomyLevel,
    approved: boolean
  ) => {
    try {
      const res = await fetch('/api/discovery/workers/autonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          workerId,
          autonomyLevel,
          approved
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to update worker autonomy:', err);
    }
  };

  const handleUpdateExperiment = async (
    experimentId: string,
    actualOutcome: string,
    decision: 'EXPAND' | 'MODIFY' | 'STOPPED' | 'ROLLED_BACK',
    lessonsLearned: string
  ) => {
    try {
      const res = await fetch('/api/discovery/experiments/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          experimentId,
          actualOutcome,
          decision,
          lessonsLearned
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to update experiment:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Initializing Autonomous Business Discovery & Diagnostic Engine...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 space-y-3">
        <h3 className="text-base font-bold">Discovery Engine Initialization Error</h3>
        <p className="text-xs">{error}</p>
        <button
          onClick={() => fetchDiscoveryData(true)}
          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg"
        >
          Retry Initialization
        </button>
      </div>
    );
  }

  const unaskedUnknowns = data.unknowns.filter((u) => u.status === 'UNASKED' || u.status === 'ASKED');

  const tabs = [
    {
      id: 'discovery',
      label: '1. Discovery & Evidence',
      icon: Search,
      badge: `${data.evidence.length} Facts`
    },
    {
      id: 'interview',
      label: '2. Adaptive Interview',
      icon: HelpCircle,
      badge: `${unaskedUnknowns.length} Questions`
    },
    {
      id: 'health',
      label: '3. Health Assessment',
      icon: Activity,
      badge: `${data.health.overallScorePct}% Health`
    },
    {
      id: 'roadmap',
      label: '4. Improvement Roadmap',
      icon: MapPin,
      badge: '5 Phases'
    },
    {
      id: 'workforce',
      label: '5. Recommended Workforce',
      icon: Bot,
      badge: `${data.workers.length} Workers`
    },
    {
      id: 'experiments',
      label: '6. Experiments & Results',
      icon: FlaskConical,
      badge: `${data.experiments.length} Pilots`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top OS Branding Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Workforce OS
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Autonomous Business Discovery, Diagnosis, and Growth Planning Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
            Tenant: {data.profile.businessType} ({data.profile.tenantId})
          </span>
          <button
            onClick={() => fetchDiscoveryData(true)}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition"
            title="Re-scan store & reload engine"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-indigo-500/30 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Screen Content */}
      <div className="pt-2">
        {activeTab === 'discovery' && (
          <BusinessDiscoveryView
            data={data}
            onRefresh={() => fetchDiscoveryData(true)}
            onNavigateToInterview={() => setActiveTab('interview')}
          />
        )}

        {activeTab === 'interview' && (
          <BusinessInterviewView
            questions={data.unknowns.filter((u) => u.status === 'UNASKED' || u.status === 'ASKED')}
            remainingCount={data.unknowns.filter((u) => u.status === 'UNASKED').length}
            confidencePct={data.profile.confidenceScore}
            onSubmitAnswer={handleSubmitAnswer}
            contradictionMessage={contradictionMsg}
          />
        )}

        {activeTab === 'health' && (
          <BusinessHealthAssessmentView health={data.health} />
        )}

        {activeTab === 'roadmap' && (
          <ImprovementRoadmapView roadmap={data.roadmap} />
        )}

        {activeTab === 'workforce' && (
          <RecommendedWorkforceView
            workers={data.workers}
            onUpdateAutonomy={handleUpdateAutonomy}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentResultsCenterView
            experiments={data.experiments}
            onUpdateExperiment={handleUpdateExperiment}
          />
        )}
      </div>
    </div>
  );
};
