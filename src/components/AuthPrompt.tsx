import { useState } from 'react';
import { Wallet, Users, Shield, Zap, Sparkles, ArrowRight, Star, Globe, Lock, TrendingUp, Crown, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';

const AuthPrompt = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with blockchain technology',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      delay: 0.1,
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Receive crypto payments directly from fans',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/10 to-orange-500/10',
      delay: 0.2,
    },
    {
      icon: Users,
      title: 'Direct Connection',
      description: 'Connect with your audience without intermediaries',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      delay: 0.3,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Creators', icon: Users },
    { value: '$2.5M+', label: 'Creator Earnings', icon: TrendingUp },
    { value: '500K+', label: 'Global Users', icon: Globe },
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-6 xl:px-8 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Gradient Orbs - Responsive sizes */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px] bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl"></div>
        
        {/* Floating Elements - Responsive positioning */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-10 sm:top-16 lg:top-20 left-4 sm:left-8 lg:left-20 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-primary-500/30 rounded-2xl blur-sm"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-10 sm:bottom-16 lg:bottom-20 right-4 sm:right-8 lg:right-20 w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-secondary-500/30 rounded-full blur-sm"
        />
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/3 right-1/4 w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-yellow-500/30 rounded-xl blur-sm"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center"
        >
          {/* Enhanced Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mb-8 sm:mb-10 lg:mb-12"
          >
            {/* Logo Container with Enhanced Effects */}
            <div className="relative inline-block">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur-2xl opacity-30 scale-150"></div>
              
              {/* Main Logo - Responsive sizes */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                <img 
                  src="/assets/favicon.png" 
                  alt="Friendsly Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                />
                
                {/* Sparkle Effects - Responsive positioning */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2"
                >
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            {/* Premium Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full text-primary-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Premium Creator Platform</span>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>

            {/* Main Title - Responsive typography */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              Welcome to
              <span className="block bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent mt-1 sm:mt-2">
                Friendsly
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Join the <span className="text-primary-400 font-semibold">decentralized creator economy</span>. 
              Connect your wallet or create an account to start earning crypto from your content.
            </p>
          </motion.div>

          {/* Enhanced Auth Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-14 lg:mb-16 px-4 sm:px-0"
          >
            <button
              onClick={() => handleAuthClick('signup')}
              className="group relative overflow-hidden w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl sm:rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105"
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center justify-center space-x-2 sm:space-x-3">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            <button
              onClick={() => handleAuthClick('login')}
              className="group w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 border-2 border-gray-600 text-gray-300 rounded-xl sm:rounded-2xl hover:border-primary-500 hover:text-white hover:bg-primary-500/10 transition-all duration-300 text-base sm:text-lg font-semibold backdrop-blur-sm"
            >
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Sign In</span>
              </div>
            </button>
          </motion.div>

          {/* Enhanced Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-14 lg:mb-16 px-4 sm:px-0"
          >
            {features.map((feature, index) => (
              <motion.div
                key={`${index}-${feature.title}`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: feature.delay + 0.8,
                  ease: "easeOut"
                }}
                className="group relative"
              >
                {/* Card Container */}
                <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:scale-105 overflow-hidden">
                  
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    {/* Enhanced Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r ${feature.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-secondary-400 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Subtle Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-2xl sm:rounded-3xl`}></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-14 lg:mb-16 px-4 sm:px-0"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 1.4 + index * 0.1,
                  ease: "easeOut"
                }}
                className="group text-center"
              >
                <div className="relative bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-primary-500/30 transition-all duration-300 group-hover:scale-105">
                  {/* Icon */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  
                  {/* Value */}
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 group-hover:text-primary-400 transition-colors duration-300">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Wallet Connection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-center px-4 sm:px-0"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-gray-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Secure Web3 Authentication</span>
            </div>
            
            <p className="text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">Already have a Web3 wallet?</p>
            
            <button
              onClick={() => handleAuthClick('login')}
              className="group inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur-xl border-2 border-white/10 text-gray-300 rounded-xl sm:rounded-2xl hover:border-primary-500/50 hover:text-white hover:bg-primary-500/10 transition-all duration-300 text-sm sm:text-base lg:text-lg"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Connect Wallet</div>
                <div className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400">MetaMask, WalletConnect & more</div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-14 lg:mt-16 pt-6 sm:pt-8 border-t border-white/10"
          >
            <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span>Decentralized</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span>Instant Payments</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span>Global Access</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default AuthPrompt;