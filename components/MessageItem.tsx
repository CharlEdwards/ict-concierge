import React from 'react';
import { Message, Role } from '../types';
import { INDUSTRY_CONFIG } from '../constants';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isBot = message.role === Role.BOT;
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current] || INDUSTRY_CONFIG.options.TECHNOLOGY;

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]`}>
      <div className={`max-w-[92%] md:max-w-[85%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-8 py-6 rounded-[2.5rem] shadow-sm text-sm md:text-[16px] leading-[1.7] transition-all
            ${isBot 
              ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)]' 
              : `bg-blue-600 text-white rounded-tr-none shadow-[0_25px_60px_-15px_rgba(37,99,235,0.3)] font-semibold`
            }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          
          {isBot && message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-50 w-full">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                Strategic Grounding
              </p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border border-slate-100 px-5 py-3 rounded-2xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-3 group"
                  >
                    <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 px-4 opacity-40">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isBot && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
          {isBot && <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">Gemini 3 Pro Intelligence</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;