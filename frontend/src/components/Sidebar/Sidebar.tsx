'use client';

import React from 'react';
import ConversationHistory from './ConversationHistory';
import DocumentManager from './DocumentManager';
import { Database, MessageSquareCode } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`glass-panel border-r shrink-0 flex flex-col h-full w-80 p-4 transition-all duration-300 ease-in-out z-20 ${
        isOpen
          ? 'translate-x-0 relative'
          : '-translate-x-full fixed md:translate-x-0 md:relative'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2 pb-5 mb-4 border-b border-white/5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-indigo shadow-md shadow-brand-violet/20">
          <MessageSquareCode size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            RAG Chatbot
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">FastAPI + LangGraph</p>
        </div>
      </div>

      {/* History Section (45% height) */}
      <ConversationHistory />

      {/* Document Ingestion Section (50% height) */}
      <DocumentManager />
    </aside>
  );
}
