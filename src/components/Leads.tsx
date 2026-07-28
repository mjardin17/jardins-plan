import { useState, useEffect, FormEvent } from 'react';
import { Users, Search, Plus, Mail, Phone, Calendar, User, Check, Edit3, Trash2, X, AlertCircle } from 'lucide-react';
import { Lead } from '../types';

export default function Leads({ businessId }: { businessId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // New Lead Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  
  // Note editing state
  const [editingNotesLeadId, setEditingNotesLeadId] = useState<string | null>(null);
  const [editedNotesValue, setEditedNotesValue] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [businessId]);

  const handleCreateLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          notes: newNotes,
          status: 'new'
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewNotes('');
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: status as any } : l));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveNotes = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editedNotesValue }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: editedNotesValue } : l));
        setEditingNotesLeadId(null);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query) ||
      lead.notes.toLowerCase().includes(query);
      
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'contacted':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'in_progress':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'closed_won':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'closed_lost':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getAILeadMetrics = (notes: string, status: string) => {
    const text = (notes || '').toLowerCase();
    let value = 180;
    let recommendedAction = "Reach out via call or SMS to qualify services needed.";
    let score = 55;
    
    if (text.includes('tankless') || text.includes('water heater') || text.includes('install')) {
      value = 2800;
      recommendedAction = "Send tankless water heater brochure & premium service financing terms.";
      score = 85;
    } else if (text.includes('emergency') || text.includes('leak') || text.includes('burst') || text.includes('flood')) {
      value = 450;
      recommendedAction = "Alert dispatch immediately. Follow up via SMS to schedule emergency tech.";
      score = 95;
    } else if (text.includes('drain') || text.includes('clog') || text.includes('snake')) {
      value = 220;
      recommendedAction = "Offer priority morning booking slots for high-power clear snaking.";
      score = 75;
    } else if (text.includes('remodel') || text.includes('renovate')) {
      value = 4500;
      recommendedAction = "Schedule on-site master supervisor consultation for precise measurements.";
      score = 90;
    }

    if (text.length > 10) score += 5;
    
    let probability = 50;
    if (status === 'closed_won') {
      probability = 100;
      recommendedAction = "Contract won. Trigger automatic request for Google review.";
    } else if (status === 'closed_lost') {
      probability = 0;
      recommendedAction = "Lead archived. Passive email newsletter engagement queue.";
    } else if (status === 'in_progress') {
      probability = 80;
    } else if (status === 'contacted') {
      probability = 65;
    }
    
    return { value, score: Math.min(100, score), probability, recommendedAction };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Retrieving CRM leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
          
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New / Untouched</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="closed_won">Closed (Won)</option>
            <option value="closed_lost">Closed (Lost)</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'Cancel' : 'Add New Lead'}
        </button>
      </div>

      {/* Slide-out Add Lead Form */}
      {showAddForm && (
        <form onSubmit={handleCreateLead} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4 shadow-inner">
          <h3 className="font-bold text-slate-800 text-sm">Add New Manual Lead</h3>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Marcus Aurelius"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Email Address</label>
              <input
                type="email"
                placeholder="marcus@emperor.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Phone Number</label>
              <input
                type="tel"
                placeholder="512-555-0199"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Lead Notes / Requirements</label>
            <textarea
              placeholder="Inquired about services, pricing structure, or custom demands..."
              value={newNotes}
              rows={3}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3 rounded-lg text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      )}

      {/* Leads List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredLeads.length === 0 ? (
          <div className="sm:col-span-2 flex flex-col items-center justify-center h-72 bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Leads Found</h4>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or add a manual lead above.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const aiMetrics = getAILeadMetrics(lead.notes, lead.status);
            return (
              <div key={lead.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" /> {lead.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Captured: {new Date(lead.createdAt).toLocaleDateString()} via{' '}
                        <span className="font-semibold uppercase text-sky-600">{lead.source}</span>
                      </p>
                    </div>
                    
                    {/* Status update selector */}
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className={`border px-2 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer ${getStatusBadgeColor(lead.status)}`}
                    >
                      <option value="new">NEW</option>
                      <option value="contacted">CONTACTED</option>
                      <option value="in_progress">IN PROGRESS</option>
                      <option value="closed_won">CLOSED WON</option>
                      <option value="closed_lost">CLOSED LOST</option>
                    </select>
                  </div>

                  {/* Contact info details */}
                  <div className="space-y-1 text-xs text-slate-600 border-b border-slate-50 pb-3">
                    {lead.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" /> {lead.email}
                      </p>
                    )}
                    {lead.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" /> {lead.phone}
                      </p>
                    )}
                  </div>

                  {/* AI Employee Core Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center py-1">
                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Lead Score</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">{aiMetrics.score}<span className="text-[10px] text-slate-400 font-medium">/100</span></p>
                    </div>
                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Est. Value</p>
                      <p className="text-sm font-extrabold text-emerald-600 mt-0.5">${aiMetrics.value.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Win Prob.</p>
                      <p className="text-sm font-extrabold text-sky-600 mt-0.5">{aiMetrics.probability}%</p>
                    </div>
                  </div>

                  {/* Notes box */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 relative group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Internal Notes</p>
                    {editingNotesLeadId === lead.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedNotesValue}
                          onChange={(e) => setEditedNotesValue(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs focus:outline-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNotesLeadId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(lead.id)}
                            className="px-2 py-1 rounded bg-sky-600 text-white text-[10px] font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-600 italic whitespace-pre-line leading-relaxed">
                          {lead.notes || 'No comments attached yet.'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingNotesLeadId(lead.id);
                            setEditedNotesValue(lead.notes);
                          }}
                          className="absolute top-2 right-2 text-slate-400 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Edit3 size={12} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* AI Recommended Next Action */}
                  <div className="p-3 bg-indigo-50/20 border border-indigo-100/40 rounded-xl space-y-1">
                    <p className="text-[9px] font-extrabold text-indigo-800 uppercase tracking-wider">AI Recommended Action</p>
                    <p className="text-[11px] text-slate-600 leading-normal font-medium">{aiMetrics.recommendedAction}</p>
                  </div>
                </div>

                {/* Footer action logs */}
                {lead.chatSessionId && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Linked to AI employee chat session</span>
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {lead.chatSessionId.substring(0, 14)}...
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
