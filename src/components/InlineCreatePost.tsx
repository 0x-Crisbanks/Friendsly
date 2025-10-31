import React, { useState, useRef, useEffect } from 'react';
import { Image, Video, BarChart3, Smile, MapPin, Calendar, Send, X, Plus, Globe, Users, Lock, DollarSign, Tag, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useWeb3 } from '../context/Web3Context';
import { uploadImage, createPost, CreatePostData } from '../utils/api';
import TagsModal from './TagsModal';
import toast from 'react-hot-toast';

interface InlineCreatePostProps {
  communityName?: string;
  communityIcon?: string;
  communityMembers?: string;
  placeholder?: string;
  onPostCreated?: (post: any) => void;
}

const InlineCreatePost: React.FC<InlineCreatePostProps> = ({
  communityName,
  communityIcon,
  communityMembers,
  placeholder = "What's on your mind?",
  onPostCreated
}) => {
  const { isAuthenticated, userProfile } = useWeb3();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'poll'>('text');
  const [visibility, setVisibility] = useState<'public' | 'subscribers' | 'ppv'>('public');
  const [price, setPrice] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isPosting, setIsPosting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [selectedCommunityForPost, setSelectedCommunityForPost] = useState(communityName || 'r/Blockchain');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user profile data
  const getUserProfile = () => {
    try {
      const storedProfile = localStorage.getItem('user_profile');
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
    return null;
  };

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
      
      // Create preview URLs
      const previews = acceptedFiles.map(file => URL.createObjectURL(file));
      setFilePreview(previews);
      
      // Set content type based on file type
      if (acceptedFiles[0]) {
        if (acceptedFiles[0].type.startsWith('image/')) {
          setContentType('image');
        } else if (acceptedFiles[0].type.startsWith('video/')) {
          setContentType('video');
        }
      }
      
      toast.success(`${acceptedFiles.length} file(s) uploaded`);
    },
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles: 4,
    disabled: !isExpanded
  });

  const handleExpand = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setContent('');
    setTitle('');
    setSelectedFiles([]);
    setFilePreview([]);
    setContentType('text');
    setVisibility('public');
    setPrice('');
    setPollOptions(['', '']);
    setTags([]);
    setNewTag('');
    setShowTagInput(false);
  };

  const handlePost = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!content.trim() && selectedFiles.length === 0 && contentType !== 'poll') {
      toast.error('Please add some content to your post');
      return;
    }

    if (contentType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) {
      toast.error('Please add at least 2 poll options');
      return;
    }

    if (visibility === 'ppv' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please set a valid price for pay-per-view content');
      return;
    }

    setIsPosting(true);

    try {
      // Upload image to Supabase if there's a file
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedFiles.length > 0 && contentType === 'image') {
        try {
          console.log('📤 Uploading post image to Supabase...');
          uploadedImageUrl = await uploadImage(selectedFiles[0], 'content');
          console.log('✅ Image uploaded:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('❌ Error uploading image:', uploadError);
          toast.error('Failed to upload image. Please try again.');
          setIsPosting(false);
          return;
        }
      }
      
      // Prepare post data for backend
      const postData: CreatePostData = {
        title: title.trim() || undefined,
        content: content.trim(),
        imageUrl: uploadedImageUrl,
        type: contentType.toUpperCase() as 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL',
        community: selectedCommunityForPost.toLowerCase().replace('r/', ''),
        communityIcon: availableCommunities.find(c => c.name === selectedCommunityForPost)?.icon || '⛓️',
        visibility: visibility.toUpperCase() as 'PUBLIC' | 'SUBSCRIBERS' | 'PPV',
        isPPV: visibility === 'ppv',
        priceUSD: visibility === 'ppv' ? parseFloat(price) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        pollOptions: contentType === 'poll' ? { options: pollOptions.filter(opt => opt.trim()) } : undefined,
      };

      // Create post via backend API
      console.log('📤 Creating post via backend API...');
      const createdPost = await createPost(postData);
      console.log('✅ Post created:', createdPost);

      // Call callback if provided
      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('postCreated', { detail: createdPost }));

      toast.success('🎉 Post created successfully!');
      handleCollapse();

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Available communities for selection
  const availableCommunities = [
    { id: 'blockchain', name: 'r/Blockchain', icon: '⛓️', members: '234K' },
    { id: 'cryptoart', name: 'r/CryptoArt', icon: '🎨', members: '125K' },
    { id: 'defi', name: 'r/DeFi', icon: '💰', members: '89K' },
    { id: 'web3creators', name: 'r/Web3Creators', icon: '🚀', members: '67K' },
    { id: 'nfts', name: 'r/NFTs', icon: '🖼️', members: '156K' },
    { id: 'ethereum', name: 'r/ethereum', icon: '⟠', members: '1.2M' },
    { id: 'bitcoin', name: 'r/Bitcoin', icon: '₿', members: '4.5M' },
    { id: 'solana', name: 'r/solana', icon: '◎', members: '890K' },
  ];

  const handleCommunitySelect = (community: any) => {
    setSelectedCommunityForPost(community.name);
    setShowCommunitySelector(false);
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
      <div className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <img
              src={currentUserAvatar}
              alt="Your avatar"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-600 object-cover"
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Title Input (only when expanded) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3"
                >
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title (optional)"
                    className="w-full px-0 py-2 bg-transparent text-white text-lg font-semibold placeholder-gray-500 border-none outline-none focus:ring-0"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Text Input */}
            <div className="relative">
              {isExpanded ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-0 py-2 bg-transparent text-white text-base sm:text-lg placeholder-gray-400 border-none outline-none resize-none focus:ring-0 min-h-[80px]"
                  rows={3}
                />
              ) : (
                <button
                  onClick={handleExpand}
                  className="w-full text-left px-4 py-3 sm:py-4 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 hover:border-gray-500 rounded-xl sm:rounded-2xl text-gray-400 hover:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <span className="text-base sm:text-lg">{placeholder}</span>
                </button>
              )}
            </div>

            {/* File Upload Area */}
            <AnimatePresence>
              {isExpanded && isDragActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4 p-8 border-2 border-dashed border-primary-500 rounded-xl bg-primary-500/10 text-center"
                >
                  <p className="text-primary-400 font-medium">Drop files here to upload</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Preview */}
            <AnimatePresence>
              {filePreview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden"
                >
                  {filePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== index);
                          const newPreviews = filePreview.filter((_, i) => i !== index);
                          setSelectedFiles(newFiles);
                          setFilePreview(newPreviews);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Poll Options */}
            <AnimatePresence>
              {isExpanded && contentType === 'poll' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center space-x-2 px-3 py-2 text-primary-400 hover:text-primary-300 hover:bg-gray-700/30 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add option</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tags Section */}
            <AnimatePresence>
              {isExpanded && (showTagInput || tags.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {/* Existing Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center space-x-1 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30"
                        >
                          <span>#{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-primary-400 hover:text-primary-300 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Tag Input */}
                  {showTagInput && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        maxLength={20}
                      />
                      <button
                        onClick={addTag}
                        disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 5}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag('');
                        }}
                        className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Add Tag Button */}
                  {!showTagInput && tags.length < 5 && (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-primary-400 hover:text-primary-300 hover:bg-gray-700/30 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add tag</span>
                    </button>
                  )}
                  
                  {tags.length >= 5 && (
                    <p className="text-gray-500 text-xs mt-2">Maximum 5 tags allowed</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mt-3 sm:mt-4 space-y-3 xs:space-y-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Media Button */}
                {isExpanded ? (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <button
                      className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                        contentType === 'image' || selectedFiles.length > 0
                          ? 'text-primary-400 bg-primary-500/20'
                          : 'text-gray-400 hover:text-primary-400 hover:bg-gray-700/30'
                      }`}
                    >
                      <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm font-medium hidden sm:inline">Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleExpand}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 text-gray-400 hover:text-primary-400 hover:bg-gray-700/30 rounded-lg transition-all duration-200 text-xs sm:text-sm"
                  >
                    <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Photo</span>
                  </button>
                )}
                
                {/* Video Button */}
                <button
                  onClick={() => {
                    if (!isExpanded) {
                      handleExpand();
                    }
                    setContentType(contentType === 'video' ? 'text' : 'video');
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                    contentType === 'video'
                      ? 'text-primary-400 bg-primary-500/20'
                      : 'text-gray-400 hover:text-primary-400 hover:bg-gray-700/30'
                  }`}
                >
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Video</span>
                </button>
                
                {/* Poll Button */}
                <button
                  onClick={() => {
                    if (!isExpanded) {
                      handleExpand();
                    }
                    setContentType(contentType === 'poll' ? 'text' : 'poll');
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                    contentType === 'poll'
                      ? 'text-primary-400 bg-primary-500/20'
                      : 'text-gray-400 hover:text-primary-400 hover:bg-gray-700/30'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Poll</span>
                </button>
                
                {/* Tags Button */}
                <button
                  onClick={() => {
                    if (!isExpanded) {
                      handleExpand();
                    }
                    setShowTagsModal(true);
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                    tags.length > 0
                      ? 'text-primary-400 bg-primary-500/20'
                      : 'text-gray-400 hover:text-primary-400 hover:bg-gray-700/30'
                  }`}
                >
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Tags</span>
                  {tags.length > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {tags.length}
                    </span>
                  )}
                </button>
                
                {/* Emoji Button */}
                <button 
                  onClick={() => {
                    if (!isExpanded) {
                      handleExpand();
                    }
                    // Aquí puedes agregar la lógica para mostrar un selector de emojis
                    toast('Emoji selector coming soon!');
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 text-gray-400 hover:text-primary-400 hover:bg-gray-700/30 rounded-lg transition-all duration-200 text-xs sm:text-sm"
                >
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Emoji</span>
                </button>
              </div>
              
              {/* Post/Cancel Buttons */}
              <div className="flex items-center space-x-2 w-full xs:w-auto">
                {isExpanded && (
                  <button
                    onClick={handleCollapse}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={isExpanded ? handlePost : handleExpand}
                  disabled={isPosting || (isExpanded && !content.trim() && selectedFiles.length === 0 && contentType !== 'poll')}
                  className="flex items-center justify-center space-x-2 px-3 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full xs:w-auto"
                >
                  {isPosting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      {isExpanded ? <Send className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{isExpanded ? 'Post' : 'Post'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Community Context */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="relative">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Posting in</span>
                <button
                  onClick={() => setShowCommunitySelector(!showCommunitySelector)}
                  className="flex items-center space-x-1 text-primary-400 font-medium hover:text-primary-300 transition-colors cursor-pointer hover:underline"
                >
                  <span className="flex items-center">
                    {availableCommunities.find(c => c.name === selectedCommunityForPost)?.icon && (
                      <span className="mr-1">{availableCommunities.find(c => c.name === selectedCommunityForPost)?.icon}</span>
                    )}
                    {selectedCommunityForPost}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCommunitySelector ? 'rotate-180' : ''}`} />
                </button>
                <span>•</span>
                <span>{availableCommunities.find(c => c.name === selectedCommunityForPost)?.members || '234K'} members</span>
              </div>

              {/* Community Selector Dropdown */}
              <AnimatePresence>
                {showCommunitySelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="fixed mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-xl shadow-2xl z-[999999] overflow-hidden"
                    style={{
                      top: 'auto',
                      left: 'auto',
                      transform: 'none'
                    }}
                  >
                    <div className="p-3 border-b border-gray-700/50">
                      <h3 className="text-white font-semibold text-base flex items-center space-x-2 relative">
                        <Users className="w-4 h-4 text-primary-400" />
                        <span>Select a community</span>
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {availableCommunities.map((community) => (
                        <button
                          key={community.id}
                          onClick={() => handleCommunitySelect(community)}
                          className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-700/50 transition-colors text-left ${
                            selectedCommunityForPost === community.name ? 'bg-primary-500/20 border-l-4 border-primary-500' : ''
                          }`}
                        >
                          <span className="text-xl">{community.icon}</span>
                          <div className="flex-1">
                            <div className="text-white font-medium">{community.name}</div>
                            <div className="text-gray-400 text-xs">{community.members} members</div>
                          </div>
                          {selectedCommunityForPost === community.name && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      
      {/* Tags Modal */}
      {showTagsModal && (
        <TagsModal
          isOpen={showTagsModal}
          onClose={() => setShowTagsModal(false)}
          selectedTags={tags}
          onTagsChange={setTags}
          communityName={selectedCommunityForPost.replace('r/', '')}
        />
      )}
    </div>
  );
};

export default InlineCreatePost;