'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createConversation } from '@/store/chatSlice';
import Sidebar from '@/components/Sidebar/Sidebar';
import ChatInterface from '@/components/Chat/ChatInterface';

export default function Home() {
  const dispatch = useAppDispatch();
  const { conversations, activeThreadId } = useAppSelector((state) => state.chat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize a thread automatically on first load if none exists
  useEffect(() => {
    const keys = Object.keys(conversations);
    if (keys.length === 0) {
      dispatch(createConversation());
    } else if (!activeThreadId) {
      // If there are conversations but no active ID selected, select the first/newest one
      const sortedKeys = Object.keys(conversations).sort(
        (a, b) => new Date(conversations[b].updatedAt).getTime() - new Date(conversations[a].updatedAt).getTime()
      );
      dispatch({ type: 'chat/setActiveThreadId', payload: sortedKeys[0] });
    }
  }, [conversations, activeThreadId, dispatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden"
        />
      )}

      {/* Left Sidebar (w-80) */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Right Chat Interface (Flex 1) */}
      <ChatInterface
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
    </main>
  );
}
