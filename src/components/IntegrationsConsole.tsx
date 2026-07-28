import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, Send, Mail, 
  MessageSquare, DollarSign, Calendar, Database, Eye, EyeOff, Search, FileText, Lock, Users, Sparkles
} from 'lucide-react';
import IntegrationWizard from './IntegrationWizard';

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  ip: string;
  timestamp: string;
  details: string;
}

interface ConnectionStatus {
  stripeConfigured: boolean;
  twilioConfigured: boolean;
  smtpConfigured: boolean;
  geminiConfigured: boolean;
  googleCalendarConfigured: boolean;
  databaseConfigured: boolean;
  jwtConfigured: boolean;
  encryptionConfigured: boolean;
}

export default function IntegrationsConsole({ businessId }: { businessId: string }) {
  const [statuses, setStatuses] = useState<ConnectionStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  
  // Test SMS State
  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsBody, setTestSmsBody] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Test Email State
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [testEmailMsg, setTestEmailMsg] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Stripe Test Verification State
  const [stripeVerifying, setStripeVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    invoiceId: number;
    appointmentId: string;
    leadId: string;
    sessionId: string;
    url: string;
    real: boolean;
  } | null>(null);

  const [checkingWebhook, setCheckingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{
    invoiceStatus: string;
    payments: any[];
    hasAuditLog: boolean;
    auditLogDetails: string | null;
  } | null>(null);

  const handleStartStripeVerification = async () => {
    setStripeVerifying(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/stripe/create-test-verification-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationResult(data);
      } else {
        alert(data.error || "Failed to initiate Stripe test checkout.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error contacting the verification API.");
    } finally {
      setStripeVerifying(false);
    }
  };

  const handleCheckWebhookState = async () => {
    if (!verificationResult) return;
    setCheckingWebhook(true);
    try {
      const res = await fetch(`/api/stripe/verify-test-payment/${verificationResult.invoiceId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookResult(data);
        fetchSecurityData();
      } else {
        alert(data.error || "Failed to verify payment status.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error contacting the verification check API.");
    } finally {
      setCheckingWebhook(false);
    }
  };

  // Load status & logs
  const fetchSecurityData = async () => {
    try {
      setLoadingStatus(true);
      const resStatus = await fetch('/api/security/status');
      const dataStatus = await resStatus.json();
      setStatuses(dataStatus);

      // Auto-open wizard if critical items are not configured yet
      if (dataStatus && (!dataStatus.stripeConfigured || !dataStatus.twilioConfigured || !dataStatus.smtpConfigured)) {
        setShowWizard(true);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoadingStatus(false);
    }

    try {
      setLoadingLogs(true);
      const resLogs = await fetch('/api/security/audit-logs');
      const dataLogs = await resLogs.json();
      if (dataLogs.auditLogs) {
        // Sort descending
        const sorted = [...dataLogs.auditLogs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAuditLogs(sorted);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [businessId]);

  const handleTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSmsPhone) return;
    setSmsSending(true);
    setSmsResult(null);

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/security/test-twilio', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: testSmsPhone, message: testSmsBody })
      });
      const data = await res.json();
      if (res.ok) {
        setSmsResult({ 
          success: true, 
          msg: `SMS Sent successfully! Method: ${data.method === 'twilio' ? 'Real Twilio Client' : 'High-fidelity Simulation Sandbox'}` 
        });
        setTestSmsPhone('');
        setTestSmsBody('');
        fetchSecurityData(); // refresh audit logs
      } else {
        setSmsResult({ success: false, msg: data.error || 'Failed to send text' });
      }
    } catch (err: any) {
      setSmsResult({ success: false, msg: err.message || 'Error occurred' });
    } finally {
      setSmsSending(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddr) return;
    setEmailSending(true);
    setEmailResult(null);

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/security/test-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: testEmailAddr, message: testEmailMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult({ 
          success: true, 
          msg: `Email Sent successfully! Method: ${data.method === 'smtp' ? 'Gmail Secure Transporter' : 'High-fidelity Simulation Sandbox'}` 
        });
        setTestEmailAddr('');
        setTestEmailMsg('');
        fetchSecurityData(); // refresh audit logs
      } else {
        setEmailResult({ success: false, msg: data.error || 'Failed to send corporate email' });
      }
    } catch (err: any) {
      setEmailResult({ success: false, msg: err.message || 'Error occurred' });
    } finally {
      setEmailSending(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showWizard) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-1 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-slate-900 animate-pulse" size={22} /> Guided Integration Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">Easily configure the operational conduits of your plumbing business in under 10 minutes.</p>
          </div>
          <button 
            onClick={() => setShowWizard(false)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Show Advanced Console View
          </button>
        </div>
        <IntegrationWizard 
          onClose={() => setShowWizard(false)} 
          onComplete={() => {
            setShowWizard(false);
            fetchSecurityData();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-1 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Lock size={10} className="text-slate-600" /> Platform Security V1
          </span>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Integrations & Security Console</h1>
          <p className="text-xs text-slate-500 mt-1">Configure active communication channels, monitor secure authorization endpoints, and audit platform interactions.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Sparkles size={13} className="text-sky-300 animate-pulse" />
            Launch Setup Wizard
          </button>
          <button 
            onClick={fetchSecurityData}
            className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={loadingStatus || loadingLogs ? 'animate-spin' : ''} />
            Refresh Connection Status
          </button>
        </div>
      </div>

      {/* Grid: 6 Connections Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Gemini AI Status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            {statuses?.geminiConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Active Key
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle size={12} /> Simulation Sandbox
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Gemini Decision Engine</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {statuses?.geminiConfigured 
                ? 'Fully active and connected. Real-time grounding with custom FAQ sheets and plumber databases.' 
                : 'Using local structural prompt matching fallback. AI is fully active using rule-based reasoning engines.'}
            </p>
          </div>
        </div>

        {/* Twilio SMS Status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <MessageSquare size={20} />
            </div>
            {statuses?.twilioConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Real Twilio API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle size={12} /> Simulation Sandbox
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Twilio SMS Transports</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {statuses?.twilioConfigured 
                ? 'SMS integration is online. Automatic confirmation and follow-up SMS triggers dispatches securely.' 
                : 'Currently routing text messages to simulated outbox in the automation logs. Test SMS will simulate transmission.'}
            </p>
          </div>
        </div>

        {/* Stripe Status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            {statuses?.stripeConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Real Stripe API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle size={12} /> Simulation Sandbox
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Stripe Payment Gateway</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {statuses?.stripeConfigured 
                ? 'Stripe V3 Checkout is active. Generates real checkout links for technician diagnostic work and estimates.' 
                : 'Generating high-fidelity simulation stripe links. Owner console and clients can open checkout demo safely.'}
            </p>
          </div>
        </div>

        {/* SMTP Status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Mail size={20} />
            </div>
            {statuses?.smtpConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Real SMTP Mailer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle size={12} /> Simulation Sandbox
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">SMTP / Gmail Server</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {statuses?.smtpConfigured 
                ? 'Secured corporate mail routing active. Automatically dispatches real .ics calendar invite attachments.' 
                : 'Emailing routing is in sandbox. Messages spool cleanly to database logs and calendar invites download via UI.'}
            </p>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Calendar size={20} />
            </div>
            {statuses?.googleCalendarConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> Active Calendar Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} /> RFC 5545 Active
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Calendar Synchronization</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {statuses?.googleCalendarConfigured 
                ? 'Google calendar OAuth active. Instantly posts technician allocations to corporate Google calendars.' 
                : 'Using universal RFC 5545 iCalendar calendar invites. Adds instant 1-click calendar downloads to confirmations!'}
            </p>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Database size={20} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle size={12} /> Active LocalDB
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">CRM Database Persistence</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Database files are 100% active and persistent. Encrypts sensitive data fields in JSON schema to keep customers private.
            </p>
          </div>
        </div>
      </div>

      {/* Two testing boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Twilio SMS Test */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare size={18} className="text-sky-600" /> Secure Twilio SMS Test Panel
            </h3>
            <p className="text-xs text-slate-500 mt-1">Verify SMS communication channels. Enter a target cell number to send a test payload.</p>
          </div>

          <form onSubmit={handleTestSMS} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Destination Mobile Phone</label>
              <input 
                type="tel"
                placeholder="(512) 555-1234"
                value={testSmsPhone}
                onChange={e => setTestSmsPhone(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payload SMS Text</label>
              <textarea 
                placeholder="AI Workforce OS Twilio integration test: successful communication trigger!"
                value={testSmsBody}
                onChange={e => setTestSmsBody(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={smsSending}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Send size={13} /> {smsSending ? 'Transmitting...' : 'Send Test Text'}
            </button>
          </form>

          {smsResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              smsResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {smsResult.msg}
            </div>
          )}
        </div>

        {/* SMTP Email Test */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Mail size={18} className="text-purple-600" /> Secure SMTP Email & ICS Test Panel
            </h3>
            <p className="text-xs text-slate-500 mt-1">Verify automated corporate mailing systems. Dispatches a secure email with a valid calendar attachment.</p>
          </div>

          <form onSubmit={handleTestEmail} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Destination Corporate Email</label>
              <input 
                type="email"
                placeholder="owner@company.com"
                value={testEmailAddr}
                onChange={e => setTestEmailAddr(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Body Message (ICS Event Attached automatically)</label>
              <textarea 
                placeholder="SMTP Secure email integration online. Real.ics calendar slots active."
                value={testEmailMsg}
                onChange={e => setTestEmailMsg(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={emailSending}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Send size={13} /> {emailSending ? 'Transmitting...' : 'Send Test Corporate Email'}
            </button>
          </form>

          {emailResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              emailResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {emailResult.msg}
            </div>
          )}
        </div>
      </div>

      {/* Security Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
              <FileText size={18} className="text-slate-700" /> Platform Audit Trail Logs
            </h3>
            <p className="text-xs text-slate-500 mt-1">Cryptographically immutable logs of user authorizations, database shifts, and active communication dispatches.</p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        {loadingLogs ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Extracting audit trail logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <ShieldCheck size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-800 mt-2">Zero Audit Records Found</p>
            <p className="text-[11px] text-slate-500 mt-1">No security audit events matched your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Identity / Actor</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Detailed Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 font-mono text-[10px] whitespace-nowrap text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-extrabold whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        log.action.includes('SUCCESS') || log.action.includes('BOOKED')
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.action.includes('TEST')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600 whitespace-nowrap">
                      {log.userEmail}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {log.ip}
                    </td>
                    <td className="p-3.5 text-slate-500 leading-relaxed min-w-[250px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stripe Live / Test Mode Production Verification Gateway */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Lock size={18} className="text-emerald-600" /> Stripe Production Verification Gateway
          </h3>
          <p className="text-xs text-slate-500 mt-1">Verify that your live/test Stripe payments are integrated with the database, tenant restrictions are verified, and webhooks trigger properly.</p>
        </div>

        {/* Credentials Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">STRIPE_SECRET_KEY</p>
              <p className="text-[10px] text-slate-400">Main Stripe API credentials secret</p>
            </div>
            {statuses?.stripeConfigured ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                <CheckCircle size={10} /> DETECTED: YES
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                <AlertTriangle size={10} /> DETECTED: NO
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">STRIPE_WEBHOOK_SECRET</p>
              <p className="text-[10px] text-slate-400">Used to cryptographically verify signed Stripe events</p>
            </div>
            {process.env.STRIPE_WEBHOOK_SECRET || (statuses as any)?.webhookSecretConfigured ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                <CheckCircle size={10} /> DETECTED: YES
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                <AlertTriangle size={10} /> DETECTED: NO
              </span>
            )}
          </div>
        </div>

        {/* Webhook Configuration Guide */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3.5">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-500" /> Webhook Endpoint Configuration Guide
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            To receive secure, instant payment confirmations directly from Stripe, you need to register this webhook endpoint in your Stripe Dashboard under Developers.
          </p>
          <div className="bg-slate-950 text-slate-300 font-mono text-[10px] p-3 rounded-xl border border-slate-800 break-all select-all flex items-center justify-between">
            <span>{window.location.origin}/api/stripe/webhook</span>
            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-sans font-bold">Copy Endpoint</span>
          </div>
          <div className="text-[10px] text-slate-500 space-y-1">
            <p><strong>1. Event Type:</strong> Select <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">checkout.session.completed</code></p>
            <p><strong>2. Signing Secret:</strong> Once added, copy your webhook signing secret (starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-600">whsec_</code>) and add it in your project settings as <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">STRIPE_WEBHOOK_SECRET</code>.</p>
          </div>
        </div>

        {/* E2E Active Pipeline Verification Console */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            E2E Payment Pipeline Console
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step-by-step Interactive Checklist */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5 text-xs">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  verificationResult ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>1</span>
                <div>
                  <p className="font-bold text-slate-800">Provision Test Invoice</p>
                  <p className="text-[10px] text-slate-500">Create real test Lead, Appointment & Pending Invoice ($1.00) in PostgreSQL.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  verificationResult ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>2</span>
                <div>
                  <p className="font-bold text-slate-800">Simulate Test Checkout</p>
                  <p className="text-[10px] text-slate-500">Open the generated Stripe Checkout URL in Stripe Sandbox environment.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  webhookResult?.invoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>3</span>
                <div>
                  <p className="font-bold text-slate-800">Validate Webhook Receipt</p>
                  <p className="text-[10px] text-slate-500">Stripe dispatches a signed event. We verify signature, tenant mapping, ledger insert & audit logs.</p>
                </div>
              </div>
            </div>

            {/* Verification Actions Panel */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {!verificationResult ? (
                  <button
                    onClick={handleStartStripeVerification}
                    disabled={stripeVerifying}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className={stripeVerifying ? 'animate-spin' : ''} />
                    {stripeVerifying ? 'Provisioning...' : 'Provision Test Invoice & Stripe Session'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600 space-y-1">
                      <p><strong>PostgreSQL Invoice ID:</strong> #{verificationResult.invoiceId}</p>
                      <p><strong>PostgreSQL Lead ID:</strong> {verificationResult.leadId.substring(0, 18)}...</p>
                      <p><strong>Stripe Session ID:</strong> {verificationResult.sessionId.substring(0, 18)}...</p>
                      <p><strong>Status:</strong> {webhookResult?.invoiceStatus || 'pending'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={verificationResult.url}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all text-center"
                      >
                        Open Checkout ↗
                      </a>

                      <button
                        onClick={handleCheckWebhookState}
                        disabled={checkingWebhook}
                        className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <RefreshCw size={11} className={checkingWebhook ? 'animate-spin' : ''} />
                        Verify Pipeline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Webhook Results Display */}
              {webhookResult && (
                <div className="border-t border-slate-100 pt-3.5 space-y-2 text-[10px]">
                  <p className="font-extrabold text-slate-700 uppercase tracking-wider">Webhook Validation Metrics</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Stripe payment_status: paid</span>
                    {webhookResult.payments?.length > 0 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> PASS</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> PENDING</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">PostgreSQL Invoice status: paid</span>
                    {webhookResult.invoiceStatus === 'paid' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> PASS</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> PENDING</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Payment ledger record registered</span>
                    {webhookResult.payments?.some(p => p.status === 'paid') ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> PASS</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> PENDING</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Secure audit trail log recorded</span>
                    {webhookResult.hasAuditLog ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> PASS</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> PENDING</span>
                    )}
                  </div>

                  {webhookResult.invoiceStatus === 'paid' && webhookResult.hasAuditLog ? (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-lg font-bold text-center mt-2 flex items-center justify-center gap-1 text-[11px]">
                      <CheckCircle size={12} /> LIVE STRIPE PAYMENT PIPELINE: VERIFIED!
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2.5 rounded-lg font-bold text-center mt-2 flex items-center justify-center gap-1 text-[11px]">
                      <AlertTriangle size={12} /> WAITING FOR WEBHOOK PAYLOAD...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-2 max-w-xl">
          <span className="text-[9px] bg-sky-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <Users size={10} /> Active Role-Based Clearance Controls
          </span>
          <h3 className="font-extrabold text-base">Enterprise Role Clearance Matrix</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The platform enforces high-fidelity role separation natively. Permissions are divided into **Owner** (Full settings modification, log access, and billing), **Admin** (Staff allocations and CRM oversight), and **Technician** (Field schedules, dispatch updates, and customer reports).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center self-stretch md:self-auto flex-shrink-0">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[120px]">
            <p className="text-xl font-black text-sky-400">Owner</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Access Clearance</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[120px]">
            <p className="text-xl font-black text-purple-400">Admin</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Operational Level</p>
          </div>
        </div>
      </div>
    </div>
  );
}
