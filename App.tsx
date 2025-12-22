import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v19.0 Market Discovery Edition";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const playPCM = async (base64Data: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const bytes = decodeBase64(base64Data);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (e) {
    console.warn("Audio Sync Interrupted.");
  }
};

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(true); // Default to Voice Active
  const [requiresAuth, setRequiresAuth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];

  useEffect(() => {
    const verifyAuth = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey && !process.env.API_KEY) {
          setRequiresAuth(true);
        }
      }
    };
    
    verifyAuth();
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: Role.BOT,
        text: `Greetings. I am the ${config.name}. I provide expert consultation on Managed IT and Professional Training for ICT. \n\nBefore we begin: Are you currently leveraging AI Agents within your own business architecture?`,
        timestamp: Date.now(),
      }]);
    }
  }, [config.name, messages.length]);

  const handleOpenAuth = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setRequiresAuth(false);
      setError(null);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (!isMinimized) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isMinimized]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    setError(null);
    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: Date.now() };
    const currentSequence = [...messages, userMsg];
    setMessages(currentSequence);
    setIsLoading(true);

    try {
      const apiHistory = currentSequence
        .filter(m => m.id !== 'welcome') 
        .map((m) => ({
          role: (m.role === Role.BOT ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.text }],
        }));
      
      const response = await geminiService.sendMessage(apiHistory, text);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.BOT,
        text: response.text,
        timestamp: Date.now(),
        groundingUrls: response.sources,
      };
      
      setMessages((prev) => [...prev, botMsg]);

      if (response.audioData && isVoiceActive) {
        playPCM(response.audioData);
      }
      
      if (response.leadCaptured && LEAD_WEBHOOK_URL) {
        fetch(LEAD_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ ...response.leadCaptured, industry: INDUSTRY_CONFIG.current, source: APP_VERSION }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error(e));
      }
    } catch (err: any) {
      if (err.message === "AUTH_REQUIRED" || err.message.includes("entity") || err.message.includes("403")) {
        setRequiresAuth(true);
      } else if (err.message.includes("quota") || err.message.includes("429")) {
        setError("GRID CONGESTION. Free-tier limit reached. Please select a Paid Tier project (even with $0 spend) for priority access.");
      } else {
        setError("Strategic Handshake Timeout. Re-aligning with ICT Grid...");
        setTimeout(() => setError(null), 8000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isVoiceActive]);

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[480px] h-[100dvh] md:h-[85vh] max-h-[980px]'}`}>
      
      {/* Concierge Interface */}
      <div className={`bg-white shadow-[0_100px_200px_-40px_rgba(0,0,0,0.8)] md:rounded-[4.5rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-1000 h-full w-full ${isMinimized ? 'scale-75 opacity-0 translate-y-40 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        
        {/* Elite Header */}
        <header className="px-12 py-12 flex items-center justify-between border-b border-slate-50 bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl relative">
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-[1.8rem]"></div>
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none mb-2">{config.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${requiresAuth ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                  {requiresAuth ? 'Handshake Required' : 'Obsidian v19.0'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVoiceActive(!isVoiceActive)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}
            >
              {isVoiceActive ? 'Voice ON' : 'Silence'}
            </button>
            <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        {/* Intelligence Feed */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-12 space-y-12 bg-[#fefeff]">
          {requiresAuth ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-in fade-in zoom-in duration-1000">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.2rem] flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Establish Elite Connection</h2>
              <p className="text-slate-500 text-[14px] font-medium leading-relaxed mb-8">
                To bypass free-tier "Grid Congestion," please establish a handshake with a **Paid Tier** project.
                <span className="block mt-4 text-blue-600 font-bold text-[12px] uppercase tracking-widest">Priority Architecture Active</span>
              </p>
              <button 
                onClick={handleOpenAuth}
                className="px-10 py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[12px]"
              >
                Connect to Obsidian Core
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-600 transition-colors">Billing Documentation</a>
            </div>
          ) : (
            <>
              {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
              
              {messages.length === 1 && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 ml-4 mb-2">Discovery Options</p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left px-10 py-6 bg-white border border-slate-100 text-slate-700 rounded-[2.5rem] text-[15px] font-bold hover:border-blue-600 hover:text-blue-600 hover:shadow-xl transition-all group flex justify-between items-center"
                    >
                      {q}
                      <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start items-center gap-6">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center relative">
                    <div className="w-6 h-6 border-[4px] border-blue-600/0 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Analyzing Market Dynamics...</p>
                </div>
              )}
              
              {error && (
                <div className="mx-4 p-8 bg-rose-50 border border-rose-100 rounded-[3rem] text-rose-600 text-[13px] font-black text-center shadow-lg uppercase tracking-widest">
                  {error}
                  <button onClick={handleOpenAuth} className="mt-4 block w-full text-[10px] font-black uppercase tracking-widest text-rose-500 border border-rose-200 py-3 rounded-xl hover:bg-white transition-all">Re-Sync Handshake</button>
                </div>
              )}
            </>
          )}
        </main>
        
        <div className="px-12 pb-14 pt-10 bg-white/60 backdrop-blur-3xl border-t border-slate-50">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading || requiresAuth} />
        </div>
      </div>

      {/* Launcher */}
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-10 right-10 cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] group ${isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
      >
        <div className="flex items-center gap-6 bg-blue-600 pl-10 pr-8 py-6 rounded-[3.5rem] shadow-2xl border border-white/20 hover:scale-105 active:scale-95 transition-all">
          <div className="flex flex-col">
            <span className="text-white text-[14px] font-black uppercase tracking-widest leading-tight">{config.name}</span>
            <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest leading-none opacity-60">Elite Pitch Active</span>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-[1.8rem] flex items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;