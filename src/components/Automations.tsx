import { useState, useEffect, FormEvent } from 'react';
import { Sliders, Sparkles, Send, Mail, Phone, Clock, AlertCircle, Save, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { AutomationSettings, AutomationLog } from '../types';

export default function Automations({ businessId }: { businessId: string }) {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings form states
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDelay, setFollowUpDelay] = useState(5);
  const [followUpEmail, setFollowUpEmail] = useState('');
  const [followUpSMS, setFollowUpSMS] = useState('');
  
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [reviewDelay, setReviewDelay] = useState(1);
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewSMS, setReviewSMS] = useState('');
  const [reviewLink, setReviewLink] = useState('');

  const fetchData = async () => {
    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch('/api/automations'),
        fetch('/api/automations/logs')
      ]);

      const settingsData = await settingsRes.json();
      const logsData = await logsRes.json();

      if (settingsData.automations) {
        const s = settingsData.automations;
        setSettings(s);
        setFollowUpEnabled(s.followUpEnabled);
        setFollowUpDelay(s.followUpDelayMinutes);
        setFollowUpEmail(s.followUpTemplateEmail);
        setFollowUpSMS(s.followUpTemplateSMS);
        
        setReviewEnabled(s.reviewEnabled);
        setReviewDelay(s.reviewRequestDelayDays);
        setReviewEmail(s.reviewTemplateEmail);
        setReviewSMS(s.reviewTemplateSMS);
        setReviewLink(s.reviewLink);
      }
      
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to load automations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpDelayMinutes: followUpDelay,
          followUpTemplateEmail: followUpEmail,
          followUpTemplateSMS: followUpSMS,
          followUpEnabled,
          reviewRequestDelayDays: reviewDelay,
          reviewTemplateEmail: reviewEmail,
          reviewTemplateSMS: reviewSMS,
          reviewEnabled,
          reviewLink
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save automation templates:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Connecting automation workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Templates configuration */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Sliders size={18} className="text-sky-600" />
              Follow-Up & Review Automations
            </h3>
            <p className="text-xs text-slate-500">Configure messaging templates that fire automatically on lead capture and service completion.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Saving...' : saveSuccess ? 'Saved successfully!' : 'Save Workflows'}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Lead Capture Follow-Up */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Lead Onboarding Follow-Up</h4>
                <p className="text-[11px] text-slate-500">Sent instantly after a new lead is captured by the AI.</p>
              </div>
              
              <button
                type="button"
                onClick={() => setFollowUpEnabled(!followUpEnabled)}
                className="text-slate-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                {followUpEnabled ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                    Enabled <ToggleRight size={20} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                    Disabled <ToggleLeft size={20} />
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Automation Delay (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={followUpDelay}
                  onChange={(e) => setFollowUpDelay(parseInt(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Template Content</label>
                <p className="text-[10px] text-slate-400 italic">Variables: {'{LeadName}, {LeadPhone}, {ServicesRequested}'}</p>
                <textarea
                  value={followUpEmail}
                  rows={6}
                  onChange={(e) => setFollowUpEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">SMS Text Template</label>
                <textarea
                  value={followUpSMS}
                  rows={2}
                  onChange={(e) => setFollowUpSMS(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Post-Service Review Request */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Post-Service Review Requests</h4>
                <p className="text-[11px] text-slate-500">Sent after you mark an appointment as complete.</p>
              </div>

              <button
                type="button"
                onClick={() => setReviewEnabled(!reviewEnabled)}
                className="text-slate-600 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                {reviewEnabled ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                    Enabled <ToggleRight size={20} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                    Disabled <ToggleLeft size={20} />
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Review Delay (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={reviewDelay}
                    onChange={(e) => setReviewDelay(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Review URL / Profile Link</label>
                  <input
                    type="url"
                    value={reviewLink}
                    placeholder="https://g.page/my-business/review"
                    onChange={(e) => setReviewLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Review Template</label>
                <p className="text-[10px] text-slate-400 italic">Variables: {'{ClientName}, {ServiceName}, {ReviewLink}'}</p>
                <textarea
                  value={reviewEmail}
                  rows={6}
                  onChange={(e) => setReviewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">SMS Review Template</label>
                <textarea
                  value={reviewSMS}
                  rows={2}
                  onChange={(e) => setReviewSMS(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* History logs of sent notifications */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Automation Transmission History</h3>
          <p className="text-xs text-slate-500">Review email and SMS follow-ups recently compiled and processed.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-100 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Workflow</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Transmitted Content Preview</th>
                  <th className="p-4">Date Sent</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <Send className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="font-semibold">No transmissions logged</p>
                      <p className="text-[10px] mt-1">Transmissions are saved once a lead is captured or service is finalized.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">
                        {log.leadName}
                        <p className="text-[10px] text-slate-400 font-normal">{log.recipient}</p>
                      </td>
                      <td className="p-4 capitalize text-slate-600 font-medium">
                        {log.type.replace('_', ' ')}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold capitalize text-[10px]">
                          {log.channel === 'email' ? <Mail size={12} className="text-sky-500" /> : <Phone size={12} className="text-emerald-500" />}
                          {log.channel}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-500 italic" title={log.content}>
                        {log.content}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                          ● Transmitted
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
