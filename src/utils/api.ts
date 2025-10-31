/**
 * API Service for Friendsly Backend
 * Handles all API calls to the NestJS backend with Supabase
 */
import cache from './cache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

/**
 * Get JWT token from localStorage
 */
// Track if we've already warned about expired token (avoid spam)
let hasWarnedExpiredToken = false;

const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      const isExpired = exp < now;
      
      // Return null if token is expired
      if (isExpired) {
        // Only warn ONCE about expired token (not on every request)
        if (!hasWarnedExpiredToken) {
          console.warn('⚠️ [AUTH] Token expired, please login again');
          hasWarnedExpiredToken = true;
          
          // Clear expired token from localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          
          // Dispatch event to notify components about auth state change
          window.dispatchEvent(new CustomEvent('authTokenExpired'));
        }
        return null;
      }
      
      // Reset warning flag if token is valid
      hasWarnedExpiredToken = false;
      return token;
    } catch (error) {
      console.error('❌ [AUTH] Invalid token format:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      return null;
    }
  }
  
  return null;
};

/**
 * Login with Web3 wallet and get JWT token
 */
export const loginWithWallet = async (walletAddress: string, signature: string, message: string): Promise<{ token: string; user: any }> => {
  try {
    // Get nonce from backend
    const nonceResponse = await fetch(`${API_URL}/auth/web3/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    if (!nonceResponse.ok) {
      throw new Error('Failed to get nonce');
    }

    const { nonce } = await nonceResponse.json();

    // Login with signature
    const loginResponse = await fetch(`${API_URL}/auth/web3/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message: message || `Sign this message to login to Friendsly. Nonce: ${nonce}`,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await loginResponse.json();

    // Save token and user to localStorage
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user_profile', JSON.stringify(data.user));

    console.log('✅ Logged in successfully:', data.user);

    return {
      token: data.accessToken,
      user: data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get current user ID from localStorage
 */
const getCurrentUserId = (): string | null => {
  const user = localStorage.getItem('user_profile');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.id || null;
    } catch (error) {
      console.error('Error parsing user profile:', error);
      return null;
    }
  }
  return null;
};

/**
 * Get or create user by wallet address
 * This ensures the user exists in the database before uploading images
 */
const getOrCreateUserByWallet = async (walletAddress: string): Promise<any> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  try {
    // First, try to get user by wallet address
    const response = await fetch(`${API_URL}/users/wallet/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      // Save to localStorage
      localStorage.setItem('user_profile', JSON.stringify(user));
      return user;
    }

    // If user doesn't exist, the backend should have created it during login
    // But if for some reason it doesn't exist, throw an error
    throw new Error('User not found. Please complete registration first.');
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Upload image to Supabase Storage
 * @param file - The image file to upload
 * @param type - Type of image: 'avatar', 'cover', or 'content'
 * @returns Promise with the permanent URL from Supabase
 */
export const uploadImage = async (
  file: File,
  type: 'avatar' | 'cover' | 'content' = 'avatar'
): Promise<string> => {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Validate size
  const maxSize = type === 'cover' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for cover, 5MB for avatar
  if (file.size > maxSize) {
    throw new Error(`Image is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  const formData = new FormData();
  formData.append('file', file);

  const endpoint = `${API_URL}/storage/upload/${type}`;

  // Prepare headers (include auth token if available, but not required for development)
  const headers: HeadersInit = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url; // Return the permanent Supabase URL
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Update user profile with new data
 * @param userId - The user ID to update
 * @param updates - Object with fields to update (avatarUrl, coverImageUrl, etc.)
 * @returns Promise with the updated user object
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    avatarUrl?: string;
    coverImageUrl?: string;
    fullName?: string;
    bio?: string;
    username?: string;
  }
): Promise<any> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const endpoint = `${API_URL}/users/${userId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Complete image upload flow: Upload to Supabase and update user profile
 * @param file - The image file
 * @param type - 'avatar' or 'cover'
 * @returns Promise with the updated user object
 */
export const uploadAndSaveProfileImage = async (
  file: File,
  type: 'avatar' | 'cover'
): Promise<{ url: string; user: any }> => {
  // Get token first to ensure user is authenticated
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  // Try to get user ID from localStorage first
  let userId = getCurrentUserId();
  
  // Debug: Show what's in localStorage
  console.log('🔍 Debug - user_profile in localStorage:', localStorage.getItem('user_profile'));
  console.log('🔍 Debug - userId extracted:', userId);

  if (!userId) {
    throw new Error('User ID not found in localStorage. Please reconnect your wallet.');
  }

  try {
    // Step 1: Upload image to Supabase Storage
    console.log(`📤 Uploading ${type} image to Supabase...`);
    const imageUrl = await uploadImage(file, type);
    console.log(`✅ Image uploaded: ${imageUrl}`);

    // Step 2: Save URL to database
    console.log(`💾 Saving to database for user ID: ${userId}...`);
    const fieldName = type === 'avatar' ? 'avatarUrl' : 'coverImageUrl';
    const updatedUser = await updateUserProfile(userId, {
      [fieldName]: imageUrl
    });
    console.log('✅ Profile updated in database');

    // Step 3: Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const newUser = { ...currentUser, [fieldName]: imageUrl };
    localStorage.setItem('user_profile', JSON.stringify(newUser));

    // Dispatch custom event to notify Profile page
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    console.log('🔔 Profile updated event dispatched');

    return {
      url: imageUrl,
      user: updatedUser
    };
  } catch (error) {
    console.error(`❌ Error uploading ${type}:`, error);
    throw error;
  }
};

// Search users (creators and regular users) on the backend
/**
 * Get all users
 */
export const getAllUsers = async (
  page: number = 1,
  limit: number = 100
): Promise<{ users: any[]; total: number; page: number; totalPages: number }> => {
  const cacheKey = `users_${page}_${limit}`;
  
  // Try to get from cache first (3 minutes TTL)
  return cache.getOrFetch(
    cacheKey,
    async () => {
      const url = new URL(`${API_URL}/users`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));

      const token = getAuthToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to get all users');
      }
      return res.json();
    },
    3 * 60 * 1000 // 3 minutes cache
  );
};

export const searchUsers = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<{ users: any[]; total: number; page: number; totalPages: number }> => {
  const url = new URL(`${API_URL}/users/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to search users');
  }
  return res.json();
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<any> => {
  const url = `${API_URL}/users/${userId}`;

  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get user');
  }
  return res.json();
};

// ============================================================================
// POSTS API
// ============================================================================

export interface CreatePostData {
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL';
  community?: string;
  communityIcon?: string;
  flair?: string;
  flairColor?: string;
  visibility: 'PUBLIC' | 'SUBSCRIBERS' | 'PPV';
  isPPV: boolean;
  priceUSD?: number;
  tags?: string[];
  pollOptions?: any;
  isPinned?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  type: string;
  community?: string;
  communityIcon?: string;
  flair?: string;
  flairColor?: string;
  visibility: string;
  isPPV: boolean;
  priceUSD?: number;
  upvotes: number;
  downvotes: number;
  comments: number;
  shares: number;
  views: number;
  tags: string[];
  pollOptions?: any;
  isPinned: boolean;
  isTrending: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/**
 * Create a new post
 */
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create post' }));
    throw new Error(error.message || 'Failed to create post');
  }

  const newPost = await response.json();
  
  // Invalidate posts cache to show new post immediately
  cache.invalidatePattern(/^posts_/);
  
  return newPost;
};

/**
 * Get all posts (public feed)
 */
export const getAllPosts = async (page: number = 1, limit: number = 20): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> => {
  const cacheKey = `posts_${page}_${limit}`;
  
  // Try to get from cache first (2 minutes TTL)
  return cache.getOrFetch(
    cacheKey,
    async () => {
      const url = new URL(`${API_URL}/posts`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch posts' }));
        throw new Error(error.message || 'Failed to fetch posts');
      }

      return response.json();
    },
    2 * 60 * 1000 // 2 minutes cache
  );
};

/**
 * Get posts by user ID
 */
export const getPostsByUser = async (userId: string, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> => {
  const url = new URL(`${API_URL}/posts/user/${userId}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user posts' }));
    const errorMessage = error.message || 'Failed to fetch user posts';
    // Include status code in error message for better error handling
    const errorWithStatus = new Error(errorMessage);
    (errorWithStatus as any).status = response.status;
    throw errorWithStatus;
  }

  return response.json();
};

/**
 * Get posts by community
 */
export const getPostsByCommunity = async (community: string, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> => {
  const url = new URL(`${API_URL}/posts/community/${community}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch community posts' }));
    throw new Error(error.message || 'Failed to fetch community posts');
  }

  return response.json();
};

/**
 * Get post by ID
 */
export const getPostById = async (postId: string): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts/${postId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch post' }));
    throw new Error(error.message || 'Failed to fetch post');
  }

  return response.json();
};

/**
 * Update a post
 */
export const updatePost = async (postId: string, updates: Partial<CreatePostData>): Promise<Post> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update post' }));
    throw new Error(error.message || 'Failed to update post');
  }

  return response.json();
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<{ message: string }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete post' }));
    throw new Error(error.message || 'Failed to delete post');
  }

  return response.json();
};

/**
 * Upvote a post
 */
export const upvotePost = async (postId: string): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts/${postId}/upvote`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upvote post' }));
    throw new Error(error.message || 'Failed to upvote post');
  }

  return response.json();
};

/**
 * Downvote a post
 */
export const downvotePost = async (postId: string): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts/${postId}/downvote`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to downvote post' }));
    throw new Error(error.message || 'Failed to downvote post');
  }

  return response.json();
};

/**
 * Toggle like on a post (like/unlike)
 */
export const toggleLikePost = async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to toggle like' }));
    throw new Error(error.message || 'Failed to toggle like');
  }

  return response.json();
};

/**
 * Get like status for a post
 */
export const getPostLikeStatus = async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/posts/${postId}/like-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get like status' }));
    throw new Error(error.message || 'Failed to get like status');
  }

  return response.json();
};

/**
 * Get all posts liked by current user
 */
export const getUserLikedPosts = async (): Promise<string[]> => {
  const token = getAuthToken();
  if (!token) {
    // Return empty array silently if no token (user not logged in)
    return [];
  }

  const response = await fetch(`${API_URL}/posts/user/liked-posts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get user liked posts' }));
    throw new Error(error.message || 'Failed to get user liked posts');
  }

  const data = await response.json();
  // Liked posts response received silently
  
  // Handle both array response and object response
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.posts)) {
    // Backend returns {posts: [...], total, page, totalPages}
    return data.posts;
  } else if (data && Array.isArray(data.data)) {
    // Alternative structure
    return data.data;
  }
  
  // Default to empty array
  console.warn('⚠️ Unexpected response format from getUserLikedPosts:', data);
  return [];
};

// ========================================
// CREATORS API
// ========================================

/**
 * Get creator by wallet address
 */
export const getCreatorByWalletAddress = async (walletAddress: string): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/creators/wallet/${walletAddress}`, { headers });
  
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Creator not found
    }
    const error = await response.json().catch(() => ({ message: 'Failed to get creator' }));
    throw new Error(error.message || 'Failed to get creator');
  }

  return response.json();
};

/**
 * Create creator profile
 */
export const createCreator = async (data: {
  walletAddress: string;
  username: string;
  subscriptionPrice?: number;
  category?: string;
  description?: string;
  profileCID?: string;
}): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/creators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create creator' }));
    throw new Error(error.message || 'Failed to create creator');
  }

  return response.json();
};

/**
 * Update creator profile
 */
export const updateCreator = async (
  creatorId: string,
  data: {
    username?: string;
    subscriptionPrice?: number;
    category?: string;
    description?: string;
    profileCID?: string;
  }
): Promise<any> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/creators/${creatorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update creator' }));
    throw new Error(error.message || 'Failed to update creator');
  }

  return response.json();
};

/**
 * Update or create creator subscription price
 */
export const updateCreatorSubscriptionPrice = async (
  walletAddress: string,
  subscriptionPriceUSD: number
): Promise<any> => {
  console.log(`💰 Updating subscription price for ${walletAddress}: $${subscriptionPriceUSD}`);
  
  try {
    // First, try to get existing creator profile
    const existingCreator = await getCreatorByWalletAddress(walletAddress);
    
    if (existingCreator) {
      // Update existing creator
      console.log('📝 Updating existing creator:', existingCreator.id);
      return await updateCreator(existingCreator.id, { subscriptionPrice: subscriptionPriceUSD });
    } else {
      // Create new creator profile
      console.log('🆕 Creating new creator profile');
      const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      return await createCreator({
        walletAddress,
        username: userProfile.username || `creator_${Date.now()}`,
        subscriptionPrice: subscriptionPriceUSD,
        category: userProfile.category || 'general',
        description: userProfile.bio || '',
      });
    }
  } catch (error) {
    console.error('❌ Error updating creator subscription price:', error);
    throw error;
  }
};

// ============================================================================
// COMMENTS API
// ============================================================================

export interface CreateCommentData {
  postId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  parentId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  parentId?: string;
  likes: number;
  isEdited: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    role?: string;
    isCreator: boolean;
    creator?: {
      id: string;
      subscriptionPrice: any;
    };
  };
  repliesCount: number;
}

/**
 * Create a new comment
 */
export const createComment = async (commentData: CreateCommentData): Promise<Comment> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create comment' }));
    throw new Error(error.message || 'Failed to create comment');
  }

  return response.json();
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string, page: number = 1, limit: number = 50): Promise<Comment[]> => {
  const response = await fetch(`${API_URL}/comments/post/${postId}?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get comments' }));
    throw new Error(error.message || 'Failed to get comments');
  }

  return response.json();
};

/**
 * Get replies for a comment
 */
export const getCommentReplies = async (commentId: string, page: number = 1, limit: number = 20): Promise<Comment[]> => {
  const response = await fetch(`${API_URL}/comments/${commentId}/replies?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get replies' }));
    throw new Error(error.message || 'Failed to get replies');
  }

  return response.json();
};

/**
 * Update a comment
 */
export const updateComment = async (commentId: string, updates: Partial<CreateCommentData>): Promise<Comment> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update comment' }));
    throw new Error(error.message || 'Failed to update comment');
  }

  return response.json();
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete comment' }));
    throw new Error(error.message || 'Failed to delete comment');
  }
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Get notifications for current user
 */
export const getNotifications = async (limit: number = 50): Promise<any[]> => {
  const token = getAuthToken();
  if (!token) return [];

  const response = await fetch(`${API_URL}/notifications?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get notifications' }));
    throw new Error(error.message || 'Failed to get notifications');
  }

  return response.json();
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  const token = getAuthToken();
  if (!token) return 0;

  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.unreadCount || 0;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) return;

  await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const token = getAuthToken();
  if (!token) return;

  await fetch(`${API_URL}/notifications/read-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) return;

  await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get user followers count
 */
export const getUserFollowersCount = async (userId: string): Promise<number> => {
  const response = await fetch(`${API_URL}/users/${userId}/followers?page=1&limit=1`);
  
  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.total || 0;
};

/**
 * Get creator subscribers count
 */
export const getCreatorSubscribersCount = async (creatorId: string): Promise<number> => {
  const token = getAuthToken();
  if (!token) return 0;

  try {
    const response = await fetch(`${API_URL}/subscriptions/my-subscribers?page=1&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.error('Error getting subscribers count:', error);
    return 0;
  }
};

/**
 * Get creator stats (includes subscribers, earnings, etc.)
 */
export const getCreatorStats = async (creatorId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/creators/${creatorId}/stats`);
  
  if (!response.ok) {
    return null;
  }

  return response.json();
};

/**
 * Get my subscriptions (subscribed creators)
 */
export const getMySubscriptions = async (page: number = 1, limit: number = 20): Promise<{ subscriptions: any[]; total: number; page: number; totalPages: number }> => {
  const token = getAuthToken();
  if (!token) {
    return { subscriptions: [], total: 0, page: 1, totalPages: 0 };
  }

  const url = new URL(`${API_URL}/subscriptions/my-subscriptions`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('activeOnly', 'true');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { subscriptions: [], total: 0, page: 1, totalPages: 0 };
  }

  return response.json();
};

/**
 * Get my followers (users following me)
 */
export const getMyFollowers = async (userId: string, page: number = 1, limit: number = 20): Promise<{ users: any[]; total: number; page: number; totalPages: number }> => {
  const url = new URL(`${API_URL}/users/${userId}/followers`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    return { users: [], total: 0, page: 1, totalPages: 0 };
  }

  return response.json();
};

/**
 * Get users I'm following
 */
export const getMyFollowing = async (userId: string, page: number = 1, limit: number = 20): Promise<{ users: any[]; total: number; page: number; totalPages: number }> => {
  const url = new URL(`${API_URL}/users/${userId}/following`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    return { users: [], total: 0, page: 1, totalPages: 0 };
  }

  return response.json();
};
