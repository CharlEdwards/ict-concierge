import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v8.0 Elite";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const checkApiKeyPresence = (): boolean => {
  return !!(process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY);
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIndustry = INDUSTRY_CONFIG.current;
  const config = INDUSTRY_CONFIG.options[activeIndustry] || INDUSTRY_CONFIG.options.TECHNOLOGY;

  useEffect(() => {
    setHasKey(checkApiKeyPresence());
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    
    // Initial welcome
    setMessages([{
      id: 'welcome',
      role: Role.BOT,
      text: `Greetings. I am the ${config.name}. How may I assist with your ${config.shortName} needs today?`,
      timestamp: Date.now(),
    }]);
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
            industry: activeIndustry,
            source: `${config.shortName}_ENGINE_${APP_VERSION}`,
          }),
          headers: { 'Content-Type': 'application/json' }
        }).catch((e) => console.error("Lead submission error:", e));
      }
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setHasKey(false);
      } else {
        setError("System recalibrating. Please wait a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config.shortName, activeIndustry]);

  if (!hasKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] p-8">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-white/20">
          <div className={`w-24 h-24 bg-${config.primaryColor}/10 text-${config.primaryColor} rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Security Check</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">The {config.name} requires a secure connection. Add your API Key to proceed.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all uppercase tracking-widest text-xs">Verify Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-24 h-24' : 'w-full md:w-[480px] h-[100dvh] md:h-[85vh] max-h-[900px]'}`}>
      <div className={`bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] md:rounded-[2.8rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-700 h-full w-full ${isMinimized ? 'scale-0 opacity-0 translate-y-20' : 'scale-100 opacity-100'}`}>
        
        {/* Dynamic Header */}
        <header className="px-8 py-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 bg-gradient-to-br ${config.bgGradient} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-emerald-500/20`}>
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-base text-slate-900 uppercase tracking-tighter leading-none mb-1">{config.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full bg-${config.accentColor} animate-pulse`}></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{config.tagline}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </header>

        {/* Chat Feed */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 space-y-10 bg-[#fbfcfd]">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          
          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 ml-2 mb-2">Popular Inquiries</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-5 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[13px] font-bold hover:border-emerald-500 hover:text-emerald-700 hover:translate-x-1 transition-all shadow-sm group flex justify-between items-center"
                >
                  {q}
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-4 animate-pulse">
              <div className={`w-10 h-10 rounded-2xl bg-${config.primaryColor}/5 flex items-center justify-center`}>
                <div className={`w-5 h-5 border-2 border-${config.primaryColor}/20 border-t-${config.primaryColor} rounded-full animate-spin`}></div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synthesizing response...</p>
            </div>
          )}
          {error && <div className="mx-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold text-center shadow-inner uppercase tracking-widest">{error}</div>}
        </main>
        
        {/* Input Dock */}
        <div className="px-6 pb-12 pt-6 bg-white border-t border-slate-50 relative">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)} 
        className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-700 active:scale-90 ${!isMinimized ? `mt-6 bg-slate-900 shadow-slate-900/40 rotate-180` : `bg-${config.primaryColor} shadow-${config.primaryColor}/40 hover:scale-110 animate-bounce-subtle`}`}
      >
        {isMinimized ? (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        ) : (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </button>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3.5s infinite ease-in-out; }
        @media (max-width: 768px) {
          .h-screen-safe { height: 100dvh; }
        }
      `}</style>
    </div>
  );
};

export default App;