
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';
import { SUGGESTED_QUESTIONS } from './constants';

const LEAD_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz3a0ARGJX90pzAGySe0mrqxdLlN3w7ioUWWkUw2lMwEQ9p7iRuvKkM0X0owKNKyZQm/exec"; 

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.BOT,
      text: "Welcome to Inner City Technology! I'm your Concierge. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageText, setLastMessageText] = useState<string>("");
  const [lastLead, setLastLead] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkKeyStatus = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        setHasKey(true);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkKeyStatus();
    }, 1000);
    return () => clearTimeout(timer);
  }, [checkKeyStatus]);

  const handleConnect = async () => {
    setError(null);
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } else {
        setHasKey(true);
      }
    } catch (e) {
      setHasKey(true); 
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
      scrollToBottom();
    }
  }, [messages, isLoading, lastLead, isMinimized]);

  const handleSendMessage = useCallback(async (text: string, isRetry = false) => {
    if (!text.trim()) return;
    setLastMessageText(text);
    setError(null);
    let currentMessages = messages;
    if (!isRetry) {
      const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: Date.now() };
      currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
    }
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
      if (response.leadCaptured) {
        setLastLead(response.leadCaptured);
        if (LEAD_WEBHOOK_URL) {
          fetch(LEAD_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ ...response.leadCaptured, capturedAt: new Date().toISOString() }),
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error("Webhook failed:", err));
        }
        setTimeout(() => setLastLead(null), 8000);
      }
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY")) {
        setHasKey(false);
        setError("API Key Required. Please reconnect.");
      } else {
        setError("Connection issue. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleSuggestClick = (q: string) => {
    if (!isLoading) handleSendMessage(q);
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="max-w-md w-full glass p-8 rounded-[2rem] shadow-2xl border border-white/20 space-y-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto">ICT</div>
          <h2 className="text-xl font-bold">Connect ICT AI</h2>
          <p className="text-slate-500 text-sm">Please connect your API key to start the concierge.</p>
          <button onClick={handleConnect} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">Connect Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-500 flex flex-col items-end ${isMinimized ? 'w-16 h-16' : 'w-[calc(100vw-2rem)] md:w-[420px] h-[calc(100vh-2rem)] max-h-[700px]'}`}>
      
      {/* Chat Window */}
      <div className={`bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-500 h-full w-full ${isMinimized ? 'scale-0 opacity-0 pointer-events-none translate-y-10' : 'scale-100 opacity-100'}`}>
        <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">ICT</div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">ICT Concierge</h1>
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMessages([{ id: 'welcome', role: Role.BOT, text: "How can I assist you now?", timestamp: Date.now() }])} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Reset">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => setIsMinimized(true)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div></div>
              </div>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <p className="text-red-700 dark:text-red-400 text-[11px] font-medium">{error}</p>
              <button onClick={() => handleSendMessage(lastMessageText, true)} className="bg-red-600 text-white text-[9px] font-bold py-1 px-2 rounded-lg">Retry</button>
            </div>
          )}
          {!isLoading && messages.length < 3 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => handleSuggestClick(q)} className="text-[10px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500 transition-all">{q}</button>
              ))}
            </div>
          )}
        </main>

        <div className="px-4 pb-4 bg-white dark:bg-slate-900">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Floating Bubble */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className={`w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all duration-300 ${!isMinimized ? 'mt-4 rotate-180 bg-slate-800' : ''}`}
      >
        {isMinimized ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;
