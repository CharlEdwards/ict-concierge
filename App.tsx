import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import { SUGGESTED_QUESTIONS, INDUSTRY_CONFIG } from './constants';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';

const APP_VERSION = "v45.0 Strategic Conversationalist";
const WELCOME_TEXT = "Hi there! I'm your ICT partner. I'd love to help you navigate Google Workspace, secure your remote setup, or help you grow with some sharp SEO and GEO strategies. What can we tackle together today?";

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const length = data.length - (data.length % 2);
  const dataInt16 = new Int16Array(data.buffer, 0, length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
  const [isVoiceActive, setIsVoiceActive] = useState(true); 
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [isManuallyUnlocked, setIsManuallyUnlocked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomeAudioPlayed = useRef(false);

  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];

  const getSafeKey = useCallback(() => {
    // @ts-ignore
    return import.meta.env?.VITE_API_KEY || import.meta.env?.API_KEY || (window as any).process?.env?.VITE_API_KEY;
  }, []);

  const initAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }
    } catch (e) {}
  }, []);

  const playHardwareTestPing = useCallback(() => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioContextRef.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const playPCM = async (base64Data: string) => {
    try {
      await initAudio();
      if (!audioContextRef.current || !isVoiceActive) return;
      const bytes = decodeBase64(base64Data);
      const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      setIsSpeaking(true);
      source.start();
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const handleFirstOpenVoice = useCallback(async () => {
    if (welcomeAudioPlayed.current || !isVoiceActive) return;
    const key = getSafeKey();
    if (!key) return;
    
    try {
      const audio = await geminiService.generateVoice(WELCOME_TEXT, key);
      if (audio) {
        await playPCM(audio);
        welcomeAudioPlayed.current = true;
      }
    } catch (e) {}
  }, [getSafeKey, isVoiceActive]);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isManuallyUnlocked) return;
      const apiKey = getSafeKey();
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasStudioKey = await window.aistudio.hasSelectedApiKey();
        const needsAuth = !hasStudioKey && !apiKey;
        setRequiresAuth(needsAuth);
        if (!needsAuth) setApiStatus('CONNECTED');
      } else {
        const needsAuth = !apiKey;
        setRequiresAuth(needsAuth);
        if (!needsAuth) setApiStatus('CONNECTED');
      }
    };
    verifyAuth();
    if ((window as any).hideICTLoader) (window as any).hideICTLoader();
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: Role.BOT,
        text: WELCOME_TEXT,
        timestamp: Date.now(),
      }]);
    }
  }, [config.name, messages.length, isManuallyUnlocked, getSafeKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    await initAudio();
    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiHistory = [...messages, userMsg]
        .filter(m => m.id !== 'welcome' && m.role !== Role.SYSTEM) 
        .map((m) => ({
          role: (m.role === Role.BOT ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.text }],
        }));
      
      const response = await geminiService.sendMessage(apiHistory, text);
      setApiStatus('CONNECTED');
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.BOT,
        text: response.text,
        timestamp: Date.now(),
        groundingUrls: response.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
      if (response.audioData && isVoiceActive) playPCM(response.audioData);
    } catch (err: any) {
      setApiStatus('ERROR');
      const errorText = err.message || "Establishing secure connection...";
      const sysMsg: Message = {
        id: 'err-' + Date.now(),
        role: Role.SYSTEM,
        text: `ICT SYSTEM NOTICE: ${errorText}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, sysMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isVoiceActive, initAudio]);

  const unlockApp = async () => {
    setIsManuallyUnlocked(true);
    setRequiresAuth(false);
    await initAudio();
    // @ts-ignore
    if (window.aistudio) await window.aistudio.openSelectKey();
    setApiStatus('CONNECTED');
    playHardwareTestPing();
  };

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col items-end p-0 md:p-6 ${isMinimized ? 'w-auto' : 'w-full md:w-[520px] h-[100dvh] md:h-[90vh] max-h-[1100px]'}`}>
      <div className={`bg-white shadow-[0_120px_250px_-50px_rgba(0,0,0,0.3)] md:rounded-[5rem] border border-slate-200/50 flex flex-col overflow-hidden transition-all duration-1000 h-full w-full ${isMinimized ? 'scale-75 opacity-0 translate-y-40 pointer-events-none' : 'scale-100 opacity-100 translate-y-0'}`}>
        <header className="px-6 py-8 md:px-10 md:py-10 flex items-center gap-4 border-b border-slate-50 bg-white/40 backdrop-blur-3xl shrink-0">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-[1.4rem] md:rounded-[1.8rem] flex-shrink-0 flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg relative">
            {isSpeaking && <div className="absolute -inset-3 bg-blue-600/20 animate-ping rounded-full"></div>}
            {config.shortName[0]}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base md:text-xl text-slate-900 uppercase tracking-tighter leading-none mb-1 truncate">{config.name}</h1>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${apiStatus === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : apiStatus === 'ERROR' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-400'} animate-pulse`}></div>
              <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] whitespace-nowrap overflow-hidden text-ellipsis">
                {requiresAuth ? 'Sync Locked' : isSpeaking ? 'Broadcasting' : `Simply Smart ${APP_VERSION.split(' ')[0]}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={async (e) => { e.stopPropagation(); await initAudio(); setIsVoiceActive(!isVoiceActive); if (!isVoiceActive) playHardwareTestPing(); }} 
              className={`w-12 h-10 md:w-14 md:h-12 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all flex flex-col items-center justify-center border-2 ${isVoiceActive ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mb-1 ${isVoiceActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
              {isVoiceActive ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setIsMinimized(true)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-8 md:py-10 space-y-10 bg-[#fefeff]">
          {requiresAuth && !isManuallyUnlocked ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-10">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Strategic Sync Pending</h2>
              <button onClick={unlockApp} className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl uppercase tracking-[0.3em] text-[12px]">RE-SYNC PRODUCTION LINK</button>
            </div>
          ) : (
            <>
              {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
              {messages.length === 1 && (
                <div className="grid grid-cols-1 gap-4 pt-4 pb-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 ml-4 mb-2">Growth Protocols</p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => handleSendMessage(q)} className="w-full text-left px-8 py-6 bg-white border border-slate-100 text-slate-700 rounded-[2.5rem] text-[15px] font-bold hover:border-blue-600 hover:text-blue-600 transition-all flex justify-between items-center group shadow-sm">
                      {q}
                      <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-5 px-4 pb-10">
                  <div className="w-12 h-12 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Insights...</p>
                </div>
              )}
            </>
          )}
        </main>
        
        {(!requiresAuth || isManuallyUnlocked) && (
          <div className="px-8 md:px-12 pb-10 md:pb-14 pt-6 md:pt-8 bg-white/60 backdrop-blur-3xl border-t border-slate-50 shrink-0">
            <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        )}
      </div>

      <div onClick={() => { setIsMinimized(false); initAudio(); handleFirstOpenVoice(); }} className={`fixed bottom-12 right-12 cursor-pointer transition-all duration-1000 group ${isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
        <div className="flex items-center gap-6 bg-blue-600 pl-10 pr-8 py-7 rounded-[4rem] shadow-[0_60px_120px_-20px_rgba(37,99,235,0.4)] border border-white/20 hover:scale-105 active:scale-95 transition-all">
          <div className="flex flex-col">
            <span className="text-white text-[15px] font-black uppercase tracking-[0.2em] leading-tight mb-1">{config.name}</span>
            <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Simply Smart Partner</span>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-[1.8rem] flex items-center justify-center text-white">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;