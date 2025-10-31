import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Web3ContextType } from '../libs/interfaces';
import { ethers } from 'ethers';

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Enhanced MetaMask detection function
const detectMetaMask = (): boolean => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Check if ethereum object exists
    if (!window.ethereum) {
      return false;
    }

    // Check if it's specifically MetaMask
    if (!window.ethereum.isMetaMask) {
      return false;
    }

    // Additional check for MetaMask provider
    if (typeof window.ethereum.request !== 'function') {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error detecting MetaMask:', error);
    return false;
  }
};

// Validate and normalize Ethereum address
const validateAndNormalizeAddress = (address: string): string => {
  try {
    // Remove any whitespace
    const cleanAddress = address.trim();
    
    // Check if it's a valid Ethereum address format (basic length and format check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      // More detailed error message based on the issue
      if (cleanAddress.length !== 42) {
        throw new Error(`Invalid address length: expected 42 characters, got ${cleanAddress.length}. Address: ${cleanAddress}`);
      }
      if (!cleanAddress.startsWith('0x')) {
        throw new Error(`Address must start with '0x'. Address: ${cleanAddress}`);
      }
      throw new Error(`Invalid address format: contains invalid characters. Address: ${cleanAddress}`);
    }
    
    // Convert to lowercase before validation to ensure consistent processing
    const lowercaseAddress = cleanAddress.toLowerCase();
    
    // Use ethers.getAddress to validate and checksum the address
    return ethers.getAddress(lowercaseAddress);
  } catch (error) {
    console.error('Address validation error:', error);
    if (error instanceof Error && error.message.includes('Invalid address')) {
      throw error; // Re-throw our custom error messages
    }
    throw new Error(`Invalid Ethereum address: ${address}. ${error instanceof Error ? error.message : 'Unknown validation error'}`);
  }
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  // FriendsX custodial wallet address (properly validated)
  const FRIENDSX_CUSTODIAL_WALLET = validateAndNormalizeAddress('0x742d35cc6634c0532925a3b8d4c9db96c4b5da5a');

  // Check MetaMask availability on mount and periodically
  useEffect(() => {
    const checkMetaMask = () => {
      const available = detectMetaMask();
      setIsMetaMaskAvailable(available);
      return available;
    };

    // Initial check
    checkMetaMask();

    // Check periodically in case MetaMask is installed after page load
    const interval = setInterval(checkMetaMask, 2000);

    // Listen for ethereum provider injection
    const handleEthereumInjection = () => {
      setTimeout(checkMetaMask, 100);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleEthereumInjection);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ethereum#initialized', handleEthereumInjection);
      }
    };
  }, []);

  const sendPayment = useCallback(async (toAddress: string, amount: string, type: 'subscription' | 'tip', creatorName?: string) => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log(`Initiating ${type} payment:`, { toAddress, amount, type, creatorName });
      
      // Validate and normalize addresses before using them
      const validatedCreatorAddress = validateAndNormalizeAddress(toAddress);
      const validatedCustodialAddress = FRIENDSX_CUSTODIAL_WALLET;
      
      console.log('Validated addresses:', {
        creator: validatedCreatorAddress,
        custodial: validatedCustodialAddress
      });
      
      const signer = await provider.getSigner();
      
      // Parse amount with proper precision handling
      let amountInWei: bigint;
      try {
        // Ensure the amount has proper decimal precision
        const normalizedAmount = parseFloat(amount).toFixed(18);
        amountInWei = ethers.parseEther(normalizedAmount);
      } catch (parseError) {
        console.error('Amount parsing error:', parseError);
        throw new Error(`Invalid amount: ${amount}`);
      }
      
      // Calculate FriendsX fee (10%)
      const friendsXFee = amountInWei * BigInt(10) / BigInt(100); // 10%
      const creatorAmount = amountInWei - friendsXFee;
      
      console.log('Payment breakdown:', {
        totalAmount: ethers.formatEther(amountInWei),
        friendsXFee: ethers.formatEther(friendsXFee),
        creatorAmount: ethers.formatEther(creatorAmount)
      });

      // Prepare transactions with validated addresses
      const creatorTransaction = {
        to: validatedCreatorAddress,
        value: creatorAmount,
        gasLimit: BigInt(21000) // Standard gas limit for simple transfers
      };

      const feeTransaction = {
        to: validatedCustodialAddress,
        value: friendsXFee,
        gasLimit: BigInt(21000) // Standard gas limit for simple transfers
      };

      console.log('Sending payment to creator:', creatorTransaction);
      
      // Send payment to creator first
      const creatorTxResponse = await signer.sendTransaction(creatorTransaction);
      console.log('Creator transaction sent:', creatorTxResponse.hash);
      
      // Wait for creator transaction confirmation
      const creatorReceipt = await creatorTxResponse.wait();
      
      if (!creatorReceipt || creatorReceipt.status !== 1) {
        throw new Error('Creator payment failed');
      }

      console.log('Sending fee to FriendsX:', feeTransaction);
      
      // Send fee to FriendsX custodial wallet
      const feeTxResponse = await signer.sendTransaction(feeTransaction);
      console.log('Fee transaction sent:', feeTxResponse.hash);
      
      // Wait for fee transaction confirmation
      const feeReceipt = await feeTxResponse.wait();
      
      if (!feeReceipt || feeReceipt.status !== 1) {
        console.warn('Fee payment failed, but creator payment succeeded');
        // Continue with success since creator was paid
      }

      // Store transaction record
      const transactionRecord = {
        hash: creatorTxResponse.hash,
        feeHash: feeTxResponse.hash,
        type,
        creatorAddress: validatedCreatorAddress,
        creatorName,
        amount: ethers.formatEther(amountInWei),
        creatorAmount: ethers.formatEther(creatorAmount),
        friendsXFee: ethers.formatEther(friendsXFee),
        timestamp: new Date().toISOString(),
        userAddress: account,
        blockNumber: creatorReceipt.blockNumber,
        gasUsed: (creatorReceipt.gasUsed + (feeReceipt?.gasUsed || BigInt(0))).toString(),
        status: 'confirmed'
      };

      // Save to localStorage (in production, this would be saved to backend)
      const transactions = JSON.parse(localStorage.getItem('user_transactions') || '[]');
      transactions.push(transactionRecord);
      localStorage.setItem('user_transactions', JSON.stringify(transactions));

      // Update balance
      await updateBalance(account, provider);
      
      return creatorTxResponse.hash;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.code === 4001) {
        // User rejected transaction - silent handling
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        // Insufficient funds - silent handling
      } else if (error.message?.includes('gas')) {
        // Gas issues - silent handling
      } else if (error.message?.includes('Invalid address')) {
        // Address validation error - silent handling
      } else {
        // Other errors - silent handling
      }
      
      throw error;
    }
  }, [provider, account]);

  const connectWallet = useCallback(async (userType?: 'user' | 'creator') => {
    try {
      // Connecting wallet...
      setIsAuthenticating(true); // Mark as authenticating
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        setIsAuthenticating(false);
        return;
      }

      // Enhanced MetaMask detection
      if (!detectMetaMask()) {
        console.log('MetaMask not detected');
        // Open MetaMask installation page
        window.open('https://metamask.io/download/', '_blank');
        setIsAuthenticating(false);
        return;
      }

        // MetaMask detected, requesting accounts...

      // Create provider with error handling
      let provider: ethers.BrowserProvider;
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
      } catch (providerError) {
        console.error('Error creating provider:', providerError);
        return;
      }

      // Request accounts with timeout and error handling
      let accounts: string[];
      try {
        const requestPromise = window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 30000);
        });

        accounts = await Promise.race([requestPromise, timeoutPromise]) as string[];
      } catch (requestError: any) {
        console.error('Error requesting accounts:', requestError);
        
        if (requestError.code === 4001) {
          // Connection rejected - silent handling
        } else if (requestError.code === -32002) {
          // Connection request pending - silent handling
        } else if (requestError.message?.includes('timeout')) {
          // Connection timeout - silent handling
        } else {
          // Failed to connect - silent handling
        }
        return;
      }

      // Accounts received

      if (!accounts || accounts.length === 0) {
        return;
      }

      const address = accounts[0];
      
      // Validate the connected address
      let validatedAddress: string;
      try {
        validatedAddress = validateAndNormalizeAddress(address);
      } catch (addressError) {
        console.error('Invalid wallet address:', addressError);
        return;
      }
      
      // Get balance with error handling - handle RPC errors silently
      let balanceValue: bigint = BigInt(0);
      try {
        // Add timeout to prevent hanging
        const balancePromise = provider.getBalance(validatedAddress);
        const timeoutPromise = new Promise<bigint>((_, reject) => 
          setTimeout(() => reject(new Error('Balance request timeout')), 5000)
        );
        balanceValue = await Promise.race([balancePromise, timeoutPromise]);
      } catch (balanceError: any) {
        // Handle RPC errors silently - these are common with MetaMask and don't affect functionality
        // Don't log or throw - just set balance to 0
        balanceValue = BigInt(0);
      }
      
      setAccount(validatedAddress);
      setProvider(provider);
      setIsConnected(true);
      setIsAuthenticated(true);
      setBalance(ethers.formatEther(balanceValue));
      
      // Save to localStorage
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('wallet_address', validatedAddress);
      
      // Complete Web3 authentication flow
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
        
        // Step 1: Get nonce from backend
        const nonceResponse = await fetch(`${API_URL}/auth/web3/nonce`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            walletAddress: validatedAddress,
            ...(userType && { userType })  // Include userType if provided
          }),
        });

        if (!nonceResponse.ok) {
          const errorData = await nonceResponse.json().catch(() => ({}));
          console.error('❌ Failed to get nonce:', errorData);
          throw new Error(errorData.message || 'Failed to get nonce');
        }

        const { nonce } = await nonceResponse.json();
        console.log('✅ Nonce received:', nonce);

        // Step 2: Request user to sign message
        const message = `Friendsly Login: ${nonce}`;
        console.log('✍️ Requesting signature for message:', message);
        
        const signer = await provider.getSigner();
        let signature: string;
        try {
          signature = await signer.signMessage(message);
          console.log('✅ Message signed');
        } catch (signError: any) {
          if (signError.code === 4001) {
            console.log('User rejected signature request');
          }
          return; // Exit if user rejects signature
        }

        // Step 3: Login with signature
        console.log('🔐 Logging in with signature...');
        const loginResponse = await fetch(`${API_URL}/auth/web3/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: validatedAddress,
            signature,
            nonce,
          }),
        });

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json().catch(() => ({}));
          console.error('❌ Login failed:', errorData);
          throw new Error(errorData.message || 'Login failed');
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('📦 User data from backend:', loginData.user);

        // Step 4: Save JWT token and user data
        localStorage.setItem('token', loginData.accessToken);
        localStorage.setItem('auth_token', loginData.accessToken);
        
        // Save complete user profile from backend
        localStorage.setItem('user_profile', JSON.stringify(loginData.user));
        
        // Create wallet profile for context
        const walletProfile = {
          ...loginData.user, // Include all backend data
          address: validatedAddress,
          method: 'wallet',
          connectedAt: new Date().toISOString()
        };
        setUserProfile(walletProfile);
        localStorage.setItem('user_data', JSON.stringify(walletProfile));

        console.log('✅ Authentication complete, token saved');
        console.log('✅ Profile data saved:', {
          id: loginData.user.id,
          username: loginData.user.username,
          displayName: loginData.user.displayName,
          avatarUrl: loginData.user.avatarUrl
        });

        // Dispatch custom event to notify Profile page
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        
        // Authentication complete
        setIsAuthenticating(false);
      } catch (dbError) {
        console.error('❌ Error during authentication:', dbError);
        // Disconnect wallet on authentication failure
        disconnectWallet();
        setIsAuthenticating(false);
        return;
      }

      console.log('Wallet connected successfully:', validatedAddress);
      window.location.href = "/feed";
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        // Connection rejected - silent handling
      } else if (error.code === -32002) {
        // Connection request pending - silent handling
      } else if (error.code === -32603) {
        // Internal error - silent handling
      } else if (error.message?.includes('User rejected')) {
        // Connection rejected by user - silent handling
      } else {
        // Failed to connect wallet - silent handling
      }
      setIsAuthenticating(false);
    }
}, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      // Simulate API call with validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation for demo
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Create user session
      const userData = {
        email,
        loginTime: new Date().toISOString(),
        method: 'email'
      };
      
      setIsAuthenticated(true);
      setUserProfile(userData);
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      console.log('Login successful');
      window.location.href = "/feed";

    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, username: string) => {
    try {
      console.log('Attempting signup with:', { email, username, password: '***' });
      
      // Simulate API call with validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation for demo
      if (!email || !password || !username) {
        throw new Error('All fields are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      
      // Create user account
      const userData = {
        email,
        username,
        signupTime: new Date().toISOString(),
        method: 'email'
      };
      
      setIsAuthenticated(true);
      setUserProfile(userData);
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      console.log('Signup successful');
      window.location.href = "/feed";
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserProfile(null);
    
    // Clear authentication data
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    
    // Clear user-specific posts and content
    localStorage.removeItem('user_posts');
    localStorage.removeItem('community_posts');
    
    // Clear PPV purchases (specific to user)
    localStorage.removeItem('purchased_ppv');
    
    // Clear profile views for current user
    const currentUserId = localStorage.getItem('user_profile');
    if (currentUserId) {
      try {
        const profile = JSON.parse(currentUserId);
        if (profile?.id) {
          localStorage.removeItem(`profile_views_${profile.id}`);
          localStorage.removeItem(`liked_posts_${profile.id}`);
          localStorage.removeItem(`bookmarked_posts_${profile.id}`);
          
          // Clear all comments from localStorage (they start with 'comments_')
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('comments_')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (e) {
        // Ignore parsing errors
        console.error("Error during logout:", e);
      }
    }
    
    console.log('🔓 User logged out and session data cleared');
    window.location.replace("/");
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setProvider(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    setUserProfile(null);
    
    // Clear authentication data
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    
    // Clear user-specific posts and content
    localStorage.removeItem('user_posts');
    localStorage.removeItem('community_posts');
    
    // Clear PPV purchases (specific to user)
    localStorage.removeItem('purchased_ppv');
    
    // Clear profile views for current user
    const currentUserId = localStorage.getItem('user_profile');
    if (currentUserId) {
      try {
        const profile = JSON.parse(currentUserId);
        if (profile?.id) {
          localStorage.removeItem(`profile_views_${profile.id}`);
          localStorage.removeItem(`liked_posts_${profile.id}`);
          localStorage.removeItem(`bookmarked_posts_${profile.id}`);
          
          // Clear all comments from localStorage (they start with 'comments_')
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('comments_')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (e) {
        // Ignore parsing errors
        console.error("Error during wallet disconnection:", e);
      }
    }
    
    window.location.replace("/");
  }, []);

  const updateBalance = useCallback(async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (error: any) {
      // Handle RPC errors silently - these are common with MetaMask and don't affect functionality
      // Note: MetaMask may still show RPC errors in console (from inpage.js), but our code handles them silently
      if (error?.code === 'UNKNOWN_ERROR' || 
          error?.message?.includes('missing trie node') || 
          error?.message?.includes('Internal JSON-RPC error') ||
          error?.code === -32603) {
        // Silently set balance to 0 for RPC errors
        setBalance('0.0');
      } else {
        // Only log non-RPC errors
        console.error('Error updating balance:', error);
        setBalance('0.0');
      }
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      try {
        // Initializing authentication state silently
        
        // Check for authentication
        const isAuth = localStorage.getItem('user_authenticated');
        const userData = localStorage.getItem('user_data');
        
        if (isAuth && userData) {
          const parsedUserData = JSON.parse(userData);
          setIsAuthenticated(true);
          setUserProfile(parsedUserData);
          // Restored authentication state silently
          
          // Dispatch custom event to notify Profile page and other components
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        }

        // Check for wallet connection only if MetaMask is available
        if (detectMetaMask() && localStorage.getItem('wallet_connected')) {
          // Checking existing wallet connection silently
          
          // Verify that we have a valid JWT token
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
          if (!token) {
            console.log('⚠️ No JWT token found, wallet connection incomplete');
            // Clear incomplete connection
            localStorage.removeItem('wallet_connected');
            localStorage.removeItem('wallet_address');
            return;
          }
          
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Get accounts without requesting permission
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              
              // Validate the restored address
              let validatedAddress: string;
              try {
                validatedAddress = validateAndNormalizeAddress(address);
              } catch (addressError) {
                console.error('Invalid restored address:', addressError);
                localStorage.removeItem('wallet_connected');
                localStorage.removeItem('wallet_address');
                localStorage.removeItem('token');
                localStorage.removeItem('auth_token');
                return;
              }
              
              setAccount(validatedAddress);
              setProvider(provider);
              setIsConnected(true);
              
              // Update balance
              await updateBalance(validatedAddress, provider);
              
              // Existing wallet connection restored silently
              
              // Dispatch custom event to notify Profile page and other components
              window.dispatchEvent(new CustomEvent('profileUpdated'));
            } else {
              // Clear localStorage if no accounts found
              localStorage.removeItem('wallet_connected');
              localStorage.removeItem('wallet_address');
              localStorage.removeItem('token');
              localStorage.removeItem('auth_token');
            }
          } catch (walletError) {
            console.error('Error restoring wallet connection:', walletError);
            // Clear localStorage on error
            localStorage.removeItem('wallet_connected');
            localStorage.removeItem('wallet_address');
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
        // Clear localStorage on error
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isInitialized, updateBalance]);

  // Set up event listeners for MetaMask
  useEffect(() => {
    if (!detectMetaMask() || !isInitialized) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        try {
          const validatedAddress = validateAndNormalizeAddress(accounts[0]);
          setAccount(validatedAddress);
          localStorage.setItem('wallet_address', validatedAddress);
          // Update balance for new account
          if (provider) {
            updateBalance(validatedAddress, provider);
          }
        } catch (addressError) {
          console.error('Invalid new account address:', addressError);
          disconnectWallet();
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('Chain changed:', chainId);
      // Optionally reload or handle chain change
      window.location.reload();
    };

    const handleConnect = (connectInfo: any) => {
      console.log('MetaMask connected:', connectInfo);
    };

    const handleDisconnect = (error: any) => {
      console.log('MetaMask disconnected:', error);
      disconnectWallet();
    };

    try {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('connect', handleConnect);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    } catch (error) {
      console.error('Error setting up MetaMask event listeners:', error);
    }
  }, [account, provider, disconnectWallet, updateBalance, isInitialized]);

  const value = {
    account,
    balance,
    isConnected,
    isAuthenticated,
    isAuthenticating,
    userProfile,
    connectWallet,
    disconnectWallet,
    provider,
    login,
    signup,
    logout,
    setUserProfile,
    isMetaMaskAvailable,
    sendPayment,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};