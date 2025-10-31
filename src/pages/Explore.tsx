import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, Eye, Star, TrendingUp, Sparkles, Crown, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { PriceConverter, SupportedCrypto } from '../utils/priceConverter';
import { searchUsers, getAllUsers } from '../utils/api';

const Explore = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [preferredCrypto, setPreferredCrypto] = useState<SupportedCrypto>('ETH');
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [remoteResults, setRemoteResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<'all' | 'free' | 'low' | 'mid' | 'high'>('all');

  // Load preferred crypto from settings and registered users
  useEffect(() => {
    const loadInitialData = async () => {
      const savedCrypto = PriceConverter.getPreferredCrypto();
      setPreferredCrypto(savedCrypto);

      // Load all registered users (loading state managed inside function)
      await loadRegisteredUsers();
    };

    loadInitialData();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadRegisteredUsers();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  // Remote search (backend) with debounce when typing
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      setRemoteResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchUsers(q, 1, 18);
        if (cancelled) return;
        // Show all users in Explore (both creators and normal users)
        const mapped = (res.users || [])
          .map((u: any) => {
            const usernameHandle = u.username ? `@${u.username}` : '@user';
            // Use posts count from backend response (already included)
            const postsCount = u.postsCount || 0;
            const viewsKey = `profile_views_${u.id}`;
            const views = parseInt(localStorage.getItem(viewsKey) || '0', 10) || 0;
            const isCreator = u.userType?.toLowerCase() === 'creator' || u.creator || u.role?.toLowerCase() === 'creator' || u.isCreator;
            return {
              id: u.id,
              name: u.displayName || u.fullName || u.username || 'User',
              username: usernameHandle,
              category: isCreator ? 'art' : 'user',
              avatar: u.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
              cover: u.coverImageUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop',
              subscribers: (u.creator?.subscriberCount ?? '0').toString(),
              views,
              posts: postsCount,
              subscriptionPriceUSD: u.subscriptionPriceUSD || u.creator?.subscriptionPrice || 0,
              isVerified: !!u.creator?.verified || !!u.isVerified,
              rating: 0,
              description: u.bio || 'User on Friendsly',
              isCurrentUser: false,
              userType: u.userType || (u.creator ? 'creator' : 'user'),
            };
          });
        setRemoteResults(mapped);
      } catch (e) {
        console.error('Search error:', e);
        setRemoteResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchTerm]);

  const loadRegisteredUsers = async () => {
    try {
      setIsInitialLoading(true);
      const currentProfile = localStorage.getItem('user_profile');
      const users: any[] = [];
      const API_URL = 'http://localhost:4000/api/v1';
      const token = localStorage.getItem('authToken');

      // Load only 20 users from backend (optimized)
      const response = await getAllUsers(1, 20);
      const backendUsers = response?.users || [];
      // Backend users loaded silently

      // Posts count is now included in the backend response (postsCount field)
      // No need for 100+ individual fetches!

      // Add current user (ONLY if they are a creator in main Explore view)
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        const isCreator = profile.userType?.toLowerCase() === 'creator' || 
                         profile.role?.toLowerCase() === 'creator' ||
                         profile.isCreator === true;
        
        // ONLY add to main Explore view if user is a creator
        if (isCreator) {
          const subscriptionPrice = profile.subscriptionPriceUSD || profile.subscriptionPrice || 0;
          const viewsKey = `profile_views_${profile.id || 'current'}`;
          const views = parseInt(localStorage.getItem(viewsKey) || '0', 10);
          // Get real posts count from backend data if available
          const backendUser = backendUsers.find((u: any) => u.id === profile.id);
          const postsCount = backendUser?.postsCount || profile.postsCount || 0;

          users.push({
            id: profile.id || Date.now().toString(), // Use actual user ID without prefix
            name: profile.displayName || profile.fullName || profile.username || 'User',
            username: profile.username ? `@${profile.username}` : '@user',
            category: 'art',
            avatar: profile.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            cover: profile.coverImageUrl || profile.coverUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop',
            subscribers: '0',
            views,
            posts: postsCount,
            subscriptionPriceUSD: subscriptionPrice,
            isVerified: !!profile.isVerified,
            rating: profile.rating || 0,
            description: profile.bio || 'User on Friendsly',
            isCurrentUser: true,
            userType: 'creator',
            createdAt: profile.createdAt,
          });
        }

        // Add other users (skip current user, add both creators and normal users)
        backendUsers.forEach((user: any) => {
          if (user.id === profile.id || user.walletAddress?.toLowerCase() === profile.walletAddress?.toLowerCase()) {
            return;
          }
          const isCreator = user.role?.toLowerCase() === 'creator' || user.userType?.toLowerCase() === 'creator' || user.isCreator === true;
          
          // Load views from localStorage for each user
          const viewsKey = `profile_views_${user.id}`;
          const userViews = parseInt(localStorage.getItem(viewsKey) || '0', 10);
          
          users.push({
            id: user.id,
            name: user.displayName || user.fullName || user.username || 'User',
            username: user.username ? `@${user.username}` : '@user',
            category: isCreator ? 'art' : 'user',
            avatar: user.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            cover: user.coverImageUrl || user.coverUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop',
            subscribers: '0',
            views: userViews,
            posts: user.postsCount || 0,
            subscriptionPriceUSD: user.subscriptionPriceUSD || 0,
            isVerified: !!user.isVerified,
            rating: user.rating || 4.5,
            description: user.bio || 'User on Friendsly',
            isCurrentUser: false,
            userType: isCreator ? 'creator' : 'user',
            createdAt: user.createdAt,
          });
        });
      } else {
        // No current profile, add both creators and normal users from backend
        backendUsers.forEach((user: any) => {
          const isCreator = user.role?.toLowerCase() === 'creator' || user.userType?.toLowerCase() === 'creator' || user.isCreator === true;
          
          // Load views from localStorage for each user
          const viewsKey = `profile_views_${user.id}`;
          const userViews = parseInt(localStorage.getItem(viewsKey) || '0', 10);
          
          users.push({
            id: user.id,
            name: user.displayName || user.fullName || user.username || 'User',
            username: user.username ? `@${user.username}` : '@user',
            category: isCreator ? 'art' : 'user',
            avatar: user.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            cover: user.coverImageUrl || user.coverUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop',
            subscribers: '0',
            views: userViews,
            posts: user.postsCount || 0,
            subscriptionPriceUSD: user.subscriptionPriceUSD || 0,
            isVerified: !!user.isVerified,
            rating: user.rating || 4.5,
            description: user.bio || 'User on Friendsly',
            isCurrentUser: false,
            userType: isCreator ? 'creator' : 'user',
            createdAt: user.createdAt,
          });
        });
      }

      // Loaded users silently
      setRegisteredUsers(users);
    } catch (error) {
      console.error('Error loading registered users:', error);
      setRegisteredUsers([]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'art', name: 'Art & Design' },
    { id: 'fitness', name: 'Fitness' },
    { id: 'music', name: 'Music' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'education', name: 'Education' },
    { id: 'user', name: 'Users' },
  ];

  // Mock creators removed - only showing real users from backend
  const creators: any[] = [];

  // Helper: Determine if creator is trending (mock logic - in production, use real metrics)
  const isTrending = (creator: any) => {
    return creator.subscribers && parseInt(creator.subscribers.replace(/[KM]/g, '')) > 15;
  };

  // Helper: Determine if creator is new (joined < 30 days ago)
  const isNew = (creator: any) => {
    // Check if user was created in the last 30 days
    if (creator.createdAt) {
      const createdDate = new Date(creator.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    // If no createdAt field, don't show "New" badge
    return false;
  };

  // Helper: Determine if creator is top rated
  const isTopRated = (creator: any) => {
    return creator.rating >= 4.8;
  };

  // Helper: Determine if creator is premium
  const isPremium = (creator: any) => {
    return creator.subscriptionPriceUSD > 30;
  };

  // Combine results: if searching, use remote results; else use registered users (real users only)
  const allUsers = searchTerm.trim() ? remoteResults : registeredUsers;

  // Filter by category, search term, and price range
  const filteredCreators = allUsers.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || creator.category === selectedCategory;
    
    // Price range filter
    let matchesPriceRange = true;
    if (priceRange === 'free') {
      matchesPriceRange = creator.subscriptionPriceUSD === 0;
    } else if (priceRange === 'low') {
      matchesPriceRange = creator.subscriptionPriceUSD > 0 && creator.subscriptionPriceUSD < 10;
    } else if (priceRange === 'mid') {
      matchesPriceRange = creator.subscriptionPriceUSD >= 10 && creator.subscriptionPriceUSD <= 25;
    } else if (priceRange === 'high') {
      matchesPriceRange = creator.subscriptionPriceUSD > 25;
    }
    
    return matchesSearch && matchesCategory && matchesPriceRange;
  });

  // Featured creators (top 3 by rating)
  const featuredCreators = [...filteredCreators]
    .filter(c => c.rating >= 4.8)
    .slice(0, 3);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Discover Amazing
            <span className="block bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Creators & Users
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore exclusive content from talented creators and connect with users across the platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search creators & users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">Price:</span>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'free', label: 'Free' },
                { id: 'low', label: '<$10' },
                { id: 'mid', label: '$10-$25' },
                { id: 'high', label: '>$25' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setPriceRange(range.id as any)}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 text-xs font-medium ${
                    priceRange === range.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Creators Section */}
        {!searchTerm && featuredCreators.length > 0 && !isInitialLoading && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Featured Creators</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCreators.map((creator, index) => (
                <motion.div
                  key={`featured-${creator.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-primary-500/50 hover:border-primary-500 transition-all duration-300 group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={creator.cover}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-16 h-16 rounded-full border-2 border-primary-500 object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{creator.name}</h3>
                        <p className="text-gray-400 text-sm">{creator.username}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-300">{creator.rating}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-2">
                      {creator.description}
                    </p>
                    <button
                      onClick={() => {
                        const cleanId = String(creator.id).replace(/^user_/, '');
                        if (creator.isCurrentUser) {
                          navigate('/profile');
                        } else {
                          navigate(`/creator/${cleanId}`);
                        }
                        // Track views
                        const key = `profile_views_${cleanId}`;
                        const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
                        localStorage.setItem(key, String(current + 1));
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 text-sm font-medium text-center"
                    >
                      View Profile
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isInitialLoading && (
          <div className="space-y-8">
            {/* Loading Indicator */}
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-400 text-lg font-medium">Loading creators...</p>
              <p className="mt-1 text-gray-500 text-sm">Please wait while we fetch the latest content</p>
            </div>

            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={`skeleton-${index}`} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700">
                  <div className="h-32 bg-gray-700/50 animate-pulse"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gray-700/50 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-700/50 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-700/50 rounded w-5/6 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 bg-gray-700/50 rounded animate-pulse"></div>
                      <div className="h-12 bg-gray-700/50 rounded animate-pulse"></div>
                      <div className="h-12 bg-gray-700/50 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-gray-700/50 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creators Grid */}
        {!isInitialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-all duration-300 group"
            >
              {/* Cover Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={creator.cover}
                  alt="Cover"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback image if cover fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=600&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {isTrending(creator) && (
                    <div className="px-2 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                  )}
                  {isNew(creator) && (
                    <div className="px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      New
                    </div>
                  )}
                  {isTopRated(creator) && (
                    <div className="px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Top Rated
                    </div>
                  )}
                  {isPremium(creator) && (
                    <div className="px-2 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                </div>

                {creator.isCurrentUser && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                    You
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-16 h-16 rounded-full border-2 border-gray-600 object-cover"
                    />
                    {creator.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{creator.name}</h3>
                    <p className="text-gray-400 text-sm">{creator.username}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{creator.rating}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {creator.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{creator.views ?? creator.subscribers}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{creator.posts} posts</span>
                  </div>
                </div>

                {/* Subscribe Button or View Profile */}
                <div className="flex items-center justify-between">
                  {/* Only show price for CREATORS */}
                  {creator.userType === 'creator' && (
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1 text-primary-400">
                        <span className="font-semibold">
                          {creator.subscriptionPriceUSD > 0 
                            ? `${PriceConverter.formatUSD(creator.subscriptionPriceUSD)}/month`
                            : 'Free'}
                        </span>
                      </div>
                      {creator.subscriptionPriceUSD > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          ≈ {PriceConverter.formatCrypto(PriceConverter.usdToCrypto(creator.subscriptionPriceUSD, preferredCrypto), preferredCrypto)}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Normal users don't show price, just spacing */}
                  {creator.userType !== 'creator' && (
                    <div className="flex-1"></div>
                  )}
                  {/* If it's the current user's own card AND no search activo, lleva a /profile.  
                      En búsquedas o para otros usuarios, lleva a /creator/:id */}
                  <button
                    onClick={() => {
                      const cleanId = String(creator.id).replace(/^user_/, '');
                      if (creator.isCurrentUser && !searchTerm.trim()) {
                        navigate('/profile');
                      } else {
                        navigate(`/creator/${cleanId}`);
                      }
                      // Track views
                      const key = `profile_views_${cleanId || 'current'}`;
                      const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
                      localStorage.setItem(key, String(current + 1));
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 text-sm font-medium"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {/* No Results */}
        {!isInitialLoading && filteredCreators.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No creators or users found</div>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;