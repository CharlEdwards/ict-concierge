import React, { useState, useRef, useEffect } from 'react';
import { INDUSTRY_CONFIG } from '../constants';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="bg-transparent">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-4">
        <button
          type="button"
          onClick={toggleListening}
          className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.8rem] transition-all flex-shrink-0 flex items-center justify-center border-2 ${
            isListening 
              ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' 
              : `bg-slate-50 border-slate-50 text-slate-400 hover:border-blue-600 hover:text-blue-600`
          }`}
        >
          {isListening ? (
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-4 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-7 bg-white rounded-full animate-pulse delay-75"></div>
              <div className="w-1.5 h-4 bg-white rounded-full animate-pulse delay-150"></div>
            </div>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your request..."
            className={`w-full bg-[#f8fafc] text-slate-900 rounded-[2rem] px-6 py-5 md:px-8 md:py-6 pr-16 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white border border-slate-100 transition-all resize-none min-h-[64px] font-bold text-[16px] placeholder:text-slate-300 shadow-sm`}
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? `bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-100`
                  : 'bg-slate-200 text-white scale-90 opacity-0 pointer-events-none'
              }`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </form>
      <div className="h-6"></div>
      <p className="text-center text-[9px] md:text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] pointer-events-none">Obsidian Protocol v42.0 Simply Smart Partner</p>
    </div>
  );
};

export default InputArea;