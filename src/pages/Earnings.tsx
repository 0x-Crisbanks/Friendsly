import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, Eye, Users, Heart, CreditCard, AlertCircle, ArrowUp, MoreHorizontal, Filter, Search, Target, Zap, Star, Award, PieChart, BarChart3, Activity, Wallet, RefreshCw, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';

// Define interfaces for data structures
interface Profile {
  id: string;
}

interface Tip {
  recipientId: string;
  amount: string;
  date: string;
}

interface PPVSale {
  creatorId: string;
  amount: string;
  date: string;
}

interface Post {
  userId?: string;
  creatorId?: string;
  views?: number;
}

interface Stats {
  totalEarnings: string;
  thisMonth: string;
  subscribers: string;
  tips: string;
  ppvSales: string;
  pendingWithdrawal: string;
  monthlyGrowth: string;
  subscriberGrowth: string;
  avgTip: string;
  conversionRate: string;
  totalViews: string;
  engagement: string;
}

interface EarningsData {
  date: string;
  subscriptions: number;
  tips: number;
  ppv: number;
  total: number;
  views: number;
  engagement: number;
}

interface Transaction {
  id: number;
  type: 'subscription' | 'tip' | 'ppv';
  user: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending';
  avatar: string;
}

interface TimeRange {
  id: string;
  label: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UserProfile {
  isCreator?: boolean;
  id?: string;
}

// Define type for Web3 context
interface Web3Context {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
}

const Earnings: React.FC = () => {
  const { isAuthenticated, userProfile } = useWeb3() as Web3Context;
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Dynamic stats based on real data
  const [stats, setStats] = useState<Stats>({
    totalEarnings: '0.00',
    thisMonth: '0.00',
    subscribers: '0',
    tips: '0.00',
    ppvSales: '0.00',
    pendingWithdrawal: '0.00',
    monthlyGrowth: '0.0',
    subscriberGrowth: '0.0',
    avgTip: '0.000',
    conversionRate: '0.0',
    totalViews: '0',
    engagement: '0.0',
  });

  // Calculate stats from localStorage and backend data
  useEffect(() => {
    const calculateEarningsStats = () => {
      try {
        const profile: Profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (!profile.id) return;

        // Get all tips received
        const tips: Tip[] = JSON.parse(localStorage.getItem('received_tips') || '[]');
        const userTips = tips.filter((tip) => tip.recipientId === profile.id);

        // Calculate total earnings from tips
        const totalTipsAmount = userTips.reduce((sum, tip) => 
          sum + parseFloat(tip.amount || '0'), 0
        );

        // Get PPV sales from localStorage
        const ppvSales: PPVSale[] = JSON.parse(localStorage.getItem('ppv_sales') || '[]');
        const totalPPVAmount = ppvSales
          .filter((sale) => sale.creatorId === profile.id)
          .reduce((sum, sale) => sum + parseFloat(sale.amount || '0'), 0);

        // Calculate total earnings
        const totalEarnings = totalTipsAmount + totalPPVAmount;

        // Calculate this month's earnings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const thisMonthTips = userTips
          .filter((tip) => new Date(tip.date) >= thirtyDaysAgo)
          .reduce((sum, tip) => sum + parseFloat(tip.amount || '0'), 0);

        const thisMonthPPV = ppvSales
          .filter((sale) => sale.creatorId === profile.id && new Date(sale.date) >= thirtyDaysAgo)
          .reduce((sum, sale) => sum + parseFloat(sale.amount || '0'), 0);

        const thisMonthEarnings = thisMonthTips + thisMonthPPV;

        // Get subscribers count
        const subscribersKey = `subscribers_${profile.id}`;
        const subscribersCount = parseInt(localStorage.getItem(subscribersKey) || '0', 10);

        // Calculate average tip
        const avgTip = userTips.length > 0 ? totalTipsAmount / userTips.length : 0;

        // Calculate growth percentages (compare with previous month)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const lastMonthEarnings = userTips
          .filter((tip) => {
            const tipDate = new Date(tip.date);
            return tipDate >= sixtyDaysAgo && tipDate < thirtyDaysAgo;
          })
          .reduce((sum, tip) => sum + parseFloat(tip.amount || '0'), 0);

        const monthlyGrowth = lastMonthEarnings > 0 
          ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
          : 0;

        // Get total views from posts
        const posts: Post[] = JSON.parse(localStorage.getItem('user_posts') || '[]');
        const totalViews = posts
          .filter((post) => post.userId === profile.id || post.creatorId === profile.id)
          .reduce((sum, post) => sum + (post.views || 0), 0);

        // Format and update stats
        setStats({
          totalEarnings: totalEarnings.toFixed(2),
          thisMonth: thisMonthEarnings.toFixed(2),
          subscribers: subscribersCount.toLocaleString(),
          tips: totalTipsAmount.toFixed(2),
          ppvSales: totalPPVAmount.toFixed(2),
          pendingWithdrawal: totalEarnings.toFixed(2),
          monthlyGrowth: monthlyGrowth >= 0 ? `+${monthlyGrowth.toFixed(1)}` : monthlyGrowth.toFixed(1),
          subscriberGrowth: '0.0',
          avgTip: avgTip.toFixed(3),
          conversionRate: subscribersCount > 0 ? ((subscribersCount / (totalViews || 1)) * 100).toFixed(1) : '0.0',
          totalViews: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString(),
          engagement: '0.0',
        });

        console.log('📊 Earnings stats calculated:', {
          totalEarnings,
          thisMonthEarnings,
          subscribersCount,
          totalTipsAmount,
          totalPPVAmount,
        });
      } catch (error) {
        console.error('Error calculating earnings stats:', error);
      }
    };

    calculateEarningsStats();
  }, []);

  const earningsData: EarningsData[] = [
    { date: '2024-01-01', subscriptions: 2.5, tips: 0.8, ppv: 0.3, total: 3.6, views: 1200, engagement: 7.2 },
    { date: '2024-01-02', subscriptions: 3.2, tips: 1.2, ppv: 0.5, total: 4.9, views: 1450, engagement: 8.1 },
    { date: '2024-01-03', subscriptions: 2.8, tips: 0.6, ppv: 0.2, total: 3.6, views: 1100, engagement: 6.8 },
    { date: '2024-01-04', subscriptions: 4.1, tips: 1.5, ppv: 0.8, total: 6.4, views: 1800, engagement: 9.2 },
    { date: '2024-01-05', subscriptions: 3.5, tips: 0.9, ppv: 0.4, total: 4.8, views: 1350, engagement: 7.5 },
    { date: '2024-01-06', subscriptions: 2.9, tips: 1.1, ppv: 0.6, total: 4.6, views: 1250, engagement: 8.0 },
    { date: '2024-01-07', subscriptions: 3.8, tips: 1.3, ppv: 0.7, total: 5.8, views: 1600, engagement: 8.7 },
  ];

  const transactions: Transaction[] = [
    { id: 1, type: 'subscription', user: 'user123', amount: '0.05', date: '2024-01-07 14:30', status: 'completed', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: 2, type: 'tip', user: 'fan456', amount: '0.02', date: '2024-01-07 12:15', status: 'completed', avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: 3, type: 'ppv', user: 'supporter789', amount: '0.01', date: '2024-01-07 10:45', status: 'completed', avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: 4, type: 'subscription', user: 'newbie101', amount: '0.05', date: '2024-01-06 18:20', status: 'completed', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: 5, type: 'tip', user: 'artlover', amount: '0.03', date: '2024-01-06 15:30', status: 'pending', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100' },
  ];

  const timeRanges: TimeRange[] = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '3 Months' },
    { id: '1y', label: '1 Year' },
  ];

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <DollarSign className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to view earnings</p>
        </motion.div>
      </div>
    );
  }

  // Check if user is a creator
  if (!userProfile?.isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Creator Access Only</h2>
          <p className="text-gray-400 mb-6">
            The Earnings page is only available for Creator accounts. 
            Users can discover and support creators, but earnings tracking is exclusive to creators.
          </p>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Want to become a Creator?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Create a new Creator account to start earning from your content and track your revenue.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors font-medium">
              Create Creator Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8"
        >
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Earnings Dashboard</h1>
                <p className="text-gray-400 text-sm sm:text-base">Track your revenue and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs sm:text-sm font-medium">Creator Account Active</span>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <span className="text-gray-400 text-xs sm:text-sm">Last updated: 2 min ago</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Time Range Selector */}
            <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-700">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    timeRange === range.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all duration-200 text-xs sm:text-sm">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 text-xs sm:text-sm shadow-lg">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sm:col-span-2 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-primary-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-green-400 text-xs sm:text-sm">
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{stats.monthlyGrowth}%</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Earnings</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{stats.totalEarnings} SOL</p>
              <p className="text-green-400 text-xs sm:text-sm">+{stats.monthlyGrowth}% from last month</p>
            </div>
          </motion.div>

          {/* This Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-emerald-400 text-xs">
                <ArrowUp className="w-3 h-3" />
                <span>{stats.subscriberGrowth}%</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-1">This Month</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">{stats.thisMonth} SOL</p>
            <p className="text-emerald-400 text-xs">+{stats.subscriberGrowth}% growth</p>
          </motion.div>

          {/* Subscribers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-blue-400 text-xs">
                <ArrowUp className="w-3 h-3" />
                <span>+45</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-1">Subscribers</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">{stats.subscribers}</p>
            <p className="text-blue-400 text-xs">+45 this week</p>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-pink-400 text-xs">
                <span>156 tips</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-1">Tips Received</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">{stats.tips} SOL</p>
            <p className="text-pink-400 text-xs">Avg: {stats.avgTip} SOL</p>
          </motion.div>

          {/* Views */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-purple-400 text-xs">
                <span>{stats.engagement}%</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-1">Total Views</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-1">{stats.totalViews}</p>
            <p className="text-purple-400 text-xs">{stats.engagement}% engagement</p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Modern Earnings Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-gray-700/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary-500/10 to-primary-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white">Earnings Overview</h3>
                          <p className="text-gray-400 text-sm">Daily revenue breakdown with insights</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm mt-3 sm:mt-0">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full">
                        <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-sm"></div>
                        <span className="text-primary-400 font-medium">Subscriptions</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-secondary-500/10 border border-secondary-500/20 rounded-full">
                        <div className="w-3 h-3 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full shadow-sm"></div>
                        <span className="text-secondary-400 font-medium">Tips</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-sm"></div>
                        <span className="text-yellow-400 font-medium">PPV</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {earningsData.map((day, index) => {
                      const maxValue = Math.max(...earningsData.map(d => d.total));
                      // const heightPercentage = (day.total / maxValue) * 100;
                      const isHovered = hoveredBar === index;
                      
                      return (
                        <motion.div 
                          key={day.date} 
                          initial={{ opacity: 0, x: -50, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.15,
                            duration: 0.6,
                            ease: "easeOut"
                          }}
                          className="group relative"
                          onMouseEnter={() => setHoveredBar(index)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="text-gray-300 text-sm font-semibold">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-xs font-medium">{day.views} views</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-white text-lg font-bold">{day.total} SOL</div>
                                <div className="text-gray-400 text-xs">≈ ${(day.total * 150).toFixed(0)}</div>
                              </div>
                              <div className="flex items-center space-x-1 text-purple-400 text-xs">
                                <Activity className="w-3 h-3" />
                                <span>{day.engagement}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="h-12 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              
                              <div className="flex h-full relative z-10">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(day.subscriptions / maxValue) * 100}%` }}
                                  transition={{ 
                                    delay: index * 0.15 + 0.3,
                                    duration: 0.8,
                                    ease: "easeOut"
                                  }}
                                  className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 relative overflow-hidden group-hover:from-primary-400 group-hover:to-primary-600 transition-all duration-500"
                                  style={{ 
                                    borderRadius: day.tips === 0 && day.ppv === 0 ? '1rem' : '1rem 0 0 1rem',
                                    boxShadow: isHovered ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none'
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
                                </motion.div>
                                
                                {day.tips > 0 && (
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(day.tips / maxValue) * 100}%` }}
                                    transition={{ 
                                      delay: index * 0.15 + 0.5,
                                      duration: 0.8,
                                      ease: "easeOut"
                                    }}
                                    className="bg-gradient-to-r from-secondary-500 via-secondary-600 to-secondary-500 relative overflow-hidden group-hover:from-secondary-400 group-hover:to-secondary-600 transition-all duration-500"
                                    style={{ 
                                      borderRadius: day.ppv === 0 ? '0 1rem 1rem 0' : '0',
                                      boxShadow: isHovered ? '0 0 20px rgba(236, 72, 153, 0.4)' : 'none'
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  </motion.div>
                                )}
                                
                                {day.ppv > 0 && (
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(day.ppv / maxValue) * 100}%` }}
                                    transition={{ 
                                      delay: index * 0.15 + 0.7,
                                      duration: 0.8,
                                      ease: "easeOut"
                                    }}
                                    className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 rounded-r-2xl relative overflow-hidden group-hover:from-yellow-400 group-hover:to-yellow-600 transition-all duration-500"
                                    style={{ 
                                      boxShadow: isHovered ? '0 0 20px rgba(234, 179, 8, 0.4)' : 'none'
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-4 shadow-2xl z-20"
                              >
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg mb-2">{day.total} SOL</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between space-x-4">
                                      <span className="text-primary-400">Subscriptions:</span>
                                      <span className="text-white font-medium">{day.subscriptions} SOL</span>
                                    </div>
                                    <div className="flex items-center justify-between space-x-4">
                                      <span className="text-secondary-400">Tips:</span>
                                      <span className="text-white font-medium">{day.tips} SOL</span>
                                    </div>
                                    <div className="flex items-center justify-between space-x-4">
                                      <span className="text-yellow-400">PPV:</span>
                                      <span className="text-white font-medium">{day.ppv} SOL</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1 text-blue-400">
                                <Eye className="w-3 h-3" />
                                <span>{day.views.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-purple-400">
                                <Activity className="w-3 h-3" />
                                <span>{day.engagement}%</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-green-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{((day.total / (earningsData[index - 1]?.total || day.total)) * 100 - 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mt-8 p-6 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-2xl border border-gray-600/30"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-400">{earningsData.reduce((sum, day) => sum + day.subscriptions, 0).toFixed(1)}</div>
                        <div className="text-gray-400 text-xs">Total Subscriptions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary-400">{earningsData.reduce((sum, day) => sum + day.tips, 0).toFixed(1)}</div>
                        <div className="text-gray-400 text-xs">Total Tips</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{earningsData.reduce((sum, day) => sum + day.ppv, 0).toFixed(1)}</div>
                        <div className="text-gray-400 text-xs">Total PPV</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{(earningsData.reduce((sum, day) => sum + day.engagement, 0) / earningsData.length).toFixed(1)}%</div>
                        <div className="text-gray-400 text-xs">Avg Engagement</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Withdraw Earnings</h3>
                      <p className="text-green-400 text-sm">Ready for withdrawal</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stats.pendingWithdrawal} SOL</p>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Minimum withdrawal:</span>
                        <span>0.01 SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network fee:</span>
                        <span>~0.000005 SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing time:</span>
                        <span>~5 minutes</span>
                      </div>
                    </div>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg">
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Revenue Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">Subscriptions</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">8.32 SOL</div>
                        <div className="text-primary-400 text-xs">67%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">Tips</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">2.13 SOL</div>
                        <div className="text-secondary-400 text-xs">17%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">PPV Sales</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">2.00 SOL</div>
                        <div className="text-yellow-400 text-xs">16%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Performance</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Conversion Rate</span>
                      <span className="text-white font-semibold text-sm">{stats.conversionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Avg. Tip Amount</span>
                      <span className="text-white font-semibold text-sm">{stats.avgTip} SOL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Engagement Rate</span>
                      <span className="text-white font-semibold text-sm">{stats.engagement}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Subscriber Growth</span>
                      <span className="text-green-400 font-semibold text-sm">+{stats.subscriberGrowth}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-700/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Recent Transactions</h3>
                    <p className="text-gray-400 text-sm">Track all your earnings and payments</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full sm:w-64"
                      />
                    </div>
                    <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors text-sm">
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/30">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredTransactions.map((transaction, index) => (
                      <motion.tr 
                        key={transaction.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-700/20 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <img
                              src={transaction.avatar}
                              alt={transaction.user}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="text-white font-medium text-sm">{transaction.user}</div>
                              <div className="text-gray-400 text-xs">@{transaction.user}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {transaction.type === 'subscription' && <CreditCard className="w-4 h-4 text-primary-400" />}
                            {transaction.type === 'tip' && <Heart className="w-4 h-4 text-pink-400" />}
                            {transaction.type === 'ppv' && <Eye className="w-4 h-4 text-yellow-400" />}
                            <span className="text-white capitalize text-sm">{transaction.type}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-white font-semibold text-sm">{transaction.amount} SOL</div>
                          <div className="text-gray-400 text-xs">≈ ${(parseFloat(transaction.amount) * 150).toFixed(2)}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-300 text-sm">{transaction.date}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-gray-700/50 flex items-center justify-between">
                <div className="text-gray-400 text-sm">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded text-sm hover:bg-gray-600/50 transition-colors">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-primary-500 text-white rounded text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded text-sm hover:bg-gray-600/50 transition-colors">
                    2
                  </button>
                  <button className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded text-sm hover:bg-gray-600/50 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Revenue Growth</span>
                      <span className="text-green-400 font-semibold">+{stats.monthlyGrowth}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Subscriber Growth</span>
                      <span className="text-blue-400 font-semibold">+{stats.subscriberGrowth}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Engagement Rate</span>
                      <span className="text-purple-400 font-semibold">{stats.engagement}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Top Performing Content</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Digital Art Tutorial', earnings: '2.45 SOL', views: '12.3K', type: 'video' },
                    { title: 'Exclusive Photo Set', earnings: '1.89 SOL', views: '8.7K', type: 'image' },
                    { title: 'Live Q&A Session', earnings: '1.23 SOL', views: '15.2K', type: 'live' },
                  ].map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          content.type === 'video' ? 'bg-red-500/20 text-red-400' :
                          content.type === 'image' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {content.type === 'video' && <Play className="w-4 h-4" />}
                          {content.type === 'image' && <Eye className="w-4 h-4" />}
                          {content.type === 'live' && <Zap className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{content.title}</div>
                          <div className="text-gray-400 text-xs">{content.views} views</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">{content.earnings}</div>
                        <div className="text-green-400 text-xs">+15%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Monthly Goals</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Revenue Target</span>
                      <span className="text-white font-semibold">15.00 SOL</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full" style={{ width: '83%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Current: {stats.totalEarnings} SOL</span>
                      <span className="text-primary-400">83% complete</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">New Subscribers</span>
                      <span className="text-white font-semibold">200</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Current: 134</span>
                      <span className="text-blue-400">67% complete</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { title: '1000 Subscribers', description: 'Reached 1K subscribers milestone', icon: '🎉', unlocked: true },
                    { title: 'Top Creator', description: 'Ranked in top 10% this month', icon: '⭐', unlocked: true },
                    { title: 'Engagement Master', description: '10%+ engagement rate for 7 days', icon: '🔥', unlocked: true },
                    { title: 'Revenue Goal', description: 'Hit monthly revenue target', icon: '💰', unlocked: false },
                  ].map((achievement, index) => (
                    <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                      achievement.unlocked ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-700/30'
                    }`}>
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${achievement.unlocked ? 'text-green-400' : 'text-gray-300'}`}>
                          {achievement.title}
                        </div>
                        <div className="text-gray-400 text-xs">{achievement.description}</div>
                      </div>
                      {achievement.unlocked && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Earnings;