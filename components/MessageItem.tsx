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
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out`}>
      <div className={`max-w-[90%] md:max-w-[85%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-6 py-5 rounded-[2rem] shadow-sm text-sm md:text-[16px] leading-[1.6] transition-all
            ${isBot 
              ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-xl shadow-slate-200/20' 
              : `bg-${config.primaryColor} text-white rounded-tr-none shadow-2xl shadow-${config.primaryColor}/20`
            }`}
        >
          <div className="whitespace-pre-wrap font-medium">{message.text}</div>
          
          {isBot && message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-50 w-full">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-${config.accentColor}`}></span>
                Elite Intelligence Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-4 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3 px-3">
          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isBot && <span className="w-1 h-1 rounded-full bg-slate-200"></span>}
          {isBot && <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Verified Engine</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;