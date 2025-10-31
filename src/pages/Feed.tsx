import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, DollarSign, Lock, Play, TrendingUp, MoreHorizontal, Bookmark, Eye, Star, Globe, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useFollow } from '../context/FollowContext';
import { PriceConverter, SupportedCrypto } from '../utils/priceConverter';
import { getAllPosts, Post as APIPost, toggleLikePost, getUserLikedPosts } from '../utils/api';
import TipModal from '../components/TipModal';
import MessageModal from '../components/MessageModal';
import CreatePostModal from '../components/CreatePostModal';
import CommentsModal from '../components/CommentsModal';
import toast from 'react-hot-toast';

const Feed = () => {
  const { isConnected, isAuthenticated, sendPayment, userProfile } = useWeb3();
  const { isFollowing, isSubscribed } = useFollow();
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('ETH');
  const [showTipModal, setShowTipModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(() => {
    // Load liked posts from localStorage
    const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
    if (userId) {
      const saved = localStorage.getItem(`liked_posts_${userId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string | number>>(() => {
    // Load bookmarked posts from localStorage
    const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
    if (userId) {
      const saved = localStorage.getItem(`bookmarked_posts_${userId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [isProcessingPPV, setIsProcessingPPV] = useState<{[key: string]: boolean}>({});
  const [purchasedPPV, setPurchasedPPV] = useState<Set<string | number>>(new Set());
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postCommentCounts, setPostCommentCounts] = useState<{[key: string]: number}>({});
  const [postLikeCounts, setPostLikeCounts] = useState<{[key: string]: number}>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400');

  // Load user avatar from localStorage/userProfile
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

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadUserAvatar();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [userProfile]);

  // Load posts from backend
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        // Loading posts from backend silently
        const result = await getAllPosts(1, 15);
        // Posts loaded silently
        setUserPosts(result.posts);
        
        // Initialize like counts from backend data
        const likeCounts: {[key: string]: number} = {};
        
        result.posts.forEach((post: any) => {
          // Use _count.likes if available, otherwise fallback to upvotes
          likeCounts[post.id] = post._count?.likes || post.upvotes || post.likes || 0;
        });
        setPostLikeCounts(likeCounts);
        
        // Load user's liked posts from backend
        try {
          const userLikedPostIds = await getUserLikedPosts();
          // Loaded liked posts silently
          
          if (Array.isArray(userLikedPostIds) && userLikedPostIds.length > 0) {
            // Convert to Set and update state
            const likedSet = new Set(userLikedPostIds.map(id => String(id)));
            setLikedPosts(likedSet);
            
            // Save to localStorage for offline access
            const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
            if (userId) {
              localStorage.setItem(`liked_posts_${userId}`, JSON.stringify(Array.from(likedSet)));
            }
          }
          // No liked posts - silent
        } catch (error) {
          // console.warn('⚠️ Could not load liked posts from backend, using localStorage:', error);
          // Fallback to localStorage if backend fails
          const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
          if (userId) {
            const saved = localStorage.getItem(`liked_posts_${userId}`);
            if (saved) {
              try {
                const savedLikes = JSON.parse(saved);
                setLikedPosts(new Set(savedLikes.map((id: any) => String(id))));
                // console.log('💾 Loaded liked posts from localStorage:', savedLikes);
              } catch (e) {
                console.error('Error parsing localStorage liked posts:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();

    // Listen for real-time post events
    const handlePostCreated = (event: any) => {
      console.log('🔔 New post created, adding to feed:', event.detail);
      
      // Check if post already exists to avoid duplicates
      setUserPosts(prev => {
        const exists = prev.some(post => post.id === event.detail.id);
        if (exists) {
          // console.log('⚠️ Post already exists in feed, skipping:', event.detail.id);
          return prev;
        }
        return [event.detail, ...prev];
      });
      
      // Initialize like count for new post (base count only)
      const baseCount = event.detail.upvotes || event.detail.likes || 0;
      
      setPostLikeCounts(prev => ({
        ...prev,
        [event.detail.id]: baseCount
      }));
    };

    const handlePostDeleted = (event: any) => {
      console.log('🗑️ Post deleted, removing from feed:', event.detail);
      setUserPosts(prev => prev.filter(post => post.id !== event.detail.postId));
    };

    const handleCommentAdded = (event: any) => {
      console.log('💬 Comment added, updating count for post:', event.detail.postId);
      setPostCommentCounts(prev => ({
        ...prev,
        [event.detail.postId]: event.detail.commentCount
      }));
    };

    const handleLikeToggled = (event: any) => {
      // Ignore events from this same component (feed)
      if (event.detail.source === 'feed') {
        return;
      }
      
      console.log('❤️ Like toggled in real-time for post:', event.detail.postId);
      const currentUserId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
      
      // Only sync if it's from the same user
      if (event.detail.userId === currentUserId) {
        // Update like count with actual value from backend if available
        if (event.detail.likeCount !== undefined) {
          setPostLikeCounts(prev => ({
            ...prev,
            [event.detail.postId]: event.detail.likeCount
          }));
        } else {
          // Fallback to increment/decrement if likeCount not provided
          setPostLikeCounts(prev => ({
            ...prev,
            [event.detail.postId]: Math.max(0, (prev[event.detail.postId] || 0) + (event.detail.isLiking ? 1 : -1))
          }));
        }
        
        setLikedPosts(prev => {
          const newLiked = new Set(prev);
          if (event.detail.isLiking) {
            newLiked.add(event.detail.postId);
          } else {
            newLiked.delete(event.detail.postId);
          }
          return newLiked;
        });
      }
    };

    const handlePostsReload = () => {
      // console.log('🔄 Reloading all posts...');
      loadPosts();
    };

    // Listen for storage events from OTHER windows/tabs
    const handleStorageEvent = (e: StorageEvent) => {
      // Sync likes
      if (e.key === 'like_sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          console.log('❤️ Like synced from another window:', data);
          
          const currentUserId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
          if (data.userId === currentUserId) {
            // Update like count with actual value if available
            if (data.likeCount !== undefined) {
              setPostLikeCounts(prev => ({
                ...prev,
                [data.postId]: data.likeCount
              }));
            } else {
              // Fallback to increment/decrement
              setPostLikeCounts(prev => ({
                ...prev,
                [data.postId]: Math.max(0, (prev[data.postId] || 0) + (data.isLiking ? 1 : -1))
              }));
            }
            
            setLikedPosts(prev => {
              const newLiked = new Set(prev);
              if (data.isLiking) {
                newLiked.add(data.postId);
              } else {
                newLiked.delete(data.postId);
              }
              return newLiked;
            });
          }
        } catch (error) {
          console.error('Error parsing like sync data:', error);
        }
      }
      
      // Sync comments
      if (e.key === 'comment_sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          console.log('💬 Comment synced from another window:', data);
          
          setPostCommentCounts(prev => ({
            ...prev,
            [data.postId]: data.commentCount
          }));
        } catch (error) {
          console.error('Error parsing comment sync data:', error);
        }
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('postDeleted', handlePostDeleted);
    window.addEventListener('commentAdded', handleCommentAdded);
    window.addEventListener('likeToggled', handleLikeToggled);
    window.addEventListener('profileUpdated', handlePostsReload);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('postDeleted', handlePostDeleted);
      window.removeEventListener('commentAdded', handleCommentAdded);
      window.removeEventListener('likeToggled', handleLikeToggled);
      window.removeEventListener('profileUpdated', handlePostsReload);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Load purchased PPV content from localStorage
  useEffect(() => {
    const savedPurchases = localStorage.getItem('purchased_ppv');
    if (savedPurchases) {
      try {
        const purchases = JSON.parse(savedPurchases);
        if (Array.isArray(purchases)) {
          setPurchasedPPV(new Set(purchases));
        }
      } catch (error) {
        console.error('Error loading purchased PPV:', error);
      }
    }
  }, []);

  // Load comment counts for all posts
  useEffect(() => {
    // Helper function to count nested replies recursively
    const countNestedReplies = (replies: any[]): number => {
      if (!Array.isArray(replies)) return 0;
      let count = replies.length;
      replies.forEach(reply => {
        if (reply.replies && Array.isArray(reply.replies)) {
          count += countNestedReplies(reply.replies);
        }
      });
      return count;
    };

    const loadCommentCounts = () => {
      const counts: {[key: number]: number} = {};
      
      // Load counts for all posts
      [...posts, ...userPosts].forEach(post => {
        try {
          const savedComments = localStorage.getItem(`comments_${post.id}`);
          if (savedComments) {
            const comments = JSON.parse(savedComments);
            
            let totalComments = Array.isArray(comments) ? comments.length : 0;
            if (Array.isArray(comments)) {
              comments.forEach(comment => {
                if (comment.replies && Array.isArray(comment.replies)) {
                  totalComments += countNestedReplies(comment.replies);
                }
              });
            }
            counts[post.id] = totalComments;
          } else {
            counts[post.id] = post.comments || 0;
          }
        } catch (error) {
          counts[post.id] = post.comments || 0;
        }
      });
      
      setPostCommentCounts(counts);
    };

    loadCommentCounts();
  }, [userPosts]);

  // Mock posts array (empty - real posts come from backend via userPosts)
  const posts: any[] = [];

  const handlePostCreated = (newPost: any) => {
    setUserPosts(prev => [newPost, ...prev]);
    toast.success('🎉 Your post is now live in the feed!');
  };

  const handleLike = useCallback(async (postId: string | number) => {
    const postIdStr = String(postId);
    
    // Determine action based on current state
    const wasLiked = likedPosts.has(postIdStr);
    const isLiking = !wasLiked;
    
    // console.log(`🔍 handleLike - postId: ${postIdStr}, wasLiked: ${wasLiked}, isLiking: ${isLiking}`);
    
    // Optimistically update UI first
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (wasLiked) {
        newLiked.delete(postIdStr);
      } else {
        newLiked.add(postIdStr);
      }
      return newLiked;
    });
    
    // Optimistically update like count
    setPostLikeCounts(prev => {
      const currentCount = prev[postIdStr] || 0;
      const newCount = currentCount + (isLiking ? 1 : -1);
      return {
        ...prev,
        [postIdStr]: Math.max(0, newCount)
      };
    });
    
    try {
      // Call backend API
      const result = await toggleLikePost(postIdStr);
      // console.log(`✅ Backend response:`, result);
      
      // Update with actual count from backend
      setPostLikeCounts(prev => ({
        ...prev,
        [postIdStr]: result.likeCount
      }));
      
      // Update liked state based on backend response
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (result.liked) {
          newLiked.add(postIdStr);
        } else {
          newLiked.delete(postIdStr);
        }
        
        // Persist to localStorage
        const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
        if (userId) {
          localStorage.setItem(`liked_posts_${userId}`, JSON.stringify(Array.from(newLiked)));
          
          // Trigger storage event for cross-window sync
          localStorage.setItem('like_sync', JSON.stringify({
            postId: postIdStr,
            isLiking: result.liked,
            likeCount: result.likeCount, // Include actual count
            userId,
            timestamp: Date.now()
          }));
          localStorage.removeItem('like_sync');
        }
        
        return newLiked;
      });
      
      // Dispatch custom event to notify OTHER components with actual like count
      const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
      window.dispatchEvent(new CustomEvent('likeToggled', { 
        detail: { 
          postId: postIdStr, 
          isLiking: result.liked, 
          likeCount: result.likeCount, // Include actual count from backend
          userId, 
          source: 'feed' 
        } 
      }));
      
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      toast.error('Error al dar like. Por favor intenta de nuevo.');
      
      // Revert optimistic update on error
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (wasLiked) {
          newLiked.add(postIdStr);
        } else {
          newLiked.delete(postIdStr);
        }
        return newLiked;
      });
      
      setPostLikeCounts(prev => {
        const currentCount = prev[postIdStr] || 0;
        const revertedCount = currentCount + (wasLiked ? 1 : -1);
        return {
          ...prev,
          [postIdStr]: Math.max(0, revertedCount)
        };
      });
    }
  }, [likedPosts]);

  const handleBookmark = useCallback((postId: string | number) => {
    setBookmarkedPosts(prev => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(postId)) {
        newBookmarked.delete(postId);
      } else {
        newBookmarked.add(postId);
      }
      
      // Persist to localStorage
      const userId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
      if (userId) {
        localStorage.setItem(`bookmarked_posts_${userId}`, JSON.stringify(Array.from(newBookmarked)));
      }
      
      return newBookmarked;
    });
  }, []);

  const handleTip = (creator: any) => {
    setSelectedCreator(creator);
    setShowTipModal(true);
  };

  const handleMessage = (creator: any) => {
    setSelectedCreator(creator);
    setShowMessageModal(true);
  };

  const handleComments = (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCommentCountChange = (postId: number, newCount: number) => {
    setPostCommentCounts(prev => ({
      ...prev,
      [postId]: newCount
    }));
  };

  const getPPVPricing = (priceUSD: number) => {
    const cryptoAmount = PriceConverter.usdToCrypto(priceUSD, selectedCrypto);
    return {
      usd: priceUSD,
      crypto: cryptoAmount,
      symbol: selectedCrypto,
    };
  };

  const handlePurchasePPV = async (postId: number, post: any) => {
    if (!isAuthenticated) {
      toast.error('🔐 Please sign in to purchase content');
      return;
    }

    if (!isConnected) {
      toast.error('💳 Please connect your wallet to purchase content');
      return;
    }

    if (!post.isPPV || !post.priceUSD) {
      toast.error('⚠️ Invalid PPV content');
      return;
    }

    if (purchasedPPV.has(postId)) {
      toast.success('✅ You have already purchased this content!');
      return;
    }

    const pricing = getPPVPricing(post.priceUSD);

    setIsProcessingPPV(prev => ({ ...prev, [postId]: true }));

    try {
      const loadingToast = toast.loading('💳 Processing payment through MetaMask...');

      // Mock creator wallet addresses
      const creatorWallets: { [key: number]: string } = {
        1: '0x8bA1f109551bD432803012645Aac136c30C6A0cE',
        2: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
        3: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
        4: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
        5: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372',
        6: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      };

      const creatorWalletAddress = creatorWallets[post.creatorId];

      const txHash = await sendPayment(
        creatorWalletAddress,
        pricing.crypto.toString(),
        'tip',
        post.creator.name
      );

      toast.dismiss(loadingToast);

      const newPurchased = new Set(purchasedPPV);
      newPurchased.add(postId);
      setPurchasedPPV(newPurchased);

      localStorage.setItem('purchased_ppv', JSON.stringify(Array.from(newPurchased)));

      toast.success(`🎉 Successfully purchased "${post.title}"!`);

    } catch (error: any) {
      console.error('❌ PPV purchase error:', error);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in wallet';
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsProcessingPPV(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Function to get content type badge - ONLY for creators
  const getContentTypeBadge = (post: any) => {
    // Only show badges for creators
    if (!post.creator.isCreator && post.creator.category !== 'Creator') {
      return null;
    }

    if (post.isPPV) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-full text-xs font-medium">
          <DollarSign className="w-3 h-3" />
          <span>PPV</span>
        </div>
      );
    } else if (post.isSubscriberOnly) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-full text-xs font-medium">
          <Lock className="w-3 h-3" />
          <span>Premium</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-xs font-medium">
          <Globe className="w-3 h-3" />
          <span>Free</span>
        </div>
      );
    }
  };

  const PostCard = ({ post: originalPost }: { post: any }) => {
    // Validate post exists
    if (!originalPost || !originalPost.id) {
      console.error('❌ PostCard received invalid post:', originalPost);
      return null;
    }
    
    // Map backend author to frontend creator format
    let mappedCreator;
    
    if (originalPost.author) {
      mappedCreator = {
        id: originalPost.author.id,
        name: originalPost.author.displayName || originalPost.author.username || 'Usuario',
        username: originalPost.author.username ? 
          (originalPost.author.username.startsWith('@') ? originalPost.author.username : `@${originalPost.author.username}`) : 
          '@usuario',
        avatar: originalPost.author.avatarUrl || currentUserAvatar,
        isVerified: originalPost.author.isVerified || false,
        category: (originalPost.author.role === 'CREATOR' || originalPost.author.isCreator) ? 'Creator' : 'User',
        isCreator: originalPost.author.role === 'CREATOR' || originalPost.author.isCreator || false,
      };
    } else if (originalPost.creator) {
      mappedCreator = {
        id: originalPost.creator.id || originalPost.userId || 'unknown',
        name: originalPost.creator.name || originalPost.creator.displayName || 'Usuario',
        username: originalPost.creator.username || '@usuario',
        avatar: originalPost.creator.avatar || originalPost.creator.avatarUrl || currentUserAvatar,
        isVerified: originalPost.creator.isVerified || false,
        category: originalPost.creator.category || 'User',
        isCreator: originalPost.creator.isCreator || false,
      };
    } else {
      // Fallback creator if no author/creator data
      mappedCreator = {
        id: originalPost.userId || 'unknown',
        name: 'Usuario',
        username: '@usuario',
        avatar: currentUserAvatar,
        isVerified: false,
        category: 'User',
        isCreator: false,
      };
    }
    
    // Ensure mappedCreator has id
    if (!mappedCreator || !mappedCreator.id) {
      console.error('❌ Invalid mappedCreator:', mappedCreator);
      return null;
    }

    // Adapt backend post format to frontend format
    const post = {
      ...originalPost,
      creator: mappedCreator,
      content: originalPost.imageUrl || originalPost.content, // Backend uses 'imageUrl' for image posts
      likes: originalPost.upvotes || originalPost.likes || 0, // Backend uses 'upvotes'
      comments: originalPost.comments || 0,
      shares: originalPost.shares || 0,
      description: originalPost.content || originalPost.description || '', // Backend 'content' is text description
      creatorId: originalPost.userId || originalPost.creatorId, // Backend uses 'userId'
      timestamp: originalPost.createdAt ? new Date(originalPost.createdAt).toLocaleString() : originalPost.timestamp,
      isSubscriberOnly: originalPost.visibility === 'SUBSCRIBERS' || originalPost.isSubscriberOnly || false,
      isPPV: originalPost.visibility === 'PPV' || originalPost.isPPV || false,
      priceUSD: originalPost.priceUSD || null,
      isTrending: originalPost.isTrending || false,
      tags: originalPost.tags || [],
      type: (originalPost.type || 'text').toLowerCase(), // CRITICAL: Convert backend 'IMAGE' to 'image'
    };
    
    const ppvPricing = post.isPPV && post.priceUSD ? getPPVPricing(post.priceUSD) : null;
    const isPPVPurchased = post.isPPV ? purchasedPPV.has(post.id) : false;
    const isCurrentlyProcessing = isProcessingPPV[post.id] || false;
    const currentCommentCount = postCommentCounts[post.id] || post.comments || 0;
    
    const canViewContent = !post.isSubscriberOnly && (!post.isPPV || isPPVPurchased) || 
                          (post.isSubscriberOnly && isSubscribed(post.creatorId));
    
    // Determine profile link - if it's current user, go to /profile, otherwise /creator/:id
    let currentUserId: string | undefined;
    try {
      const profile = localStorage.getItem('user_profile');
      if (profile) {
        currentUserId = JSON.parse(profile)?.id;
      }
    } catch (e) {
      console.warn('Error parsing user profile:', e);
    }
    
    const creatorId = mappedCreator?.id || post.creatorId || post.userId || 'unknown';
    const profileLink = creatorId === currentUserId ? '/profile' : `/creator/${creatorId}`;
    
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300"
      >
        {/* Post Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={profileLink}>
                <img
                  src={post.creator.avatar || currentUserAvatar}
                  alt={post.creator.name}
                  className="w-12 h-12 rounded-full border-2 border-gray-600 hover:border-primary-500 transition-colors object-cover"
                />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={profileLink}
                    className="text-white font-semibold hover:text-primary-400 transition-colors"
                  >
                    {post.creator.name}
                  </Link>
                  {post.creator.isVerified && (
                    <Star className="w-4 h-4 text-primary-400 fill-current" />
                  )}
                  {/* Content Type Badge - NEW POSITION */}
                  {getContentTypeBadge(post)}
                  {post.isTrending && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>Trending</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <span>{post.creator.username}</span>
                  <span>•</span>
                  <span>{post.timestamp}</span>
                  <span>•</span>
                  <span className="text-primary-400">{post.creator.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-0 break-words">{post.title}</h3>
            {/* Show description here only if NOT a text-only post */}
            {post.type !== 'text' && (
              <p className="text-gray-300 mb-4 leading-relaxed break-words whitespace-pre-wrap mt-0.5">{post.description}</p>
            )}
            
            {/* Tags */}
            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs hover:bg-gray-600/50 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media Content */}
          {!canViewContent ? (
            <>
              {/* PPV Content */}
              {post.isPPV && post.priceUSD && !isPPVPurchased ? (
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm" />
                  <div className="text-center z-10 p-6">
                    <Lock className="w-12 h-12 text-white mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Pay Per View Content</h4>
                    <p className="text-gray-300 mb-4">
                      Purchase this content for {PriceConverter.formatUSD(post.priceUSD)}
                    </p>
                    
                    <button
                      onClick={() => handlePurchasePPV(post.id, post)}
                      disabled={!isAuthenticated || !isConnected || isCurrentlyProcessing}
                      className={`px-8 py-4 rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        !isAuthenticated || !isConnected || isCurrentlyProcessing
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                      }`}
                    >
                      {isCurrentlyProcessing ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing Payment...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-6 h-6" />
                          <span>Purchase for {PriceConverter.formatUSD(post.priceUSD)}</span>
                        </div>
                      )}
                    </button>
                    
                    {ppvPricing && (
                      <p className="text-gray-400 text-sm mt-3">
                        ≈ {PriceConverter.formatCrypto(ppvPricing.crypto, selectedCrypto)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Subscriber Only Content */
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 backdrop-blur-sm" />
                  <div className="text-center z-10">
                    <Lock className="w-12 h-12 text-white mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Subscriber Only Content</h4>
                    <p className="text-gray-300 mb-4">
                      Subscribe to {post.creator.name} to view this exclusive content
                    </p>
                    <Link
                      to={profileLink}
                      className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
                    >
                      View Creator Profile
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Show actual content */}
              {post.type === 'image' && post.content && (
                <div className="relative">
                  <img
                    src={post.content}
                    alt={post.title}
                    className="w-full aspect-video object-cover"
                  />
                  {post.isPPV && isPPVPurchased && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Purchased</span>
                    </div>
                  )}
                </div>
              )}

              {post.type === 'video' && post.thumbnail && (
                <div className="relative aspect-video bg-gray-900">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  {post.isPPV && isPPVPurchased && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Purchased</span>
                    </div>
                  )}
                </div>
              )}

              {post.type === 'text' && (
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/30">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 leading-relaxed text-lg">{post.description}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Post Actions */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-2 transition-colors ${
                  likedPosts.has(post.id)
                    ? 'text-red-400'
                    : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                <span className="text-sm">
                  {(postLikeCounts[post.id] || post.likes || 0)}
                </span>
              </button>

              <button
                onClick={() => handleComments(post)}
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{currentCommentCount}</span>
              </button>

              <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">{post.shares}</span>
              </button>

              <button
                onClick={() => handleBookmark(post.id)}
                className={`flex items-center space-x-2 transition-colors ${
                  bookmarkedPosts.has(post.id)
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Tip Button - ONLY for creators */}
              {post.creator.isCreator && (
                <button
                  onClick={() => handleTip(post.creator)}
                  className="p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleMessage(post.creator)}
                className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Your Feed</h2>
          <p className="text-gray-400 mb-6">Sign in to see content from creators you follow</p>
        </div>
      </div>
    );
  }

  // Filter out invalid posts and ensure allPosts is clean
  const allPosts = [...userPosts, ...posts].filter(post => post && post.id);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Feed</h1>
            <p className="text-gray-400">Latest content from creators you follow</p>
          </div>
          <button
            onClick={() => setShowCreatePostModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {/* Loading State */}
          {isLoadingPosts ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading feed...</h3>
              <p className="text-gray-400">Please wait while we fetch the latest posts</p>
            </div>
          ) : (
            <>
          {allPosts.filter(post => post && post.id).map((post, index) => {
            // Ensure unique key
            const uniqueKey = post.id ? `${post.id}-${index}` : `post-${index}`;
            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
            );
          })}

          {allPosts.length === 0 && (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
              <p className="text-gray-400 mb-6">Follow some creators to see their content here</p>
              <Link
                to="/explore"
                className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
              >
                Discover Creators
              </Link>
            </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCreator && (
        <>
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            creator={selectedCreator}
          />
          
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            creator={selectedCreator}
          />
        </>
      )}

      {selectedPost && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          postAuthor={selectedPost.creator.name}
          initialCommentCount={postCommentCounts[selectedPost.id] || selectedPost.comments || 0}
          onCommentCountChange={(newCount) => handleCommentCountChange(selectedPost.id, newCount)}
        />
      )}

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Feed;