import { useState, useEffect, FormEvent } from 'react';
import { Calendar, Clock, User, Phone, Mail, Check, X, CheckCircle, AlertCircle, Plus, Info, RefreshCw } from 'lucide-react';
import { Appointment } from '../types';

export default function Appointments({ businessId }: { businessId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // New appointment form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [businessId]);

  const handleCreateAppointment = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !serviceName || !dateTime) return;

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          serviceName,
          dateTime: new Date(dateTime).toISOString(),
          notes,
          status: 'confirmed'
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setServiceName('');
        setDateTime('');
        setNotes('');
        fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
    }
  };

  const handleUpdateStatus = async (aptId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local items
        setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: status as any } : a));
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Status filter bar */}
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'pending' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'confirmed' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Completed
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {/* manual creation form */}
      {showAddForm && (
        <form onSubmit={handleCreateAppointment} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4 shadow-inner">
          <h3 className="font-bold text-slate-800 text-sm">Add New Scheduled Appointment</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Client Name *</label>
              <input
                type="text"
                required
                placeholder="Marcus Aurelius"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Service Name *</label>
              <input
                type="text"
                required
                placeholder="Drain Clog Snaking"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Client Email</label>
              <input
                type="email"
                placeholder="marcus@emperor.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Client Phone</label>
              <input
                type="tel"
                placeholder="512-555-0199"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Booking Notes</label>
            <textarea
              placeholder="E.g. blockages in basement sink, gate code 291..."
              value={notes}
              rows={2}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3 rounded-lg text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Book Service
            </button>
          </div>
        </form>
      )}

      {/* Info notification */}
      <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 p-4 rounded-xl text-xs text-sky-800">
        <Info size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Pro Tip:</span> Completing an appointment automatically fires the **Review Request Automation** to get 5-star Google reviews on complete auto-pilot, helping you dominate your local searches!
        </div>
      </div>

      {/* Appointments Chronology Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filteredAppointments.length === 0 ? (
          <div className="md:col-span-3 flex flex-col items-center justify-center h-72 bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Appointments Scheduled</h4>
            <p className="text-xs text-slate-500 mt-1">Schedules are booked dynamically during conversations, or can be added manually above.</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const dateObj = new Date(apt.dateTime);
            return (
              <div key={apt.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="space-y-4">
                  {/* Service, Date details */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 border border-sky-100/50 px-2 py-0.5 rounded-full">
                        {apt.serviceName}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" /> {apt.clientName}
                      </h4>
                    </div>

                    <span className={`border px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight ${getStatusStyle(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>

                  {/* Calendar / Clock specs */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100/50 text-xs text-slate-700">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-950">
                      <Calendar size={13} className="text-sky-600" />
                      {dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock size={13} className="text-slate-400" />
                      {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Contact specifications */}
                  <div className="space-y-1 text-xs text-slate-600 pl-1">
                    {apt.clientEmail && (
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" /> {apt.clientEmail}
                      </p>
                    )}
                    {apt.clientPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" /> {apt.clientPhone}
                      </p>
                    )}
                  </div>

                  {/* Extra user comments */}
                  {apt.notes && (
                    <div className="border-t border-slate-50 pt-2.5 text-[11px] text-slate-500 leading-relaxed italic">
                      &ldquo;{apt.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Confirm/Complete actions */}
                {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                  <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-end gap-2">
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        className="inline-flex items-center justify-center h-7 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <Check size={11} className="mr-1" /> Confirm Booking
                      </button>
                    )}
                    
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        className="inline-flex items-center justify-center h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle size={11} className="mr-1" /> Mark Completed
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                      className="inline-flex items-center justify-center h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <X size={11} className="mr-1" /> Cancel
                    </button>
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
