import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v18.0 Obsidian Protocol";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

// Voice Synthesis Engine
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
    console.warn("Audio Context Interrupted.");
  }
};

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];

  // Auth & Init Sync
  useEffect(() => {
    const verifyAuth = async () => {
      // @ts-ignore - aistudio is globally available in the environment
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
        text: `Greetings. I am the ${config.name}. I provide expert consultation on Managed IT Services and Professional IT training for Inner City Technology. How may I assist your business objectives?`,
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
      // Brief recovery delay to let the environment update
      setTimeout(() => setIsLoading(false), 500);
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
      // API CONFORMITY: Strictly alternating roles (User -> Model). 
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

      if (response.audioData && !isMuted) {
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
      console.error("Handshake Sync Failure:", err.message);
      if (err.message === "AUTH_REQUIRED" || err.message.includes("403") || err.message.includes("401")) {
        setRequiresAuth(true);
      } else if (err.message.includes("429") || err.message.includes("quota")) {
        setError("GRID OVERLOAD. ICT Free-tier quota reached. Please select a Paid Tier key for unlimited access.");
      } else {
        setError("Strategic Handshake Timeout. Re-aligning with ICT Grid...");
        setTimeout(() => setError(null), 8000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config.name, isMuted]);

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[480px] h-[100dvh] md:h-[85vh] max-h-[980px]'}`}>
      
      {/* Prime Interface */}
      <div className={`bg-white shadow-[0_100px_200px_-40px_rgba(0,0,0,0.8)] md:rounded-[4.5rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-1000 h-full w-full ${isMinimized ? 'scale-75 opacity-0 translate-y-40 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        
        {/* Elite Obsidian Header */}
        <header className="px-14 py-14 flex items-center justify-between border-b border-slate-50 bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-600/50 relative group">
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-[2rem]"></div>
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none mb-2">{config.name}</h1>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${requiresAuth ? 'bg-amber-500 shadow-amber-500/50' : 'bg-blue-600 shadow-blue-600/50'}`}></span>
                <span className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em] leading-none">
                  {requiresAuth ? 'Connection Pending' : 'Obsidian Sync Online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${isMuted ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              {isMuted ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
            </button>
            <button onClick={() => setIsMinimized(true)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        {/* Intelligence Feed */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-12 py-16 space-y-14 bg-[#fefeff]">
          {requiresAuth ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-10 animate-in fade-in zoom-in duration-1000">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Secure Link Required</h2>
              <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-10">
                To connect to the ICT Obsidian Core, please establish a secure handshake using your professional API credentials. 
                <br /><br />
                <span className="text-slate-400 text-[13px] font-black uppercase tracking-widest">Select "Paid Tier" if prompted to avoid grid congestion.</span>
              </p>
              <button 
                onClick={handleOpenAuth}
                className="px-12 py-6 bg-blue-600 text-white font-black rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-[13px]"
              >
                Establish Connection
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-8 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors border-b border-slate-200 pb-1">Billing Documentation</a>
            </div>
          ) : (
            <>
              {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
              
              {messages.length === 1 && (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                  <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-300 ml-5 mb-2">Knowledge Shortcuts</p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left px-12 py-8 bg-white border border-slate-100 text-slate-700 rounded-[3rem] text-[17px] font-bold hover:border-blue-600 hover:text-blue-600 hover:shadow-2xl transition-all group flex justify-between items-center"
                    >
                      {q}
                      <svg className="w-7 h-7 opacity-0 group-hover:opacity-100 -translate-x-8 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start items-center gap-8">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center shadow-inner relative">
                    <div className="absolute inset-0 border-[5px] border-blue-600/10 rounded-[1.8rem]"></div>
                    <div className="w-8 h-8 border-[5px] border-blue-600/0 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Syncing Knowledge Core...</p>
                </div>
              )}
              
              {error && (
                <div className="mx-8 p-10 bg-rose-50 border border-rose-100 rounded-[3.5rem] text-rose-600 text-[14px] font-black text-center shadow-2xl shadow-rose-500/10 uppercase tracking-[0.2em] leading-relaxed">
                  {error}
                  <button 
                    onClick={handleOpenAuth} 
                    className="mt-6 block w-full text-[11px] font-black uppercase tracking-widest text-rose-500 border border-rose-200 py-3 rounded-2xl hover:bg-white transition-all"
                  >
                    Reset Grid Handshake
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        
        <div className="px-14 pb-16 pt-12 bg-white/60 backdrop-blur-3xl border-t border-slate-50">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading || requiresAuth} />
        </div>
      </div>

      {/* Launcher */}
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-12 right-12 cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] group ${isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
      >
        <div className="flex items-center gap-8 bg-blue-600 pl-14 pr-10 py-8 rounded-[4.5rem] shadow-[0_60px_150px_-25px_rgba(37,99,235,0.9)] border border-white/20 hover:scale-105 active:scale-95 transition-all">
          <div className="flex flex-col">
            <span className="text-white text-[16px] font-black uppercase tracking-[0.5em] leading-tight mb-2">{config.name}</span>
            <span className="text-black text-[12px] font-black uppercase tracking-widest leading-none opacity-90">Secure Connection</span>
          </div>
          <div className="w-18 h-18 bg-white/20 rounded-[2.2rem] flex items-center justify-center text-white transition-all shadow-inner relative overflow-hidden group-hover:bg-white/30">
            <div className="absolute inset-0 bg-white/15 animate-pulse"></div>
            <svg className="w-10 h-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;