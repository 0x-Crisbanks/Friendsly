import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, Heart, Reply, MoreHorizontal, Flag, Trash2, Edit3, Image as ImageIcon, Video, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { uploadImage } from '../utils/api';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  likes: number;
  replies: Reply[];
  isLiked: boolean;
  isEdited: boolean;
}

interface Reply {
  id: number;
  commentId: number;
  userId: number;
  username: string;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isEdited: boolean;
  replies?: Reply[]; // Nested replies support
  parentReplyId?: number; // Track which reply this is responding to
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postTitle: string;
  postAuthor: string;
  initialCommentCount: number;
  onCommentCountChange: (newCount: number) => void;
}

interface ReplyingTo {
  commentId: number;
  replyId?: number; // If replying to a nested reply
  username: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  postAuthor,
  initialCommentCount,
  onCommentCountChange,
}) => {
  const { isAuthenticated, userProfile } = useWeb3();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentMediaFile, setCommentMediaFile] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMediaFiles, setReplyMediaFiles] = useState<{ [key: string]: File }>({});
  const [replyMediaPreviews, setReplyMediaPreviews] = useState<{ [key: string]: string }>({});
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingReply, setEditingReply] = useState<{ commentId: number; replyId: number } | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Mock current user data
  const getCurrentUser = () => {
    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      return {
        id: profile.id || 1,
        username: profile.username || 'user',
        avatar: profile.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      };
    }
    return {
      id: 1,
      username: userProfile?.email?.split('@')[0] || 'user',
      avatar: userProfile?.avatarUrl || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    };
  };

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load comments from localStorage
  // Clean up old mock comments on first mount (one-time cleanup)
  useEffect(() => {
    const hasCleanedComments = localStorage.getItem('comments_cleaned');
    if (!hasCleanedComments) {
      console.log('🧹 Cleaning up old mock comments from localStorage...');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('comments_')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('comments_cleaned', 'true');
      console.log('✅ Old comments cleaned');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId, sortBy]);

  const loadComments = () => {
    try {
      console.log('🔍 Loading comments for postId:', postId, 'Type:', typeof postId);
      
      // Debug: Show all comment keys in localStorage
      const commentKeys = Object.keys(localStorage).filter(key => key.startsWith('comments_'));
      console.log('🗂️ All comment keys in localStorage:', commentKeys);
      
      const savedComments = localStorage.getItem(`comments_${postId}`);
      console.log('💾 Saved comments from localStorage:', savedComments);
      
      if (savedComments) {
        let loadedComments = JSON.parse(savedComments);
        console.log('📝 Parsed comments:', loadedComments);
        
        // Sort comments
        loadedComments = sortComments(loadedComments);
        
        setComments(loadedComments);
        
        // Update comment count
        const totalComments = loadedComments.reduce((total: number, comment: Comment) => {
          return total + 1 + countNestedReplies(comment.replies);
        }, 0);
        console.log('💬 Total comments count:', totalComments);
        onCommentCountChange(totalComments);
      } else {
        console.log('⚠️ No comments found in localStorage for this post');
        // Start with empty comments array for posts without comments
        setComments([]);
        onCommentCountChange(0);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const sortComments = (commentsToSort: Comment[]) => {
    switch (sortBy) {
      case 'newest':
        return [...commentsToSort].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'oldest':
        return [...commentsToSort].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'popular':
        return [...commentsToSort].sort((a, b) => b.likes - a.likes);
      default:
        return commentsToSort;
    }
  };

  const saveComments = (commentsToSave: Comment[]) => {
    localStorage.setItem(`comments_${postId}`, JSON.stringify(commentsToSave));
  };

  // Handle media file selection for comments
  const handleCommentMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📎 Comment media selected:', file);
    if (file) {
      setCommentMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentMediaPreview(reader.result as string);
        console.log('✅ Comment media preview ready');
      };
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Handle media file selection for replies
  const handleReplyMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, replyKey: string) => {
    const file = e.target.files?.[0];
    console.log('📎 Reply media selected:', file, 'for key:', replyKey);
    if (file) {
      setReplyMediaFiles(prev => ({ ...prev, [replyKey]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyMediaPreviews(prev => ({ ...prev, [replyKey]: reader.result as string }));
        console.log('✅ Reply media preview ready for key:', replyKey);
      };
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Remove media preview for comments
  const removeCommentMedia = () => {
    setCommentMediaFile(null);
    setCommentMediaPreview(null);
  };

  // Remove media preview for replies
  const removeReplyMedia = (replyKey: string) => {
    setReplyMediaFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[replyKey];
      return newFiles;
    });
    setReplyMediaPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[replyKey];
      return newPreviews;
    });
  };

  // Scroll to bottom of comments
  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim() && !commentMediaFile) {
      toast.error('Please enter a comment or attach media');
      return;
    }

    try {
      setIsUploadingMedia(true);
      const currentUser = getCurrentUser();
      
      // Upload media if selected
      let mediaUrl = '';
      let isVideo = false;
      if (commentMediaFile) {
        const fileType = commentMediaFile.type;
        isVideo = fileType.startsWith('video/');
        mediaUrl = await uploadImage(commentMediaFile, 'content');
      }

      const comment: Comment = {
        id: Date.now(),
        postId,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        content: newComment.trim(),
        imageUrl: !isVideo ? mediaUrl : undefined,
        videoUrl: isVideo ? mediaUrl : undefined,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: [],
        isLiked: false,
        isEdited: false,
      };

      const updatedComments = [comment, ...comments];
      setComments(updatedComments);
      saveComments(updatedComments);
      setNewComment('');
      removeCommentMedia();

      // Update comment count (including all nested replies)
      const totalComments = updatedComments.reduce((total, comment) => {
        return total + 1 + countNestedReplies(comment.replies);
      }, 0);
      onCommentCountChange(totalComments);

      // Dispatch custom event to notify all components in SAME window
      window.dispatchEvent(new CustomEvent('commentAdded', { 
        detail: { postId, commentCount: totalComments } 
      }));

      // Trigger storage event for cross-window sync
      localStorage.setItem('comment_sync', JSON.stringify({
        postId,
        commentCount: totalComments,
        timestamp: Date.now()
      }));
      localStorage.removeItem('comment_sync');

      toast.success('Comment added!');
      scrollToBottom();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Helper function to add reply to nested replies recursively
  const addReplyToNestedReplies = (replies: Reply[], targetReplyId: number, newReply: Reply): Reply[] => {
    return replies.map(reply => {
      if (reply.id === targetReplyId) {
        return {
          ...reply,
          replies: [...(reply.replies || []), newReply],
        };
      } else if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: addReplyToNestedReplies(reply.replies, targetReplyId, newReply),
        };
      }
      return reply;
    });
  };

  // Helper function to count all nested replies
  const countNestedReplies = (replies: Reply[]): number => {
    return replies.reduce((count, reply) => {
      return count + 1 + (reply.replies ? countNestedReplies(reply.replies) : 0);
    }, 0);
  };

  const handleAddReply = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!replyingTo) return;

    // Create reply key
    const replyKey = replyingTo.replyId 
      ? `reply-${replyingTo.commentId}-${replyingTo.replyId}`
      : `comment-${replyingTo.commentId}`;
    
    const currentMediaFile = replyMediaFiles[replyKey];

    if (!replyContent.trim() && !currentMediaFile) {
      toast.error('Please enter a reply or attach media');
      return;
    }

    try {
      setIsUploadingMedia(true);
      const currentUser = getCurrentUser();
      
      // Upload media if selected
      let mediaUrl = '';
      let isVideo = false;
      if (currentMediaFile) {
        const fileType = currentMediaFile.type;
        isVideo = fileType.startsWith('video/');
        mediaUrl = await uploadImage(currentMediaFile, 'content');
      }

      const reply: Reply = {
        id: Date.now(),
        commentId: replyingTo.commentId,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        content: replyContent.trim(),
        imageUrl: !isVideo && mediaUrl ? mediaUrl : undefined,
        videoUrl: isVideo && mediaUrl ? mediaUrl : undefined,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isEdited: false,
        replies: [],
        parentReplyId: replyingTo.replyId,
      };

      const updatedComments = comments.map(comment => {
        if (comment.id === replyingTo.commentId) {
          // If replying to a comment (not a nested reply)
          if (!replyingTo.replyId) {
            return {
              ...comment,
              replies: [...comment.replies, reply],
            };
          } else {
            // If replying to a nested reply
            return {
              ...comment,
              replies: addReplyToNestedReplies(comment.replies, replyingTo.replyId, reply),
            };
          }
        }
        return comment;
      });

      setComments(updatedComments);
      saveComments(updatedComments);
      setReplyingTo(null);
      setReplyContent('');
      removeReplyMedia(replyKey);

      // Update comment count (including all nested replies)
      const totalComments = updatedComments.reduce((total, comment) => {
        return total + 1 + countNestedReplies(comment.replies);
      }, 0);
      onCommentCountChange(totalComments);

      // Dispatch custom event to notify all components in SAME window
      window.dispatchEvent(new CustomEvent('commentAdded', { 
        detail: { postId, commentCount: totalComments } 
      }));

      // Trigger storage event for cross-window sync
      localStorage.setItem('comment_sync', JSON.stringify({
        postId,
        commentCount: totalComments,
        timestamp: Date.now()
      }));
      localStorage.removeItem('comment_sync');

      toast.success('Reply added!');
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleLikeComment = (commentId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like comments');
      return;
    }

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
        };
      }
      return comment;
    });

    setComments(updatedComments);
    saveComments(updatedComments);
  };

  // Helper function to toggle like in nested replies recursively
  const toggleLikeInReplies = (replies: Reply[], targetReplyId: number): Reply[] => {
    return replies.map(reply => {
      if (reply.id === targetReplyId) {
        return {
          ...reply,
          isLiked: !reply.isLiked,
          likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
        };
      } else if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: toggleLikeInReplies(reply.replies, targetReplyId),
        };
      }
      return reply;
    });
  };

  const handleLikeReply = (commentId: number, replyId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like replies');
      return;
    }

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: toggleLikeInReplies(comment.replies, replyId),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    saveComments(updatedComments);
  };

  const handleEditComment = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.userId === getCurrentUser().id) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          content: editContent.trim(),
          isEdited: true,
        };
      }
      return comment;
    });

    setComments(updatedComments);
    saveComments(updatedComments);
    setEditingComment(null);
    setEditContent('');
    toast.success('Comment updated!');
  };

  const handleDeleteComment = (commentId: number) => {
    const currentUser = getCurrentUser();
    const comment = comments.find(c => c.id === commentId);
    
    if (comment && comment.userId === currentUser.id) {
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      saveComments(updatedComments);

      // Update comment count (including all nested replies)
      const totalComments = updatedComments.reduce((total, comment) => {
        return total + 1 + countNestedReplies(comment.replies);
      }, 0);
      onCommentCountChange(totalComments);

      // Dispatch custom event to notify all components in SAME window
      window.dispatchEvent(new CustomEvent('commentAdded', { 
        detail: { postId, commentCount: totalComments } 
      }));

      // Trigger storage event for cross-window sync
      localStorage.setItem('comment_sync', JSON.stringify({
        postId,
        commentCount: totalComments,
        timestamp: Date.now()
      }));
      localStorage.removeItem('comment_sync');

      toast.success('Comment deleted');
    }
  };

  // Helper function to edit reply recursively
  const editReplyInReplies = (replies: Reply[], targetReplyId: number, newContent: string): Reply[] => {
    return replies.map(reply => {
      if (reply.id === targetReplyId) {
        return {
          ...reply,
          content: newContent,
          isEdited: true,
        };
      } else if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: editReplyInReplies(reply.replies, targetReplyId, newContent),
        };
      }
      return reply;
    });
  };

  // Helper function to delete reply recursively
  const deleteReplyInReplies = (replies: Reply[], targetReplyId: number): Reply[] => {
    return replies
      .filter(reply => reply.id !== targetReplyId)
      .map(reply => {
        if (reply.replies && reply.replies.length > 0) {
          return {
            ...reply,
            replies: deleteReplyInReplies(reply.replies, targetReplyId),
          };
        }
        return reply;
      });
  };

  const handleEditReply = (commentId: number, replyId: number, currentContent: string) => {
    const currentUser = getCurrentUser();
    setEditingReply({ commentId, replyId });
    setEditReplyContent(currentContent);
  };

  const handleSaveReplyEdit = () => {
    if (!editReplyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    if (!editingReply) return;

    const updatedComments = comments.map(comment => {
      if (comment.id === editingReply.commentId) {
        return {
          ...comment,
          replies: editReplyInReplies(comment.replies, editingReply.replyId, editReplyContent.trim()),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    saveComments(updatedComments);
    setEditingReply(null);
    setEditReplyContent('');
    toast.success('Reply updated!');
  };

  const handleDeleteReply = (commentId: number, replyId: number) => {
    const currentUser = getCurrentUser();
    
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: deleteReplyInReplies(comment.replies, replyId),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    saveComments(updatedComments);

    // Update comment count
    const totalComments = updatedComments.reduce((total, comment) => {
      return total + 1 + countNestedReplies(comment.replies);
    }, 0);
    onCommentCountChange(totalComments);

    // Dispatch custom event to notify all components in SAME window
    window.dispatchEvent(new CustomEvent('commentAdded', { 
      detail: { postId, commentCount: totalComments } 
    }));

    // Trigger storage event for cross-window sync
    localStorage.setItem('comment_sync', JSON.stringify({
      postId,
      commentCount: totalComments,
      timestamp: Date.now()
    }));
    localStorage.removeItem('comment_sync');

    toast.success('Reply deleted');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + countNestedReplies(comment.replies);
  }, 0);

  // Toggle expand/collapse replies
  const toggleExpandReplies = (key: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Handle image modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Recursive component to render nested replies
  const renderReply = (reply: Reply, commentId: number, depth: number = 0): JSX.Element => {
    const isReplyingToThis = replyingTo?.commentId === commentId && replyingTo?.replyId === reply.id;
    const replyKey = `reply-${commentId}-${reply.id}`;
    
    return (
      <div key={reply.id} className={`${depth > 0 ? 'mt-3 pl-4 border-l-2 border-gray-600/30' : ''}`}>
        <div className="bg-gray-600/20 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <img
                src={reply.userAvatar}
                alt={reply.username}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium text-sm">@{reply.username}</span>
                  {reply.isEdited && (
                    <span className="text-gray-500 text-xs">(edited)</span>
                  )}
                </div>
                <span className="text-gray-400 text-xs">{formatTimeAgo(reply.timestamp)}</span>
              </div>
            </div>
            
            {/* Edit and Delete buttons for reply owner */}
            {reply.userId === getCurrentUser().id && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditReply(commentId, reply.id, reply.content)}
                  className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteReply(commentId, reply.id)}
                  className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Reply Content - Show edit form or content */}
          {editingReply?.commentId === commentId && editingReply?.replyId === reply.id ? (
            <div className="mb-2">
              <textarea
                value={editReplyContent}
                onChange={(e) => setEditReplyContent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-xs resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                rows={2}
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleSaveReplyEdit}
                  className="px-3 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingReply(null);
                    setEditReplyContent('');
                  }}
                  className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {reply.content && <p className="text-gray-200 text-sm mb-2 leading-relaxed">{reply.content}</p>}
              
              {/* Reply Media */}
              {reply.imageUrl && (
                <img 
                  src={reply.imageUrl} 
                  alt="Reply image" 
                  onClick={() => openImageModal(reply.imageUrl!)}
                  className="w-full max-h-64 object-contain rounded-lg mb-2 bg-gray-900/30 cursor-pointer hover:opacity-90 transition-opacity" 
                />
              )}
              {reply.videoUrl && (
                <video src={reply.videoUrl} controls className="w-full max-h-64 rounded-lg mb-2" />
              )}
            </>
          )}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleLikeReply(commentId, reply.id)}
              disabled={!isAuthenticated}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                reply.isLiked
                  ? 'text-red-400'
                  : 'text-gray-400 hover:text-red-400'
              } disabled:opacity-50`}
            >
              <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
              <span>{reply.likes}</span>
            </button>
            
            {/* Reply button for nested replies */}
            <button
              onClick={() => setReplyingTo(
                isReplyingToThis
                  ? null
                  : { commentId, replyId: reply.id, username: reply.username }
              )}
              disabled={!isAuthenticated}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>
        </div>

        {/* Reply Input for nested reply */}
        {isReplyingToThis && (() => {
          const currentReplyKey = `reply-${commentId}-${reply.id}`;
          const currentReplyMedia = replyMediaFiles[currentReplyKey];
          const currentReplyPreview = replyMediaPreviews[currentReplyKey];
          
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pl-4 border-l-2 border-primary-500/30"
            >
              <div className="flex space-x-2">
                <img
                  src={getCurrentUser().avatar}
                  alt="Your avatar"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (replyContent.trim() || currentReplyMedia) {
                          handleAddReply();
                        }
                      }
                    }}
                    placeholder={`Reply to @${reply.username}... (Press Enter to send)`}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-xs resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    rows={2}
                  />
                  
                  {/* Reply Media Preview */}
                  {currentReplyPreview && (
                    <div className="relative mt-2 rounded-lg overflow-hidden">
                      {currentReplyMedia?.type.startsWith('video/') ? (
                        <video src={currentReplyPreview} controls className="w-full max-h-32 rounded-lg" />
                      ) : (
                        <img src={currentReplyPreview} alt="Preview" className="w-full max-h-32 object-cover rounded-lg" />
                      )}
                      <button
                        onClick={() => removeReplyMedia(currentReplyKey)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleReplyMediaSelect(e, currentReplyKey)}
                      className="hidden"
                      id={`reply-media-input-${reply.id}`}
                    />
                    <label
                      htmlFor={`reply-media-input-${reply.id}`}
                      className="cursor-pointer p-1 text-gray-400 hover:text-primary-400 rounded hover:bg-gray-700/50 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAddReply}
                        disabled={(!replyContent.trim() && !currentReplyMedia) || isUploadingMedia}
                        className="px-3 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        {isUploadingMedia ? 'Uploading...' : 'Reply'}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                          removeReplyMedia(currentReplyKey);
                        }}
                        className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Nested replies */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="space-y-3">
            {/* Show first reply or all if expanded (for nested replies) */}
            {(expandedReplies.has(replyKey) ? reply.replies : reply.replies.slice(0, 1)).map(nestedReply => 
              renderReply(nestedReply, commentId, depth + 1)
            )}
            
            {/* View more button if there are more than 1 reply */}
            {reply.replies.length > 1 && (
              <button
                onClick={() => toggleExpandReplies(replyKey)}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors pl-4 mt-2"
              >
                {expandedReplies.has(replyKey) 
                  ? `Hide ${reply.replies.length - 1} ${reply.replies.length - 1 === 1 ? 'reply' : 'replies'}`
                  : `View ${reply.replies.length - 1} ${reply.replies.length - 1 === 1 ? 'reply' : 'replies'}`
                }
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate engagement score (likes + total replies count)
  const getEngagementScore = (comment: Comment): number => {
    const totalReplies = countNestedReplies(comment.replies);
    return comment.likes + totalReplies;
  };

  // Sort comments based on selected sort option
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        // Newest comments last (most recent at the bottom, like a chat)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      
      case 'oldest':
        // Oldest comments last (newest at the bottom)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      
      case 'popular':
        // Sort by engagement score (likes + replies) - highest first
        const scoreA = getEngagementScore(a);
        const scoreB = getEngagementScore(b);
        return scoreB - scoreA; // Descending order
      
      default:
        return 0;
    }
  });

  return (
    <>
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
            className="relative w-full max-w-2xl bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary-500/10 to-secondary-500/10 p-6 border-b border-gray-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <MessageCircle className="w-6 h-6 text-primary-400" />
                    <span>Comments ({totalComments})</span>
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    on "{postTitle}" by {postAuthor}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                {['newest', 'oldest', 'popular'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option as any)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      sortBy === option
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No comments yet</p>
                  <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
                </div>
              ) : (
                sortedComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30"
                  >
                    {/* Comment Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={comment.userAvatar}
                          alt={comment.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">@{comment.username}</span>
                            {comment.isEdited && (
                              <span className="text-gray-500 text-xs">(edited)</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">{formatTimeAgo(comment.timestamp)}</span>
                        </div>
                      </div>
                      
                      {comment.userId === getCurrentUser().id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    {editingComment === comment.id ? (
                      <div className="mb-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          rows={2}
                        />
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {comment.content && <p className="text-gray-200 mb-3 leading-relaxed">{comment.content}</p>}
                        
                        {/* Comment Media */}
                        {comment.imageUrl && (
                          <img 
                            src={comment.imageUrl} 
                            alt="Comment image" 
                            onClick={() => openImageModal(comment.imageUrl!)}
                            className="w-full max-h-96 object-contain rounded-lg mb-3 bg-gray-900/30 cursor-pointer hover:opacity-90 transition-opacity" 
                          />
                        )}
                        {comment.videoUrl && (
                          <video src={comment.videoUrl} controls className="w-full max-h-96 rounded-lg mb-3" />
                        )}
                      </>
                    )}

                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!isAuthenticated}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          comment.isLiked
                            ? 'text-red-400'
                            : 'text-gray-400 hover:text-red-400'
                        } disabled:opacity-50`}
                      >
                        <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                        <span>{comment.likes}</span>
                      </button>

                      <button
                        onClick={() => setReplyingTo(
                          replyingTo?.commentId === comment.id && !replyingTo?.replyId
                            ? null
                            : { commentId: comment.id, username: comment.username }
                        )}
                        disabled={!isAuthenticated}
                        className="flex items-center space-x-1 text-sm text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </button>

                      <button className="flex items-center space-x-1 text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                        <Flag className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    </div>

                    {/* Reply Input */}
                    {replyingTo?.commentId === comment.id && !replyingTo?.replyId && (() => {
                      const currentReplyKey = `comment-${comment.id}`;
                      const currentReplyMedia = replyMediaFiles[currentReplyKey];
                      const currentReplyPreview = replyMediaPreviews[currentReplyKey];
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pl-4 border-l-2 border-primary-500/30"
                        >
                          <div className="flex space-x-2">
                            <img
                              src={getCurrentUser().avatar}
                              alt="Your avatar"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (replyContent.trim() || currentReplyMedia) {
                                      handleAddReply();
                                    }
                                  }
                                }}
                                placeholder={`Reply to @${replyingTo.username}... (Press Enter to send)`}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                rows={2}
                              />
                              
                              {/* Reply Media Preview */}
                              {currentReplyPreview && (
                                <div className="relative mt-2 rounded-lg overflow-hidden">
                                  {currentReplyMedia?.type.startsWith('video/') ? (
                                    <video src={currentReplyPreview} controls className="w-full max-h-32 rounded-lg" />
                                  ) : (
                                    <img src={currentReplyPreview} alt="Preview" className="w-full max-h-32 object-cover rounded-lg" />
                                  )}
                                  <button
                                    onClick={() => removeReplyMedia(currentReplyKey)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={(e) => handleReplyMediaSelect(e, currentReplyKey)}
                                  className="hidden"
                                  id={`comment-reply-media-input-${comment.id}`}
                                />
                                <label
                                  htmlFor={`comment-reply-media-input-${comment.id}`}
                                  className="cursor-pointer p-1 text-gray-400 hover:text-primary-400 rounded hover:bg-gray-700/50 transition-colors"
                                >
                                  <Paperclip className="w-4 h-4" />
                                </label>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleAddReply}
                                    disabled={(!replyContent.trim() && !currentReplyMedia) || isUploadingMedia}
                                    className="px-3 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 transition-colors disabled:opacity-50"
                                  >
                                    {isUploadingMedia ? 'Uploading...' : 'Reply'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                      removeReplyMedia(currentReplyKey);
                                    }}
                                    className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {/* Show first 2 replies or all if expanded */}
                        {(expandedReplies.has(`comment-${comment.id}`) ? comment.replies : comment.replies.slice(0, 2)).map((reply) => 
                          renderReply(reply, comment.id)
                        )}
                        
                        {/* View more button if there are more than 2 replies */}
                        {comment.replies.length > 2 && (
                          <button
                            onClick={() => toggleExpandReplies(`comment-${comment.id}`)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors pl-4 mt-2"
                          >
                            {expandedReplies.has(`comment-${comment.id}`) 
                              ? `Hide ${comment.replies.length - 2} ${comment.replies.length - 2 === 1 ? 'reply' : 'replies'}`
                              : `View ${comment.replies.length - 2} ${comment.replies.length - 2 === 1 ? 'reply' : 'replies'}`
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {/* Scroll anchor for auto-scroll */}
              <div ref={commentsEndRef} />
            </div>

            {/* Add Comment Input */}
            <div className="p-4 border-t border-gray-700/50 bg-gray-800/50">
              {isAuthenticated ? (
                <div className="flex space-x-3">
                  <img
                    src={getCurrentUser().avatar}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newComment.trim() || commentMediaFile) {
                            handleAddComment();
                          }
                        }
                      }}
                      placeholder="Add a comment... (Press Enter to send, Shift+Enter for new line)"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      rows={3}
                    />
                    
                    {/* Media Preview */}
                    {commentMediaPreview && (
                      <div className="relative mt-2 rounded-lg overflow-hidden">
                        {commentMediaFile?.type.startsWith('video/') ? (
                          <video src={commentMediaPreview} controls className="w-full max-h-48 rounded-lg" />
                        ) : (
                          <img src={commentMediaPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                        )}
                        <button
                          onClick={removeCommentMedia}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleCommentMediaSelect}
                          className="hidden"
                          id="comment-media-input"
                        />
                        <label
                          htmlFor="comment-media-input"
                          onClick={() => console.log('📌 Comment media label clicked')}
                          className="cursor-pointer p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-gray-700/50 transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </label>
                        <span className="text-gray-400 text-xs">
                          {newComment.length}/500 characters
                        </span>
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={(!newComment.trim() && !commentMediaFile) || isUploadingMedia}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isUploadingMedia ? 'Uploading...' : 'Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-3">Sign in to join the conversation</p>
                  <button className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors">
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {imageModalOpen && selectedImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={closeImageModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeImageModal}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-full object-contain rounded-lg max-h-[90vh]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommentsModal;