import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Calendar, Sparkles, User, Mail, Phone, Clock, FileText, CheckCircle } from 'lucide-react';
import { ChatSession } from '../types';

export default function Conversations({ businessId }: { businessId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/chat/sessions');
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSession(data.sessions[0]);
        }
      } catch (err) {
        console.error('Failed to fetch chat logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [businessId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading conversation archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 h-[600px] border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Session List Sidebar */}
      <div className="md:col-span-1 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Conversation History</h3>
          <p className="text-xs text-slate-500">Review AI Employee chats with clients</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No chats recorded yet</p>
              <p className="text-[10px] mt-1">Interactions will appear once customers speak to the AI widget.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = selectedSession?.id === sess.id;
              const lastMsg = sess.messages[sess.messages.length - 1];
              return (
                <button
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 ${
                    isSelected ? 'bg-white border-l-4 border-sky-600 shadow-sm' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-800 truncate max-w-[120px]">
                      {sess.visitorName || 'Anonymous Visitor'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className="text-slate-500 text-[11px] truncate w-full">
                    {lastMsg ? lastMsg.text : 'No messages'}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {sess.leadCaptured && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        Lead captured
                      </span>
                    )}
                    {sess.appointmentBooked && (
                      <span className="text-[9px] font-bold bg-sky-50 text-sky-600 border border-sky-100 px-1.5 py-0.5 rounded-full">
                        Appt Booked
                      </span>
                    )}
                    {!sess.leadCaptured && !sess.appointmentBooked && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                        Consultation
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Session Chat Transcript */}
      <div className="md:col-span-2 flex flex-col h-full bg-white">
        {selectedSession ? (
          <>
            {/* Header / Client Metadata */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/20">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  {selectedSession.visitorName || 'Anonymous Visitor'}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                  {selectedSession.visitorEmail && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {selectedSession.visitorEmail}
                    </span>
                  )}
                  {selectedSession.visitorPhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {selectedSession.visitorPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Started: {new Date(selectedSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Badges for capture */}
              <div className="flex gap-1.5">
                {selectedSession.leadCaptured && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                    <CheckCircle size={12} /> Lead Captured
                  </div>
                )}
                {selectedSession.appointmentBooked && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg">
                    <Calendar size={12} /> Booked Appt
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/25">
              {selectedSession.messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                        isBot
                          ? 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                          : 'bg-slate-800 text-white rounded-br-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 border-b border-slate-50/10 pb-1">
                        <span className="font-bold flex items-center gap-1">
                          {isBot ? <Sparkles size={11} className="text-sky-500" /> : <User size={11} />}
                          {isBot ? 'AI Employee' : 'Visitor'}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText size={48} className="text-slate-200 mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Session Selected</h4>
            <p className="text-xs text-slate-500 mt-1">Choose a conversation from the sidebar to inspect the AI employee transcript.</p>
          </div>
        )}
      </div>
    </div>
  );
}
