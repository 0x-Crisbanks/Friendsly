import React, { useState, useEffect } from 'react';
import { X, DollarSign, Heart, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { PriceConverter, SupportedCrypto, QUICK_TIP_AMOUNTS_USD, CRYPTO_ICONS, CRYPTO_SYMBOLS } from '../utils/priceConverter';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: number;
    name: string;
    avatar: string;
    username: string;
    walletAddress?: string;
  };
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, creator }) => {
  const { isConnected, sendPayment } = useWeb3();
  const [customAmountUSD, setCustomAmountUSD] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAmountUSD, setSelectedAmountUSD] = useState<number | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('ETH');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock creator wallet addresses (in production, these would come from your backend)
  const creatorWallets: { [key: number]: string } = {
    1: '0x8ba1f109551bD432803012645Aac136c30C6A0', // Luna Martinez - Fixed: H -> A
    2: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db', // Sofia Rivera  
    3: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB', // Alex Chen
    4: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2', // Marcus Johnson
    5: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372', // Emma Thompson
    6: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', // Dr. Sarah Kim
  };

  const supportedCryptos: { symbol: SupportedCrypto; name: string; icon: string; fallback: string }[] = [
    { symbol: 'ETH', name: 'Ethereum', icon: CRYPTO_ICONS.ETH, fallback: CRYPTO_SYMBOLS.ETH },
    { symbol: 'BTC', name: 'Bitcoin', icon: CRYPTO_ICONS.BTC, fallback: CRYPTO_SYMBOLS.BTC },
    { symbol: 'USDT', name: 'Tether', icon: CRYPTO_ICONS.USDT, fallback: CRYPTO_SYMBOLS.USDT },
    { symbol: 'SOL', name: 'Solana', icon: CRYPTO_ICONS.SOL, fallback: CRYPTO_SYMBOLS.SOL },
  ];

  // Update exchange rates on component mount
  useEffect(() => {
    if (isOpen) {
      PriceConverter.updateExchangeRates();
    }
  }, [isOpen]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getCurrentTipAmount = (): number => {
    if (selectedAmountUSD) return selectedAmountUSD;
    if (customAmountUSD) return parseFloat(customAmountUSD);
    return 0;
  };

  const getTipBreakdown = () => {
    const usdAmount = getCurrentTipAmount();
    if (!usdAmount) return null;

    const cryptoAmount = PriceConverter.usdToCrypto(usdAmount, selectedCrypto);
    const creatorReceivesUSD = usdAmount * 0.9;
    const creatorReceivesCrypto = PriceConverter.usdToCrypto(creatorReceivesUSD, selectedCrypto);
    const platformFeeUSD = usdAmount * 0.1;
    const platformFeeCrypto = PriceConverter.usdToCrypto(platformFeeUSD, selectedCrypto);

    return {
      totalUSD: usdAmount,
      totalCrypto: cryptoAmount,
      creatorReceivesUSD,
      creatorReceivesCrypto,
      platformFeeUSD,
      platformFeeCrypto,
    };
  };

  const handleTip = async () => {
    const breakdown = getTipBreakdown();
    if (!breakdown) {
      return;
    }

    if (!isConnected) {
      return;
    }

    const creatorWalletAddress = creator.walletAddress || creatorWallets[creator.id];
    if (!creatorWalletAddress) {
      return;
    }

    setIsProcessing(true);

    try {
      // Process tip payment directly without confirmation modal
      const txHash = await sendPayment(
        creatorWalletAddress,
        breakdown.totalCrypto.toFixed(18),
        'tip',
        creator.name
      );

      // Store tip record with both USD and crypto amounts
      const tipRecord = {
        creatorId: creator.id,
        creatorName: creator.name,
        amountUSD: breakdown.totalUSD,
        amountCrypto: breakdown.totalCrypto,
        cryptoSymbol: selectedCrypto,
        message,
        transactionHash: txHash,
        timestamp: new Date().toISOString(),
        paymentBreakdown: {
          totalUSD: breakdown.totalUSD,
          totalCrypto: breakdown.totalCrypto,
          creatorAmountUSD: breakdown.creatorReceivesUSD,
          creatorAmountCrypto: breakdown.creatorReceivesCrypto,
          platformFeeUSD: breakdown.platformFeeUSD,
          platformFeeCrypto: breakdown.platformFeeCrypto,
          cryptoSymbol: selectedCrypto,
        }
      };

      const tipHistory = JSON.parse(localStorage.getItem('tip_history') || '[]');
      tipHistory.push(tipRecord);
      localStorage.setItem('tip_history', JSON.stringify(tipHistory));

      onClose();
      setCustomAmountUSD('');
      setMessage('');
      setSelectedAmountUSD(null);

    } catch (error: any) {
      console.error('Tip error:', error);
      // Error handling is done in sendPayment
    } finally {
      setIsProcessing(false);
    }
  };

  const breakdown = getTipBreakdown();

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
            className="relative w-full max-w-lg bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Send Tip</h2>
                  <p className="text-gray-400 text-sm">to {creator.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Creator Info */}
              <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-700/30 rounded-lg">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                />
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-base">{creator.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">{creator.username}</p>
                </div>
              </div>

              {/* Quick Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Quick Amounts (USD)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_TIP_AMOUNTS_USD.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmountUSD(amount);
                        setCustomAmountUSD('');
                      }}
                      disabled={isProcessing}
                      className={`p-2 sm:p-3 rounded-lg border transition-colors text-center disabled:opacity-50 text-sm sm:text-base ${
                        selectedAmountUSD === amount
                          ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      {PriceConverter.formatUSD(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Custom Amount (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={customAmountUSD}
                    onChange={(e) => {
                      setCustomAmountUSD(e.target.value);
                      setSelectedAmountUSD(null);
                    }}
                    disabled={isProcessing}
                    placeholder="5.00"
                    className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </div>
                </div>
              </div>

              {/* Cryptocurrency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {supportedCryptos.map((crypto) => (
                    <button
                      key={crypto.symbol}
                      onClick={() => setSelectedCrypto(crypto.symbol)}
                      disabled={isProcessing}
                      className={`flex items-center justify-center space-x-2 p-2 sm:p-3 rounded-lg border transition-colors disabled:opacity-50 ${
                        selectedCrypto === crypto.symbol
                          ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <img 
                          src={crypto.icon} 
                          alt={crypto.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                          onError={(e) => {
                            // Fallback to text symbol if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = document.createElement('span');
                            fallback.textContent = crypto.fallback;
                            fallback.className = 'text-base sm:text-lg font-bold';
                            target.parentNode?.insertBefore(fallback, target);
                          }}
                        />
                        <span className="text-xs sm:text-sm font-medium">{crypto.symbol}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-50 text-sm"
                />
              </div>

              {/* Tip Summary */}
              {breakdown && (
                <div className="p-3 sm:p-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Tip Amount:</span>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm sm:text-base">
                          {PriceConverter.formatUSD(breakdown.totalUSD)}
                        </div>
                        <div className="text-primary-400 text-xs sm:text-sm">
                          {PriceConverter.formatCrypto(breakdown.totalCrypto, selectedCrypto)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Creator receives:</span>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          {PriceConverter.formatUSD(breakdown.creatorReceivesUSD)}
                        </div>
                        <div className="text-green-400 text-xs">
                          {PriceConverter.formatCrypto(breakdown.creatorReceivesCrypto, selectedCrypto)} (90%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Platform fee:</span>
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">
                          {PriceConverter.formatUSD(breakdown.platformFeeUSD)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {PriceConverter.formatCrypto(breakdown.platformFeeCrypto, selectedCrypto)} (10%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                      <span className="text-gray-300 text-sm">Exchange rate:</span>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        1 {selectedCrypto} = {PriceConverter.formatUSD(PriceConverter.getExchangeRate(selectedCrypto))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Connection Warning */}
              {!isConnected && (
                <div className="p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    Please connect your wallet to send tips
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-4 sm:px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTip}
                  disabled={!isConnected || !breakdown || isProcessing}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Send Tip</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TipModal;