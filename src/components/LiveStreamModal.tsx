import React, { useState } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Users, Heart, DollarSign, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: number;
    name: string;
    avatar: string;
    username: string;
  };
}

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ isOpen, onClose, creator }) => {
  const { isConnected } = useWeb3();
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showTipInput, setShowTipInput] = useState(false);

  const chatMessages = [
    { id: 1, user: 'user123', message: 'Amazing stream! 🔥', tip: null },
    { id: 2, user: 'fan456', message: 'Love your content!', tip: null },
    { id: 3, user: 'supporter789', message: 'Keep it up!', tip: '0.01' },
  ];

  const handleStartStream = () => {
    setIsLive(true);
    setViewers(Math.floor(Math.random() * 100) + 10);
    toast.success('Live stream started!');
  };

  const handleEndStream = () => {
    setIsLive(false);
    setViewers(0);
    toast.success('Live stream ended');
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    toast.success('Message sent to chat!');
    setChatMessage('');
  };

  const handleSendTip = () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) return;
    toast.success(`Tip of ${tipAmount} ETH sent during live stream!`);
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-4xl bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
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
                  <div className="flex items-center space-x-2">
                    {isLive && (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 text-sm font-medium">LIVE</span>
                        <div className="flex items-center space-x-1 text-gray-400 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{viewers}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-96">
              {/* Video Area */}
              <div className="flex-1 bg-gray-800 relative">
                {isLive ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-secondary-500/20">
                    <div className="text-center">
                      <Video className="w-16 h-16 text-white mx-auto mb-4" />
                      <p className="text-white text-lg font-semibold">Live Stream Active</p>
                      <p className="text-gray-300">Broadcasting to {viewers} viewers</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Stream Offline</p>
                      <button
                        onClick={handleStartStream}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
                      >
                        Start Live Stream
                      </button>
                    </div>
                  </div>
                )}

                {/* Stream Controls */}
                {isLive && (
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                    <button className="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleEndStream}
                      className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      End Stream
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Sidebar */}
              <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700">
                  <h4 className="text-white font-semibold">Live Chat</h4>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-primary-400 font-medium">{msg.user}:</span>
                        <span className="text-gray-300">{msg.message}</span>
                      </div>
                      {msg.tip && (
                        <div className="flex items-center space-x-1 mt-1 text-yellow-400">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-xs">Tipped {msg.tip} ETH</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tip Input */}
                {showTipInput && (
                  <div className="p-3 border-t border-gray-700 bg-gray-900/50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.01"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleSendTip}
                        className="px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors text-sm"
                      >
                        Tip
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => setShowTipInput(!showTipInput)}
                      className="p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LiveStreamModal;