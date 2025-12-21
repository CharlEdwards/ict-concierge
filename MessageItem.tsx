import React from 'react';
import { Message, Role } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isBot = message.role === Role.BOT;

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`max-w-[88%] md:max-w-[80%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-5 py-4 rounded-[1.8rem] shadow-sm text-sm md:text-[15px] leading-relaxed transition-all
            ${isBot 
              ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]' 
              : 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-600/10'
            }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          
          {isBot && message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-50 w-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                Expert References
              </p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1.5 rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-2">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isBot && <span className="w-1 h-1 rounded-full bg-slate-200"></span>}
          {isBot && <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Verified by ICT</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;