// src/components/universal/WorkerActivationView.tsx
import React, { useState } from 'react';
import {
  ActivationState,
  ApprovalPolicyLevel,
  AuditTrailEntry
} from '../../types/connector-activation.ts';
import {
  runInboxAssistantWorkflow,
  approveInboxDraft,
  InboxWorkflowExecutionResult
} from '../../lib/executors/inbox-assistant-executor.ts';
import {
  runSchedulingAssistantWorkflow,
  approveAndWriteCalendarEvent,
  SchedulingWorkflowExecutionResult
} from '../../lib/executors/scheduling-assistant-executor.ts';
import {
  Bot, Shield, CheckCircle2, Play, AlertCircle, RefreshCw, Send,
  Calendar as CalendarIcon, Check, FileText, ArrowRight, Pause, UserCheck, ShieldAlert, Clock
} from 'lucide-react';

interface Props {
  tenantId?: string;
}

const ACTIVATION_STATES_LIST: { state: ActivationState; label: string; desc: string }[] = [
  { state: 'RECOMMENDED', label: '1. Recommended', desc: 'Identified opportunity for workforce expansion.' },
  { state: 'CONFIGURATION_STARTED', label: '2. Config Started', desc: 'Dependencies mapped.' },
  { state: 'CONNECTIONS_INCOMPLETE', label: '3. Conn Incomplete', desc: 'Waiting for missing required connectors.' },
  { state: 'CONNECTIONS_VERIFIED', label: '4. Conn Verified', desc: 'All required credentials authenticated.' },
  { state: 'PERMISSIONS_REVIEWED', label: '5. Scopes Reviewed', desc: 'Read and write scopes verified.' },
  { state: 'SANDBOX_TEST_READY', label: '6. Sandbox Ready', desc: 'Ready for isolated sandbox test run.' },
  { state: 'SANDBOX_TEST_PASSED', label: '7. Sandbox Passed', desc: 'End-to-end sandbox execution verified.' },
  { state: 'OWNER_APPROVAL_REQUIRED', label: '8. Approval Required', desc: 'Awaiting human owner policy review.' },
  { state: 'ACTIVE_WITH_APPROVALS', label: '9. Active (Approvals)', desc: 'Worker active with human approval on dispatch.' },
  { state: 'ACTIVE_WITHIN_POLICY', label: '10. Active (Autopilot)', desc: 'Worker active within policy limits.' },
  { state: 'PAUSED', label: '11. Paused', desc: 'Worker paused by owner or connection loss.' },
  { state: 'ERROR', label: '12. Error', desc: 'Encountered execution failure.' },
  { state: 'DISABLED', label: '13. Disabled', desc: 'Deactivated by tenant owner.' }
];

export const WorkerActivationView: React.FC<Props> = ({ tenantId = 'default_tenant' }) => {
  const [activeWorkerTab, setActiveWorkerTab] = useState<'inbox' | 'scheduling'>('inbox');

  // Inbox Assistant State
  const [inboxState, setInboxState] = useState<ActivationState>('ACTIVE_WITH_APPROVALS');
  const [inboxPolicy, setInboxPolicy] = useState<ApprovalPolicyLevel>('DRAFT_ONLY');
  const [inboxExec, setInboxExec] = useState<InboxWorkflowExecutionResult | null>(null);
  const [isInboxRunning, setIsInboxRunning] = useState(false);

  // Scheduling Assistant State
  const [schedState, setSchedState] = useState<ActivationState>('ACTIVE_WITH_APPROVALS');
  const [schedPolicy, setSchedPolicy] = useState<ApprovalPolicyLevel>('ALWAYS_ASK');
  const [schedExec, setSchedExec] = useState<SchedulingWorkflowExecutionResult | null>(null);
  const [isSchedRunning, setIsSchedRunning] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditTrailEntry[]>([
    {
      id: 'aud_101',
      tenantId,
      timestamp: new Date().toISOString(),
      actor: 'Business Inbox Assistant',
      actionType: 'INBOX_MESSAGE_READ',
      targetConnectorOrWorker: 'gmail',
      details: 'Read inbound customer email from customer.johnson@example.com',
      status: 'SUCCESS',
      externalRefId: 'msg_9942'
    }
  ]);

  const handleRunInbox = async () => {
    setIsInboxRunning(true);
    try {
      const result = await runInboxAssistantWorkflow(tenantId);
      setInboxExec(result);
    } finally {
      setIsInboxRunning(false);
    }
  };

  const handleApproveInboxDraft = () => {
    if (!inboxExec) return;
    const updated = approveInboxDraft(tenantId, inboxExec.executionId);
    setInboxExec({ ...updated });
    setAuditLogs(prev => [
      {
        id: `aud_${Date.now()}`,
        tenantId,
        timestamp: new Date().toISOString(),
        actor: 'Tenant Owner',
        actionType: 'INBOX_DRAFT_APPROVED',
        targetConnectorOrWorker: 'Business Inbox Assistant',
        details: 'Owner approved draft response. Sent via Gmail Sandbox API (Simulated Sent).',
        status: 'SUCCESS'
      },
      ...prev
    ]);
  };

  const handleRunSched = async () => {
    setIsSchedRunning(true);
    try {
      const result = await runSchedulingAssistantWorkflow(tenantId);
      setSchedExec(result);
    } finally {
      setIsSchedRunning(false);
    }
  };

  const handleApproveSchedEvent = () => {
    if (!schedExec) return;
    const updated = approveAndWriteCalendarEvent(tenantId, schedExec.executionId);
    setSchedExec({ ...updated });
    setAuditLogs(prev => [
      {
        id: `aud_${Date.now()}`,
        tenantId,
        timestamp: new Date().toISOString(),
        actor: 'Scheduling Assistant',
        actionType: 'CALENDAR_EVENT_CREATED',
        targetConnectorOrWorker: 'google_calendar',
        details: `Created calendar event ID: ${updated.externalEventId}. Read-back verified cleanly.`,
        status: 'SUCCESS',
        externalRefId: updated.externalEventId
      },
      ...prev
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
            <Bot className="w-4 h-4" /> WORKER ACTIVATION & APPROVAL ENGINE
          </div>
          <h2 className="text-2xl font-bold">13-State Activation & Sandbox Workflows</h2>
          <p className="text-slate-300 text-sm mt-1">
            Manage worker dependencies, human approval policies, and execute end-to-end sandbox tests.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveWorkerTab('inbox')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkerTab === 'inbox' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Business Inbox Assistant
          </button>
          <button
            onClick={() => setActiveWorkerTab('scheduling')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWorkerTab === 'scheduling' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Scheduling Assistant
          </button>
        </div>
      </div>

      {/* 13-State Machine Visual Track */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" /> Controlled 13-State Worker Lifecycle State Machine
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {ACTIVATION_STATES_LIST.map(st => {
            const currentWorkerState = activeWorkerTab === 'inbox' ? inboxState : schedState;
            const isCurrent = currentWorkerState === st.state;

            return (
              <div
                key={st.state}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-semibold">{st.label}</div>
                <div className={`text-[10px] mt-0.5 ${isCurrent ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WORKER VIEW 1: Business Inbox Assistant */}
      {activeWorkerTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls & Policy Column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Business Inbox Assistant</h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  STATE: {inboxState}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Required Connectors</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-800">Google Gmail API</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Approval Policy Level</label>
              <select
                value={inboxPolicy}
                onChange={e => setInboxPolicy(e.target.value as ApprovalPolicyLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DRAFT_ONLY">DRAFT ONLY (Must approve before sending)</option>
                <option value="ALWAYS_ASK">ALWAYS ASK (Require approval on all actions)</option>
                <option value="ASK_FOR_HIGH_RISK">ASK FOR HIGH RISK (Auto-execute low risk)</option>
                <option value="AUTO_EXECUTE_LOW_RISK">AUTO EXECUTE LOW RISK</option>
                <option value="READ_ONLY">READ ONLY (No replies created)</option>
              </select>
            </div>

            <button
              onClick={handleRunInbox}
              disabled={isInboxRunning}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              {isInboxRunning ? 'Executing Sandbox Workflow...' : 'Run End-to-End Inbox Workflow'}
            </button>
          </div>

          {/* Workflow Execution Display */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> End-to-End Sandbox Workflow Execution
            </h3>

            {!inboxExec ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Click "Run End-to-End Inbox Workflow" to read a test email, classify it, draft a factual reply, and request owner approval.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Step List */}
                <div className="space-y-2">
                  {inboxExec.workflowSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{step.stepName}</div>
                        <div className="text-slate-600 mt-0.5">{step.output}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        step.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        step.status === 'WAITING_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Draft Review Card */}
                <div className="p-4 bg-indigo-950 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
                    <span className="font-bold text-indigo-200">Generated Reply Draft</span>
                    <span className="font-mono text-[11px] text-amber-300">
                      Status: {inboxExec.approvalStatus}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] text-indigo-300">To: {inboxExec.draftResponse.recipient}</div>
                    <div className="text-[11px] text-indigo-300">Subject: {inboxExec.draftResponse.subject}</div>
                  </div>

                  <div className="p-3 bg-indigo-900/60 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-slate-200">
                    {inboxExec.draftResponse.body}
                  </div>

                  {inboxExec.approvalStatus === 'PENDING_APPROVAL' ? (
                    <button
                      onClick={handleApproveInboxDraft}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" /> Approve & Send Response (Sandbox Dispatched)
                    </button>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Reply Dispatched (Labeled: Simulated / Sandbox Sent)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKER VIEW 2: Scheduling Assistant */}
      {activeWorkerTab === 'scheduling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Scheduling Assistant</h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  STATE: {schedState}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Required Connectors</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-800">Google Calendar API</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                </span>
              </div>
            </div>

            <button
              onClick={handleRunSched}
              disabled={isSchedRunning}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              {isSchedRunning ? 'Executing Calendar Workflow...' : 'Run Scheduling Assistant Workflow'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" /> Calendar Booking & Read-Back Verification Workflow
            </h3>

            {!schedExec ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Click "Run Scheduling Assistant Workflow" to read calendar availability, propose an appointment, request approval, and verify event read-back.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  {schedExec.workflowSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{step.stepName}</div>
                        <div className="text-slate-600 mt-0.5">{step.output}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>

                {schedExec.approvalStatus === 'PENDING_APPROVAL' ? (
                  <button
                    onClick={handleApproveSchedEvent}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Appointment & Write to Google Calendar
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-900 text-white rounded-2xl space-y-2">
                    <div className="font-bold text-emerald-200 text-sm">✅ Event Written & Read-Back Verified</div>
                    <div className="font-mono text-xs text-slate-200">External Event ID: {schedExec.externalEventId}</div>
                    <div className="text-xs text-slate-300">{schedExec.cleanupStatus}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tenant Audit Trail Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> Immutable Tenant Action Audit Trail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Target</th>
                <th className="p-3">Details</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-semibold">{log.actor}</td>
                  <td className="p-3 font-mono text-[11px] text-indigo-700">{log.actionType}</td>
                  <td className="p-3">{log.targetConnectorOrWorker}</td>
                  <td className="p-3 max-w-xs truncate">{log.details}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
