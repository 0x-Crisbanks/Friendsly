import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3 } from './Web3Context';

interface FollowContextType {
  followedCreators: Set<string | number>;
  subscribedCreators: Set<string | number>;
  followCreator: (creatorId: string | number) => void;
  unfollowCreator: (creatorId: string | number) => void;
  subscribeToCreator: (creatorId: string | number, creatorData: any) => Promise<void>;
  unsubscribeFromCreator: (creatorId: string | number) => void;
  isFollowing: (creatorId: string | number) => boolean;
  isSubscribed: (creatorId: string | number) => boolean;
  getFollowedCreators: () => (string | number)[];
  getSubscribedCreators: () => (string | number)[];
  getFollowStats: () => { following: number; subscribers: number };
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

interface FollowProviderProps {
  children: ReactNode;
}

// Helper function to load data synchronously from localStorage
const loadFollowedCreatorsFromStorage = (): Set<string | number> => {
  try {
    const savedFollowed = localStorage.getItem('followed_creators');
    if (savedFollowed) {
      const followedArray = JSON.parse(savedFollowed);
      // Removed verbose log for performance
      return new Set(followedArray);
    }
  } catch (error) {
    console.error('Error loading followed creators:', error);
  }
  return new Set();
};

const loadSubscribedCreatorsFromStorage = (): Set<string | number> => {
  try {
    const savedSubscribed = localStorage.getItem('subscribed_creators');
    if (savedSubscribed) {
      const subscribedArray = JSON.parse(savedSubscribed);
      // Removed verbose log for performance
      return new Set(subscribedArray);
    }
  } catch (error) {
    console.error('Error loading subscribed creators:', error);
  }
  return new Set();
};

export const FollowProvider: React.FC<FollowProviderProps> = ({ children }) => {
  const { sendPayment, isConnected } = useWeb3();
  // Load data SYNCHRONOUSLY during initialization
  const [followedCreators, setFollowedCreators] = useState<Set<string | number>>(() => loadFollowedCreatorsFromStorage());
  const [subscribedCreators, setSubscribedCreators] = useState<Set<string | number>>(() => loadSubscribedCreatorsFromStorage());

  // Mock creator wallet addresses (in production, these would come from your backend)
  const creatorWallets: { [key: number]: string} = {
    1: '0x8bA1f109551bD432803012645Aac136c30C6A0cE', // Luna Martinez - Fixed to 42 characters
    2: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db', // Sofia Rivera  
    3: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB', // Alex Chen
    4: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2', // Marcus Johnson
    5: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372', // Emma Thompson
    6: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', // Dr. Sarah Kim
  };

  // Save to localStorage whenever data changes (silent for performance)
  useEffect(() => {
    const followedArray = Array.from(followedCreators);
    localStorage.setItem('followed_creators', JSON.stringify(followedArray));
  }, [followedCreators]);

  useEffect(() => {
    const subscribedArray = Array.from(subscribedCreators);
    localStorage.setItem('subscribed_creators', JSON.stringify(subscribedArray));
  }, [subscribedCreators]);

  const followCreator = (creatorId: string | number) => {
    console.log('✅ Following creator:', creatorId, typeof creatorId);
    setFollowedCreators(prev => {
      const newSet = new Set(prev);
      newSet.add(creatorId);
      console.log('📊 Updated followed creators:', Array.from(newSet));
      return newSet;
    });
    
    // Track follow event
    const followEvent = {
      creatorId,
      timestamp: new Date().toISOString(),
      action: 'follow'
    };
    
    let followHistory;
    try {
      const storedHistory = localStorage.getItem('follow_history');
      followHistory = storedHistory ? JSON.parse(storedHistory) : [];
      // Ensure followHistory is an array
      if (!Array.isArray(followHistory)) {
        followHistory = [];
      }
    } catch (error) {
      console.error('Error parsing follow history:', error);
      followHistory = [];
    }
    
    followHistory.push(followEvent);
    localStorage.setItem('follow_history', JSON.stringify(followHistory));
  };

  const unfollowCreator = (creatorId: string | number) => {
    console.log('❌ Unfollowing creator:', creatorId, typeof creatorId);
    setFollowedCreators(prev => {
      const newSet = new Set(prev);
      newSet.delete(creatorId);
      console.log('📊 Updated followed creators:', Array.from(newSet));
      return newSet;
    });
    
    // Also unsubscribe if subscribed
    if (subscribedCreators.has(creatorId)) {
      unsubscribeFromCreator(creatorId);
    }
    
    // Track unfollow event
    const unfollowEvent = {
      creatorId,
      timestamp: new Date().toISOString(),
      action: 'unfollow'
    };
    
    let followHistory;
    try {
      const storedHistory = localStorage.getItem('follow_history');
      followHistory = storedHistory ? JSON.parse(storedHistory) : [];
      // Ensure followHistory is an array
      if (!Array.isArray(followHistory)) {
        followHistory = [];
      }
    } catch (error) {
      console.error('Error parsing follow history:', error);
      followHistory = [];
    }
    
    followHistory.push(unfollowEvent);
    localStorage.setItem('follow_history', JSON.stringify(followHistory));
  };

  const subscribeToCreator = async (creatorId: string | number, creatorData: any) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    // Must be following to subscribe
    if (!followedCreators.has(creatorId)) {
      followCreator(creatorId);
    }

    try {
      // Get creator wallet address from creatorData or fallback to creatorWallets
      let creatorWalletAddress = creatorData.walletAddress;
      
      // If walletAddress not in creatorData, try to get it from creatorWallets (for backward compatibility)
      if (!creatorWalletAddress && typeof creatorId === 'number') {
        creatorWalletAddress = creatorWallets[creatorId];
      }
      
      if (!creatorWalletAddress) {
        throw new Error('Creator wallet address not found');
      }

      console.log('Processing subscription payment:', {
        creatorId,
        creatorName: creatorData.name,
        subscriptionPrice: creatorData.subscriptionPrice,
        creatorWallet: creatorWalletAddress
      });

      // Process payment through Web3Context
      const txHash = await sendPayment(
        creatorWalletAddress,
        creatorData.subscriptionPrice,
        'subscription',
        creatorData.name
      );

      // If payment successful, add to subscribed creators
      console.log('✅ Subscribing to creator:', creatorId, typeof creatorId);
      setSubscribedCreators(prev => {
        const newSet = new Set(prev);
        newSet.add(creatorId);
        console.log('📊 Updated subscribed creators:', Array.from(newSet));
        return newSet;
      });
      
      // Track subscription event with transaction details
      const subscriptionEvent = {
        creatorId,
        creatorName: creatorData.name,
        subscriptionPrice: creatorData.subscriptionPrice,
        creatorWallet: creatorWalletAddress,
        transactionHash: txHash,
        timestamp: new Date().toISOString(),
        action: 'subscribe',
        conversionFromFollow: followedCreators.has(creatorId),
        paymentBreakdown: {
          total: creatorData.subscriptionPrice,
          creatorAmount: (parseFloat(creatorData.subscriptionPrice) * 0.9).toFixed(3),
          platformFee: (parseFloat(creatorData.subscriptionPrice) * 0.1).toFixed(3)
        }
      };
      
      let subscriptionHistory;
      try {
        const storedHistory = localStorage.getItem('subscription_history');
        subscriptionHistory = storedHistory ? JSON.parse(storedHistory) : [];
        // Ensure subscriptionHistory is an array
        if (!Array.isArray(subscriptionHistory)) {
          subscriptionHistory = [];
        }
      } catch (error) {
        console.error('Error parsing subscription history:', error);
        subscriptionHistory = [];
      }
      
      subscriptionHistory.push(subscriptionEvent);
      localStorage.setItem('subscription_history', JSON.stringify(subscriptionHistory));

    } catch (error: any) {
      console.error('Subscription error:', error);
      
      // Don't add to subscribed creators if payment failed
      if (error.code === 4001) {
        // User cancelled - silent handling
      } else if (error.message?.includes('insufficient funds')) {
        // Insufficient funds - silent handling
      } else {
        // Other errors - silent handling
      }
      
      throw error;
    }
  };

  const unsubscribeFromCreator = (creatorId: string | number) => {
    console.log('❌ Unsubscribing from creator:', creatorId, typeof creatorId);
    setSubscribedCreators(prev => {
      const newSet = new Set(prev);
      newSet.delete(creatorId);
      console.log('📊 Updated subscribed creators:', Array.from(newSet));
      return newSet;
    });
    
    // Track unsubscription event
    const unsubscriptionEvent = {
      creatorId,
      timestamp: new Date().toISOString(),
      action: 'unsubscribe'
    };
    
    let subscriptionHistory;
    try {
      const storedHistory = localStorage.getItem('subscription_history');
      subscriptionHistory = storedHistory ? JSON.parse(storedHistory) : [];
      // Ensure subscriptionHistory is an array
      if (!Array.isArray(subscriptionHistory)) {
        subscriptionHistory = [];
      }
    } catch (error) {
      console.error('Error parsing subscription history:', error);
      subscriptionHistory = [];
    }
    
    subscriptionHistory.push(unsubscriptionEvent);
    localStorage.setItem('subscription_history', JSON.stringify(subscriptionHistory));
  };

  const isFollowing = (creatorId: string | number) => {
    return followedCreators.has(creatorId);
  };

  const isSubscribed = (creatorId: string | number) => {
    return subscribedCreators.has(creatorId);
  };

  const getFollowedCreators = () => {
    return Array.from(followedCreators);
  };

  const getSubscribedCreators = () => {
    return Array.from(subscribedCreators);
  };

  const getFollowStats = () => {
    return {
      following: followedCreators.size,
      subscribers: subscribedCreators.size
    };
  };

  const value = {
    followedCreators,
    subscribedCreators,
    followCreator,
    unfollowCreator,
    subscribeToCreator,
    unsubscribeFromCreator,
    isFollowing,
    isSubscribed,
    getFollowedCreators,
    getSubscribedCreators,
    getFollowStats,
  };

  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
};