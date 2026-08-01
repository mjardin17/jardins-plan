// src/components/discovery/ImprovementDeploymentCenter.tsx
import React, { useState, useEffect } from 'react';
import {
  DeployableBusinessImprovement,
  FinancialScenario,
  FinancialAssumption,
  ImprovementPerformanceResult,
  EvidenceClassification
} from '../../types/deployable-improvement.ts';
import {
  Rocket,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Lock,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Zap,
  Globe,
  Bot
} from 'lucide-react';

export const ImprovementDeploymentCenter: React.FC = () => {
  const [improvements, setImprovements] = useState<DeployableBusinessImprovement[]>([]);
  const [selectedImp, setSelectedImp] = useState<DeployableBusinessImprovement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [perfResult, setPerfResult] = useState<ImprovementPerformanceResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchImprovements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discovery/improvements?tenantId=joshua_jardin');
      const json = await res.json();
      if (json.success && json.data) {
        setImprovements(json.data);
        if (json.data.length > 0 && !selectedImp) {
          setSelectedImp(json.data[0]);
        } else if (selectedImp) {
          const updated = json.data.find((i: any) => i.id === selectedImp.id);
          if (updated) setSelectedImp(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching improvements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImprovements();
  }, []);

  const handleGenerateSample = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/discovery/improvements/generate-from-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          opportunityId: 'opp_ai_catalog_01',
          title: 'Deploy AI-Accessible Service & Catalog API',
          description: 'Expose machine-readable schema.org JSON-LD and OpenAPI manifests so third-party AI systems and agents can query and book services automatically.',
          problemBeingSolved: 'Current business website lacks AI-agent accessibility, losing 85% of automated voice and assistant referral bookings.',
          capabilityType: 'ai_accessibility',
          businessOutcome: 'improve_ai_discoverability',
          baseMonthlySavings: 1500,
          baseMonthlyRevenueIncrease: 3800,
          implementationCost: 600,
          monthlyOperatingCost: 120
        })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'New deployable AI capability generated successfully!' });
        await fetchImprovements();
        setSelectedImp(json.data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate improvement' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAssumption = async (assumptionId: string) => {
    if (!selectedImp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/discovery/improvements/${selectedImp.id}/assumptions/${assumptionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'joshua_jardin', isConfirmed: true })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedImp(json.data);
        setMessage({ type: 'success', text: 'Assumption confirmed as verified fact!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedImp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/discovery/improvements/${selectedImp.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          approver: 'Business Owner',
          approvedScope: ['publish_website_changes', 'ai_accessibility']
        })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedImp(json.data.improvement);
        setMessage({ type: 'success', text: 'Improvement approved for deployment!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedImp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/discovery/improvements/${selectedImp.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'joshua_jardin' })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedImp(json.data.improvement);
        setMessage({ type: 'success', text: 'Deployment & verification completed successfully! Capability is now ACTIVE.' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Deployment failed verification checks.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedImp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/discovery/improvements/${selectedImp.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'joshua_jardin' })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedImp(json.data.improvement);
        setMessage({ type: 'success', text: 'Capability safely rolled back to inactive state.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedImp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/discovery/improvements/${selectedImp.id}/evaluate-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'joshua_jardin',
          actualMetrics: { m_rev: 18200, m_ai_disc: 16 }
        })
      });
      const json = await res.json();
      if (json.success) {
        setPerfResult(json.data);
        setMessage({ type: 'success', text: 'Performance evaluation completed against baseline and financial scenarios.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getClassificationBadge = (classification: EvidenceClassification) => {
    switch (classification) {
      case 'verified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</span>;
      case 'owner_provided':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Owner Provided</span>;
      case 'connected_data':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Connected Data</span>;
      case 'benchmark':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Industry Benchmark</span>;
      case 'assumption':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"><HelpCircle className="w-3 h-3 mr-1" /> Assumption</span>;
      case 'unknown':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Unknown</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{classification}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white flex items-center gap-1"><Zap className="w-3 h-3" /> ACTIVE</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> APPROVED</span>;
      case 'awaiting_approval':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white flex items-center gap-1"><Lock className="w-3 h-3" /> AWAITING APPROVAL</span>;
      case 'recommended':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-600 text-white">RECOMMENDED</span>;
      case 'rolled_back':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-600 text-white flex items-center gap-1"><RotateCcw className="w-3 h-3" /> ROLLED BACK</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500 text-white">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Deployable Improvement & Capability Center</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Transform diagnosed business opportunities into controlled, measurable, deployable business capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSample}
            disabled={actionLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Bot className="w-4 h-4" /> Generate AI Capability
          </button>
          <button
            onClick={fetchImprovements}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition border border-slate-700 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Improvement Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>Diagnosed Opportunities ({improvements.length})</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading improvements...
            </div>
          ) : improvements.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No deployable improvements generated yet. Click "Generate AI Capability" above to create one.
            </div>
          ) : (
            improvements.map((imp) => {
              const isSelected = selectedImp?.id === imp.id;
              return (
                <div
                  key={imp.id}
                  onClick={() => setSelectedImp(imp)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {imp.capabilityType.replace('_', ' ')}
                    </span>
                    {getStatusBadge(imp.deploymentStatus)}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1 mb-1">{imp.title}</h3>
                  <p className={`text-xs line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {imp.problemBeingSolved}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/20 flex justify-between items-center text-xs">
                    <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                      Confidence: {(imp.confidenceScore * 100).toFixed(0)}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedImp ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Title Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Outcome: {selectedImp.businessOutcome.replace('_', ' ')}
                    </span>
                    {getStatusBadge(selectedImp.deploymentStatus)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedImp.title}</h2>
                  <p className="text-slate-600 text-sm mt-1">{selectedImp.description}</p>
                </div>

                {/* Primary Action Button Bar */}
                <div className="flex items-center gap-2">
                  {selectedImp.deploymentStatus === 'recommended' || selectedImp.deploymentStatus === 'awaiting_approval' ? (
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" /> Human Approve
                    </button>
                  ) : null}

                  {selectedImp.deploymentStatus === 'approved' ? (
                    <button
                      onClick={handleDeploy}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Rocket className="w-4 h-4" /> Deploy & Verify
                    </button>
                  ) : null}

                  {selectedImp.deploymentStatus === 'active' ? (
                    <>
                      <button
                        onClick={handleEvaluate}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Measure Results
                      </button>
                      <button
                        onClick={handleRollback}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Rollback
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Problem Being Solved */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Business Problem Being Solved
                </span>
                <p className="text-sm font-medium text-slate-800">{selectedImp.problemBeingSolved}</p>
              </div>

              {/* Financial Scenarios Cards (Conservative, Expected, Upside) */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Financial Scenarios & Expected Impact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {selectedImp.scenarios.map((sc) => {
                    const isExpected = sc.scenario === 'expected';
                    return (
                      <div
                        key={sc.scenario}
                        className={`p-4 rounded-xl border transition ${
                          isExpected
                            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold uppercase ${isExpected ? 'text-emerald-800' : 'text-slate-600'}`}>
                            {sc.scenario}
                          </span>
                          <span className="text-xs text-slate-500">
                            Confidence: {((sc.formulaDetails?.confidenceScore || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xl font-extrabold text-slate-900 mb-2">
                          +${(sc.monthlyNetBenefit || 0).toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo net</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                          <div className="flex justify-between">
                            <span>Annual Benefit:</span>
                            <span className="font-semibold text-slate-800">+${(sc.annualNetBenefit || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payback Period:</span>
                            <span className="font-semibold text-slate-800">{sc.paybackPeriodMonths || 0} mos</span>
                          </div>
                          <div className="flex justify-between">
                            <span>First-Year ROI:</span>
                            <span className="font-semibold text-emerald-700">{sc.roiPercent || 0}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assumptions & Evidence Classification */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" /> Assumptions & Evidence Classification
                </h3>
                <div className="space-y-2">
                  {selectedImp.assumptions.map((asm) => (
                    <div
                      key={asm.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{asm.label}:</span>
                          <span className="font-bold text-slate-900">{String(asm.value)}</span>
                          {getClassificationBadge(asm.classification)}
                        </div>
                      </div>
                      {asm.requiresConfirmation && !asm.isConfirmed && (
                        <button
                          onClick={() => handleConfirmAssumption(asm.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          Confirm Fact
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements & Deployment Readiness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Required Approvals & Scope
                  </h4>
                  <ul className="text-xs space-y-1 text-slate-700">
                    {selectedImp.requiredApprovals.map((appr, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {appr}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" /> Connectors & Dependencies
                  </h4>
                  <ul className="text-xs space-y-1 text-slate-700">
                    {selectedImp.requiredConnectors.length === 0 ? (
                      <li className="text-slate-400 italic">No external connectors required</li>
                    ) : (
                      selectedImp.requiredConnectors.map((conn, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> {conn}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Performance Evaluation Output (if measured) */}
              {perfResult && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-700" /> Measured Post-Deployment Results
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                      Recommendation: {perfResult.recommendation.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-950">{perfResult.notes}</p>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-emerald-200/60 text-center">
                    <div>
                      <span className="text-slate-500 block">Vs Conservative</span>
                      <span className="font-bold text-slate-900">{(perfResult.comparisonToScenarios.conservativeRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Vs Expected</span>
                      <span className="font-bold text-slate-900">{(perfResult.comparisonToScenarios.expectedRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Financial Benefit Status</span>
                      <span className="font-bold text-emerald-800 uppercase">{perfResult.financialBenefitStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select an improvement from the left sidebar to view its financial scenarios and deployment readiness.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
