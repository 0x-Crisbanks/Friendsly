import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, CreditCard, User, Moon, Sun, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { SupportedCrypto, CRYPTO_ICONS, CRYPTO_SYMBOLS } from '../utils/priceConverter';
import toast from 'react-hot-toast';
import { updateCreatorSubscriptionPrice } from '../utils/api';

const Settings = () => {
  const { account, isConnected } = useWeb3();
  const [activeSection, setActiveSection] = useState('profile');
  
  // Determine if user is a creator
  const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  const isCreator = userProfile?.isCreator === true || 
                    userProfile?.role?.toLowerCase() === 'creator' || 
                    userProfile?.userType?.toLowerCase() === 'creator' || 
                    !!userProfile?.creator || 
                    false;
  
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      newSubscribers: true,
      newMessages: true,
      paymentAlerts: true,
    },
    privacy: {
      profileVisibility: 'public',
      showEarnings: false,
      allowMessages: true,
    },
    payment: {
      autoWithdraw: false,
      withdrawThreshold: '1.0',
      preferredCurrency: 'ETH' as SupportedCrypto,
    },
    general: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    // Also save preferred currency separately for easy access
    localStorage.setItem('preferred_crypto', settings.payment.preferredCurrency);
  }, [settings]);

  const sections = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'payment', name: 'Payment Settings', icon: CreditCard },
    { id: 'general', name: 'General', icon: SettingsIcon },
  ];

  const supportedCryptos: { symbol: SupportedCrypto; name: string; icon: string; fallback: string }[] = [
    { symbol: 'ETH', name: 'Ethereum', icon: CRYPTO_ICONS.ETH, fallback: CRYPTO_SYMBOLS.ETH },
    { symbol: 'BTC', name: 'Bitcoin', icon: CRYPTO_ICONS.BTC, fallback: CRYPTO_SYMBOLS.BTC },
    { symbol: 'USDT', name: 'Tether', icon: CRYPTO_ICONS.USDT, fallback: CRYPTO_SYMBOLS.USDT },
    { symbol: 'SOL', name: 'Solana', icon: CRYPTO_ICONS.SOL, fallback: CRYPTO_SYMBOLS.SOL },
  ];

  type SettingValue = boolean | string | number;
  type SettingSections = 'notifications' | 'privacy' | 'payment' | 'general';

  const updateSetting = (section: SettingSections, key: string, value: SettingValue) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    // Settings are automatically saved via useEffect
    // Show confirmation message
    toast.success('Settings saved successfully!', {
      duration: 3000,
      icon: '✅',
    });
    console.log('💾 Settings saved:', settings);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and privacy settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-24">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        activeSection === section.id
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Wallet Address
                      </label>
                      <div className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300">
                        {account}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your display name"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Tell your audience about yourself..."
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    {/* Category - Only for Creators */}
                    {isCreator && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Category
                        </label>
                        <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                          <option value="">Select a category</option>
                          <option value="art">Art & Design</option>
                          <option value="fitness">Fitness</option>
                          <option value="music">Music</option>
                          <option value="gaming">Gaming</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="education">Education</option>
                        </select>
                      </div>
                    )}

                    {/* Subscription Price Setting - Only for Creators */}
                    {isCreator && (
                      <div className="border-t border-gray-700 pt-6 mt-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">Creator Settings</h3>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Monthly Subscription Price (USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="9.99"
                              defaultValue={(() => {
                                try {
                                  const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                                  return profile.subscriptionPriceUSD || '';
                                } catch {
                                  return '';
                                }
                              })()}
                              onBlur={async (e) => {
                                try {
                                  const value = parseFloat(e.target.value) || 0;
                                  const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                                  
                                  // Update localStorage first
                                  profile.subscriptionPriceUSD = value;
                                  localStorage.setItem('user_profile', JSON.stringify(profile));
                                  
                                  // Save to backend (database)
                                  if (account) {
                                    console.log('💾 Saving subscription price to database...');
                                    await updateCreatorSubscriptionPrice(account, value);
                                    console.log('✅ Subscription price saved to database');
                                  }
                                  
                                  // Dispatch profile update event to refresh UI
                                  window.dispatchEvent(new CustomEvent('profileUpdated'));
                                  
                                  // Show success message
                                  toast.success(`Subscription price updated to $${value.toFixed(2)}/month`);
                                  
                                  console.log('💰 Subscription price updated:', value);
                                } catch (error) {
                                  console.error('Error updating subscription price:', error);
                                  toast.error('Error updating price');
                                }
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                            />
                          </div>
                          <p className="text-gray-400 text-sm mt-2">
                            Set your monthly subscription price. Users will pay this amount to access your exclusive content.
                          </p>
                          <div className="mt-3 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <span className="text-2xl">💡</span>
                              <div>
                                <p className="text-blue-400 text-sm font-medium mb-1">
                                  Tips for setting your price:
                                </p>
                                <ul className="text-blue-400 text-xs space-y-1 list-disc list-inside">
                                  <li>Consider the value and quality of your content</li>
                                  <li>Research prices of similar creators</li>
                                  <li>You can offer discounts or special promotions</li>
                                  <li>Price changes will apply to new subscribers</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                            {key === 'pushNotifications' && 'Receive browser push notifications'}
                            {key === 'newSubscribers' && 'Get notified when someone subscribes'}
                            {key === 'newMessages' && 'Get notified of new messages'}
                            {key === 'paymentAlerts' && 'Get notified of payment transactions'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Privacy & Security</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Visibility
                      </label>
                      <select 
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="public">Public</option>
                        {isCreator && <option value="subscribers">Subscribers Only</option>}
                        <option value="private">Private</option>
                      </select>
                    </div>

                    {/* Show Earnings - Only for Creators */}
                    {isCreator && (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">Show Earnings</h3>
                          <p className="text-gray-400 text-sm">Display your earnings publicly on your profile</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showEarnings}
                            onChange={(e) => updateSetting('privacy', 'showEarnings', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Allow Messages</h3>
                        <p className="text-gray-400 text-sm">Allow subscribers to send you direct messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.allowMessages}
                          onChange={(e) => updateSetting('privacy', 'allowMessages', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'payment' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Payment Settings</h2>
                  <div className="space-y-6">
                    {/* Preferred Cryptocurrency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Preferred Cryptocurrency
                      </label>
                      <p className="text-gray-400 text-sm mb-4">
                        Choose your preferred cryptocurrency for payments and price displays. All prices will show in USD with conversion to your selected crypto.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {supportedCryptos.map((crypto) => (
                          <button
                            key={crypto.symbol}
                            onClick={() => updateSetting('payment', 'preferredCurrency', crypto.symbol)}
                            className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${
                              settings.payment.preferredCurrency === crypto.symbol
                                ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                                : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/30'
                            }`}
                          >
                            <img 
                              src={crypto.icon} 
                              alt={crypto.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                // Fallback to text if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = document.createElement('span');
                                fallback.textContent = crypto.fallback;
                                fallback.className = 'text-2xl font-bold';
                                target.parentNode?.insertBefore(fallback, target);
                              }}
                            />
                            <div className="text-left">
                              <div className="font-medium">{crypto.symbol}</div>
                              <div className="text-xs opacity-75">{crypto.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 text-sm">
                          <strong>Current selection:</strong> {settings.payment.preferredCurrency} - All subscription prices and tips will be displayed in USD with {settings.payment.preferredCurrency} conversion.
                        </p>
                      </div>
                    </div>

                    {/* Auto Withdraw - Only for Creators */}
                    {isCreator && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium">Auto Withdraw</h3>
                            <p className="text-gray-400 text-sm">Automatically withdraw earnings when threshold is reached</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.payment.autoWithdraw}
                              onChange={(e) => updateSetting('payment', 'autoWithdraw', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Withdraw Threshold ({settings.payment.preferredCurrency})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={settings.payment.withdrawThreshold}
                            onChange={(e) => updateSetting('payment', 'withdrawThreshold', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                          <p className="text-gray-400 text-xs mt-1">
                            Minimum amount in {settings.payment.preferredCurrency} before auto-withdrawal triggers
                          </p>
                        </div>

                        {/* Payment Information - Only for Creators */}
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Payment Information</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between">
                              <span>Platform Fee:</span>
                              <span className="text-yellow-400">10%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Creator Earnings:</span>
                              <span className="text-green-400">90%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Payment Method:</span>
                              <span className="text-primary-400">MetaMask Wallet</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price Display:</span>
                              <span className="text-blue-400">USD + {settings.payment.preferredCurrency}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'general' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => updateSetting('general', 'theme', 'dark')}
                          className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                            settings.general.theme === 'dark'
                              ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                              : 'border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <Moon className="w-5 h-5" />
                          <span>Dark</span>
                        </button>
                        <button
                          onClick={() => updateSetting('general', 'theme', 'light')}
                          className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                            settings.general.theme === 'light'
                              ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                              : 'border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <Sun className="w-5 h-5" />
                          <span>Light</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select 
                        value={settings.general.language}
                        onChange={(e) => updateSetting('general', 'language', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select 
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">Greenwich Mean Time</option>
                        <option value="JST">Japan Standard Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <button 
                  onClick={handleSaveSettings}
                  className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 active:scale-95 transform transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Save Changes</span>
                </button>
                <p className="text-gray-400 text-sm mt-3">
                  💡 Most settings are automatically saved when you make changes. This button confirms your saved settings.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;