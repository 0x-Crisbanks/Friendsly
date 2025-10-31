import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, Zap, LogOut, Reply, Crown, Mail, Bell, Heart,
  MessageCircle, UserPlus, TrendingUp
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useNotifications } from '../context/NotificationsContext';
import { useMessages } from '../context/MessagesContext';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import navbarMenuData from '../data/navbarMenu';

const Navbar = () => {
  const {
    account, balance, isConnected, isAuthenticated, isAuthenticating,
    userProfile, disconnectWallet, logout
  } = useWeb3();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { totalUnreadCount } = useMessages();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
  );

  const dynamicNavbarMenu = useMemo(() => {
    let menu = navbarMenuData.filter(item => item.active && item.mainMenu);

    if (isAuthenticated) {
      return menu.map(item => {
        if (item.name === 'Home') {
          return {
            ...item,
            name: 'Feed',
            href: '/feed',
            icon: TrendingUp,
          };
        }
        return item;
      });
    } else {
      return menu.filter(item => item.name !== 'Feed');
    }
  }, [isAuthenticated]);

  const logoHref = isAuthenticated ? '/feed' : '/';

  // Load user avatar
  useEffect(() => {
    const loadUserAvatar = () => {
      try {
        const storedProfile = localStorage.getItem('user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.avatarUrl) {
            setCurrentUserAvatar(profile.avatarUrl);
          }
        } else if (userProfile?.avatarUrl) {
          setCurrentUserAvatar(userProfile.avatarUrl);
        }
      } catch (error) {
        console.error('Error loading user avatar:', error);
      }
    };

    loadUserAvatar();
    const handleProfileUpdate = () => loadUserAvatar();
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [userProfile]);

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-dropdown') && !target.closest('.notifications-button')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutsideUserMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-dropdown') && !target.closest('.user-menu-button')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideUserMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideUserMenu);
  }, [showUserMenu]);

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    if (isConnected) disconnectWallet();
    else logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-400" fill="currentColor" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'reply': return <Reply className="w-4 h-4 text-blue-400" />;
      case 'subscribe': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'trending': return <TrendingUp className="w-4 h-4 text-primary-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-2xl border-b border-gray-800/30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-secondary-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            <Link to={logoHref} className="group flex items-center relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center transition-all duration-300">
                <img
                  src="/assets/logo-white.png"
                  alt="Friendsly"
                  className="h-10 sm:h-12 lg:h-14 w-auto group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              {dynamicNavbarMenu.map((item) => {
                if (item.name.toLowerCase() === 'messages') return null;

                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`group relative flex items-center space-x-2 px-3 xl:px-4 py-2.5 rounded-xl transition-all duration-300 text-sm xl:text-base font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-400 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl blur-sm"></div>
                    )}
                    <div className={`relative ${isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'} transition-colors duration-300`}>
                      <Icon className="w-4 h-4 xl:w-5 xl:h-5" />
                      {isActive && <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-md"></div>}
                    </div>
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth / Wallet Section */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAuthenticated && (
                <>
                  <Link
                    to="/messages"
                    className="relative group hidden lg:flex items-center justify-center w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Mail className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors duration-300 relative z-10" />
                    {totalUnreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{totalUnreadCount}</span>
                      </div>
                    )}
                  </Link>

                  <div className="relative hidden lg:block">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="notifications-button group flex items-center justify-center w-11 h-11 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Bell className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors duration-300 relative z-10" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{unreadCount}</span>
                        </div>
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="notifications-dropdown absolute right-0 mt-4 w-96 bg-gray-800/95 backdrop-blur-2xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
                        >
                          <div className="relative p-4 sm:p-5 border-b border-gray-700/50 bg-gradient-to-r from-primary-500/10 to-secondary-500/15">
                            <h3 className="text-white font-bold text-lg">Notifications</h3>
                          </div>
                          <div className="max-h-[500px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No notifications yet</p>
                              </div>
                              ) : (
                                notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  onClick={() => markAsRead(notification.id)}
                                  className={`p-4 border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-primary-500/5' : ''
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                        {getNotificationIcon(notification.type)}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start space-x-2">
                                        <img
                                          src={notification.user.avatar}
                                          alt={notification.user.name}
                                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm">
                                            <span className="font-semibold text-white">{notification.user.name}</span>
                                            <span className="text-gray-400"> {notification.action}</span>
                                          </div>
                                          {notification.content && (
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{notification.content}</p>
                                          )}
                                          <span className="text-gray-500 text-xs mt-1 block">{notification.timestamp}</span>
                                        </div>
                                        {!notification.read && (
                                          <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-700/50 bg-gray-800/30 flex items-center justify-between gap-2">
                              {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="flex-1 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors py-2 px-3 rounded-lg hover:bg-white/5">
                                  Mark all as read
                                </button>
                              )}
                              <Link to="/notifications" className="flex-1 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors py-2 px-3 rounded-lg hover:bg-white/5 text-center" onClick={() => setShowNotifications(false)}>
                                View all
                              </Link>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* User Menu / Auth Buttons */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="user-menu-button group flex items-center space-x-2 sm:space-x-3 pl-1 pr-2 py-[.1rem] rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {isConnected ? (
                      <>
                        <div className="hidden sm:block text-left relative z-10">
                          <div className="text-xs sm:text-sm text-white font-medium">{formatAddress(account!)}</div>
                          <div className="text-xs text-primary-400 font-semibold">{parseFloat(balance).toFixed(4)} ETH</div>
                        </div>
                        <div className="relative">
                          <img src={currentUserAvatar} alt="User avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-primary-500 group-hover:scale-105 transition-transform duration-300 shadow-lg" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="hidden sm:block text-left relative z-10">
                          <div className="text-xs sm:text-sm text-white font-medium">
                            {isAuthenticating ? 'Authenticating...' : (userProfile?.email || 'User')}
                          </div>
                          <div className="text-xs text-green-400 font-semibold">Email Account</div>
                        </div>
                        <div className="relative">
                          <img src={currentUserAvatar} alt="User avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-green-500 group-hover:scale-105 transition-transform duration-300 shadow-lg" />
                          {userProfile?.isCreator && userProfile?.role?.toLowerCase() === 'creator' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                              <Crown className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {showUserMenu && isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="user-menu-dropdown absolute right-0 mt-2.5 w-64 sm:w-72 bg-gray-800/95 backdrop-blur-2xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
                      >
                        <div className="relative p-4 sm:p-5 border-b border-gray-700/50 bg-gradient-to-r from-primary-500/10 to-secondary-500/15">
                          <div className="flex items-center space-x-3">
                            <img
                              src={currentUserAvatar}
                              alt="User avatar"
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-lg border-2 ${isConnected ? 'border-primary-500' : 'border-green-500'}`}
                            />
                            <div className="flex-1">
                              <div className="text-white font-semibold text-sm sm:text-base">
                                {isAuthenticating ? 'Authenticating...' : isConnected ? formatAddress(account!) : userProfile?.email || 'User'}
                              </div>
                              <div className="text-gray-400 text-xs sm:text-sm">
                                {isAuthenticating ? 'Please wait...' : isConnected ? `${parseFloat(balance).toFixed(4)} ETH` : 'Email Account'}
                              </div>
                              {userProfile?.isCreator && userProfile?.role?.toLowerCase() === 'creator' && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Crown className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-400 text-xs font-medium">Creator</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          {navbarMenuData
                            .filter((item) => item.active && item.userMenu && (item.name.toLowerCase() !== 'earnings' || (userProfile?.isCreator && userProfile?.role?.toLowerCase() === 'creator')))
                            .map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.id}
                                  to={item.href}
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 text-sm group"
                                >
                                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span>{item.name}</span>
                                  {item.name.toLowerCase() === 'earnings' && userProfile?.isCreator && userProfile?.role?.toLowerCase() === 'creator' && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                                  )}
                                </Link>
                              );
                            })}
                        </div>

                        <div className="p-2 border-t border-gray-700/50">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm group"
                          >
                            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span>{isConnected ? 'Disconnect Wallet' : 'Sign Out'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="hidden sm:flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all duration-300 text-sm font-medium"
                  >
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="group relative overflow-hidden flex items-center space-x-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base font-semibold"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Sign Up</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 text-gray-300 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
              >
                <motion.div animate={{ rotate: isMobileMenuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-gray-900/98 backdrop-blur-2xl border-t border-gray-800/50"
            >
              <div className="px-3 sm:px-4 py-3 space-y-1">
                {dynamicNavbarMenu.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-400 border border-primary-500/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20' : 'bg-gray-700/30'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-base">{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}

                {!isAuthenticated && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="pt-4 border-t border-gray-700/50 space-y-3">
                    <button onClick={() => { handleAuthClick('login'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all duration-300 font-medium">
                      Sign In
                    </button>
                    <button onClick={() => { handleAuthClick('signup'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 font-semibold shadow-lg">
                      Sign Up
                    </button>
                  </motion.div>
                )}

                {isAuthenticated && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }} className="pt-4 border-t border-gray-700/50">
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all duration-300 font-medium">
                      <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span>{isConnected ? 'Disconnect Wallet' : 'Sign Out'}</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />

      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
    </>
  );
};

export default Navbar;