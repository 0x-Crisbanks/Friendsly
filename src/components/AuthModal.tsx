import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Wallet, Users, Palette, Calendar, CheckCircle, AlertCircle, FileText, DollarSign, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { updateUserProfile } from '../utils/api';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { connectWallet, login, signup, isMetaMaskAvailable } = useWeb3();
  const [mode, setMode] = useState<'login' | 'signup' | 'user-type' | 'wallet-signup' | 'wallet-login' | 'profile-setup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'user' | 'creator'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [contractSigned, setContractSigned] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    acceptTerms: false,
    // Profile setup fields
    fullName: '',
    displayUsername: '',
    age: '',
    category: '',
    subscriptionPrice: '',
    preferredCrypto: 'ETH',
    confirmAge: false,
  });

  const contentCategories = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'programming', name: 'Programming', icon: '⌨️' },
    { id: 'crypto', name: 'Crypto', icon: '₿' },
    { id: 'nfts', name: 'NFTs', icon: '🖼️' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'fitness', name: 'Fitness and Wellness', icon: '💪' },
    { id: 'fashion', name: 'Fashion and Beauty', icon: '👗' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'art', name: 'Art and Creativity', icon: '🎨' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' },
    { id: 'adult', name: 'Adult Content', icon: '🔞' },
  ];

  const cryptoOptions = [
    { id: 'ETH', name: 'Ethereum (ETH)', icon: '⟠' },
    { id: 'BTC', name: 'Bitcoin (BTC)', icon: '₿' },
    { id: 'USDT', name: 'Tether (USDT)', icon: '₮' },
    { id: 'SOL', name: 'Solana (SOL)', icon: '◎' },
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (mode === 'login') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    if (mode === 'signup') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'Please accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        onClose();
        resetForm();
      } else if (mode === 'signup') {
        await signup(formData.email, formData.password, formData.username);
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrors({ general: error.message || 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const signLoginContract = async () => {
    try {
      if (!isMetaMaskAvailable) {
        throw new Error('MetaMask not found or not properly installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create the login contract message
      const loginContractMessage = `
FriendsX Login Authentication

By signing this message, you confirm:
- You are the owner of this wallet
- You agree to our Terms of Service
- You accept our Privacy Policy
- You authorize this login session

Login Type: Wallet Authentication
Timestamp: ${new Date().toISOString()}
Session ID: ${Math.random().toString(36).substring(7)}
      `.trim();

      console.log('Requesting signature for login contract...');
      
      // Request signature from user
      const signature = await signer.signMessage(loginContractMessage);
      
      console.log('Login contract signed successfully:', signature);
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(loginContractMessage, signature);
      console.log('Login signature verified, recovered address:', recoveredAddress);
      
      // Store login contract signature
      localStorage.setItem('login_contract_signature', JSON.stringify({
        message: loginContractMessage,
        signature,
        timestamp: new Date().toISOString(),
        sessionId: Math.random().toString(36).substring(7)
      }));
      
      setContractSigned(true);
      toast.success('Login contract signed successfully!');
      
      return true;
    } catch (error: any) {
      console.error('Login contract signing error:', error);
      
      if (error.code === 4001) {
        toast.error('Login contract signing rejected. Please sign to continue.');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Login contract signing was cancelled.');
      } else if (error.message?.includes('MetaMask not found')) {
        toast.error('MetaMask is not properly installed. Please install MetaMask and refresh the page.');
      } else {
        toast.error('Failed to sign login contract. Please try again.');
      }
      
      throw error;
    }
  };

  const signSmartContract = async () => {
    try {
      if (!isMetaMaskAvailable) {
        throw new Error('MetaMask not found or not properly installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create the contract message to sign
      const contractMessage = `
Welcome to FriendsX!

By signing this message, you agree to:
- Create a ${userType} account on FriendsX
- Accept our Terms of Service
- Accept our Privacy Policy
- Use the platform responsibly

Account Type: ${userType.charAt(0).toUpperCase() + userType.slice(1)}
Timestamp: ${new Date().toISOString()}
Nonce: ${Math.random().toString(36).substring(7)}
      `.trim();

      console.log('Requesting signature for contract...');
      
      // Request signature from user
      const signature = await signer.signMessage(contractMessage);
      
      console.log('Contract signed successfully:', signature);
      
      // Verify the signature using ethers.js v6 API
      const recoveredAddress = ethers.verifyMessage(contractMessage, signature);
      console.log('Signature verified, recovered address:', recoveredAddress);
      
      // Store contract signature
      localStorage.setItem('contract_signature', JSON.stringify({
        message: contractMessage,
        signature,
        userType,
        timestamp: new Date().toISOString()
      }));
      
      setContractSigned(true);
      toast.success('Smart contract signed successfully!');
      
      return true;
    } catch (error: any) {
      console.error('Contract signing error:', error);
      
      if (error.code === 4001) {
        toast.error('Contract signing rejected. Please sign the contract to continue.');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Contract signing was cancelled.');
      } else if (error.message?.includes('MetaMask not found')) {
        toast.error('MetaMask is not properly installed. Please install MetaMask and refresh the page.');
      } else {
        toast.error('Failed to sign contract. Please try again.');
      }
      
      throw error;
    }
  };

  const handleWalletSignup = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      // Check if MetaMask is available
      if (!isMetaMaskAvailable) {
        toast.error('MetaMask is not installed or not properly detected. Please install MetaMask first.');
        window.open('https://metamask.io/download/', '_blank');
        setIsLoading(false);
        return;
      }

      console.log('Starting wallet signup process...');
      
      // Use the Web3Context connectWallet function which handles the complete authentication flow
      toast('Connecting wallet and signing message...');
      await connectWallet(userType); // Pass userType to connect wallet
      
      // Check if profile is already complete
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        // Check if profile has displayName or fullName (profile is complete)
        if (profile.displayName || profile.fullName) {
          console.log('✅ Profile already complete, closing modal');
          toast.success('Welcome back! Your profile is already set up.');
          onClose();
          return;
        }
      }
      
      // If profile not complete, move to profile setup
      toast.success('Wallet connected! Complete your profile to finish setup.');
      setMode('profile-setup');
      
    } catch (error: any) {
      console.error('Wallet signup error:', error);
      setErrors({ general: 'Failed to complete wallet signup. Please try again.' });
      
      // Reset states on error
      setWalletConnected(false);
      setContractSigned(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      // Check if MetaMask is available
      if (!isMetaMaskAvailable) {
        toast.error('MetaMask is not installed or not properly detected. Please install MetaMask first.');
        window.open('https://metamask.io/download/', '_blank');
        setIsLoading(false);
        return;
      }

      console.log('Starting wallet login process...');
      
      // Use the Web3Context connectWallet function which handles the complete authentication flow
      toast('Connecting wallet and signing message...');
      await connectWallet();
      
      toast.success('Login successful!');
      onClose();
      resetForm();
      
    } catch (error: any) {
      console.error('Wallet login error:', error);
      
      if (error.message?.includes('User rejected')) {
        setErrors({ general: 'Login was cancelled. Please try again.' });
      } else if (error.message?.includes('MetaMask not found')) {
        setErrors({ general: 'MetaMask is not properly installed. Please install MetaMask and refresh the page.' });
      } else {
        setErrors({ general: 'Failed to complete wallet login. Please try again.' });
      }
      
      // Reset states on error
      setWalletConnected(false);
      setContractSigned(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }
    if (!formData.displayUsername.trim()) {
      newErrors.displayUsername = 'Please enter a username';
    }
    if (!formData.age || parseInt(formData.age) < 13) {
      newErrors.age = 'You must be at least 13 years old';
    }

    // Creator-specific validations
    if (userType === 'creator') {
      if (!formData.category) {
        newErrors.category = 'Please select a content category';
      }
      if (!formData.subscriptionPrice || parseFloat(formData.subscriptionPrice) <= 0) {
        newErrors.subscriptionPrice = 'Please enter a valid subscription price';
      }
      if (!formData.confirmAge) {
        newErrors.confirmAge = 'Please confirm you are 18 years or older';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Get existing user profile to preserve ID and other backend data
      const existingProfile = localStorage.getItem('user_profile');
      const existingData = existingProfile ? JSON.parse(existingProfile) : {};
      
      // Merge with form data, preserving important fields like ID
      const updatedProfile = {
        ...existingData, // Preserve existing data (especially ID)
        fullName: formData.fullName,
        username: formData.displayUsername,
        displayName: formData.fullName, // Add displayName for consistency
        age: formData.age,
        userType: userType,
        category: formData.category,
        subscriptionPrice: formData.subscriptionPrice,
        preferredCrypto: formData.preferredCrypto,
        contractSigned: contractSigned,
        walletConnected: walletConnected,
      };
      
      // Save updated profile to localStorage
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      
      console.log('✅ Profile updated locally, user ID preserved:', updatedProfile.id);
      
      // Update profile in backend if user ID exists
      if (updatedProfile.id) {
        try {
          console.log('📤 Updating profile in backend...');
          console.log('   User ID:', updatedProfile.id);
          console.log('   Display Name:', formData.fullName);
          console.log('   Username:', formData.displayUsername);
          
          await updateUserProfile(updatedProfile.id, {
            displayName: formData.fullName, // Use displayName instead of fullName
            username: formData.displayUsername,
            bio: `${userType === 'creator' ? 'Creator' : 'User'} in ${formData.category || 'general'} category`,
          });
          
          console.log('✅ Profile updated in backend successfully');
          
          // Fetch the updated profile from backend to ensure consistency
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
          if (token) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
            const response = await fetch(`${API_URL}/users/${updatedProfile.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              const backendUser = await response.json();
              // Update localStorage with backend data
              localStorage.setItem('user_profile', JSON.stringify(backendUser));
              console.log('✅ Profile synced with backend');
              
              // Dispatch custom event to notify Profile page
              window.dispatchEvent(new CustomEvent('profileUpdated'));
            }
          }
        } catch (backendError: any) {
          console.error('❌ Failed to update backend profile:', backendError);
          console.error('   Error details:', backendError.message);
          // Show error to user
          toast.error('Failed to save profile to server. Please try again.');
          throw backendError; // Don't continue if backend update fails
        }
      } else {
        console.error('❌ No user ID found, cannot save to backend');
        toast.error('User ID not found. Please reconnect your wallet.');
        throw new Error('No user ID found');
      }
      
      toast.success('Profile created successfully!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to create profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      acceptTerms: false,
      fullName: '',
      displayUsername: '',
      age: '',
      category: '',
      subscriptionPrice: '',
      preferredCrypto: 'ETH',
      confirmAge: false,
    });
    setErrors({});
    setMode(initialMode);
    setContractSigned(false);
    setWalletConnected(false);
  };

  // MetaMask SVG Logo Component
  const MetaMaskLogo = () => (
    <svg width="20" height="20" viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          {`.cls-1{fill:#e2761b;stroke:#e2761b;stroke-linecap:round;stroke-linejoin:round;}.cls-2{fill:#e4761b;stroke:#e4761b;stroke-linecap:round;stroke-linejoin:round;}.cls-3{fill:#d7c1b3;stroke:#d7c1b3;stroke-linecap:round;stroke-linejoin:round;}.cls-4{fill:#233447;stroke:#233447;stroke-linecap:round;stroke-linejoin:round;}.cls-5{fill:#cd6116;stroke:#cd6116;stroke-linecap:round;stroke-linejoin:round;}.cls-6{fill:#e4751f;stroke:#e4751f;stroke-linecap:round;stroke-linejoin:round;}.cls-7{fill:#f6851b;stroke:#f6851b;stroke-linecap:round;stroke-linejoin:round;}.cls-8{fill:#c0ad9e;stroke:#c0ad9e;stroke-linecap:round;stroke-linejoin:round;}.cls-9{fill:#161616;stroke:#161616;stroke-linecap:round;stroke-linejoin:round;}.cls-10{fill:#763d16;stroke:#763d16;stroke-linecap:round;stroke-linejoin:round;}`}
        </style>
      </defs>
      <polygon className="cls-1" points="274.1,35.5 174.6,109.4 193,65.8 274.1,35.5"/>
      <polygon className="cls-1" points="44.4,35.5 143.1,110.1 125.6,65.8 44.4,35.5"/>
      <polygon className="cls-1" points="238.3,206.8 211.8,247.4 268.5,262.6 284.8,207.7 238.3,206.8"/>
      <polygon className="cls-1" points="33.9,207.7 50.1,262.6 106.8,247.4 80.3,206.8 33.9,207.7"/>
      <polygon className="cls-1" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1 103.6,138.2"/>
      <polygon className="cls-1" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1 214.9,138.2"/>
      <polygon className="cls-1" points="106.8,247.4 140.6,230.9 111.4,208.1 106.8,247.4"/>
      <polygon className="cls-1" points="177.9,230.9 211.8,247.4 207.1,208.1 177.9,230.9"/>
      <polygon className="cls-2" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3 211.8,247.4"/>
      <polygon className="cls-2" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9 106.8,247.4"/>
      <polygon className="cls-3" points="138.8,193.5 110.6,185.2 130.5,176.1 138.8,193.5"/>
      <polygon className="cls-3" points="179.7,193.5 188,176.1 208,185.2 179.7,193.5"/>
      <polygon className="cls-4" points="106.8,247.4 111.6,206.8 80.3,207.7 106.8,247.4"/>
      <polygon className="cls-4" points="207,206.8 211.8,247.4 238.3,207.7 207,206.8"/>
      <polygon className="cls-4" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2 230.8,162.1"/>
      <polygon className="cls-4" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1 110.6,185.2"/>
      <polygon className="cls-5" points="87.8,162.1 111.4,208.1 110.6,185.2 87.8,162.1"/>
      <polygon className="cls-5" points="208.1,185.2 207.1,208.1 230.8,162.1 208.1,185.2"/>
      <polygon className="cls-5" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7 144.1,164.6"/>
      <polygon className="cls-5" points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5 174.6,164.6"/>
      <polygon className="cls-6" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2 179.8,193.5"/>
      <polygon className="cls-6" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5 110.6,185.2"/>
      <polygon className="cls-7" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4 180.3,262.3"/>
      <polygon className="cls-8" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253 177.9,230.9"/>
      <polygon className="cls-9" points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2 278.3,114.2"/>
      <polygon className="cls-9" points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5 31.8,73.4"/>
      <polygon className="cls-10" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7 267.2,153.5"/>
      <polygon className="cls-10" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1 103.6,138.2"/>
      <polygon className="cls-10" points="174.6,164.6 177.9,106.9 193,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8 174.6,164.6"/>
    </svg>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary-500/10 to-secondary-500/10 p-6 border-b border-gray-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'user-type' && 'Choose Account Type'}
                    {mode === 'wallet-signup' && 'Connect Wallet'}
                    {mode === 'wallet-login' && 'Wallet Login'}
                    {mode === 'profile-setup' && 'Complete Profile'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {mode === 'login' && 'Sign in to your account'}
                    {mode === 'signup' && 'Join the FriendsX community'}
                    {mode === 'user-type' && 'How would you like to use FriendsX?'}
                    {mode === 'wallet-signup' && 'Connect your Web3 wallet'}
                    {mode === 'wallet-login' && 'Sign contract to authenticate'}
                    {mode === 'profile-setup' && 'Tell us about yourself'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* General Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{errors.general}</span>
                </div>
              )}

              {/* User Type Selection */}
              {mode === 'user-type' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <button
                      onClick={() => setUserType('user')}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        userType === 'user'
                          ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-semibold">User</h3>
                          <p className="text-gray-400 text-sm">
                            Discover and support amazing creators
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setUserType('creator')}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        userType === 'creator'
                          ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-semibold">Creator</h3>
                          <p className="text-gray-400 text-sm">
                            Share content and earn from your audience
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setMode('signup')}
                      className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                      Continue with Email
                    </button>
                    
                    <button
                      onClick={() => setMode('wallet-signup')}
                      disabled={!isMetaMaskAvailable}
                      className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <MetaMaskLogo />
                      <span>{isMetaMaskAvailable ? 'Sign Up with MetaMask' : 'Install MetaMask First'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet Signup */}
              {mode === 'wallet-signup' && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Wallet className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-400">
                      Connect your wallet and sign the smart contract to create your {userType} account
                    </p>
                  </div>

                  {!isMetaMaskAvailable && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-yellow-400 text-sm">
                        MetaMask is not detected. Please install MetaMask to continue.
                      </p>
                      <button
                        onClick={() => window.open('https://metamask.io/download/', '_blank')}
                        className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        Install MetaMask
                      </button>
                    </div>
                  )}

                  {/* Progress Steps */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-3">Setup Progress:</h4>
                    <div className="space-y-2 text-left">
                      <div className={`flex items-center space-x-2 ${walletConnected ? 'text-green-400' : 'text-gray-400'}`}>
                        {walletConnected ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-400 rounded-full"></div>}
                        <span className="text-sm">Connect Web3 wallet</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${contractSigned ? 'text-green-400' : 'text-gray-400'}`}>
                        {contractSigned ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span className="text-sm">Sign smart contract</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Complete profile setup</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Start using the platform!</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWalletSignup}
                    disabled={isLoading || !isMetaMaskAvailable}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          {!walletConnected ? 'Connecting Wallet...' : 
                           !contractSigned ? 'Waiting for Signature...' : 
                           'Processing...'}
                        </span>
                      </div>
                    ) : (
                      !walletConnected ? 'Connect Wallet' :
                      !contractSigned ? 'Sign Contract' :
                      'Continue to Profile'
                    )}
                  </button>

                  <button
                    onClick={() => setMode('user-type')}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ← Back to account type
                  </button>
                </div>
              )}

              {/* Wallet Login */}
              {mode === 'wallet-login' && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Wallet className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Wallet Login
                    </h3>
                    <p className="text-gray-400">
                      Connect your wallet and sign the login contract to authenticate
                    </p>
                  </div>

                  {!isMetaMaskAvailable && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-yellow-400 text-sm">
                        MetaMask is not detected. Please install MetaMask to continue.
                      </p>
                      <button
                        onClick={() => window.open('https://metamask.io/download/', '_blank')}
                        className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        Install MetaMask
                      </button>
                    </div>
                  )}

                  {/* Progress Steps */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-3">Login Progress:</h4>
                    <div className="space-y-2 text-left">
                      <div className={`flex items-center space-x-2 ${walletConnected ? 'text-green-400' : 'text-gray-400'}`}>
                        {walletConnected ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-400 rounded-full"></div>}
                        <span className="text-sm">Connect Web3 wallet</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${contractSigned ? 'text-green-400' : 'text-gray-400'}`}>
                        {contractSigned ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span className="text-sm">Sign login contract</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Access your account</span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Preview */}
                  {walletConnected && !contractSigned && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm font-medium">Login Contract Preview</span>
                      </div>
                      <div className="text-left text-xs text-gray-300 bg-gray-800/50 rounded p-3 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
{`FriendsX Login Authentication

By signing this message, you confirm:
- You are the owner of this wallet
- You agree to our Terms of Service
- You accept our Privacy Policy
- You authorize this login session

Login Type: Wallet Authentication
Timestamp: ${new Date().toISOString()}
Session ID: ${Math.random().toString(36).substring(7)}`}
                        </pre>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleWalletLogin}
                    disabled={isLoading || !isMetaMaskAvailable}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          {!walletConnected ? 'Connecting Wallet...' : 
                           !contractSigned ? 'Waiting for Signature...' : 
                           'Logging in...'}
                        </span>
                      </div>
                    ) : (
                      !walletConnected ? 'Connect Wallet' :
                      !contractSigned ? 'Sign Login Contract' :
                      'Complete Login'
                    )}
                  </button>

                  <button
                    onClick={() => setMode('login')}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ← Back to login options
                  </button>
                </div>
              )}

              {/* Profile Setup */}
              {mode === 'profile-setup' && (
                <form onSubmit={handleProfileSetup} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-300">
                      Complete your profile to finish setting up your {userType} account
                    </p>
                    {contractSigned && (
                      <div className="mt-2 flex items-center justify-center space-x-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Smart contract signed</span>
                      </div>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                        errors.fullName ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        required
                        value={formData.displayUsername}
                        onChange={(e) => handleInputChange('displayUsername', e.target.value)}
                        className={`w-full pl-8 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                          errors.displayUsername ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="your_username"
                      />
                    </div>
                    {errors.displayUsername && (
                      <p className="text-red-400 text-sm mt-1">{errors.displayUsername}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        required
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                          errors.age ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your age"
                      />
                    </div>
                    {errors.age && (
                      <p className="text-red-400 text-sm mt-1">{errors.age}</p>
                    )}
                  </div>

                  {/* Creator-specific fields */}
                  {userType === 'creator' && (
                    <>
                      {/* Content Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Content Category *
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {contentCategories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => handleInputChange('category', category.id)}
                              className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 text-left ${
                                formData.category === category.id
                                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                                  : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/30'
                              }`}
                            >
                              <span className="text-lg">{category.icon}</span>
                              <span className="text-sm font-medium">{category.name}</span>
                            </button>
                          ))}
                        </div>
                        {errors.category && (
                          <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                        )}
                      </div>

                      {/* Subscription Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Subscription Price (USD/month) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            value={formData.subscriptionPrice}
                            onChange={(e) => handleInputChange('subscriptionPrice', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                              errors.subscriptionPrice ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="19.99"
                          />
                        </div>
                        {errors.subscriptionPrice && (
                          <p className="text-red-400 text-sm mt-1">{errors.subscriptionPrice}</p>
                        )}
                      </div>

                      {/* Preferred Cryptocurrency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Preferred Cryptocurrency for Payments
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {cryptoOptions.map((crypto) => (
                            <button
                              key={crypto.id}
                              type="button"
                              onClick={() => handleInputChange('preferredCrypto', crypto.id)}
                              className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                                formData.preferredCrypto === crypto.id
                                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                                  : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/30'
                              }`}
                            >
                              <span className="text-lg">{crypto.icon}</span>
                              <div className="text-left">
                                <div className="text-sm font-medium">{crypto.id}</div>
                                <div className="text-xs opacity-75">{crypto.name.split(' ')[0]}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age Confirmation for Creators */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="confirmAge"
                          checked={formData.confirmAge}
                          onChange={(e) => handleInputChange('confirmAge', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-500 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <label htmlFor="confirmAge" className="text-sm text-gray-300">
                          I confirm that I am 18 years or older and eligible to create content on this platform *
                        </label>
                      </div>
                      {errors.confirmAge && (
                        <p className="text-red-400 text-sm">{errors.confirmAge}</p>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Profile...</span>
                      </div>
                    ) : (
                      'Complete Setup'
                    )}
                  </button>
                </form>
              )}

              {/* Login/Signup Forms */}
              {(mode === 'login' || mode === 'signup') && (
                <>
                  {/* Mode Toggle */}
                  <div className="flex space-x-1 bg-gray-700/30 rounded-xl p-1 mb-6">
                    <button
                      onClick={() => {
                        setMode('login');
                        resetForm();
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        mode === 'login'
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setMode('user-type')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        mode === 'signup'
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                            errors.email ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Username (only for signup) */}
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Username
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                              errors.username ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="Choose a username"
                          />
                        </div>
                        {errors.username && (
                          <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                        )}
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                            errors.password ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password (only for signup) */}
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                              errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="Confirm your password"
                          />
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>
                    )}

                    {/* Terms and Conditions (only for signup) */}
                    {mode === 'signup' && (
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-500 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-gray-300">
                          I agree to the{' '}
                          <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                    )}
                    {errors.acceptTerms && (
                      <p className="text-red-400 text-sm">{errors.acceptTerms}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        mode === 'login' ? 'Sign In' : 'Create Account'
                      )}
                    </button>
                  </form>

                  {/* Forgot Password (only for login) */}
                  {mode === 'login' && (
                    <div className="mt-4 text-center">
                      <a href="#" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                        Forgot your password?
                      </a>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <span className="px-4 text-gray-400 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-700"></div>
                  </div>

                  {/* Connect Wallet Button */}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'wallet-login' : 'wallet-signup')}
                    disabled={isLoading || !isMetaMaskAvailable}
                    className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <MetaMaskLogo />
                    <span>
                      {!isMetaMaskAvailable ? 'Install MetaMask First' : 
                       mode === 'login' ? 'Login with MetaMask' : 'Sign Up with MetaMask'}
                    </span>
                  </button>

                  {!isMetaMaskAvailable && (
                    <p className="text-center text-gray-400 text-sm mt-2">
                      <button
                        onClick={() => window.open('https://metamask.io/download/', '_blank')}
                        className="text-primary-400 hover:text-primary-300 underline transition-colors"
                      >
                        Install MetaMask
                      </button>{' '}
                      to connect your wallet
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;