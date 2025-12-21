import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v5.1";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const checkApiKeyPresence = (): boolean => {
  // Check common env variable locations
  const key = (process.env.API_KEY) || (import.meta as any).env?.VITE_API_KEY;
  return !!key;
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.BOT,
      text: "Hello! I'm the Inner City Technology Concierge. I can help you with IT certifications, managed services, or getting your team trained. How can I serve you today?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyExists = checkApiKeyPresence();
    setHasKey(keyExists);
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (!isMinimized) scrollToBottom();
  }, [messages, isLoading, isMinimized]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    setError(null);
    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: Date.now() };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const history = currentMessages.map((m) => ({
        role: (m.role === Role.BOT ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.text }],
      }));
      
      const response = await geminiService.sendMessage(history, text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.BOT,
        text: response.text,
        timestamp: Date.now(),
        groundingUrls: response.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
      
      if (response.leadCaptured && LEAD_WEBHOOK_URL) {
        console.log("Lead captured:", response.leadCaptured);
        fetch(LEAD_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            ...response.leadCaptured, 
            capturedAt: new Date().toISOString(), 
            source: `ICT_CONCIERGE_${APP_VERSION}` 
          }),
          headers: { 'Content-Type': 'application/json' }
        }).catch((e) => console.error("Webhook error:", e));
      }
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setHasKey(false);
      } else {
        setError("I'm currently adjusting my circuits. Please try again in a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6 text-slate-900">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight leading-none">Security Gate</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Status: App Ready / Key Missing</p>
          </div>
          <div className="bg-slate-50 rounded-3xl p-6 text-left border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The application is deployed, but the API Key is not detected. Please add <strong>API_KEY</strong> to Vercel Environment Variables and <strong>Redeploy</strong>.
            </p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black text-xs py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest active:scale-95">
            Check Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-500 flex flex-col items-end p-4 ${isMinimized ? 'w-24 h-24' : 'w-full md:w-[440px] h-full max-h-[800px]'}`}>
      <div className={`bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[2.5rem] border border-slate-200 flex flex-col overflow-hidden transition-all duration-500 h-full w-full ${isMinimized ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100'}`}>
        <header className="px-6 py-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/20">ICT</div>
            <div>
              <h1 className="font-black text-sm text-slate-900 leading-tight uppercase tracking-tight">ICT Concierge</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active • {APP_VERSION}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-slate-50/40">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          {isLoading && (
            <div className="flex justify-start px-2">
              <div className="bg-white px-5 py-3.5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          {error && <div className="mx-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center leading-tight shadow-sm">{error}</div>}
        </main>
        
        <div className="px-5 pb-8 pt-4 bg-white border-t border-slate-50">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      <button onClick={() => setIsMinimized(!isMinimized)} className={`w-16 h-16 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ${!isMinimized ? 'mt-4 bg-slate-900 shadow-slate-900/10' : 'shadow-emerald-600/40'}`}>
        {isMinimized ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </button>
    </div>
  );
};

export default App;