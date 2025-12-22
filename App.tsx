import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v23.0 Oracle Voice";
const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64.trim());
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(true); 
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomeVoicedRef = useRef(false);

  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];

  // Initialize AudioContext on first human interaction
  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const playPCM = async (base64Data: string) => {
    try {
      await initAudio();
      if (!audioContextRef.current) return;

      const bytes = decodeBase64(base64Data);
      const alignedLength = Math.floor(bytes.length / 2) * 2;
      const dataInt16 = new Int16Array(bytes.buffer, 0, alignedLength / 2);
      
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      source.start();
    } catch (e) {
      console.error("Voice Playback Error:", e);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const hasEnvKey = !!process.env.API_KEY;
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasStudioKey = await window.aistudio.hasSelectedApiKey();
        setRequiresAuth(!hasStudioKey && !hasEnvKey);
      } else {
        setRequiresAuth(!hasEnvKey);
      }
    };
    
    verifyAuth();
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: Role.BOT,
        text: `Greetings. I am the ${config.name}. I provide expert consultation on Managed IT and Professional Training for ICT.\n\nTo align our insights: Are you currently leveraging AI Agents within your own business architecture?`,
        timestamp: Date.now(),
      }]);
    }
  }, [config.name, messages.length]);

  // Voice the welcome message once audio is unlocked and chat is open
  useEffect(() => {
    if (!isMinimized && !requiresAuth && isVoiceActive && !welcomeVoicedRef.current && messages.length > 0) {
      const welcome = messages.find(m => m.id === 'welcome');
      if (welcome && process.env.API_KEY) {
        welcomeVoicedRef.current = true;
        geminiService.generateVoice(welcome.text, process.env.API_KEY)
          .then(audio => audio && playPCM(audio))
          .catch(() => {});
      }
    }
  }, [isMinimized, requiresAuth, isVoiceActive, messages]);

  const handleOpenAuth = async () => {
    await initAudio();
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setRequiresAuth(false);
    } else {
      setRequiresAuth(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
    await initAudio();
    
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
    } catch (err: any) {
      setError("Strategic Handshake Timeout. Please ensure your Paid Tier project is Redeployed.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isVoiceActive, initAudio]);

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[520px] h-[100dvh] md:h-[90vh] max-h-[1100px]'}`}>
      
      <div className={`bg-white shadow-[0_120px_250px_-50px_rgba(0,0,0,0.3)] md:rounded-[5rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-1000 h-full w-full ${isMinimized ? 'scale-75 opacity-0 translate-y-40 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        
        <header className="px-12 py-8 flex items-center justify-between border-b border-slate-50 bg-white/40 backdrop-blur-3xl shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-lg relative">
              {isSpeaking && <div className="absolute -inset-2 bg-blue-600/20 animate-ping rounded-full"></div>}
              {config.shortName[0]}
            </div>
            <div>
              <h1 className="font-black text-lg text-slate-900 uppercase tracking-tighter leading-none mb-1">{config.name}</h1>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">
                {requiresAuth ? 'Handshake Required' : isSpeaking ? 'Speaking Now...' : 'Elite v23.0 Active'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { initAudio(); setIsVoiceActive(!isVoiceActive); }} 
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isVoiceActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
            >
              {isVoiceActive ? 'VOICE ON' : 'OFF'}
            </button>
            <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-8 bg-[#fefeff]">
          {requiresAuth ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-10">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Elite Production Sync</h2>
              <button 
                onClick={handleOpenAuth}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl uppercase tracking-[0.3em] text-[12px]"
              >
                SYNC STRATEGIC LINK
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 underline decoration-2 underline-offset-8">BILLING DOCUMENTATION</a>
            </div>
          ) : (
            <>
              {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
              {messages.length === 1 && (
                <div className="grid grid-cols-1 gap-3 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 ml-4 mb-2">Discovery Protocols</p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => handleSendMessage(q)} className="w-full text-left px-8 py-5 bg-white border border-slate-100 text-slate-700 rounded-[2rem] text-[14px] font-bold hover:border-blue-600 hover:text-blue-600 transition-all flex justify-between items-center group shadow-sm">
                      {q}
                      <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-4 px-4">
                  <div className="w-10 h-10 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Insights...</p>
                </div>
              )}
              {error && (
                <div className="mx-4 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-600 text-[12px] font-black text-center uppercase tracking-[0.2em]">
                  {error}
                </div>
              )}
            </>
          )}
        </main>
        
        {!requiresAuth && (
          <div className="px-10 pb-10 pt-6 bg-white/60 backdrop-blur-3xl border-t border-slate-50 shrink-0">
            <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        )}
      </div>

      <div 
        onClick={() => { setIsMinimized(false); initAudio(); }}
        className={`fixed bottom-10 right-10 cursor-pointer transition-all duration-1000 group ${isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
      >
        <div className="flex items-center gap-6 bg-blue-600 pl-10 pr-8 py-6 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(37,99,235,0.4)] border border-white/20 hover:scale-105 active:scale-95 transition-all">
          <div className="flex flex-col">
            <span className="text-white text-[14px] font-black uppercase tracking-[0.2em] leading-tight mb-1">{config.name}</span>
            <span className="text-blue-100 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Open Oracle</span>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-[1.5rem] flex items-center justify-center text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;