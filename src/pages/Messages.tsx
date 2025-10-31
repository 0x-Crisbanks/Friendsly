import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, Video, Phone, MoreVertical, Send, Paperclip, Smile, Image, Mic, ChevronLeft, Star, Shield, Calendar, Clock, ArrowRight, Heart, Plus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context'; 
import { useMessages } from '../context/MessagesContext';
import toast from 'react-hot-toast';

const Messages = () => {
  const { isConnected, isAuthenticated, userProfile } = useWeb3();
  const { 
    conversations: realConversations, 
    sendMessage, 
    markConversationAsRead, 
    searchConversations 
  } = useMessages();
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileConversationList, setShowMobileConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '🤩',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
    '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
    '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '🔥', '✨', '💫', '⭐', '🌟', '💥', '💯', '💢', '💬', '💭',
  ];

  // Map real conversations to match expected format
  const conversations = realConversations.map(conv => ({
    id: conv.id,
    name: conv.participantName,
    username: conv.participantUsername,
    avatar: conv.participantAvatar,
    lastMessage: conv.lastMessage,
    timestamp: conv.lastMessageTime,
    unread: conv.unreadCount,
    isOnline: conv.isOnline,
    isVerified: conv.isVerified,
    category: conv.isCreator ? 'Creator' : 'User',
  }));
  
  // Filter conversations based on search term
  const filteredConversations = searchTerm.trim() 
    ? searchConversations(searchTerm).map(conv => ({
        id: conv.id,
        name: conv.participantName,
        username: conv.participantUsername,
        avatar: conv.participantAvatar,
        lastMessage: conv.lastMessage,
        timestamp: conv.lastMessageTime,
        unread: conv.unreadCount,
        isOnline: conv.isOnline,
        isVerified: conv.isVerified,
        category: conv.isCreator ? 'Creator' : 'User',
      }))
    : conversations;

  // Get selected conversation from real conversations
  const selectedRealConversation = realConversations.find(conv => conv.id === selectedChat);
  
  // Get selected conversation (mapped format for UI)
  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  // Get current user ID
  const currentUserId = userProfile?.id || JSON.parse(localStorage.getItem('user_profile') || '{}').id;
  
  // Get messages for selected conversation and map to expected format
  const messages = selectedRealConversation 
    ? selectedRealConversation.messages.map(msg => ({
        id: msg.id,
        sender: msg.senderId === currentUserId ? 'user' : 'creator',
        content: msg.type === 'image' ? msg.imageUrl! : 
                 msg.type === 'video' ? msg.videoUrl! : 
                 msg.type === 'audio' ? msg.audioUrl! : 
                 msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
      }))
    : [];

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedChat) {
      markConversationAsRead(selectedChat);
    }
  }, [selectedChat, markConversationAsRead]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) {
      toast.error('Please select a conversation and write a message');
      return;
    }
    
    try {
      // Send message using context
      sendMessage(selectedChat, newMessage, 'text');
    
    // Show success toast
      toast.success('Message sent!', {
        duration: 2000,
        icon: '💬',
      });
    
    // Clear input
    setNewMessage('');
    
      // Close emoji picker if open
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const toggleMobileView = () => {
    setShowMobileConversationList(!showMobileConversationList);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">Please login to access your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">Messages</span>
            {!showMobileConversationList && selectedConversation && (
              <button 
                onClick={toggleMobileView}
                className="md:hidden ml-4 p-2 rounded-full bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Connect directly with your favorite creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <AnimatePresence mode="wait">
            {(showMobileConversationList || window.innerWidth >= 768) && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-1 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden shadow-xl"
            >
            {/* Search */}
            <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-400 w-5 h-5 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-primary-500/70 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-700/80 transition-all duration-200"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto h-[calc(100vh-280px)]">
              <div className="p-3 border-b border-gray-700/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium text-sm">Recent Conversations</h3>
                  <button className="p-1 text-gray-400 hover:text-primary-400 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.2)' }}
                  onClick={() => setSelectedChat(conversation.id)}
                  className={`p-4 cursor-pointer border-b border-gray-700/30 transition-all duration-300 ${
                    selectedChat === conversation.id ? 'bg-primary-500/10 border-l-4 border-l-primary-500 pl-3' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={conversation.avatar}
                        alt={conversation.name}
                        className={`w-12 h-12 rounded-full border-2 ${selectedChat === conversation.id ? 'border-primary-500' : 'border-gray-700'} transition-colors duration-300`}
                      />
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
                      )}
                      {conversation.isVerified && (
                        <div className="absolute top-0 right-0 w-4 h-4 bg-primary-500 rounded-full border border-gray-800 flex items-center justify-center">
                          <Star className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium truncate ${selectedChat === conversation.id ? 'text-primary-400' : 'text-white'} transition-colors duration-300`}>{conversation.name}</h3>
                        <span className="text-gray-400 text-xs flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {conversation.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                        <span>{conversation.username}</span>
                        <span>•</span>
                        <span>{conversation.category}</span>
                      </div>
                      <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs">{conversation.unread}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No conversations found</p>
                  <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
            </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <AnimatePresence mode="wait">
            {(!showMobileConversationList || window.innerWidth >= 768) && selectedConversation ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="md:col-span-2 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden flex flex-col shadow-xl"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={toggleMobileView}
                      className="md:hidden p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <img
                        src={selectedConversation.avatar}
                        alt={selectedConversation.name}
                        className="w-12 h-12 rounded-full border-2 border-gray-700"
                      />
                      {selectedConversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
                      )}
                      {selectedConversation.isVerified && (
                        <div className="absolute top-0 right-0 w-4 h-4 bg-primary-500 rounded-full border border-gray-800 flex items-center justify-center">
                          <Star className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-semibold">{selectedConversation.name}</h3>
                        {selectedConversation.isVerified && (
                          <Star className="w-4 h-4 text-primary-400 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <p className="text-gray-400">
                          {selectedConversation.username}
                        </p>
                        <span className="text-gray-500">•</span>
                        <p className={`text-primary-400 flex items-center ${selectedConversation.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                          {selectedConversation.isOnline ? (
                            <>
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              Online
                            </>
                          ) : (
                            'Last seen 2h ago'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toast.info('📞 Voice call feature coming soon!', { duration: 3000 })}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                      title="Voice Call"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toast.info('📹 Video call feature coming soon!', { duration: 3000 })}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                      title="Video Call"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toast.info('⚙️ More options coming soon!', { duration: 3000 })}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                      title="More Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-800/20 to-gray-900/20">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md shadow-lg ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                            : 'bg-gray-700/80 text-gray-200'
                        } rounded-2xl px-4 py-3 backdrop-blur-sm ${message.sender === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      >
                        <div className="flex flex-col">
                          {message.type === 'text' ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="rounded-lg overflow-hidden mb-1 border border-white/10">
                              <img
                                src={message.content}
                                alt="Shared image"
                                className="rounded-lg max-w-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                              />
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs opacity-75">{message.timestamp}</p>
                            {message.sender === 'user' && (
                              <div className="text-xs opacity-75">✓✓</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700/50 text-gray-200 rounded-2xl px-4 py-2 max-w-xs">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
                  {/* Attachment Options */}
                  {showAttachmentOptions && (
                    <div className="mb-3 p-3 bg-gray-700/50 rounded-xl border border-gray-600/50">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => toast.success('Photo upload coming soon!')}
                          className="p-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors flex flex-col items-center"
                        >
                          <Image className="w-5 h-5 mb-1" />
                          <span className="text-xs">Photo</span>
                        </button>
                        <button 
                          onClick={() => toast.success('Video upload coming soon!')}
                          className="p-3 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors flex flex-col items-center"
                        >
                          <Video className="w-5 h-5 mb-1" />
                          <span className="text-xs">Video</span>
                        </button>
                        <button 
                          onClick={() => toast.success('Audio recording coming soon!')}
                          className="p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex flex-col items-center"
                        >
                          <Mic className="w-5 h-5 mb-1" />
                          <span className="text-xs">Audio</span>
                        </button>
                        <button 
                          onClick={() => toast.success('Tipping feature coming soon!')}
                          className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors flex flex-col items-center"
                        >
                          <Heart className="w-5 h-5 mb-1" />
                          <span className="text-xs">Tip</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                      className={`p-2 rounded-full ${showAttachmentOptions ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700'} transition-all duration-200 transform hover:scale-110 active:scale-95`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="relative z-10 w-full px-4 py-3 pr-20 bg-gray-700/60 border border-gray-600/50 rounded-full text-white placeholder-gray-400 focus:border-primary-500/70 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-700/80 transition-all duration-200 outline-none"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-20 pointer-events-none">
                        <button 
                          onClick={() => toast.info('📎 File attachment coming soon!', { duration: 3000 })}
                          className="pointer-events-auto p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-600/50 transition-all duration-200 transform hover:scale-110 active:scale-95"
                          title="Attach File"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <div className="relative pointer-events-auto">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`p-1.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${showEmojiPicker ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-gray-600/50'}`}
                            title="Insert Emoji"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                          
                          {/* Emoji Picker */}
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                ref={emojiPickerRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 w-80 max-h-64 bg-gray-800/98 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
                              >
                                <div className="p-3 border-b border-gray-700/50 bg-gray-800/80">
                                  <h4 className="text-white font-medium text-sm">Emojis</h4>
                                </div>
                                <div className="grid grid-cols-10 gap-1 p-3 max-h-56 overflow-y-auto">
                                  {commonEmojis.map((emoji, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleEmojiSelect(emoji)}
                                      className="text-2xl hover:bg-gray-700/50 rounded-lg p-1 transition-colors duration-150 hover:scale-125 transform"
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary-500/25 transform hover:scale-105 active:scale-95 disabled:transform-none focus:outline-none"
                    >
                      <Send className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:col-span-2 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden flex flex-col shadow-xl"
              >
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">Your messages</h3>
                    <p className="text-gray-400 mb-6">Connect directly with creators through secure, encrypted messaging</p>
                    <button 
                      onClick={() => {
                        setShowMobileConversationList(true);
                        toast.success('Starting a new conversation');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-colors shadow-lg hover:shadow-primary-500/25 transform hover:scale-105 flex items-center justify-center mx-auto space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Start a conversation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Messages;