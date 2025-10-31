import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
  read: boolean;
  createdAt: number;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantUsername: string;
  participantAvatar: string;
  participantBio?: string;
  isCreator: boolean;
  isVerified: boolean;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface MessagesContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  getConversation: (conversationId: string) => Conversation | undefined;
  getOrCreateConversation: (participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    isCreator?: boolean;
    isVerified?: boolean;
  }) => Conversation;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'image' | 'video' | 'audio', mediaUrl?: string) => Message;
  markConversationAsRead: (conversationId: string) => void;
  markMessageAsRead: (messageId: string) => void;
  deleteConversation: (conversationId: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  searchConversations: (query: string) => Conversation[];
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
};

interface MessagesProviderProps {
  children: ReactNode;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (profile.id) {
          const saved = localStorage.getItem(`conversations_${profile.id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            setConversations(parsed);
            // Silent load for performance
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();

    // Listen for profile changes
    window.addEventListener('profileUpdated', loadConversations);
    return () => window.removeEventListener('profileUpdated', loadConversations);
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      if (profile.id && conversations.length >= 0) {
        localStorage.setItem(`conversations_${profile.id}`, JSON.stringify(conversations));
      }
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, [conversations]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // Helper function to format timestamp
  const formatTimestamp = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Get conversation by ID
  const getConversation = useCallback((conversationId: string): Conversation | undefined => {
    return conversations.find(conv => conv.id === conversationId);
  }, [conversations]);

  // Get or create conversation with a participant
  const getOrCreateConversation = useCallback((participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    isCreator?: boolean;
    isVerified?: boolean;
  }): Conversation => {
    // Check if conversation already exists
    const existing = conversations.find(conv => conv.participantId === participant.id);
    if (existing) {
      return existing;
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantUsername: participant.username,
      participantAvatar: participant.avatar,
      participantBio: participant.bio,
      isCreator: participant.isCreator || false,
      isVerified: participant.isVerified || false,
      isOnline: false,
      lastMessage: '',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations(prev => [newConversation, ...prev]);
    console.log('💬 Created new conversation with:', participant.name);
    return newConversation;
  }, [conversations]);

  // Send a message
  const sendMessage = useCallback((
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string
  ): Message => {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const now = Date.now();
    const newMessage: Message = {
      id: `msg_${now}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: profile.id,
      receiverId: conversation.participantId,
      content,
      timestamp: formatTimestamp(now),
      type,
      read: false,
      createdAt: now,
      imageUrl: type === 'image' ? mediaUrl : undefined,
      videoUrl: type === 'video' ? mediaUrl : undefined,
      audioUrl: type === 'audio' ? mediaUrl : undefined,
    };

    // Update conversation
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: type === 'text' ? content : `Sent a ${type}`,
            lastMessageTime: 'Just now',
            updatedAt: now,
          };
        }
        return conv;
      }).sort((a, b) => b.updatedAt - a.updatedAt) // Sort by most recent
    );

    console.log('💬 Message sent:', newMessage.id);
    return newMessage;
  }, [conversations, formatTimestamp]);

  // Mark entire conversation as read
  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: 0,
            messages: conv.messages.map(msg => ({ ...msg, read: true })),
          };
        }
        return conv;
      })
    );
  }, []);

  // Mark single message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    setConversations(prev =>
      prev.map(conv => {
        const hasMessage = conv.messages.some(msg => msg.id === messageId);
        if (hasMessage) {
          const updatedMessages = conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, read: true } : msg
          );
          const unreadCount = updatedMessages.filter(msg => !msg.read && msg.senderId !== conv.participantId).length;
          return {
            ...conv,
            messages: updatedMessages,
            unreadCount,
          };
        }
        return conv;
      })
    );
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    console.log('🗑️ Deleted conversation:', conversationId);
  }, []);

  // Delete single message
  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedMessages = conv.messages.filter(msg => msg.id !== messageId);
          const lastMsg = updatedMessages[updatedMessages.length - 1];
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: lastMsg ? (lastMsg.type === 'text' ? lastMsg.content : `Sent a ${lastMsg.type}`) : '',
            lastMessageTime: lastMsg ? lastMsg.timestamp : '',
          };
        }
        return conv;
      })
    );
    console.log('🗑️ Deleted message:', messageId);
  }, []);

  // Search conversations
  const searchConversations = useCallback((query: string): Conversation[] => {
    if (!query.trim()) return conversations;
    
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv =>
      conv.participantName.toLowerCase().includes(lowerQuery) ||
      conv.participantUsername.toLowerCase().includes(lowerQuery) ||
      conv.lastMessage.toLowerCase().includes(lowerQuery)
    );
  }, [conversations]);

  // Update timestamps periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConversations(prev =>
        prev.map(conv => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          return {
            ...conv,
            lastMessageTime: lastMsg ? formatTimestamp(lastMsg.createdAt) : conv.lastMessageTime,
            messages: conv.messages.map(msg => ({
              ...msg,
              timestamp: formatTimestamp(msg.createdAt),
            })),
          };
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const value: MessagesContextType = {
    conversations,
    totalUnreadCount,
    getConversation,
    getOrCreateConversation,
    sendMessage,
    markConversationAsRead,
    markMessageAsRead,
    deleteConversation,
    deleteMessage,
    searchConversations,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

