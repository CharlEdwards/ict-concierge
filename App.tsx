import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v8.8 Sapphire Prime";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIndustry = INDUSTRY_CONFIG.current;
  const config = INDUSTRY_CONFIG.options[activeIndustry];

  useEffect(() => {
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    
    // Initial welcome message
    setMessages([{
      id: 'welcome',
      role: Role.BOT,
      text: `Greetings. I am the ${config.name}. How may I assist you with ${config.shortName} services today?`,
      timestamp: Date.now(),
    }]);
  }, [config.name, config.shortName]);

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
      // Correctly map history for the API - includes the new user message
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
            source: `${config.name}_${APP_VERSION}`,
          }),
          headers: { 'Content-Type': 'application/json' }
        }).catch((e) => console.error("Lead submission error:", e));
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError("Synchronizing connection. Please retry in 3 seconds.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config.name, activeIndustry]);

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[480px] h-[100dvh] md:h-[85vh] max-h-[900px]'}`}>
      
      {/* Main Chat Interface */}
      <div className={`bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] md:rounded-[3rem] border border-slate-200/60 flex flex-col overflow-hidden transition-all duration-700 h-full w-full ${isMinimized ? 'scale-90 opacity-0 translate-y-10 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        
        {/* Professional Header */}
        <header className="px-10 py-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-3xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-600/20`}>
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-lg text-slate-900 uppercase tracking-tighter leading-none mb-1">{config.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full bg-blue-600 animate-pulse`}></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{config.tagline}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </header>

        {/* Messaging Area */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-10 space-y-10 bg-[#fbfcfd]">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          
          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 ml-2 mb-1">Elite Tech Services</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-6 py-5 bg-white border border-slate-100 text-slate-600 rounded-3xl text-[14px] font-bold hover:border-blue-600 hover:text-blue-600 hover:shadow-xl hover:shadow-blue-600/5 transition-all flex justify-between items-center group"
                >
                  {q}
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                <div className={`w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin`}></div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Intelligence...</p>
            </div>
          )}
          {error && <div className="mx-4 p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-[11px] font-bold text-center shadow-sm uppercase tracking-widest">{error}</div>}
        </main>
        
        <div className="px-8 pb-12 pt-6 bg-white/50 backdrop-blur-xl border-t border-slate-50">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Sapphire Prime Minimized Tab */}
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-8 right-8 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group
          ${isMinimized ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
      >
        <div className="flex items-center gap-4 bg-blue-600 px-8 py-5 rounded-[2.5rem] shadow-[0_30px_70px_-10px_rgba(37,99,235,0.7)] border border-white/30 hover:scale-105 active:scale-95 transition-all">
          <div className="relative">
             <div className="w-4 h-4 rounded-full bg-white animate-ping absolute opacity-75"></div>
             <div className="w-4 h-4 rounded-full bg-white relative shadow-lg"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-black uppercase tracking-[0.2em] leading-tight mb-0.5">{config.name}</span>
            <span className="text-black text-[9px] font-black uppercase tracking-widest leading-none opacity-90 group-hover:opacity-100">Click to Expand</span>
          </div>
          <div className="ml-4 w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-white group-hover:bg-white/25 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;