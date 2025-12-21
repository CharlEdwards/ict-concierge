import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v9.0 Master-Build";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const checkApiKeyPresence = (): boolean => {
  return !!(process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY);
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.BOT,
      text: "Greetings. I am the ICT Elite Concierge. How may I assist with your IT certification or managed service needs today?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasKey(checkApiKeyPresence());
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
        fetch(LEAD_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            ...response.leadCaptured, 
            capturedAt: new Date().toISOString(), 
            source: `ICT_CONCIERGE_${APP_VERSION}`,
            environment: "Production_V9"
          }),
          headers: { 'Content-Type': 'application/json' }
        }).catch((e) => console.error("Webhook submission error:", e));
      }
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setHasKey(false);
      } else {
        setError("Network optimization in progress. Please retry in a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  if (!hasKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] p-8">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-12 text-center border border-white/20">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Initialization</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">Application V9.0 is online. Awaiting authorized API credentials to activate the neural engine.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all uppercase tracking-widest text-xs">Reload & Re-verify</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 flex flex-col items-end p-4 md:p-6 ${isMinimized ? 'w-24 h-24' : 'w-full md:w-[460px] h-full max-h-[850px]'}`}>
      <div className={`bg-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] border border-slate-200/60 flex flex-col overflow-hidden transition-all duration-700 h-full w-full ${isMinimized ? 'scale-0 opacity-0 translate-y-20 rotate-12' : 'scale-100 opacity-100'}`}>
        <header className="px-8 py-7 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-emerald-500/30">ICT</div>
            <div>
              <h1 className="font-black text-sm text-slate-900 uppercase tracking-tight">ICT Concierge</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Status: Ready • {APP_VERSION}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-8 bg-slate-50/50">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 px-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(q)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Accessing ICT Knowledge...</p>
            </div>
          )}
          {error && <div className="mx-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center shadow-sm">{error}</div>}
        </main>
        
        <div className="px-6 pb-10 pt-4 bg-white border-t border-slate-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      <button onClick={() => setIsMinimized(!isMinimized)} className={`w-20 h-20 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_24px_48px_-8px_rgba(16,185,129,0.5)] hover:scale-110 active:scale-90 transition-all duration-500 ${!isMinimized ? 'mt-6 bg-slate-900 shadow-slate-900/40' : 'animate-bounce-subtle'}`}>
        {isMinimized ? (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        ) : (
          <svg className=" Officer w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </button>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;