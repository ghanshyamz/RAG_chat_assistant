'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/store/chatSlice';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Sparkles, MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

export default function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const examplePrompts = [
    "What is the main topic of the uploaded document?",
    "Summarize the key findings in the file.",
    "Explain the methodology described in the document.",
    "List the major recommendations from the text."
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 select-none">
        {/* Welcome Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-brand-violet/20 rounded-full blur-xl scale-125 animate-pulse" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-indigo border border-white/10 shadow-lg shadow-brand-violet/20">
            <Sparkles size={32} className="text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            How can I help you today?
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Upload documents (PDF, TXT, or MD) in the sidebar to index them, then ask questions. The assistant will retrieve relevant context to answer.
          </p>
        </div>

        {/* Example Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-4">
          {examplePrompts.map((prompt, i) => (
            <div
              key={i}
              className="glass-panel glass-panel-hover flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-left transition-all duration-300 cursor-pointer"
              onClick={() => {
                // We'll let the user fill the textarea when clicked
                const input = document.getElementById('chat-input') as HTMLTextAreaElement;
                if (input) {
                  input.value = prompt;
                  input.focus();
                  // Trigger an input event so any state handlers update
                  const event = new Event('input', { bubbles: true });
                  input.dispatchEvent(event);
                }
              }}
            >
              <MessageSquare size={16} className="text-brand-purple shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-slate-200">
                {prompt}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div
            key={message.id}
            className={`flex gap-4 max-w-3xl ${
              isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isUser
                  ? 'bg-brand-violet/10 border-brand-violet/30 text-brand-purple'
                  : 'bg-slate-900 border-white/10 text-slate-300 shadow-sm'
              }`}
            >
              {isUser ? <User size={18} /> : <Bot size={18} />}
            </div>

            {/* Message Body */}
            <div
              className={`flex flex-col gap-1 min-w-0 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Content Panel */}
              <div
                className={`glass-panel px-4 py-3 rounded-2xl border text-sm max-w-full ${
                  isUser
                    ? 'bg-brand-violet/10 border-brand-violet/20 rounded-tr-none text-slate-100'
                    : 'bg-white/[0.02] border-white/5 rounded-tl-none text-slate-200 shadow-sm'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : (
                  <div className="prose leading-relaxed">
                    {message.content === '' && loading ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-slate-500 px-1 mt-0.5">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        );
      })}

      {/* Floating loading skeleton */}
      {loading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex gap-4 max-w-3xl mr-auto">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-slate-900 border-white/10 text-slate-300">
            <Bot size={18} />
          </div>
          <div className="glass-panel px-4 py-3.5 rounded-2xl rounded-tl-none border border-white/5 bg-white/[0.02] text-sm flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Anchor for scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
