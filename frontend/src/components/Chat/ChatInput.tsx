'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  loading: boolean;
  disabled: boolean;
}

export default function ChatInput({ onSend, loading, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to compute scrollHeight
    textarea.style.height = 'auto';
    // Set to scrollHeight (bounded by CSS max-h)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || loading || disabled) return;

    onSend(trimmed);
    setContent('');

    // Refocus input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6 bg-slate-950 border-t border-white/5 relative z-10"
    >
      <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-white/[0.02] border border-white/10 focus-within:border-brand-violet/50 rounded-2xl p-2 pr-3 transition-all">
        <textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Please create or select a conversation thread..." : "Ask a question about your documents..."}
          disabled={disabled || loading}
          className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm py-2 px-3 text-slate-100 placeholder-slate-500 resize-none max-h-[200px] min-h-[40px] leading-relaxed overflow-y-auto"
        />

        <button
          type="submit"
          disabled={!content.trim() || loading || disabled}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shadow-md cursor-pointer ${
            content.trim() && !loading && !disabled
              ? 'bg-brand-violet hover:bg-brand-indigo text-white hover:scale-105 shadow-brand-violet/20'
              : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed shadow-none'
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-500 mt-2 max-w-sm mx-auto">
        RAG chatbot uses retrieved chunks. Please check important details for accuracy.
      </p>
    </form>
  );
}
