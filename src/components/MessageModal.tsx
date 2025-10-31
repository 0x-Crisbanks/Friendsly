import React, { useState } from 'react';
import { X, Send, Paperclip, Smile, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: number;
    name: string;
    avatar: string;
    username: string;
  };
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, creator }) => {
  const { isConnected } = useWeb3();
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showTipInput, setShowTipInput] = useState(false);

  const messages = [
    {
      id: 1,
      sender: 'creator',
      content: 'Hey! Thanks for subscribing! 💜',
      timestamp: '2 hours ago',
      type: 'text'
    },
    {
      id: 2,
      sender: 'user',
      content: 'Love your content! Keep it up!',
      timestamp: '1 hour ago',
      type: 'text'
    },
    {
      id: 3,
      sender: 'creator',
      content: 'Thank you so much! Here\'s a special photo just for you 📸',
      timestamp: '45 minutes ago',
      type: 'text'
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast.success('Message sent!');
    setMessage('');
  };

  const handleSendTip = () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) return;
    
    toast.success(`Tip of ${tipAmount} ETH sent!`);
    setTipAmount('');
    setShowTipInput(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-white font-semibold">{creator.name}</h3>
                  <p className="text-gray-400 text-sm">{creator.username}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip Input */}
            {showTipInput && (
              <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="text-gray-400 text-sm">ETH</span>
                  <button
                    onClick={handleSendTip}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors text-sm"
                  >
                    Send Tip
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full px-4 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-white rounded">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white rounded">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowTipInput(!showTipInput)}
                  className="p-2 text-gray-400 hover:text-primary-400 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MessageModal;