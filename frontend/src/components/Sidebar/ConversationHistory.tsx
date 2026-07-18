'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createConversation,
  setActiveThreadId,
  deleteConversation,
} from '@/store/chatSlice';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

export default function ConversationHistory() {
  const dispatch = useAppDispatch();
  const { conversations, activeThreadId } = useAppSelector((state) => state.chat);

  const sortedConversations = Object.values(conversations).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleNewChat = () => {
    dispatch(createConversation());
  };

  const handleSelectChat = (id: string) => {
    dispatch(setActiveThreadId(id));
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      dispatch(deleteConversation(id));
    }
  };

  return (
    <div className="flex flex-col h-[45%] border-b border-white/5 pb-4">
      {/* Header and New Chat Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Conversations
        </h3>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-brand-violet hover:bg-brand-indigo rounded-lg transition-all shadow-md shadow-brand-violet/20 hover:scale-[1.02] cursor-pointer"
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center border border-dashed border-white/5 rounded-xl p-4 bg-slate-900/20">
            <p className="text-xs text-slate-500">No chat history yet.</p>
            <button
              onClick={handleNewChat}
              className="mt-2 text-xs text-brand-purple hover:underline cursor-pointer"
            >
              Start one now
            </button>
          </div>
        ) : (
          sortedConversations.map((chat) => {
            const isActive = chat.id === activeThreadId;
            return (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-brand-violet/15 border border-brand-violet/30 text-white shadow-inner'
                    : 'bg-white/[0.01] border border-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    size={16}
                    className={isActive ? 'text-brand-purple' : 'text-slate-400'}
                  />
                  <span className="text-sm font-medium truncate">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
                  title="Delete Conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
