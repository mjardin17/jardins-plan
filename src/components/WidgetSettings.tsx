import { useState, useEffect, FormEvent } from 'react';
import { Code, Globe, Sparkles, Check, Copy, Settings, Bot, RefreshCw } from 'lucide-react';
import { BusinessProfile } from '../types';

export default function WidgetSettings({ businessId, onUpdate }: { businessId: string; onUpdate: () => void }) {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [color, setColor] = useState('#0284c7');
  const [greeting, setGreeting] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  // Simulator state
  const [simMessages, setSimMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [simInput, setSimInput] = useState('');
  const [simTyping, setSimTyping] = useState(false);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await fetch(`/api/business/${businessId}`);
        const data = await res.json();
        if (data.business) {
          const b = data.business;
          setBusiness(b);
          setColor(b.widgetColor || '#0284c7');
          setGreeting(b.widgetGreeting || '');
          setPlaceholder(b.widgetPlaceholder || '');
          setSimMessages([{ sender: 'bot', text: b.widgetGreeting || 'Hello! How can I help you?' }]);
        }
      } catch (err) {
        console.error('Failed to load business profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusiness();
  }, [businessId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetColor: color,
          widgetGreeting: greeting,
          widgetPlaceholder: placeholder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        onUpdate();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update widget settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentDomain = window.location.origin;
  const embedCode = `<!-- AI Employee Website Widget -->
<script src="${currentDomain}/widget-loader.js?businessId=${businessId}"></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Simulator Chat
  const handleSimSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const text = simInput;
    setSimInput('');
    setSimMessages(prev => [...prev, { sender: 'user', text }]);
    setSimTyping(true);

    try {
      // Create a transient simulator chat on the server
      const res = await fetch('/api/public/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const chatStartData = await res.json();
      const sId = chatStartData.sessionId;

      const chatMsgRes = await fetch('/api/public/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sId, text }),
      });
      const data = await chatMsgRes.json();
      if (data.success) {
        setSimMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      }
    } catch (err) {
      console.error('Simulator connection error:', err);
      setSimMessages(prev => [...prev, { sender: 'bot', text: "Simulator fallback error: check your connection." }]);
    } finally {
      setSimTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading customizer settings...</p>
        </div>
      </div>
    );
  }

  const colorPresets = ['#0284c7', '#0d9488', '#16a34a', '#dc2626', '#4f46e5', '#db2777', '#1e293b'];

  return (
    <div className="grid gap-8 lg:grid-cols-5 items-start">
      {/* Widget settings column */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Embed Code Snippet</h3>
            <p className="text-xs text-slate-500">Copy and paste this script tag right before the closing {"</body>"} tag on your website to launch the AI Employee on any platform (Wordpress, Webflow, Shopify, HTML files).</p>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Customization Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Visual & Behavioral Identity</h3>
            <p className="text-xs text-slate-500">Style your website assistant to fit seamlessly into your existing brand.</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Color Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Header Widget Color</label>
              <div className="flex flex-wrap items-center gap-2.5">
                {colorPresets.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setColor(p)}
                    className="h-7 w-7 rounded-full border-2 border-white cursor-pointer relative"
                    style={{ backgroundColor: p, boxShadow: color === p ? '0 0 0 2px #0f172a' : '0 0 0 1px #e2e8f0' }}
                  >
                    {color === p && <Check size={13} className="text-white absolute inset-0 m-auto" />}
                  </button>
                ))}
                
                {/* Custom HEX code input */}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  className="w-24 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Bubble Greeting */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Welcome Greeting Bubble Message</label>
              <textarea
                value={greeting}
                rows={3}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi there! I'm your virtual assistant..."
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs leading-relaxed focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            {/* Text placeholder */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Input Text Placeholder Prompt</label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Ask about leak repairs, water heating..."
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Updating...' : saveSuccess ? 'Widget Preserved!' : 'Apply Widget Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Interactive Sandbox Simulator */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          {/* Mock Widget Header */}
          <div 
            className="px-4 py-3 text-white flex items-center justify-between"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 rounded-full bg-white/25 flex items-center justify-center">
                <Bot size={18} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border border-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs">{business?.name || 'My Business'} AI</h4>
                <p className="text-[9px] text-white/80 flex items-center gap-0.5">
                  <Sparkles size={9} /> Sandbox Simulator Mode
                </p>
              </div>
            </div>
          </div>

          {/* Chat content timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {simMessages.map((msg, i) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm leading-relaxed ${
                      isUser ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}
                  >
                    {!isUser && <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase">{business?.name || 'AI'}</p>}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            
            {simTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input footer */}
          <form onSubmit={handleSimSend} className="p-2 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <input
                type="text"
                placeholder={placeholder || 'Send message...'}
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!simInput.trim() || simTyping}
                className="h-6 w-6 rounded-md text-white flex items-center justify-center transition-opacity"
                style={{ backgroundColor: color, opacity: simInput.trim() ? 1 : 0.4 }}
              >
                <Check size={12} />
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-[11px] text-slate-400 mt-2">
          Test custom services, schedules, and quotes. Real leads captured here will flow straight to your Leads tab!
        </p>
      </div>
    </div>
  );
}
