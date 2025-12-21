import React, { useState, useRef, useEffect } from 'react';

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
    if (!SpeechRecognition) {
      alert("Voice protocols are not enabled on this browser.");
      return;
    }

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
      <form onSubmit={handleSubmit} className="relative flex items-end gap-3 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={toggleListening}
          className={`w-14 h-14 rounded-2xl transition-all flex-shrink-0 flex items-center justify-center border-2 ${
            isListening 
              ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30' 
              : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
          }`}
          title={isListening ? "Deactivate Mic" : "Activate Voice Control"}
        >
          {isListening ? (
            <div className="flex gap-0.5 items-center">
              <div className="w-1 h-3 bg-white animate-pulse"></div>
              <div className="w-1 h-5 bg-white animate-pulse delay-75"></div>
              <div className="w-1 h-3 bg-white animate-pulse delay-150"></div>
            </div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <div className="flex-1 relative group">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your inquiry..."
            className="w-full bg-slate-50 text-slate-800 rounded-2xl px-5 py-4 pr-16 border-2 border-slate-50 focus:outline-none focus:border-emerald-500/20 focus:bg-white transition-all resize-none min-h-[56px] font-medium text-[15px]"
            disabled={isLoading}
          />
          <div className="absolute right-3 bottom-3">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl transition-all ${
                input.trim() && !isLoading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-200 text-white cursor-not-allowed opacity-0 scale-75'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </form>
      <p className="text-center text-[9px] text-slate-300 mt-4 font-black uppercase tracking-[0.2em]">End-to-End Encrypted Concierge Service</p>
    </div>
  );
};

export default InputArea;