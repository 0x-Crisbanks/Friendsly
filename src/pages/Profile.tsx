import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit3, Camera, DollarSign, Users, Heart, Upload, Settings, Plus, Video, MessageCircle, Share2, Lock, Play, TrendingUp, MoreHorizontal, Bookmark, Eye, Star, Globe, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { useDropzone } from 'react-dropzone';
import { PriceConverter, SupportedCrypto } from '../utils/priceConverter';
import { uploadAndSaveProfileImage, getPostsByUser, deletePost, toggleLikePost, getUserLikedPosts, getUserFollowersCount, getCreatorSubscribersCount, getCreatorStats } from '../utils/api';
import toast from 'react-hot-toast';
import ContentUploadModal from '../components/ContentUploadModal';
import LiveStreamModal from '../components/LiveStreamModal';
import CreatePostModal from '../components/CreatePostModal';
import CommentsModal from '../components/CommentsModal';

const Profile = () => {
  const navigate = useNavigate();
  const { account, isConnected, sendPayment } = useWeb3();
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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
  // Prepared for future PPV purchase functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessingPPV, setIsProcessingPPV] = useState<{[key: string]: boolean}>({});
  const [purchasedPPV, setPurchasedPPV] = useState<Set<string | number>>(new Set());
  const [selectedCrypto] = useState<SupportedCrypto>('ETH'); // Setter not currently used, but kept for future PPV features
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postCommentCounts, setPostCommentCounts] = useState<{[key: string]: number}>({});
  const [postLikeCounts, setPostLikeCounts] = useState<{[key: string]: number}>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [openPostMenu, setOpenPostMenu] = useState<string | number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState({
    name: 'Your Name',
    username: '@yourname',
    bio: 'Welcome to my FriendsX profile! Subscribe for exclusive content.',
    subscriptionPrice: '0.05',
    category: 'lifestyle',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=600&fit=crop',
    avatarImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  });

  // Dynamic stats based on real data
  const [stats, setStats] = useState({
    subscribers: '0',
    posts: '0',
    earnings: '0.00',
    likes: '0',
    followers: '0',
    tips: '0',
  });

  // Real stats for creators (followers, subscribers, rating, free/premium posts, contentCount)
  const [creatorStats, setCreatorStats] = useState({
    followers: 0,
    subscribers: 0,
    rating: 0,
    freePosts: 0,
    premiumPosts: 0,
    contentCount: 0,
  });


  // Load user profile from localStorage and listen for changes
  useEffect(() => {
    const loadProfile = () => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserProfile(parsedProfile);
        
      setProfile(prev => ({
        ...prev,
          // Try displayName first (backend format), then fullName (localStorage format), then fallback
          name: parsedProfile.displayName || parsedProfile.fullName || parsedProfile.username || prev.name,
          username: parsedProfile.username ? `@${parsedProfile.username}` : prev.username,
        bio: parsedProfile.bio || prev.bio,
        // Load saved images from database if available
        avatarImage: parsedProfile.avatarUrl || prev.avatarImage,
        coverImage: parsedProfile.coverImageUrl || prev.coverImage,
      }));
        
        // console.log('✅ Profile UI updated with name:', parsedProfile.displayName || parsedProfile.fullName || parsedProfile.username);
      }
    };

    // Load profile on mount
    loadProfile();

    // Listen for storage changes (when profile is updated in another tab or by another component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_profile' && e.newValue) {
        console.log('🔄 Profile updated, reloading...');
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event (for same-tab updates)
    const handleProfileUpdate = () => {
      console.log('🔄 Profile update event received, reloading...');
      setTimeout(loadProfile, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Load user posts from backend
  useEffect(() => {
    const loadUserPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (profile?.id) {
          console.log('📥 Loading user posts from backend for user:', profile.id);
          const result = await getPostsByUser(profile.id);
          console.log('✅ Loaded user posts:', result);
          console.log('📊 Number of posts loaded:', result.posts?.length || 0);
          // Log first post to debug imageUrl
          if (result.posts && result.posts.length > 0) {
            const firstPost = result.posts[0];
            console.log('📸 First post data:', {
              id: firstPost.id,
              type: firstPost.type,
              imageUrl: firstPost.imageUrl,
              content: firstPost.content,
              videoUrl: firstPost.videoUrl,
              thumbnailUrl: firstPost.thumbnailUrl,
            });
          }
          setUserPosts(result.posts || []);
          
          // Initialize like counts from backend data
          const likeCounts: {[key: string]: number} = {};
          
          if (result.posts && Array.isArray(result.posts)) {
          result.posts.forEach((post: any) => {
            // Use _count.likes if available, otherwise fallback to upvotes
            likeCounts[post.id] = post._count?.likes || post.upvotes || post.likes || 0;
          });
          setPostLikeCounts(likeCounts);
          }
          
          // Load user's liked posts from backend
          try {
            const userLikedPostIds = await getUserLikedPosts();
            // console.log('✅ Loaded user liked posts from backend:', userLikedPostIds);
            // console.log('📊 Type check:', Array.isArray(userLikedPostIds), 'Length:', userLikedPostIds.length);
            
            if (Array.isArray(userLikedPostIds) && userLikedPostIds.length > 0) {
              // Convert to Set and update state
              const likedSet = new Set(userLikedPostIds.map(id => String(id)));
              // console.log('❤️ Setting liked posts state:', Array.from(likedSet));
              setLikedPosts(likedSet);
              
              // Save to localStorage for offline access
              if (profile.id) {
                localStorage.setItem(`liked_posts_${profile.id}`, JSON.stringify(Array.from(likedSet)));
                // console.log('💾 Saved liked posts to localStorage for user:', profile.id);
              }
            } else {
              // console.log('ℹ️ No liked posts found in backend');
            }
          } catch (error) {
            // console.warn('⚠️ Could not load liked posts from backend, using localStorage:', error);
            // Fallback to localStorage if backend fails
            if (profile.id) {
              const saved = localStorage.getItem(`liked_posts_${profile.id}`);
              if (saved) {
                try {
                  const savedLikes = JSON.parse(saved);
                  setLikedPosts(new Set(savedLikes.map((id: any) => String(id))));
                  console.log('💾 Loaded liked posts from localStorage:', savedLikes);
                } catch (e) {
                  console.error('Error parsing localStorage liked posts:', e);
                }
              }
            }
          }
        } else {
          console.warn('⚠️ No user profile found, cannot load posts');
          setUserPosts([]);
        }
      } catch (error) {
        console.error('Error loading user posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadUserPosts();

    // Listen for real-time post events
    const handlePostCreated = (event: any) => {
      // console.log('🔔 New post created, checking if it belongs to this profile...');
      const currentUserId = JSON.parse(localStorage.getItem('user_profile') || '{}').id;
      if (event.detail.userId === currentUserId) {
        // console.log('✅ Post belongs to current user, adding to profile feed');
        
        // Check if post already exists to avoid duplicates
        setUserPosts(prev => {
          const exists = prev.some(post => post.id === event.detail.id);
          if (exists) {
            console.log('⚠️ Post already exists in profile, skipping:', event.detail.id);
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
      }
    };

    const handlePostDeleted = (event: any) => {
      console.log('🗑️ Post deleted, removing from profile feed:', event.detail.postId);
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
      // Ignore events from this same component (profile)
      if (event.detail.source === 'profile') {
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
      console.log('🔄 Reloading posts after profile update...');
      setTimeout(loadUserPosts, 200); // Small delay to ensure profile is updated
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenPostMenu(null);
      }
    };

    if (openPostMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openPostMenu]);

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
      
      // Load counts for all posts (real posts only)
      userPosts.forEach(post => {
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

  // Calculate dynamic stats based on real data
  useEffect(() => {
    const calculateStats = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (!profile?.id) return;

        // 1. Posts count - from userPosts array
        const postsCount = userPosts.length;

        // 2. Total likes - sum all likes from all user posts
        const totalLikes = userPosts.reduce((sum, post) => {
          const postLikes = postLikeCounts[post.id] || post.upvotes || post.likes || 0;
          return sum + postLikes;
        }, 0);

        // 3. Subscribers count - from localStorage or FollowContext
        const subscribersKey = `subscribers_${profile.id}`;
        const subscribersCount = parseInt(localStorage.getItem(subscribersKey) || '0', 10);

        // 4. Earnings - sum all tips received from localStorage
        const tips = JSON.parse(localStorage.getItem('received_tips') || '[]');
        const totalEarnings = tips.reduce((sum: number, tip: any) => {
          if (tip.recipientId === profile.id) {
            return sum + parseFloat(tip.amount || '0');
          }
          return sum;
        }, 0);

        // 5. Followers count - from localStorage
        const followersKey = `followers_${profile.id}`;
        const followersCount = parseInt(localStorage.getItem(followersKey) || '0', 10);

        // 6. Tips received count - count of tips
        const tipsReceived = tips.filter((tip: any) => tip.recipientId === profile.id).length;

        // Format and update stats
        setStats({
          subscribers: subscribersCount.toLocaleString(),
          posts: postsCount.toString(),
          earnings: totalEarnings.toFixed(2),
          likes: totalLikes.toLocaleString(),
          followers: followersCount.toLocaleString(),
          tips: tipsReceived.toString(),
        });

        // console.log('📊 Stats calculated:', {
        //   subscribers: subscribersCount,
        //   posts: postsCount,
        //   earnings: totalEarnings,
        //   likes: totalLikes,
        //   followers: followersCount,
        //   tips: tipsReceived,
        // });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };

    calculateStats();
  }, [userPosts, postLikeCounts]);

  // Load creator statistics from backend (followers, subscribers, rating, free/premium posts)
  useEffect(() => {
    const loadCreatorStats = async () => {
      try {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const isUserCreator = profile?.isCreator === true || profile?.role === 'CREATOR' || profile?.creator?.id;
        if (!profile?.id || !isUserCreator) return;

        // Get followers count
        const followersCount = await getUserFollowersCount(profile.id);

        // Get subscribers count (if user is a creator)
        let subscribersCount = 0;
        if (profile.creator?.id) {
          subscribersCount = await getCreatorSubscribersCount(profile.creator.id);
        }

        // Get creator stats (includes more details)
        let creatorStatsData = null;
        let contentCount = 0;
        if (profile.creator?.id) {
          try {
            creatorStatsData = await getCreatorStats(profile.creator.id);
            // contentCount comes from creatorStatsData.contentCount
            contentCount = creatorStatsData?.contentCount || 0;
          } catch (error) {
            console.error('Error loading creator stats:', error);
            contentCount = 0;
          }
        }

        // Calculate free and premium posts
        const freePosts = userPosts.filter(post => 
          !post.isPPV && post.visibility !== 'SUBSCRIBERS'
        ).length;
        const premiumPosts = userPosts.filter(post => 
          post.isPPV || post.visibility === 'SUBSCRIBERS'
        ).length;

        // Calculate rating based on engagement (similar to Creator.tsx)
        const calculateRating = (posts: any[]): number => {
          try {
            let rating = 3.0;
            
            // Factor 1: Number of posts
            if (posts.length > 0) {
              rating += Math.min(posts.length / 20, 0.5);
            }
            
            // Factor 2: Average engagement per post
            const totalEngagement = posts.reduce((sum, post) => {
              const likes = postLikeCounts[post.id] || post.upvotes || post.likes || 0;
              const comments = postCommentCounts[post.id] || post.comments || 0;
              return sum + likes + comments;
            }, 0);
            const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;
            rating += Math.min(avgEngagement / 10, 0.8);
            
            // Factor 3: Subscriber/Follower ratio
            const audienceSize = subscribersCount + followersCount;
            if (audienceSize > 0) {
              rating += Math.min(audienceSize / 100, 0.7);
            }
            
            return Math.min(Math.round(rating * 10) / 10, 5.0);
          } catch (error) {
            console.error('Error calculating rating:', error);
            return 4.0;
          }
        };

        const rating = calculateRating(userPosts);

        setCreatorStats({
          followers: followersCount,
          subscribers: subscribersCount,
          rating,
          freePosts,
          premiumPosts,
          contentCount,
        });
      } catch (error) {
        console.error('Error loading creator stats:', error);
      }
    };

    loadCreatorStats();
  }, [userPosts, userProfile, postLikeCounts, postCommentCounts]);

  // Check if current user is the creator (owner of this profile)
  const isOwnProfile = () => {
    // In a real app, you would check if the current user ID matches the profile owner ID
    // For now, we'll assume this is always the user's own profile since it's the Profile page
    return true;
  };

  // Toggle post menu
  const togglePostMenu = (postId: string | number) => {
    setOpenPostMenu(openPostMenu === postId ? null : postId);
  };

  // Delete post
  const handleDeletePost = async (postId: string | number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      try {
        // console.log('🗑️ Deleting post from backend...', postId);
        await deletePost(String(postId));
        // console.log('✅ Post deleted from backend');

        // Remove from local state
        const updatedPosts = userPosts.filter(post => post.id !== postId);
        setUserPosts(updatedPosts);
        
        // Dispatch custom event to notify all components
        window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId } }));
        
        // Close the menu
        setOpenPostMenu(null);
        
        // Show success message
        toast.success('🗑️ Publicación eliminada correctamente');
      } catch (error: any) {
        console.error('❌ Error deleting post:', error);
        toast.error(error.message || 'Error al eliminar la publicación');
      }
    }
  };

  const onDrop = async (acceptedFiles: File[], type: 'avatar' | 'cover') => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Only image files are allowed');
      return;
    }

    // Validate size
    const maxSize = type === 'cover' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`❌ Image too large. Max ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Set loading state
    if (type === 'avatar') {
      setIsUploadingAvatar(true);
    } else {
      setIsUploadingCover(true);
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading(`📤 Uploading ${type} image...`);

      // Upload to Supabase and save to database
      const { url } = await uploadAndSaveProfileImage(file, type);

      // Update local state
      setProfile(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatarImage' : 'coverImage']: url
      }));

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success(`✅ ${type === 'avatar' ? 'Profile photo' : 'Cover photo'} updated!`);

      // console.log(`✅ ${type} image saved permanently:`, url);
    } catch (error: any) {
      console.error(`❌ Error uploading ${type}:`, error);
      toast.error(`❌ Failed to upload ${type}: ${error.message}`);
    } finally {
      // Clear loading state
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'avatar'),
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'cover'),
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleSaveProfile = async () => {
    // Validate that we have user ID
    if (!userProfile?.id) {
      alert('User ID not found. Please reconnect your wallet.');
      return;
    }

    try {
      console.log('💾 Saving profile changes to backend...');
      
      // Import updateUserProfile if not already imported
      const { updateUserProfile } = await import('../utils/api');
      
      await updateUserProfile(userProfile.id, {
        fullName: profile.name,
        username: profile.username.replace('@', ''), // Remove @ prefix
        bio: profile.bio,
      });
      
      // Update localStorage with new values
      const updatedProfile = {
        ...userProfile,
        displayName: profile.name,
        username: profile.username.replace('@', ''),
        bio: profile.bio,
      };
      
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      // console.log('✅ Profile changes saved successfully');
      alert('Profile updated successfully!');
    setIsEditing(false);
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      alert(`Failed to save profile: ${error.message || 'Unknown error'}`);
    }
  };

  const handlePostCreated = (newPost: any) => {
    // Update user posts state (check for duplicates)
    setUserPosts(prev => {
      const exists = prev.some(post => post.id === newPost.id);
      if (exists) {
        console.log('⚠️ Post already exists, skipping duplicate:', newPost.id);
        return prev;
      }
      return [newPost, ...prev];
    });
    
    // Show success message
    toast.success('🎉 Your post is now live on your profile!', {
      duration: 4000,
      style: {
        background: '#10B981',
        color: '#fff',
      }
    });
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
          source: 'profile' 
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

  const handleComments = (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCommentCountChange = (postId: string | number, newCount: number) => {
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

  // Note: handlePurchasePPV is prepared for future PPV purchase functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePurchasePPV = async (postId: string | number, post: any) => {
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

      // Mock wallet address for own content
      const mockWalletAddress = '0x8bA1f109551bD432803012645Aac136c30C6A0cE';

      await sendPayment(
        mockWalletAddress,
        pricing.crypto.toString(),
        'tip',
        'Your Content'
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

  // Function to get content type badge
  const getContentTypeBadge = (post: any) => {
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
    } else if (isCreator) {
      // Only show "Free" badge for creators
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-xs font-medium">
          <Globe className="w-3 h-3" />
          <span>Free</span>
        </div>
      );
    } else {
      // Normal users: no badge for public posts
      return null;
    }
  };

  // PostCard component - same as Feed but with creator privileges
  const PostCard = ({ post: originalPost }: { post: any }) => {
    // Map backend author to frontend creator format
    const mappedCreator = originalPost.author ? {
      id: originalPost.author.id,
      name: originalPost.author.displayName || originalPost.author.username,
      username: originalPost.author.username.startsWith('@') ? originalPost.author.username : `@${originalPost.author.username}`,
      avatar: originalPost.author.avatarUrl || profile.avatarImage,
      isVerified: true,
      category: originalPost.author.isCreator ? 'Creator' : 'User',
    } : (originalPost.creator || {
      id: userProfile?.id || '',
      name: profile.name,
      username: `@${profile.username}`,
      avatar: profile.avatarImage,
      isVerified: true,
      category: isCreator ? 'Creator' : 'User',
    });

    // Adapt backend post format to frontend format
    const postType = (originalPost.type || 'TEXT').toLowerCase();
    
    // Debug log for post mapping
    if (postType === 'image' && originalPost.imageUrl) {
      console.log('🖼️ Mapping IMAGE post:', {
        postId: originalPost.id,
        type: originalPost.type,
        imageUrl: originalPost.imageUrl,
        content: originalPost.content,
      });
    }
    
    const post = {
      ...originalPost,
      creator: mappedCreator,
      // Explicitly preserve title
      title: originalPost.title || '',
      // Keep original imageUrl, videoUrl, thumbnailUrl separately
      imageUrl: originalPost.imageUrl || null,
      videoUrl: originalPost.videoUrl || null,
      thumbnailUrl: originalPost.thumbnailUrl || null,
      // content is ALWAYS the text description, never the image URL
      content: originalPost.content || '',
      likes: originalPost.upvotes || originalPost.likes || 0,
      comments: originalPost.comments || 0,
      shares: originalPost.shares || 0,
      description: originalPost.content || originalPost.description || '',
      creatorId: originalPost.userId || originalPost.creatorId,
      timestamp: originalPost.createdAt ? new Date(originalPost.createdAt).toLocaleString() : originalPost.timestamp,
      isSubscriberOnly: originalPost.visibility === 'SUBSCRIBERS' || originalPost.isSubscriberOnly || false,
      isPPV: originalPost.visibility === 'PPV' || originalPost.isPPV || false,
      priceUSD: originalPost.priceUSD || null,
      isTrending: originalPost.isTrending || false,
      tags: originalPost.tags || [],
      type: postType, // Already converted to lowercase
    };
    
    // Debug: Log if title or imageUrl are missing
    if (!post.title && originalPost.title) {
      console.warn('⚠️ Title lost in mapping for post:', originalPost.id);
    }
    if (!post.imageUrl && originalPost.imageUrl) {
      console.warn('⚠️ imageUrl lost in mapping for post:', originalPost.id);
    }
    
    // Note: PPV pricing and purchase state are available if needed for future features
    // const ppvPricing = post.isPPV && post.priceUSD ? getPPVPricing(post.priceUSD) : null;
    // const isPPVPurchased = post.isPPV ? purchasedPPV.has(post.id) : false;
    // const isCurrentlyProcessing = isProcessingPPV[post.id] || false;
    // const canViewContent = true; // Always true for own profile
    
    const currentCommentCount = postCommentCounts[post.id] || post.comments || 0;
    
    // Determine profile link - if it's current user, go to /profile, otherwise /creator/:id
    const currentUserId = userProfile?.id || JSON.parse(localStorage.getItem('user_profile') || '{}').id;
    const profileLink = post.creator.id === currentUserId ? '/profile' : `/creator/${post.creator.id}`;
    
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300"
      >
        {/* Post Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={profileLink}>
                <img
                  src={post.creator.avatar}
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
                  {/* Creator Badge - Show when viewing own content */}
                  {isOwnProfile() && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      <Eye className="w-3 h-3" />
                      <span>Your Content</span>
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
            <div className="flex items-center space-x-2 relative">
              <button 
                onClick={() => togglePostMenu(post.id)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {openPostMenu === post.id && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Eliminar publicación</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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

          {/* Media Content - Always show for own content */}
          {post.type === 'image' && post.imageUrl && (
            <div className="relative">
              <img
                src={post.imageUrl}
                alt={post.title || post.description || 'Post image'}
                className="w-full aspect-video object-cover"
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', post.imageUrl);
                }}
                onError={(e) => {
                  console.error('❌ Error loading image:', {
                    imageUrl: post.imageUrl,
                    type: post.type,
                    postId: post.id,
                  });
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {post.type === 'video' && (post.thumbnailUrl || post.thumbnail) && (
            <div className="relative aspect-video bg-gray-900">
              <img
                src={post.thumbnailUrl || post.thumbnail}
                alt={post.title || post.description || 'Post video thumbnail'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Error loading thumbnail:', post.thumbnailUrl || post.thumbnail);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            </div>
          )}

          {post.type === 'text' && (
            <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/30 relative">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-200 leading-relaxed text-lg">{post.description}</p>
              </div>
            </div>
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

            {/* Tip and Message buttons - ONLY for creators */}
            {isCreator && (
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-gray-700/50 transition-colors">
                <DollarSign className="w-4 h-4" />
              </button>

              <button className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700/50 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Determine if user is a creator (check multiple possible fields from backend)
  const isCreator = userProfile?.isCreator === true || 
                    userProfile?.role?.toLowerCase() === 'creator' || 
                    userProfile?.userType?.toLowerCase() === 'creator' || 
                    !!userProfile?.creator || 
                    false;

  // Get all user posts (real posts only, no mock data) - calculate directly (no useMemo to avoid hooks order issues)
  const allPosts = userPosts || [];

  // Early return after all hooks have been called
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access your profile</p>
        </div>
      </div>
    );
  }

  // Debug logs removed for performance optimization

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className={`relative ${isCreator ? 'h-80 sm:h-96' : 'h-48 sm:h-64'} overflow-hidden`}>
        <img
          src={profile.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        
        {isEditing && !isUploadingCover && (
          <div
            {...getCoverRootProps()}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/50 cursor-pointer group"
          >
            <input {...getCoverInputProps()} />
            <div className="bg-gray-800/80 rounded-full p-4 group-hover:bg-gray-700/80 transition-colors">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {isUploadingCover && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70">
            <div className="bg-gray-800/90 rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-400"></div>
              <span className="text-white font-medium">Uploading cover...</span>
            </div>
          </div>
        )}

        {/* Edit Button */}
        <div className="absolute top-4 right-4">
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-700/80 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              {/* Avatar */}
              <div className="relative mb-6">
                <div
                  {...(isEditing && !isUploadingAvatar ? getAvatarRootProps() : {})}
                  className={`relative ${isEditing && !isUploadingAvatar ? 'cursor-pointer group' : ''}`}
                >
                  {isEditing && !isUploadingAvatar && <input {...getAvatarInputProps()} />}
                  <img
                    src={profile.avatarImage}
                    alt={profile.name}
                    className={`${isCreator ? 'w-40 h-40' : 'w-32 h-32'} rounded-full border-4 ${isCreator ? 'border-purple-500/50' : 'border-gray-600'} mx-auto object-cover`}
                  />
                  {isEditing && !isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full group-hover:bg-gray-900/70 transition-colors">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                    </div>
                  )}
                </div>
                {isCreator && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                    ⭐ Premium Creator
                  </div>
                )}
              </div>

              {/* Profile Details */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  {isCreator && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Price (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={profile.subscriptionPrice}
                      onChange={(e) => setProfile(prev => ({ ...prev, subscriptionPrice: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
                  <p className="text-primary-400 mb-2">{profile.username}</p>
                  
                  {isCreator && (
                    <>
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-gray-300 text-sm">
                          {creatorStats.followers >= 1000 
                            ? `${(creatorStats.followers / 1000).toFixed(1)}K` 
                            : creatorStats.followers} followers
                        </span>
                        <span className="text-gray-500">•</span>
                        <Users className="w-4 h-4 text-primary-400" />
                        <span className="text-gray-300 text-sm">
                          {creatorStats.subscribers >= 1000 
                            ? `${(creatorStats.subscribers / 1000).toFixed(1)}K` 
                            : creatorStats.subscribers} subscribers
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-yellow-400 text-sm">⭐ {creatorStats.rating.toFixed(1)} rating</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{profile.category || 'Art & Design'}</p>
                    </>
                  )}
                  
                  {!isCreator && (
                    <p className="text-gray-400 text-sm mb-3">User in general category</p>
                  )}
                  
                  <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
                  
                  {/* Only show subscription price for creators */}
                  {isCreator && (
                    <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg mb-4">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold text-lg">{profile.subscriptionPrice} ETH/month</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              {isCreator ? (
                <>
                  {/* Creator Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-6 mt-6">
                <div className="text-center">
                      <div className="text-3xl font-bold text-white">{creatorStats.freePosts}</div>
                      <div className="text-gray-400 text-sm">Free Posts</div>
                </div>
                <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">{creatorStats.premiumPosts}</div>
                      <div className="text-gray-400 text-sm">Premium Posts</div>
                </div>
                <div className="text-center">
                      <div className="text-3xl font-bold text-primary-400">
                        {creatorStats.subscribers >= 1000 
                          ? `${(creatorStats.subscribers / 1000).toFixed(1)}K` 
                          : creatorStats.subscribers}
                      </div>
                      <div className="text-gray-400 text-sm">Subscribers</div>
                </div>
                <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{creatorStats.rating.toFixed(1)}</div>
                      <div className="text-gray-400 text-sm">Rating</div>
                </div>
              </div>

                  {/* Payment Methods */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Payment Method</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm">
                        <span className="font-mono">⟠</span>
                        <span>ETH</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-sm">
                        <span className="font-mono">₿</span>
                        <span>BTC</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-sm">
                        <span className="font-mono">$</span>
                        <span>USDT</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm">
                        <span className="font-mono">◎</span>
                        <span>SOL</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Subscription: ${profile.subscriptionPrice} = 0.0062 ETH
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal User Stats - No Subscribers, No ETH/Tips */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-700 pt-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.followers}</div>
                  <div className="text-gray-400 text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{allPosts.length}</div>
                  <div className="text-gray-400 text-sm">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.likes}</div>
                  <div className="text-gray-400 text-sm">Total Likes</div>
              </div>
              </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Creator Tabs - Only for creators */}
            {isCreator && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">
                  Digital Art
                </button>
                <button className="px-4 py-2 bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-lg text-sm hover:bg-gray-600/50 transition-colors">
                  NFTs
                </button>
                <button className="px-4 py-2 bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-lg text-sm hover:bg-gray-600/50 transition-colors">
                  Tutorials
                </button>
                <button className="px-4 py-2 bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-lg text-sm hover:bg-gray-600/50 transition-colors">
                  Commission Work
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`grid ${isCreator ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'} gap-4 mb-8`}>
              {/* New Post Button - Available for ALL users */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowCreatePostModal(true)}
                className="group relative overflow-hidden flex items-center justify-center space-x-2 px-4 py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary-500/25"
              >
                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon with Animation */}
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
                
                {/* Text */}
                <span className="relative z-10 font-semibold">New Post</span>
                
                {/* Subtle Sparkle Effect */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </motion.button>
              
              {/* Go Live Button - ONLY for creators */}
              {isCreator && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowLiveStreamModal(true)}
                  className="group relative overflow-hidden flex items-center justify-center space-x-2 px-4 py-3.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/25"
                >
                  {/* Live Pulse Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  
                  {/* Live Indicator */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  
                  {/* Icon */}
                  <Video className="w-5 h-5 relative z-10" />
                  
                  {/* Text */}
                  <span className="relative z-10 font-semibold">Go Live</span>
                </motion.button>
              )}
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  navigate('/messages');
                }}
                className="group relative overflow-hidden flex items-center justify-center space-x-2 px-4 py-3.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon with Bounce Animation */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.div>
                
                {/* Text */}
                <span className="relative z-10 font-medium">Messages</span>
                
                {/* Notification Dot */}
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full opacity-75 animate-pulse"></div>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  navigate('/settings');
                }}
                className="group relative overflow-hidden flex items-center justify-center space-x-2 px-4 py-3.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon with Rotation Animation */}
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-10"
                >
                  <Settings className="w-5 h-5" />
                </motion.div>
                
                {/* Text */}
                <span className="relative z-10 font-medium">Settings</span>
              </motion.button>
            </div>

            {/* Content Tabs - Only for creators */}
            {isCreator && (
              <div className="mb-6 flex space-x-4 border-b border-gray-700">
                <button className="px-4 py-3 text-purple-400 border-b-2 border-purple-400 font-medium">
                  Posts <span className="text-gray-500">({userPosts.length})</span>
                </button>
                <button className="px-4 py-3 text-gray-400 hover:text-gray-300 transition-colors">
                  About
                </button>
                <button className="px-4 py-3 text-gray-400 hover:text-gray-300 transition-colors">
                  Collections <span className="text-gray-500">({creatorStats.contentCount || 0})</span>
                </button>
                <button className="px-4 py-3 text-gray-400 hover:text-gray-300 transition-colors">
                  Live
                </button>
              </div>
            )}

            {/* Posts Feed - Same design as Feed page */}
            <div className="space-y-6">
              {/* Loading State */}
              {isLoadingPosts ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-white mb-2">Loading posts...</h3>
                  <p className="text-gray-400">Please wait while we fetch your content</p>
                </div>
              ) : (
                <>
              {allPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}

              {/* Empty State - Only show if no posts exist */}
              {allPosts.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
                  <p className="text-gray-400 mb-6">
                    {isCreator 
                      ? 'Start creating and sharing amazing content with your audience' 
                      : 'Start sharing your thoughts and experiences with the community'}
                  </p>
                  <button
                    onClick={() => setShowCreatePostModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors"
                  >
                    Upload Your First Post
                  </button>
                </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      
      {/* Create Post Modal - Available for ALL users */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Content Upload and Live Stream Modals - ONLY for creators */}
      {isCreator && (
        <>
          <ContentUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
          />
          
          <LiveStreamModal
            isOpen={showLiveStreamModal}
            onClose={() => setShowLiveStreamModal(false)}
            creator={{
              id: 1,
              name: profile.name,
              avatar: profile.avatarImage,
              username: profile.username,
            }}
          />
        </>
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          postAuthor={profile.name}
          initialCommentCount={postCommentCounts[selectedPost.id] || selectedPost.comments || 0}
          onCommentCountChange={(newCount) => handleCommentCountChange(selectedPost.id, newCount)}
        />
      )}
    </div>
  );
};

export default Profile;