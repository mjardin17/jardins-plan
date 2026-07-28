import React, { useState, useEffect } from 'react';
import { 
  Users, User, Phone, Mail, Calendar, FileText, CheckCircle2, 
  Clock, DollarSign, MessageSquare, ArrowRight, Sparkles, Plus, 
  Trash2, TrendingUp, AlertCircle, Bookmark, ShieldAlert, CheckCircle
} from 'lucide-react';
import { Lead, Appointment, ChatSession } from '../types';

interface CustomersProps {
  businessId: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  service: string;
}

interface TimelineEvent {
  id: string;
  type: 'captured' | 'booking' | 'invoice' | 'note' | 'review';
  title: string;
  desc: string;
  date: string;
}

export default function Customers({ businessId }: CustomersProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invService, setInvService] = useState('');
  const [invAmount, setInvAmount] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, apptsRes, sessionsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/appointments'),
          fetch('/api/chat/sessions')
        ]);
        
        const leadsData = await leadsRes.json();
        const apptsData = await apptsRes.json();
        const sessionsData = await sessionsRes.json();

        const leads = leadsData.leads || [];
        const appts = apptsData.appointments || [];
        const sessions = sessionsData.sessions || [];

        // Transform Won leads & those with appointments into active customers
        const customerList = leads.map((lead: Lead, idx: number) => {
          const clientAppts = appts.filter((a: Appointment) => 
            a.clientEmail === lead.email || a.clientPhone === lead.phone || a.leadId === lead.id
          );
          
          const clientSessions = sessions.filter((s: ChatSession) => 
            s.visitorEmail === lead.email || s.visitorPhone === lead.phone || s.id === lead.chatSessionId
          );

          // Generate default invoices
          const isWon = lead.status === 'closed_won';
          const invoices: Invoice[] = [
            {
              id: `INV-2026-0${10 + idx}`,
              service: clientAppts[0]?.serviceName || 'Diagnostic Plumbing Inspection',
              amount: isWon ? 350 : 49,
              status: isWon ? 'paid' : 'pending',
              dueDate: new Date(Date.now() - 2 * 24 * 3600000).toLocaleDateString()
            }
          ];

          if (isWon && clientAppts.length > 1) {
            invoices.push({
              id: `INV-2026-0${50 + idx}`,
              service: clientAppts[1]?.serviceName || 'Plumbing Service Follow-up',
              amount: 180,
              status: 'paid',
              dueDate: new Date().toLocaleDateString()
            });
          }

          // Generate Timeline Events
          const timeline: TimelineEvent[] = [
            {
              id: `t1-${lead.id}`,
              type: 'captured',
              title: 'Lead Captured by AI',
              desc: `First contact via AI assistant widget. Status initialized as "${lead.status.toUpperCase()}".`,
              date: new Date(lead.createdAt).toLocaleString()
            }
          ];

          clientSessions.forEach((s: any, sIdx: number) => {
            timeline.push({
              id: `t-sess-${s.id}-${sIdx}`,
              type: 'review',
              title: 'Consulted AI Employee',
              desc: `Discussed services, pricing, and timing. Left contact info.`,
              date: new Date(s.createdAt).toLocaleString()
            });
          });

          clientAppts.forEach((a: Appointment, aIdx: number) => {
            timeline.push({
              id: `t-appt-${a.id}-${aIdx}`,
              type: 'booking',
              title: `Appointment ${a.status.toUpperCase()}`,
              desc: `Booked "${a.serviceName}" scheduled for ${new Date(a.dateTime).toLocaleString()}.`,
              date: new Date(a.createdAt).toLocaleString()
            });
          });

          // Custom AI Notes
          const aiNotes = lead.notes 
            ? `Customer noted: "${lead.notes}". Preferred tone is helpful and direct.`
            : 'Lead captured automatically. Prefers text follow-up. High priority client.';

          return {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            createdAt: lead.createdAt,
            aiNotes: aiNotes,
            customNotes: [] as string[],
            invoices,
            timeline: timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            appointments: clientAppts,
            communications: clientSessions
          };
        });

        setCustomers(customerList);
        if (customerList.length > 0) {
          setSelectedCustomerId(customerList[0].id);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
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
          <p className="text-sm font-medium text-slate-500">Loading Customer CRM profiles...</p>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleAddNote = () => {
    if (!newNoteText.trim() || !selectedCustomerId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          customNotes: [...c.customNotes, newNoteText],
          timeline: [
            {
              id: `note-${Date.now()}`,
              type: 'note',
              title: 'Manual Business Note Added',
              desc: newNoteText,
              date: new Date().toLocaleString()
            },
            ...c.timeline
          ]
        };
      }
      return c;
    }));
    setNewNoteText('');
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invService.trim() || !invAmount.trim() || !selectedCustomerId) return;

    const newInv: Invoice = {
      id: `INV-2026-R${Math.floor(100 + Math.random() * 900)}`,
      service: invService,
      amount: parseFloat(invAmount),
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 3600000).toLocaleDateString()
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          invoices: [newInv, ...c.invoices],
          timeline: [
            {
              id: `inv-event-${Date.now()}`,
              type: 'invoice',
              title: 'Invoice Drafted & Sent',
              desc: `Drafted invoice ${newInv.id} for "${invService}" with balance of $${newInv.amount}.`,
              date: new Date().toLocaleString()
            },
            ...c.timeline
          ]
        };
      }
      return c;
    }));

    setShowInvoiceModal(false);
    setInvService('');
    setInvAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users size={20} className="text-sky-600" /> Customers Directory
          </h2>
          <p className="text-xs text-slate-500">View deep profiles, customer invoices, comprehensive activity timelines, and auto-generated AI workspace summaries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Customer List Side Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 h-[600px] overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2">Active Clients ({customers.length})</p>
          <div className="space-y-1">
            {customers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              const hasUnpaid = c.invoices.some((i: Invoice) => i.status !== 'paid');
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between border ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                      : 'hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <User size={13} className={isSelected ? 'text-white/80' : 'text-slate-400'} />
                      {c.name}
                    </p>
                    <p className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{c.email || c.phone || 'No contact details'}</p>
                  </div>
                  {hasUnpaid && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Pending Invoice" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Deep Profile Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-700 font-bold text-base flex items-center justify-center">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Customer ID: {selectedCustomer.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={`mailto:${selectedCustomer.email}`}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Mail size={13} /> Email
                    </a>
                    <a 
                      href={`tel:${selectedCustomer.phone}`}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Phone size={13} /> Call
                    </a>
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <FileText size={13} /> Create Invoice
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 border-t border-slate-50 pt-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <p className="font-bold text-sky-600 mt-0.5 uppercase">{selectedCustomer.status}</p>
                  </div>
                </div>
              </div>

              {/* Grid: AI Notes & Invoicing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI & Custom Notes */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> AI Workspace Notes
                    </h4>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Autogenerated</span>
                  </div>

                  <div className="p-3 bg-amber-50/20 border border-amber-100/50 rounded-xl">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedCustomer.aiNotes}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Manual Staff Notes</p>
                    
                    {selectedCustomer.customNotes.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedCustomer.customNotes.map((cn: string, i: number) => (
                          <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600">
                            {cn}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add private office note..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                      />
                      <button 
                        onClick={handleAddNote}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-500" /> Invoices & Billings
                  </h4>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedCustomer.invoices.map((inv: Invoice) => (
                      <div key={inv.id} className="p-3.5 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">{inv.service}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                            <span>ID: {inv.id}</span>
                            <span>•</span>
                            <span>Due: {inv.dueDate}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-xs font-bold text-slate-900">${inv.amount}</p>
                          <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : inv.status === 'overdue' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline list */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Customer Timeline & Event History</h4>
                
                <div className="relative border-l border-slate-100 pl-4 space-y-6">
                  {selectedCustomer.timeline.map((ev: TimelineEvent) => (
                    <div key={ev.id} className="relative">
                      {/* Circle dot on line */}
                      <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-white ${
                        ev.type === 'captured' 
                          ? 'bg-purple-500' 
                          : ev.type === 'booking' 
                            ? 'bg-sky-500' 
                            : ev.type === 'invoice' 
                              ? 'bg-emerald-500' 
                              : 'bg-slate-400'
                      }`} />

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">{ev.title}</p>
                          <span className="text-[10px] font-mono text-slate-400">{ev.date}</span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">{ev.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-white border border-dashed border-slate-200 rounded-2xl text-center">
              <Users size={32} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500 mt-2">Select a customer to view history</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Invoice for {selectedCustomer?.name}</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Service or Job Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Drain Cleaning, Tankless Installation..."
                  value={invService}
                  onChange={(e) => setInvService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Invoice Amount ($)</label>
                <input 
                  type="number" 
                  required
                  placeholder="250"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInvoiceModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
