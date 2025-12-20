
import React from 'react';
import { Message, Role } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isBot = message.role === Role.BOT;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap
            ${isBot 
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700' 
              : 'bg-indigo-600 text-white rounded-tr-none'
            }`}
        >
          {message.text}
          
          {isBot && message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 w-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingUrls.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
