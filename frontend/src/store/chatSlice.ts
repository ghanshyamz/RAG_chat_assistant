import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  activeThreadId: string | null;
  loading: boolean;
  error: string | null;
}

const getLocalStorageConversations = (): Record<string, Conversation> => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('rag_conversations');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Failed to load conversations from local storage', e);
    return {};
  }
};

const saveLocalStorageConversations = (conversations: Record<string, Conversation>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('rag_conversations', JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to local storage', e);
  }
};

const getLocalStorageActiveThreadId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rag_active_thread_id');
};

const saveLocalStorageActiveThreadId = (id: string | null) => {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem('rag_active_thread_id', id);
  } else {
    localStorage.removeItem('rag_active_thread_id');
  }
};

const initialState: ChatState = {
  conversations: getLocalStorageConversations(),
  activeThreadId: getLocalStorageActiveThreadId(),
  loading: false,
  error: null,
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createConversation: (state, action: PayloadAction<{ id?: string; title?: string } | undefined>) => {
      const id = action.payload?.id || generateUUID();
      const title = action.payload?.title || `New Conversation`;
      const now = new Date().toISOString();
      
      state.conversations[id] = {
        id,
        title,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      state.activeThreadId = id;
      saveLocalStorageConversations(state.conversations);
      saveLocalStorageActiveThreadId(id);
    },
    setActiveThreadId: (state, action: PayloadAction<string>) => {
      state.activeThreadId = action.payload;
      saveLocalStorageActiveThreadId(action.payload);
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.conversations[id];
      saveLocalStorageConversations(state.conversations);
      
      if (state.activeThreadId === id) {
        const keys = Object.keys(state.conversations);
        if (keys.length > 0) {
          state.activeThreadId = keys[keys.length - 1];
          saveLocalStorageActiveThreadId(state.activeThreadId);
        } else {
          state.activeThreadId = null;
          saveLocalStorageActiveThreadId(null);
        }
      }
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(message);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
        
        // Auto-update title if it was default "New Conversation" and this is the first user message
        if (
          state.conversations[conversationId].title === 'New Conversation' &&
          message.role === 'user'
        ) {
          const content = message.content;
          state.conversations[conversationId].title =
            content.length > 30 ? content.substring(0, 27) + '...' : content;
        }
        
        saveLocalStorageConversations(state.conversations);
      }
    },
    updateMessageContent: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string; content: string }>
    ) => {
      const { conversationId, messageId, content } = action.payload;
      if (state.conversations[conversationId]) {
        const message = state.conversations[conversationId].messages.find(
          (m) => m.id === messageId
        );
        if (message) {
          message.content = content;
          state.conversations[conversationId].updatedAt = new Date().toISOString();
          saveLocalStorageConversations(state.conversations);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  createConversation,
  setActiveThreadId,
  deleteConversation,
  addMessage,
  updateMessageContent,
  setLoading,
  setError,
  clearError,
} = chatSlice.actions;

// Async Thunk Action for Streaming Messages
export const sendMessage = (conversationId: string, content: string) => async (
  dispatch: any,
  getState: any
) => {
  const userMessageId = generateUUID();
  const assistantMessageId = generateUUID();
  const now = new Date().toISOString();

  // 1. Add user message
  dispatch(
    addMessage({
      conversationId,
      message: {
        id: userMessageId,
        role: 'user',
        content,
        timestamp: now,
      },
    })
  );

  // 2. Add empty assistant message placeholder
  dispatch(
    addMessage({
      conversationId,
      message: {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: now,
      },
    })
  );

  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    // Call streaming endpoint directly on localhost:8000
    const response = await fetch('http://localhost:8000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
        thread_id: conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Save incomplete line back to buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.substring(6).trim();
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              dispatch(setError(parsed.error));
              dispatch(
                updateMessageContent({
                  conversationId,
                  messageId: assistantMessageId,
                  content: `Error: ${parsed.error}`,
                })
              );
            } else if (parsed.content !== undefined) {
              dispatch(
                updateMessageContent({
                  conversationId,
                  messageId: assistantMessageId,
                  content: parsed.content,
                })
              );
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON chunk:', e, dataStr);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Chat stream failed:', err);
    dispatch(setError(err.message || 'Stream connection error'));
    dispatch(
      updateMessageContent({
        conversationId,
        messageId: assistantMessageId,
        content: `Error: Failed to generate response. Ensure the backend server is running. (${err.message || 'Connection lost'})`,
      })
    );
  } finally {
    dispatch(setLoading(false));
  }
};

export default chatSlice.reducer;
