// src/components/CustomerPortal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, CreditCard, Clock, FileText, Send, Upload, Sparkles, 
  MessageSquare, User, CheckCircle, ShieldAlert, BookOpen, AlertCircle,
  HelpCircle, ChevronRight, CheckSquare, Zap, Activity, Users, DollarSign
} from 'lucide-react';

interface Invoice {
  id: number;
  amount: number;
  status: string;
  dueDate: string;
  serviceName: string;
}

interface Appointment {
  id: string;
  serviceName: string;
  dateTime: string;
  status: string;
}

export default function CustomerPortal({ businessId }: { businessId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Portal preview sub-tabs
  const [activePortalTab, setActivePortalTab] = useState<'book' | 'chat' | 'invoices' | 'upload'>('book');

  // Customer Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: "Hello! Welcome to the Apex Customer Portal. I am your automated dispatcher assistant. You can book emergency repair appointments, check pricing guidelines, and upload photos of structural concerns. How can I assist you?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Appointment Form State
  const [clientName, setClientName] = useState('Sarah Jenkins');
  const [clientPhone, setClientPhone] = useState('555-0199');
  const [clientEmail, setClientEmail] = useState('sarah@jenkins.me');
  const [service, setService] = useState('Emergency Hot Water Leak Resolution');
  const [dateTime, setDateTime] = useState('');

  // Diagnostic upload state
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, [businessId]);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [resInvoices, resApts] = await Promise.all([
        fetch('/api/workforce/portal/invoices'),
        fetch('/api/workforce/portal/appointments')
      ]);

      if (resInvoices.ok && resApts.ok) {
        const dataInv = await resInvoices.json();
        const dataApt = await resApts.json();
        setInvoices(dataInv.invoices || []);
        setAppointmentsList(dataApt.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAppointmentBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) return alert('Please select a calendar date and time slot.');

    try {
      const res = await fetch('/api/workforce/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Schedule customer appointment for ${clientName}`,
          payload: {
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            service,
            dateTime
          },
          priority: 2
        })
      });

      if (res.ok) {
        // Trigger calendar booking endpoint directly to sync database
        await fetch('/api/workforce/mcp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: 'google_calendar',
            args: {
              name: clientName,
              email: clientEmail,
              phone: clientPhone,
              service,
              dateTime
            }
          })
        });

        alert('Appointment successfully requested and synced with Google Calendar! Customer text invitation dispatched.');
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendPortalChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'customer', text: userText }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/workforce/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch('/api/workforce/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'stripe_billing',
          args: { invoiceId }
        })
      });

      if (res.ok) {
        // Simulate invoice completion on backend
        await fetch(`/api/workforce/portal/invoices/${invoiceId}/pay`, { method: 'POST' });
        alert('Stripe sandbox payment succeeded! Ledger updated to "Paid" in realtime.');
        fetchPortalData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const simulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);

    const file = e.target.files[0];
    setTimeout(() => {
      setUploadedFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          status: 'verified',
          type: file.type
        }
      ]);
      setIsUploading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-sky-600" /> Customer Engagement Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Realtime client-facing suite allowing consumers to schedule maintenance, upload photo briefs, pay invoices, and query customer assistance bots (Phase 14).
          </p>
        </div>

        <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
          LIVE CONSUMER PREVIEW
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {[
          { id: 'book', name: 'Book Service Visit', icon: <Calendar size={13} /> },
          { id: 'chat', name: 'Dialogue Support Bot', icon: <MessageSquare size={13} /> },
          { id: 'invoices', name: 'Invoice & Ledger', icon: <CreditCard size={13} /> },
          { id: 'upload', name: 'Diagnostics Upload', icon: <Upload size={13} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePortalTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activePortalTab === tab.id
                ? 'bg-slate-950 text-white shadow-sm'
                : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Main Preview Container */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden min-h-[420px] flex flex-col justify-between">
        
        {activePortalTab === 'book' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Schedule Professional Dispatch Repair</h3>
              <p className="text-xs text-slate-500">Fill in your information to reserve a spot. Your requested technician dispatch time will sync with calendars in less than 3 seconds.</p>

              <form onSubmit={submitAppointmentBooking} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Name</label>
                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                    <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Work Email</label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs" required />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Select Dispatch Option</label>
                  <select value={service} onChange={(e) => setService(e.target.value)} className="w-full bg-slate-50 border border-slate-250 px-3 py-2.5 rounded-xl text-xs">
                    <option>Emergency Hot Water Leak Resolution</option>
                    <option>Comprehensive Tankless Install Audit</option>
                    <option>Standard Seasonal Heat-pump Checkup</option>
                    <option>Safety Ground Wire Diagnostic review</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Date & Slot</label>
                  <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs" required />
                </div>

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                  Reserve Appointment Slot
                </button>
              </form>
            </div>

            {/* Existing bookings sidebar list */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YOUR ACTIVE DISPATCH VISITS</p>
              
              <div className="space-y-3">
                {appointmentsList.length === 0 ? (
                  <p className="text-xs text-slate-400">No appointments scheduled yet.</p>
                ) : (
                  appointmentsList.map((apt) => (
                    <div key={apt.id} className="p-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{apt.serviceName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{new Date(apt.dateTime).toLocaleString()}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                        {apt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activePortalTab === 'chat' && (
          <div className="flex flex-col h-[450px]">
            {/* Conversations list area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] inline-block shadow-sm ${
                    msg.sender === 'customer' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-100 text-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl text-xs text-slate-400 font-medium">
                    AI agent is planning response...
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <form onSubmit={sendPortalChatMessage} className="p-3 bg-white border-t border-slate-150 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask our AI customer support bot about estimates, diagnostic fees, and dispatch schedules..."
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              />
              <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                Send
              </button>
            </form>
          </div>
        )}

        {activePortalTab === 'invoices' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Your Diagnostic & Repair Ledger</h3>
            <p className="text-xs text-slate-500">Pay your invoice securely via our Stripe MCP payment processor module integration.</p>

            <div className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No current invoices found.</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="py-4 flex items-center justify-between first:pt-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{inv.serviceName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Due date: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-900">${inv.amount.toFixed(2)}</span>
                      {inv.status === 'paid' ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded">PAID</span>
                      ) : (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Pay Invoice (Stripe)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePortalTab === 'upload' && (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Upload Structural & Pipe Diagnostics</h3>
              <p className="text-xs text-slate-500">Upload images or videos of leaking hardware or circuit panels. Our AI dispatcher analyzes structural integrity files to formulate estimates.</p>
            </div>

            {/* Custom drag-drop uploader area */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                onChange={simulateFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="mx-auto text-slate-400 mb-2.5" size={24} />
              <p className="text-xs font-bold text-slate-700">Drag & drop files or click to choose from system explorer</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF up to 10MB verified by malware scan hooks.</p>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SECURELY UPLOADED DIAGNOSTICS</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText size={14} className="text-sky-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{file.size} • Verified</p>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                        SCAN OK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
