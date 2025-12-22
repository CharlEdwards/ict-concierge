import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v14.0 Obsidian Prime";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

// Audio Buffer Manager
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
    console.warn("Audio playback context was interrupted.");
  }
};

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];

  // Initialize Concierge
  useEffect(() => {
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: Role.BOT,
        text: `Greetings. I am the ${config.name}. I am here to provide expert consultation on ICT's Managed Services and IT Certification programs. How may I assist you today?`,
        timestamp: Date.now(),
      }]);
    }
  }, [config.name, messages.length]);

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
      // Create strict history for API (Must alternate User/Model)
      const apiHistory = currentSequence.map((m) => ({
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

      // Professional Voice Playback
      if (response.audioData && !isMuted) {
        playPCM(response.audioData);
      }
      
      // Lead Handling
      if (response.leadCaptured && LEAD_WEBHOOK_URL) {
        fetch(LEAD_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            ...response.leadCaptured, 
            capturedAt: new Date().toISOString(), 
            industry: INDUSTRY_CONFIG.current,
            source: `${config.name}_${APP_VERSION}`,
          }),
          headers: { 'Content-Type': 'application/json' }
        }).catch((e) => console.error("Lead submission error:", e));
      }
    } catch (err: any) {
      console.error("Strategic Handshake Error:", err.message);
      setError("Strategic Sync Interrupted. Re-aligning with ICT Core...");
      setTimeout(() => setError(null), 6000);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config.name, isMuted]);

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[480px] h-[100dvh] md:h-[85vh] max-h-[900px]'}`}>
      
      {/* Concierge Interface */}
      <div className={`bg-white shadow-[0_70px_160px_-40px_rgba(0,0,0,0.7)] md:rounded-[3.8rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-1000 h-full w-full ${isMinimized ? 'scale-75 opacity-0 translate-y-40 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        
        {/* Prime Header */}
        <header className="px-12 py-12 flex items-center justify-between border-b border-slate-50 bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
          <div className="flex items-center gap-7">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-600/40 relative">
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-[1.8rem]"></div>
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none mb-1.5">{config.name}</h1>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50"></span>
                <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] leading-none">Voice Synthesizer Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              {isMuted ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
            </button>
            <button onClick={() => setIsMinimized(true)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        {/* Intelligence Feed */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-14 space-y-12 bg-[#fdfdfe]">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          
          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 ml-4 mb-2">Secure Knowledge Shortcuts</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-10 py-7 bg-white border border-slate-100 text-slate-700 rounded-[2.5rem] text-[16px] font-bold hover:border-blue-600 hover:text-blue-600 hover:shadow-2xl transition-all group flex justify-between items-center"
                >
                  {q}
                  <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-6 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-6">
              <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center shadow-inner">
                <div className="w-7 h-7 border-[4px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Analyzing Knowledge Matrix...</p>
            </div>
          )}
          
          {error && (
            <div className="mx-6 p-8 bg-rose-50 border border-rose-100 rounded-[3rem] text-rose-600 text-[13px] font-black text-center shadow-xl uppercase tracking-[0.15em] leading-relaxed">
              {error}
              <span className="text-[11px] opacity-60 block mt-3 font-bold">Initiating auto-recovery sequence...</span>
            </div>
          )}
        </main>
        
        <div className="px-12 pb-14 pt-10 bg-white/60 backdrop-blur-2xl border-t border-slate-50">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Launcher */}
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-10 right-10 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group ${isMinimized ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90 pointer-events-none'}`}
      >
        <div className="flex items-center gap-7 bg-blue-600 pl-12 pr-8 py-7 rounded-[4rem] shadow-[0_50px_120px_-20px_rgba(37,99,235,0.85)] border border-white/20 hover:scale-105 active:scale-95 transition-all">
          <div className="flex flex-col">
            <span className="text-white text-[14px] font-black uppercase tracking-[0.4em] leading-tight mb-1.5">{config.name}</span>
            <span className="text-black text-[11px] font-black uppercase tracking-widest leading-none opacity-90">Secure Connection</span>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center text-white transition-all shadow-inner relative overflow-hidden group-hover:bg-white/30">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <svg className="w-9 h-9 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;