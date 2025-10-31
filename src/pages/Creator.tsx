import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, DollarSign, Users, Star, Lock, Play, Video, UserPlus, UserCheck, TrendingUp, MoreHorizontal, Bookmark, Eye, Globe, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { useFollow } from '../context/FollowContext';
import { useMessages } from '../context/MessagesContext';
import { PriceConverter, SupportedCrypto } from '../utils/priceConverter';
import MessageModal from '../components/MessageModal';
import LiveStreamModal from '../components/LiveStreamModal';
import TipModal from '../components/TipModal';
import CommentsModal from '../components/CommentsModal';
import toast from 'react-hot-toast';
import { getUserById, getPostsByUser, toggleLikePost, getUserLikedPosts } from '../utils/api';

const Creator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, isAuthenticated, sendPayment, account } = useWeb3();
  const { isFollowing, isSubscribed, followCreator, unfollowCreator, subscribeToCreator } = useFollow();
  const { getOrCreateConversation } = useMessages();
  const [activeTab, setActiveTab] = useState('posts');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('ETH');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => {
    const currentUserProfile = localStorage.getItem('user_profile');
    if (currentUserProfile) {
      const profile = JSON.parse(currentUserProfile);
      const userId = profile.id;
      const saved = localStorage.getItem(`liked_posts_${userId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(() => {
    const currentUserProfile = localStorage.getItem('user_profile');
    if (currentUserProfile) {
      const profile = JSON.parse(currentUserProfile);
      const userId = profile.id;
      const saved = localStorage.getItem(`bookmarked_posts_${userId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  
  const [postLikeCounts, setPostLikeCounts] = useState<{ [key: string]: number }>({});
  const [postCommentCounts, setPostCommentCounts] = useState<{ [key: string]: number }>({});
  const [isProcessingPPV, setIsProcessingPPV] = useState<{[key: number]: boolean}>({});
  const [purchasedPPV, setPurchasedPPV] = useState<Set<number>>(new Set());

  // Dynamic creator data loaded from backend
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate dynamic rating based on engagement metrics
  const calculateRating = (posts: any[], subscribers: number, followers: number): number => {
    try {
      // Base rating
      let rating = 3.0;
      
      // Factor 1: Number of posts (more content = better)
      if (posts.length > 0) {
        rating += Math.min(posts.length / 20, 0.5); // +0.5 max for having 20+ posts
      }
      
      // Factor 2: Average engagement per post (likes + comments)
      const totalEngagement = posts.reduce((sum, post) => {
        const likes = post.upvotes || post.likes || 0;
        const comments = post.comments || 0;
        return sum + likes + comments;
      }, 0);
      const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;
      rating += Math.min(avgEngagement / 10, 0.8); // +0.8 max for high engagement
      
      // Factor 3: Subscriber/Follower ratio (subscribers are more valuable)
      const audienceSize = subscribers + followers;
      if (audienceSize > 0) {
        rating += Math.min(audienceSize / 100, 0.7); // +0.7 max for large audience
      }
      
      // Cap rating at 5.0
      return Math.min(Math.round(rating * 10) / 10, 5.0);
    } catch (error) {
      console.error('Error calculating rating:', error);
      return 4.0; // Default fallback rating
    }
  };

  // Load creator and posts from backend
  useEffect(() => {
    const loadCreatorData = async () => {
      if (!id) {
        console.error('❌ No creator ID provided');
        toast.error('Usuario no encontrado');
        navigate('/explore');
        return;
      }

      try {
        setIsLoading(true);
        // Loading creator data silently for performance

        // Fetch user data
        let userData;
        try {
          userData = await getUserById(id);
        } catch (userError: any) {
          console.error('❌ Error loading user data:', userError);
          // If user not found (404), navigate back
          if (userError.message?.includes('404') || userError.message?.includes('not found')) {
            toast.error('Usuario no encontrado');
            navigate('/explore');
            return;
          }
          // For other errors, show message but don't navigate
          toast.error('Error al cargar datos del usuario');
          setIsLoading(false);
          return;
        }

        // Fetch user posts - handle errors gracefully
        let postsData = { posts: [], total: 0, page: 1, totalPages: 0 };
        try {
          postsData = await getPostsByUser(id);
        } catch (postsError: any) {
          console.error('⚠️ Error loading posts (continuing with empty posts):', postsError);
          // If it's a 404, the user doesn't exist, so navigate back
          if (postsError.status === 404 || postsError.message?.includes('404')) {
            toast.error('Usuario no encontrado');
            navigate('/explore');
            setIsLoading(false);
            return;
          }
          // For 500 or other errors, continue with empty posts array
          // Don't show error toast - user can still view profile without posts
        }

        // Map backend posts to creator format
        const mappedPosts = postsData.posts.map((post: any) => ({
          id: post.id,
          creatorId: post.userId,
          type: (post.type || 'text').toLowerCase(),
          title: post.title || '',
          content: post.imageUrl || post.content,
          thumbnail: post.thumbnailUrl,
          description: post.content || '',
          likes: post.upvotes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          timestamp: new Date(post.createdAt).toLocaleString(),
          visibility: post.visibility || 'PUBLIC',
          isSubscriberOnly: post.visibility === 'SUBSCRIBERS',
          isPPV: post.visibility === 'PPV' || post.isPPV,
          priceUSD: post.priceUSD ? parseFloat(post.priceUSD.toString()) : undefined,
          tags: post.tags || [],
          isTrending: post.isTrending || false,
        }));

        setPosts(mappedPosts);
        
        // Load user's liked posts from backend first
        try {
          const userLikedPostIds = await getUserLikedPosts();
          // Loaded liked posts silently
          
          if (Array.isArray(userLikedPostIds) && userLikedPostIds.length > 0) {
            // Convert to Set and update state
            const likedSet = new Set(userLikedPostIds.map(id => String(id)));
            setLikedPosts(likedSet);
            
            // Save to localStorage for offline access
            const currentUserProfile = localStorage.getItem('user_profile');
            if (currentUserProfile) {
              const profile = JSON.parse(currentUserProfile);
              if (profile.id) {
                localStorage.setItem(`liked_posts_${profile.id}`, JSON.stringify(Array.from(likedSet)));
              }
            }
          }
          // No liked posts - silent
        } catch (error) {
          console.warn('⚠️ Could not load liked posts from backend, using localStorage:', error);
          // Fallback to localStorage if backend fails
          const currentUserProfile = localStorage.getItem('user_profile');
          if (currentUserProfile) {
            const profile = JSON.parse(currentUserProfile);
            if (profile.id) {
              const saved = localStorage.getItem(`liked_posts_${profile.id}`);
              if (saved) {
                try {
                  const savedLikes = JSON.parse(saved);
                  setLikedPosts(new Set(savedLikes.map((id: any) => String(id))));
                  // Loaded from localStorage silently
                } catch (e) {
                  console.error('Error parsing localStorage liked posts:', e);
                }
              }
            }
          }
        }
        
        // Initialize like and comment counts from backend
        const currentUserProfile = localStorage.getItem('user_profile');
        const newLikeCounts: { [key: string]: number } = {};
        const newCommentCounts: { [key: string]: number } = {};
        
        // Helper function to count nested replies
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
        
        mappedPosts.forEach((post: any) => {
          // LIKES: Use _count.likes from backend if available
          const backendLikeCount = post._count?.likes || post.upvotes || post.likes || 0;
          newLikeCounts[post.id] = backendLikeCount;
          
          // COMMENTS: Get count from localStorage first, then fall back to backend
          const savedComments = localStorage.getItem(`comments_${post.id}`);
          if (savedComments) {
            try {
              const comments = JSON.parse(savedComments);
              
              let totalComments = Array.isArray(comments) ? comments.length : 0;
              if (Array.isArray(comments)) {
                comments.forEach(comment => {
                  if (comment.replies && Array.isArray(comment.replies)) {
                    totalComments += countNestedReplies(comment.replies);
                  }
                });
              }
              newCommentCounts[post.id] = totalComments;
            } catch {
              newCommentCounts[post.id] = post.comments || 0;
            }
          } else {
            // Fallback to backend count
            newCommentCounts[post.id] = post.comments || 0;
          }
        });
        
        setPostLikeCounts(newLikeCounts);
        setPostCommentCounts(newCommentCounts);
        
        // Debug logs removed for performance

        // Calculate free and premium posts based on visibility
        const freePostsCount = mappedPosts.filter(post => 
          !post.isSubscriberOnly && !post.isPPV
        ).length;
        const premiumPostsCount = mappedPosts.filter(post => 
          post.isSubscriberOnly || post.isPPV
        ).length;

        // Get followers/subscribers from localStorage or default to 0
        const followersKey = `followers_${id}`;
        const subscribersKey = `subscribers_${id}`;
        let followersCount = parseInt(localStorage.getItem(followersKey) || '0', 10);
        let subscribersCount = parseInt(localStorage.getItem(subscribersKey) || '0', 10);
        
        // IMPORTANT: Sync followers count with actual follow state
        // If current user is following but count is 0, initialize to 1
        const savedFollowed = localStorage.getItem('followed_creators');
        if (savedFollowed) {
          try {
            const followedArray = JSON.parse(savedFollowed);
            const isCurrentlyFollowing = followedArray.includes(id);
            if (isCurrentlyFollowing && followersCount === 0) {
              followersCount = 1;
              localStorage.setItem(followersKey, '1');
              // Synced followers count silently
            }
          } catch (error) {
            console.error('Error syncing followers count:', error);
          }
        }
        
        // IMPORTANT: Sync subscribers count with actual subscription state
        const savedSubscribed = localStorage.getItem('subscribed_creators');
        if (savedSubscribed) {
          try {
            const subscribedArray = JSON.parse(savedSubscribed);
            const isCurrentlySubscribed = subscribedArray.includes(id);
            if (isCurrentlySubscribed && subscribersCount === 0) {
              subscribersCount = 1;
              localStorage.setItem(subscribersKey, '1');
              // Synced subscribers count silently
            }
          } catch (error) {
            console.error('Error syncing subscribers count:', error);
          }
        }
        
        // Debug log removed for performance

        // Map backend user data to creator format with calculated values
        const mappedCreator = {
          id: userData.id,
          name: userData.displayName || userData.username,
          username: userData.username.startsWith('@') ? userData.username : `@${userData.username}`,
          avatar: userData.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
          cover: userData.coverImageUrl || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop',
          bio: userData.bio || 'Usuario de Friendsly',
          subscribers: subscribersCount.toString(),
          followers: followersCount.toString(),
          posts: postsData.total,
          subscriptionPriceUSD: userData.subscriptionPriceUSD || 0,
          isVerified: userData.isVerified || false,
          rating: calculateRating(mappedPosts, subscribersCount, followersCount),
          category: userData.category || 'Creator',
          joinedDate: new Date(userData.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          tags: userData.tags || [],
    isLive: false,
          freePostsCount,
          premiumPostsCount,
          walletAddress: userData.walletAddress || '',
          isCreator: userData.isCreator || userData.role === 'CREATOR',
        };

        setCreator(mappedCreator);

      } catch (error: any) {
        console.error('❌ Error loading creator data:', error);
        // Only navigate if it's a 404 (user not found)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          toast.error('Usuario no encontrado');
          navigate('/explore');
        } else {
          // For other errors (500, network, etc.), show error but stay on page
          toast.error(error.message || 'Error al cargar el perfil. Intenta recargar la página.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCreatorData();
  }, [id, navigate]);

  // Listen for like and comment events
  useEffect(() => {
    const handleCommentAdded = (event: any) => {
      const { postId, commentCount } = event.detail;
      setPostCommentCounts(prev => ({
        ...prev,
        [postId]: commentCount
      }));
    };

    const handleLikeToggled = (event: any) => {
      // Ignore events from this same component
      if (event.detail.source === 'creator') {
        return;
      }
      
      const currentUserProfile = localStorage.getItem('user_profile');
      if (currentUserProfile) {
        const profile = JSON.parse(currentUserProfile);
        // Only sync if it's from the same user
        if (event.detail.userId === profile.id) {
          const postIdStr = String(event.detail.postId);
          
          // Update like count with actual value from backend if available
          if (event.detail.likeCount !== undefined) {
            setPostLikeCounts(prev => ({
              ...prev,
              [postIdStr]: event.detail.likeCount
            }));
          } else {
            // Fallback to increment/decrement if likeCount not provided
            setPostLikeCounts(prev => ({
              ...prev,
              [postIdStr]: Math.max(0, (prev[postIdStr] || 0) + (event.detail.isLiking ? 1 : -1))
            }));
          }
          
          setLikedPosts(prev => {
            const newLiked = new Set(prev);
            if (event.detail.isLiking) {
              newLiked.add(postIdStr);
            } else {
              newLiked.delete(postIdStr);
            }
            return newLiked;
          });
        }
      }
    };

    // Listen for storage events from OTHER windows/tabs
    const handleStorageEvent = (e: StorageEvent) => {
      const currentUserProfile = localStorage.getItem('user_profile');
      if (!currentUserProfile) return;
      const profile = JSON.parse(currentUserProfile);
      
      // Sync likes
      if (e.key === 'like_sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === profile.id) {
            const postIdStr = String(data.postId);
            
            // Update like count with actual value if available
            if (data.likeCount !== undefined) {
              setPostLikeCounts(prev => ({
                ...prev,
                [postIdStr]: data.likeCount
              }));
            } else {
              // Fallback to increment/decrement
              setPostLikeCounts(prev => ({
                ...prev,
                [postIdStr]: Math.max(0, (prev[postIdStr] || 0) + (data.isLiking ? 1 : -1))
              }));
            }
            
            setLikedPosts(prev => {
              const newLiked = new Set(prev);
              if (data.isLiking) {
                newLiked.add(postIdStr);
              } else {
                newLiked.delete(postIdStr);
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
          setPostCommentCounts(prev => ({
            ...prev,
            [data.postId]: data.commentCount
          }));
        } catch (error) {
          console.error('Error parsing comment sync data:', error);
        }
      }
    };

    window.addEventListener('commentAdded', handleCommentAdded);
    window.addEventListener('likeToggled', handleLikeToggled);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('commentAdded', handleCommentAdded);
      window.removeEventListener('likeToggled', handleLikeToggled);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Debug useEffect removed for performance
  // useEffect(() => {
  //   if (creator) {
  //     // Debug logs for follow status
  //   }
  // }, [creator, isFollowing, isSubscribed]);

  const supportedCryptos: { symbol: SupportedCrypto; name: string; icon: string; fallback: string }[] = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', fallback: '⟠' },
    { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', fallback: '₿' },
    { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', fallback: '₮' },
    { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', fallback: '◎' },
  ];

  // Check if current user is the creator (owner of this profile)
  const isOwnProfile = () => {
    // In a real app, you would check if the current user ID matches the creator ID
    // For this demo, we'll check if the wallet address matches the creator's wallet
    return account && account.toLowerCase() === creator.walletAddress.toLowerCase();
  };

  const getSubscriptionPricing = () => {
    const cryptoAmount = PriceConverter.usdToCrypto(creator.subscriptionPriceUSD, selectedCrypto);
    return {
      usd: creator.subscriptionPriceUSD,
      crypto: cryptoAmount,
      symbol: selectedCrypto,
    };
  };

  const getPPVPricing = (priceUSD: number) => {
    const cryptoAmount = PriceConverter.usdToCrypto(priceUSD, selectedCrypto);
    return {
      usd: priceUSD,
      crypto: cryptoAmount,
      symbol: selectedCrypto,
    };
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para seguir a este usuario');
      return;
    }

    try {
      const followersKey = `followers_${creator.id}`;
      const currentFollowers = parseInt(localStorage.getItem(followersKey) || '0', 10);
      
      // Follow logic silently
      
      if (isFollowing(creator.id)) {
        unfollowCreator(creator.id);
        // Decrease followers count
        const newCount = Math.max(0, currentFollowers - 1);
        localStorage.setItem(followersKey, String(newCount));
        setCreator((prev: any) => prev ? { ...prev, followers: String(newCount) } : prev);
        toast.success('Has dejado de seguir a este usuario');
      } else {
        followCreator(creator.id);
        // Increase followers count
        const newCount = currentFollowers + 1;
        localStorage.setItem(followersKey, String(newCount));
        setCreator((prev: any) => prev ? { ...prev, followers: String(newCount) } : prev);
        toast.success('Ahora sigues a este usuario');
      }
    } catch (error) {
      console.error('Error in handleFollow:', error);
      toast.error('Error al actualizar el seguimiento');
    }
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para enviar mensajes');
      return;
    }

    try {
      // Create or get conversation using MessagesContext
      getOrCreateConversation({
        id: creator.id,
        name: creator.name || creator.username,
        username: creator.username,
        avatar: creator.avatarImage || creator.avatarUrl || '/default-avatar.png',
        bio: creator.bio,
        isCreator: true,
        isVerified: creator.verified || false,
      });
      
      // Navigate to messages page
      navigate('/messages');
      
      toast.success(`Conversación iniciada con ${creator.name}`, {
        icon: '💬',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Error al iniciar la conversación');
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para suscribirte');
      return;
    }

    if (!isConnected) {
      toast.error('Debes conectar tu wallet para suscribirte');
      return;
    }

    if (isSubscribed(creator.id)) {
      toast.info('Ya estás suscrito a este creator');
      return;
    }

    const pricing = getSubscriptionPricing();

    setIsProcessingSubscription(true);
    
    try {
      // Process subscription payment directly without confirmation modal
      await subscribeToCreator(creator.id, {
        name: creator.name,
        subscriptionPrice: pricing.crypto.toString(), // Send crypto amount to payment processor
        subscriptionPriceUSD: pricing.usd, // Store USD amount for records
        walletAddress: creator.walletAddress,
        cryptoSymbol: selectedCrypto,
      });

      // Update subscribers count after successful subscription
      const subscribersKey = `subscribers_${creator.id}`;
      const currentSubscribers = parseInt(localStorage.getItem(subscribersKey) || '0', 10);
      const newCount = currentSubscribers + 1;
      localStorage.setItem(subscribersKey, String(newCount));
      setCreator((prev: any) => prev ? { ...prev, subscribers: String(newCount) } : prev);
      // Subscribers increased silently
      
      toast.success(`¡Te has suscrito a ${creator.name}!`);

    } catch (error: any) {
      console.error('Subscription error:', error);
      // Error handling is done in subscribeToCreator
    } finally {
      setIsProcessingSubscription(false);
    }
  };

  const handleLike = useCallback(async (postId: any) => {
    const postIdStr = String(postId);
    
    // Determine action based on current state
    const wasLiked = likedPosts.has(postIdStr);
    const isLiking = !wasLiked;
    
    // Handle like silently
    
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
      // Backend response received silently
      
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
        const currentUserProfile = localStorage.getItem('user_profile');
        if (currentUserProfile) {
          const profile = JSON.parse(currentUserProfile);
          const userId = profile.id;
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
      const currentUserProfile = localStorage.getItem('user_profile');
      if (currentUserProfile) {
        const profile = JSON.parse(currentUserProfile);
        window.dispatchEvent(new CustomEvent('likeToggled', {
          detail: { 
            postId: postIdStr, 
            isLiking: result.liked, 
            likeCount: result.likeCount, // Include actual count from backend
            userId: profile.id, 
            source: 'creator' 
          }
        }));
      }
      
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

  const handleBookmark = useCallback((postId: any) => {
    const postIdStr = String(postId);
    
    setBookmarkedPosts(prev => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(postIdStr)) {
        newBookmarked.delete(postIdStr);
      } else {
        newBookmarked.add(postIdStr);
      }
      
      // Save to localStorage
      const currentUserProfile = localStorage.getItem('user_profile');
      if (currentUserProfile) {
        const profile = JSON.parse(currentUserProfile);
        const userId = profile.id;
        localStorage.setItem(`bookmarked_posts_${userId}`, JSON.stringify(Array.from(newBookmarked)));
      }
      
      return newBookmarked;
    });
  }, []);

  const handleOpenComments = useCallback((post: any) => {
    setSelectedPost(post);
    setShowComments(true);
  }, []);

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

      const txHash = await sendPayment(
        creator.walletAddress,
        pricing.crypto.toString(),
        'tip',
        creator.name
      );

      toast.dismiss(loadingToast);

      // Update state: Mark as purchased
      const newPurchased = new Set(purchasedPPV);
      newPurchased.add(postId);
      setPurchasedPPV(newPurchased);

      // Save to localStorage
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

  // PostCard component - same as Feed but with creator privileges
  const PostCard = ({ post }: { post: any }) => {
    const ppvPricing = post.isPPV && post.priceUSD ? getPPVPricing(post.priceUSD) : null;
    const isPPVPurchased = post.isPPV ? purchasedPPV.has(post.id) : false;
    const isCurrentlyProcessing = isProcessingPPV[post.id] || false;
    
    // CRITICAL FIX: Creator can only see their own content without restrictions
    // For other creators' content, they must pay like everyone else
    const canViewContent = isOwnProfile() || 
      (!post.isSubscriberOnly && (!post.isPPV || isPPVPurchased)) || 
      (post.isSubscriberOnly && isSubscribed(creator.id));
    
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300"
      >
        {/* Post Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-12 h-12 rounded-full border-2 border-gray-600"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{creator.name}</span>
                  {creator.isVerified && (
                    <Star className="w-4 h-4 text-primary-400 fill-current" />
                  )}
                  {post.isTrending && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>Trending</span>
                    </div>
                  )}
                  {/* Creator Badge - Show when viewing own content */}
                  {isOwnProfile() && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <Eye className="w-3 h-3" />
                      <span>Your Content</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <span>{creator.username}</span>
                  <span>•</span>
                  <span>{post.timestamp}</span>
                  <span>•</span>
                  <span className="text-primary-400">{creator.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {post.isSubscriberOnly && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                  <Lock className="w-3 h-3" />
                  <span>Premium</span>
                </div>
              )}
              
              {post.isPPV && post.priceUSD && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                  <DollarSign className="w-3 h-3" />
                  <span>{PriceConverter.formatUSD(post.priceUSD)}</span>
                </div>
              )}
              
              <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">{post.description}</p>
            
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
          {/* Show content based on creator privileges or purchase/subscription status */}
          {!canViewContent ? (
            <>
              {/* PPV Content - Show locked state for non-owners */}
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
                /* Subscriber Only Content - Show locked state for non-subscribers */
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 backdrop-blur-sm" />
                  <div className="text-center z-10">
                    <Lock className="w-12 h-12 text-white mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-white mb-2">Subscriber Only Content</h4>
                    <p className="text-gray-300 mb-4">
                      Subscribe to view this exclusive content
                    </p>
                    <button
                      onClick={handleSubscribe}
                      disabled={!isAuthenticated || !isConnected || isProcessingSubscription}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors disabled:opacity-50"
                    >
                      {isProcessingSubscription ? 'Processing...' : `Subscribe for ${PriceConverter.formatUSD(subscriptionPricing.usd)}/month`}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Show actual content - Creator can always see their own content, others based on purchase/subscription */}
              {post.type === 'image' && post.content && (
                <div className="relative">
                  <img
                    src={post.content}
                    alt={post.title}
                    className="w-full aspect-video object-cover"
                  />
                  {/* Show creator indicator for own content */}
                  {isOwnProfile() && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Your Content</span>
                    </div>
                  )}
                  {/* Show purchased indicator for PPV content */}
                  {post.isPPV && isPPVPurchased && !isOwnProfile() && (
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
                  {/* Show creator indicator for own content */}
                  {isOwnProfile() && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Your Content</span>
                    </div>
                  )}
                  {/* Show purchased indicator for PPV content */}
                  {post.isPPV && isPPVPurchased && !isOwnProfile() && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Purchased</span>
                    </div>
                  )}
                </div>
              )}

              {post.type === 'text' && (
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/30 relative">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 leading-relaxed text-lg">{post.description}</p>
                  </div>
                  {/* Show creator indicator for own content */}
                  {isOwnProfile() && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      <span>Your Content</span>
                    </div>
                  )}
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
                <span className="text-sm">{(postLikeCounts[post.id] || post.likes || 0)}</span>
              </button>

              <button 
                onClick={() => handleOpenComments(post)}
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{postCommentCounts[post.id] || post.comments || 0}</span>
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
              {/* Show content stats for creator */}
              {isOwnProfile() && (
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  {post.isSubscriberOnly && (
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Premium</span>
                    </div>
                  )}
                  {post.isPPV && post.priceUSD && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{PriceConverter.formatUSD(post.priceUSD)}</span>
                    </div>
                  )}
                  {/* Free badge - ONLY for creators */}
                  {creator.isCreator && !post.isSubscriberOnly && !post.isPPV && (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>Free</span>
                    </div>
                  )}
                </div>
              )}

              {/* Only show tip and message buttons for non-owners */}
              {!isOwnProfile() && (
                <>
                  {/* Tip button - ONLY for creators */}
                  {creator.isCreator && (
                    <button
                      onClick={() => setShowTipModal(true)}
                      className="p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Show error state if creator not found
  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  // Now that we know creator is not null, we can safely access its properties
  const tabs = [
    { id: 'posts', name: 'Posts', count: creator.posts },
    { id: 'about', name: 'About', count: null },
    { id: 'collections', name: 'Collections', count: 12 },
    { id: 'live', name: 'Live', count: null },
  ];

  const subscriptionPricing = getSubscriptionPricing();

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={creator.cover}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        
        {/* Live Indicator */}
        {creator.isLive && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        )}

        {/* Follow Status Badge */}
        {isFollowing(creator.id) && !isOwnProfile() && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white rounded-full text-sm font-medium">
            <UserCheck className="w-4 h-4" />
            <span>Following</span>
          </div>
        )}

        {/* Creator Badge - Show when viewing own profile */}
        {isOwnProfile() && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-sm font-medium">
            <Eye className="w-4 h-4" />
            <span>Your Profile</span>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-32 h-32 rounded-full border-4 border-gray-600"
              />
              {creator.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">{creator.name}</h1>
                    {/* Subscription Price Badge - ONLY for creators */}
                    {creator.isCreator && (
                    <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                      <span className="text-yellow-400 text-sm font-medium">
                        {PriceConverter.formatUSD(creator.subscriptionPriceUSD)}/month
                      </span>
                    </div>
                    )}
                  </div>
                  <p className="text-primary-400 text-lg mb-2">{creator.username}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <UserPlus className="w-4 h-4" />
                      <span>{creator.followers} followers</span>
                    </div>
                    {/* Subscribers - ONLY for creators */}
                    {creator.isCreator && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{creator.subscribers} subscribers</span>
                    </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{creator.rating} rating</span>
                    </div>
                    <span>{creator.isCreator ? 'Creator' : 'User'}</span>
                  </div>
                  <p className="text-gray-300 max-w-2xl leading-relaxed">{creator.bio}</p>
                </div>

                {/* Action Buttons - Hide for own profile */}
                {!isOwnProfile() && (
                  <div className="flex flex-col space-y-3 mt-4 sm:mt-0">
                    <div className="flex space-x-3">
                      {/* Follow Button */}
                      <button
                        onClick={handleFollow}
                        disabled={!isAuthenticated}
                        className={`flex items-center justify-center space-x-2 w-32 h-12 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                          isFollowing(creator.id)
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isFollowing(creator.id) ? (
                          <>
                            <UserCheck className="w-5 h-5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>

                      {/* Subscribe Button - ONLY for creators */}
                      {creator.isCreator && (
                        <>
                      {isSubscribed(creator.id) ? (
                        <div className="flex items-center justify-center space-x-2 w-40 h-12 bg-green-500/20 border border-green-500 text-green-400 rounded-lg">
                          <Star className="w-5 h-5 fill-current" />
                          <span>Subscribed</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubscribe}
                          disabled={!isAuthenticated || !isConnected || isProcessingSubscription}
                          className="flex items-center justify-center space-x-2 w-40 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessingSubscription ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-5 h-5" />
                              <span>Subscribe</span>
                            </>
                          )}
                        </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Additional Actions */}
                    <div className="flex space-x-2">
                      {/* Tip Button - ONLY for creators */}
                      {creator.isCreator && (
                      <button
                        onClick={() => setShowTipModal(true)}
                        disabled={!isAuthenticated}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Tip</span>
                      </button>
                      )}
                      <button
                        onClick={handleSendMessage}
                        disabled={!isAuthenticated}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                      {creator.isLive && (
                        <button
                          onClick={() => setShowLiveStreamModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          <span>Watch Live</span>
                        </button>
                      )}
                      <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Stats - Different for creators vs normal users */}
          {creator.isCreator ? (
            // Creator Stats
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{creator.freePostsCount}</div>
              <div className="text-gray-400 text-sm">Free Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">{creator.premiumPostsCount}</div>
              <div className="text-gray-400 text-sm">Premium Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{creator.subscribers}</div>
              <div className="text-gray-400 text-sm">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{creator.rating}</div>
              <div className="text-gray-400 text-sm">Rating</div>
            </div>
          </div>
          ) : (
            // Normal User Stats (No Subscribers, No Free/Premium Posts)
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{creator.followers}</div>
                <div className="text-gray-400 text-sm">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">{creator.posts}</div>
                <div className="text-gray-400 text-sm">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{creator.rating}</div>
                <div className="text-gray-400 text-sm">Rating</div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-700">
            {creator.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Cryptocurrency Selection for Payments - Hide for own profile and normal users */}
          {creator.isCreator && !isOwnProfile() && isAuthenticated && isConnected && !isSubscribed(creator.id) && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Payment Method</h4>
              <div className="flex space-x-2">
                {supportedCryptos.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                      selectedCrypto === crypto.symbol
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <img 
                      src={crypto.icon} 
                      alt={crypto.name}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = document.createElement('span');
                        fallback.textContent = crypto.fallback;
                        fallback.className = 'text-sm font-bold';
                        target.parentNode?.insertBefore(fallback, target);
                      }}
                    />
                    <span>{crypto.symbol}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Subscription: {PriceConverter.formatUSD(subscriptionPricing.usd)} = {PriceConverter.formatCrypto(subscriptionPricing.crypto, selectedCrypto)}
              </div>
            </div>
          )}
        </div>

        {/* Tabs - ONLY for creators */}
        {creator.isCreator && (
        <div className="flex space-x-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              {tab.name}
              {tab.count && (
                <span className="ml-2 text-sm opacity-75">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* For creators: show based on active tab, for normal users: always show posts */}
          {((creator.isCreator && activeTab === 'posts') || !creator.isCreator) && (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}

          {/* About tab - ONLY for creators */}
          {creator.isCreator && activeTab === 'about' && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">About {creator.name}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Bio</h4>
                  <p className="text-gray-300 leading-relaxed">{creator.bio}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Joined</h4>
                  <p className="text-gray-300">{creator.joinedDate}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {creator.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collections tab - ONLY for creators */}
          {creator.isCreator && activeTab === 'collections' && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Collections</h3>
              <p className="text-gray-400">Collections feature coming soon...</p>
            </div>
          )}

          {/* Live tab - ONLY for creators */}
          {creator.isCreator && activeTab === 'live' && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Live Streaming</h3>
              {creator.isLive ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{creator.name} is Live!</h4>
                  <p className="text-gray-400 mb-4">Join the live stream now</p>
                  <button
                    onClick={() => setShowLiveStreamModal(true)}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Watch Live Stream
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Live Stream</h4>
                  <p className="text-gray-400">{creator.name} is not currently live</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals - Hide for own profile */}
      {!isOwnProfile() && (
        <>
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            creator={creator}
          />
          
          <LiveStreamModal
            isOpen={showLiveStreamModal}
            onClose={() => setShowLiveStreamModal(false)}
            creator={creator}
          />
          
          {/* TipModal - ONLY for creators */}
          {creator.isCreator && (
            <TipModal
              isOpen={showTipModal}
              onClose={() => setShowTipModal(false)}
              creator={creator}
            />
          )}
        </>
      )}
      
      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
          postId={selectedPost.id}
          postTitle={selectedPost.title || ''}
          postAuthor={creator?.name || ''}
          initialCommentCount={postCommentCounts[selectedPost.id] || selectedPost.comments || 0}
          onCommentCountChange={(newCount) => {
            setPostCommentCounts(prev => ({
              ...prev,
              [selectedPost.id]: newCount
            }));
          }}
        />
      )}
    </div>
  );
};

export default Creator;