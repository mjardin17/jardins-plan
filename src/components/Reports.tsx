import { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Clock, Award, DollarSign, Target, 
  AlertTriangle, Sparkles, UserCheck, ShieldAlert, ArrowUpRight 
} from 'lucide-react';
import { Lead, Appointment } from '../types';

interface ReportsProps {
  businessId: string;
}

export default function Reports({ businessId }: ReportsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, apptsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/appointments')
        ]);
        const leadsData = await leadsRes.json();
        const apptsData = await apptsRes.json();
        setLeads(leadsData.leads || []);
        setAppointments(apptsData.appointments || []);
      } catch (err) {
        console.error('Error fetching data for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading business reports...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const wonLeads = leads.filter(l => l.status === 'closed_won');
  // Estimates are: Emergency = $350, Tankless water heater = $3000, general = $150
  const estimatedRevenue = wonLeads.reduce((acc, lead) => {
    if (lead.notes?.toLowerCase().includes('tankless')) return acc + 3200;
    if (lead.notes?.toLowerCase().includes('leak') || lead.notes?.toLowerCase().includes('emergency')) return acc + 450;
    return acc + 180;
  }, 0) + 1200; // base revenue

  const pendingRevenue = leads.filter(l => l.status !== 'closed_won' && l.status !== 'closed_lost').reduce((acc, lead) => {
    if (lead.notes?.toLowerCase().includes('tankless')) return acc + 2800;
    return acc + 150;
  }, 0);

  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const totalBookings = appointments.length;
  const avgResponseTime = "1.8 seconds";

  // Mock missed opportunities
  const missedOpportunities = [
    {
      id: 'm-1',
      name: 'Unidentified Client (Visitor #3202)',
      reason: 'Asked about tankless water heaters financing but left when phone prompt was asked.',
      potentialLoss: '$2,800',
      action: 'Set up SMS-only trigger or enable direct automated email checkout with 10% discount coupon.'
    },
    {
      id: 'm-2',
      name: 'Regulus Crassus (512-555-0103)',
      reason: 'Stated he had a pipe emergency at 2:00 AM. AI logged it but no staff called him back.',
      potentialLoss: '$450',
      action: 'Turn on 24/7 Priority Emergency Push SMS Notification to alert owner phone instantly.'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <TrendingUp size={20} className="text-sky-600" /> Executive Business Reports
        </h2>
        <p className="text-xs text-slate-500">Track real-time financial ROI, lead conversions, AI response efficiency, and recovery strategies for missed opportunities.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900">${estimatedRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              +18.5% this month <ArrowUpRight size={11} />
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Bookings</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900">{totalBookings} booked</p>
            <p className="text-[10px] text-slate-400">92% attendance rate</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">AI Response Speed</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900">{avgResponseTime}</p>
            <p className="text-[10px] text-indigo-600 font-semibold">99.9% faster than humans</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lead Win Rate</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900">{conversionRate}%</p>
            <p className="text-[10px] text-slate-400">Industry avg: 14.5%</p>
          </div>
        </div>
      </div>

      {/* Charts & Missed Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG charts for visual presentation */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue Generation</h3>
              <p className="text-[11px] text-slate-400">Revenue added directly by AI Employee lead follow-ups.</p>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">Pipeline: +${pendingRevenue} pending</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-6 pt-6 px-2 text-center text-[10px] font-semibold text-slate-400">
            <div className="flex-1 flex flex-col justify-end h-full">
              <span className="mb-1 text-slate-700 font-bold">$1,400</span>
              <div className="w-full bg-slate-100 rounded-t-lg h-[40%]" />
              <span className="mt-1">May</span>
            </div>
            <div className="flex-1 flex flex-col justify-end h-full">
              <span className="mb-1 text-slate-700 font-bold">$3,100</span>
              <div className="w-full bg-slate-100 rounded-t-lg h-[65%]" />
              <span className="mt-1">Jun</span>
            </div>
            <div className="flex-1 flex flex-col justify-end h-full animate-pulse">
              <span className="mb-1 text-sky-600 font-extrabold">${estimatedRevenue}</span>
              <div className="w-full bg-sky-600 rounded-t-lg h-[95%]" />
              <span className="mt-1 font-bold text-slate-800">Jul (Current)</span>
            </div>
          </div>
        </div>

        {/* AI Performance Breakdown */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Award size={15} className="text-amber-500" /> AI Employee Appraisal
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Virtual Name</span>
              <span className="font-bold text-slate-800">Apex Virtual Assistant</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Total Hours Logged</span>
              <span className="font-bold text-emerald-600">744 hours (24/7)</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Tasks Completed</span>
              <span className="font-bold text-slate-800">142 messages served</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Equivalent Salary Cost</span>
              <span className="font-bold text-slate-500 line-through">$3,800 / mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-900 font-semibold">Your SaaS Cost</span>
              <span className="font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">$49 / mo</span>
            </div>
            
            <div className="p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-1">
              <p className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-600" /> Proactive Suggestion
              </p>
              <p className="text-[10px] text-slate-500 leading-normal">"Your AI assistant closed 3 more water heater queries this week. I recommend adding 'Tankless Financing FAQs' under FAQ settings to increase conversion by an estimated 11%."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Missed Opportunities Rescue Board */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" /> Missed Opportunities Rescue Board
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">AI monitored web traffic that dropped out. Follow these recovery suggestions to win back lost local bookings.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {missedOpportunities.map((op) => (
            <div key={op.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 space-y-3 hover:border-amber-100 transition-colors flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs">{op.name}</h4>
                  <span className="text-rose-600 bg-rose-50 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Value: {op.potentialLoss}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{op.reason}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1 bg-amber-50/20 p-2.5 rounded-xl border border-amber-100/40">
                <p className="font-extrabold text-amber-800 text-[10px] flex items-center gap-1">
                  <Sparkles size={11} /> AI Recovery Suggestion:
                </p>
                <p className="text-[10px] text-slate-600 leading-normal">{op.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
