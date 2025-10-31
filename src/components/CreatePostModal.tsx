import React, { useState } from 'react';
import { X, Upload, Image, Video, FileText, DollarSign, Lock, Globe, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useWeb3 } from '../context/Web3Context';
import { uploadImage, createPost, CreatePostData } from '../utils/api';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { isAuthenticated } = useWeb3();
  const [contentType, setContentType] = useState<'image' | 'video' | 'text'>('text');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [isPPV, setIsPPV] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  // Determine if user is a creator
  const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  const isCreator = userProfile?.isCreator === true ||
                    userProfile?.role?.toLowerCase() === 'creator' ||
                    userProfile?.userType?.toLowerCase() === 'creator' ||
                    !!userProfile?.creator ||
                    false;

  const onDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    toast.success(`${acceptedFiles.length} file(s) uploaded`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: contentType === 'image' 
      ? { 'image/*': [] }
      : contentType === 'video'
      ? { 'video/*': [] }
      : { 'text/*': [] },
    maxFiles: contentType === 'text' ? 1 : 10,
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setIsSubscriberOnly(false);
    setIsPPV(false);
    setTags([]);
    setUploadedFiles([]);
    setContentType('text');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }

    if (contentType !== 'text' && uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (isPPV && (!price || parseFloat(price) <= 0)) {
      toast.error('Please set a valid price for pay-per-view content');
      return;
    }

    setIsPosting(true);

    try {
      // Upload image to Supabase if there's a file
      let uploadedImageUrl: string | undefined = undefined;
      if (contentType === 'image' && uploadedFiles.length > 0) {
        try {
          console.log('📤 Uploading post image to Supabase...');
          uploadedImageUrl = await uploadImage(uploadedFiles[0], 'content');
          console.log('✅ Image uploaded:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('❌ Error uploading image:', uploadError);
          toast.error('Failed to upload image. Please try again.');
          setIsPosting(false);
          return;
        }
      }
      
      // Determine visibility
      let visibility: 'PUBLIC' | 'SUBSCRIBERS' | 'PPV' = 'PUBLIC';
      if (isPPV) {
        visibility = 'PPV';
      } else if (isSubscriberOnly) {
        visibility = 'SUBSCRIBERS';
      }

      // Prepare post data for backend
      const postData: CreatePostData = {
        title: title.trim(),
        content: description.trim(),
        imageUrl: uploadedImageUrl,
        type: contentType.toUpperCase() as 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL',
        visibility,
        isPPV,
        priceUSD: isPPV ? parseFloat(price) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      // Create post via backend API
      console.log('📤 Creating post via backend API...');
      const createdPost = await createPost(postData);
      console.log('✅ Post created:', createdPost);

      // Call the callback to update the feed
      onPostCreated(createdPost);

      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('postCreated', { detail: createdPost }));

      toast.success('🎉 Post created successfully!');
      resetForm();
      onClose();

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
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
            className="relative w-full max-w-2xl bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary-500/10 to-secondary-500/10 p-6 border-b border-gray-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Post</h2>
                  <p className="text-gray-400 text-sm mt-1">Share your content with your audience</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Content Type</label>
                <div className="flex space-x-4">
                  {[
                    { type: 'text', icon: FileText, label: 'Text Post' },
                    { type: 'image', icon: Image, label: 'Photo' },
                    { type: 'video', icon: Video, label: 'Video' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type as any)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                        contentType === type
                          ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              {contentType !== 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Upload {contentType === 'image' ? 'Photos' : 'Videos'}
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      {isDragActive
                        ? 'Drop files here...'
                        : `Drag & drop ${contentType}s here, or click to select`}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {contentType === 'image' ? 'JPG, PNG, GIF up to 10MB each' : 'MP4, MOV up to 100MB each'}
                    </p>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-2">Uploaded files:</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>📎</span>
                            <span>{file.name}</span>
                            <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your content a catchy title..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your content..."
                  rows={contentType === 'text' ? 8 : 4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center space-x-1 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Content Settings - ONLY for creators */}
              {isCreator && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Content Settings</h3>
                
                {/* Visibility Options */}
                <div className="space-y-4">
                  {/* Free Content */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Free Content</p>
                        <p className="text-gray-400 text-sm">Everyone can view this content</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!isSubscriberOnly && !isPPV}
                        onChange={() => {
                          setIsSubscriberOnly(false);
                          setIsPPV(false);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-gray-600 rounded-full peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors"></div>
                    </label>
                  </div>

                  {/* Subscriber Only */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Subscriber Only</p>
                        <p className="text-gray-400 text-sm">Only subscribers can view this content</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={isSubscriberOnly && !isPPV}
                        onChange={() => {
                          setIsSubscriberOnly(true);
                          setIsPPV(false);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-gray-600 rounded-full peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors"></div>
                    </label>
                  </div>

                  {/* Pay Per View */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Pay Per View</p>
                        <p className="text-gray-400 text-sm">Charge extra for this premium content</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={isPPV}
                        onChange={() => {
                          setIsSubscriberOnly(false);
                          setIsPPV(true);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 border-gray-600 rounded-full peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors"></div>
                    </label>
                  </div>
                </div>

                {/* PPV Price */}
                {isPPV && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="9.99"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={onClose}
                  disabled={isPosting}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPosting}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors disabled:opacity-50"
                >
                  {isPosting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Create Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;