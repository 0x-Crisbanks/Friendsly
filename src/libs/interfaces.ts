import { ethers } from 'ethers';

export interface Web3ContextType {
  account: string | null;
  balance: string;
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  userProfile: any;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  provider: ethers.BrowserProvider | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  setUserProfile: (profile: any) => void;
  isMetaMaskAvailable: boolean;
  sendPayment: (toAddress: string, amount: string, type: 'subscription' | 'tip', creatorName?: string) => Promise<string>;
}