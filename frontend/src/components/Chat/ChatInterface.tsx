'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { sendMessage, clearError } from '@/store/chatSlice';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { Menu, Bot, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ChatInterfaceProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function ChatInterface({ onToggleSidebar, isSidebarOpen }: ChatInterfaceProps) {
  const dispatch = useAppDispatch();
  const { conversations, activeThreadId, loading, error } = useAppSelector((state) => state.chat);
  
  const activeConversation = activeThreadId ? conversations[activeThreadId] : null;
  const messages = activeConversation ? activeConversation.messages : [];

  const handleSend = (content: string) => {
    if (activeThreadId) {
      dispatch(sendMessage(activeThreadId, content));
    }
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/30 overflow-hidden relative">
      {/* Chat Top Header */}
      <header className="glass-panel border-b flex items-center justify-between px-4 md:px-6 h-16 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Active Conversation Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-brand-purple shrink-0">
              <Bot size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                {activeConversation ? activeConversation.title : 'No active chat'}
              </h2>
              {activeConversation && (
                <p className="text-[10px] text-slate-500 font-medium">
                  {messages.length} Turn{messages.length !== 1 ? 's' : ''} • Thread ID: {activeThreadId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status badges / Top navigation items */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1 bg-emerald-500/5 text-emerald-400/90 border border-emerald-500/10 px-2 py-0.5 rounded-full select-none">
            <ShieldCheck size={12} className="text-emerald-400" />
            Backend Connected
          </span>
        </div>
      </header>

      {/* SSE / API Error Alert Banner */}
      {error && (
        <div className="bg-red-950/40 border-b border-red-500/20 px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-red-300 relative z-10 backdrop-blur-sm animate-slide-down">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleDismissError}
            className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Welcome Screen or Message List */}
      <MessageList messages={messages} loading={loading} />

      {/* Text Area Input */}
      <ChatInput
        onSend={handleSend}
        loading={loading}
        disabled={!activeThreadId}
      />
    </div>
  );
}
