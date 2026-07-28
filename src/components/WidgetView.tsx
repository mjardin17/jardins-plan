import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Bot, Clock, Sparkles } from 'lucide-react';
import { ChatMessage, BusinessProfile } from '../types';

export default function WidgetView({ businessId }: { businessId: string }) {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch business profile and start session
  useEffect(() => {
    async function initWidget() {
      try {
        const bizRes = await fetch(`/api/business/${businessId}`);
        const bizData = await bizRes.json();
        if (bizData.business) {
          setBusiness(bizData.business);
        }

        const chatRes = await fetch('/api/public/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId }),
        });
        const chatData = await chatRes.json();
        if (chatData.sessionId) {
          setSessionId(chatData.sessionId);
          setMessages(chatData.messages);
        }
      } catch (err) {
        console.error('Failed to initialize widget:', err);
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      initWidget();
    }
  }, [businessId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;

    const userText = inputValue;
    setInputValue('');

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `msg-temp-${Date.now()}`,
      sender: 'user',
      text: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/public/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text: userText }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Refresh session messages or append reply
        const botMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, botMsg]);
        
        // Custom events when action is taken (e.g., alert the widget parent in real production)
        if (data.actionTaken) {
          console.log('Action taken by AI Employee:', data.actionTaken);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Connecting to AI Employee...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4 font-sans text-center">
        <div>
          <p className="text-base font-semibold text-gray-800">Business Not Found</p>
          <p className="mt-1 text-sm text-gray-500">The widget could not resolve this business profile.</p>
        </div>
      </div>
    );
  }

  const primaryColor = business.widgetColor || '#0284c7';

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-gray-800 select-none">
      {/* Widget Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            <Bot size={22} className="animate-pulse" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{business.name}</h3>
            <p className="flex items-center gap-1 text-[11px] text-white/80">
              <Sparkles size={10} /> AI Employee Active
            </p>
          </div>
        </div>
        <div className="flex items-center text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white">
          <Clock size={10} className="mr-1" /> Fast reply
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                }`}
                style={isUser ? {} : {}}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span 
                      className="font-semibold text-[11px]"
                      style={{ color: primaryColor }}
                    >
                      {business.name} AI Assistant
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed break-words">
                  {msg.text}
                </div>
                <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-slate-400' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
          <input
            type="text"
            placeholder={business.widgetPlaceholder || "Ask me anything..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder-gray-400 py-1"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-all disabled:bg-gray-200 disabled:text-gray-400"
            style={{ backgroundColor: inputValue.trim() && !isTyping ? primaryColor : '#e2e8f0' }}
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-1.5 flex justify-center items-center gap-1 text-[10px] text-gray-400">
          Powered by <span className="font-semibold text-slate-500">AI Employee SaaS</span>
        </div>
      </form>
    </div>
  );
}
