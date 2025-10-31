import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image, Video, Smile, MapPin, Calendar, BarChart3, Globe, Users, Lock, AtSign, Search, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TwitterStyleCreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  communityName?: string;
  onPost: (content: string, media?: File[]) => void;
}

const TwitterStyleCreatePost: React.FC<TwitterStyleCreatePostProps> = ({
  isOpen,
  onClose,
  communityName,
  onPost,
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [audience, setAudience] = useState<'everyone' | 'community' | 'followers'>('community');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 280;
  const remainingChars = maxLength - content.length;

  // Available tags for the community
  const availableTags = [
    { id: 'sin-etiqueta', name: 'Sin etiqueta', description: 'Publicación sin categoría específica', color: 'bg-gray-500', selected: false },
    { id: 'politica', name: 'Política', description: 'Temas políticos y gubernamentales', color: 'bg-blue-500', selected: false },
    { id: 'economia', name: 'Economía', description: 'Economía, finanzas y mercados', color: 'bg-orange-500', selected: false },
    { id: 'serio', name: 'Serio', description: 'Discusiones serias y formales', color: 'bg-blue-600', selected: false },
    { id: 'tecnologia', name: 'Tecnología', description: 'Tecnología e innovación', color: 'bg-green-500', selected: true },
    { id: 'ciencia', name: 'Ciencia', description: 'Ciencia e investigación', color: 'bg-purple-500', selected: false },
    { id: 'noticias', name: 'Noticias', description: 'Noticias y actualidad', color: 'bg-red-500', selected: false },
  ];

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedMedia(prev => [...prev, ...files].slice(0, 4)); // Max 4 media files
      
      // Create preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (content.trim() || selectedMedia.length > 0) {
      onPost(content, selectedMedia);
      setContent('');
      setTitle('');
      setSelectedMedia([]);
      setMediaPreview([]);
      onClose();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const getAudienceIcon = () => {
    switch (audience) {
      case 'everyone':
        return <Globe className="w-4 h-4" />;
      case 'community':
        return <Users className="w-4 h-4" />;
      case 'followers':
        return <Lock className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getAudienceText = () => {
    switch (audience) {
      case 'everyone':
        return 'Everyone can reply';
      case 'community':
        return `r/Blockchain members can reply`;
      case 'followers':
        return 'People you follow can reply';
      default:
        return 'r/Blockchain members can reply';
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
    tag.description.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Don't render anything if not open
  if (!isOpen) return null;

  // Tags Modal Component (will be rendered via portal)
  const TagsModal = () => {
    if (!showTagsModal) return null;

    const tagsModalContent = (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowTagsModal(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] sm:max-h-[80vh] lg:max-h-[85vh] overflow-y-auto z-[100001]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50 sticky top-0 z-10">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Añadir marcas y etiquetas</h2>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Categoriza tu publicación en r/Blockchain</p>
              </div>
            </div>
            <button
              onClick={() => setShowTagsModal(false)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar etiquetas..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Etiquetas de Comunidad</h3>
            </div>

            {/* Selected Tag (Sin etiqueta by default) */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-500/20 border-2 border-purple-500 rounded-lg sm:rounded-xl">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-medium text-sm sm:text-base truncate">Sin etiqueta</h4>
                    <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Publicación sin categoría específica</p>
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm sm:text-lg">🏷️</span>
                </div>
              </div>
            </div>

            {/* Available Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {filteredTags.slice(1).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                    selectedTags.includes(tag.id)
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="text-white font-medium text-sm sm:text-base truncate">{tag.name}</h4>
                      <p className="text-gray-400 text-xs sm:text-sm hidden sm:block truncate">{tag.description}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tag.id === 'politica' ? 'bg-gray-600' :
                    tag.id === 'economia' ? 'bg-orange-500' :
                    tag.id === 'serio' ? 'bg-blue-600' :
                    tag.id === 'tecnologia' ? 'bg-green-500' :
                    tag.id === 'ciencia' ? 'bg-purple-500' :
                    tag.id === 'noticias' ? 'bg-red-500' : 'bg-gray-500'
                  }`}>
                    <span className="text-white text-sm sm:text-base lg:text-lg">
                      {tag.id === 'politica' ? '🏛️' :
                       tag.id === 'economia' ? '📊' :
                       tag.id === 'serio' ? '💼' :
                       tag.id === 'tecnologia' ? '💻' :
                       tag.id === 'ciencia' ? '🔬' :
                       tag.id === 'noticias' ? '📰' : '🏷️'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile-specific bottom padding for better scrolling */}
            <div className="h-4 sm:h-0"></div>
          </div>
        </motion.div>
      </div>
    );

    return createPortal(tagsModalContent, document.body);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[50000] flex items-start justify-center pt-8 sm:pt-12 lg:pt-16 px-2 sm:px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl z-[50001]"
          style={{
            maxHeight: 'calc(100vh - 4rem)',
            minHeight: 'auto',
            height: 'fit-content'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-700 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 lg:p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white">Create a post</h2>
            <div className="w-8 sm:w-9 lg:w-10" /> {/* Spacer */}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 lg:p-6 xl:p-8" style={{ minHeight: 'fit-content' }}>
            {/* User Info and Audience */}
            <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 mb-4 sm:mb-6">
              <img
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Your avatar"
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                {/* Audience Selector */}
                <div className="relative mb-3 sm:mb-4 lg:mb-5">
                  <button
                    onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                    className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors text-xs sm:text-sm lg:text-base font-medium"
                  >
                    {getAudienceIcon()}
                    <span className="truncate">{getAudienceText()}</span>
                  </button>

                  {/* Audience Menu */}
                  <AnimatePresence>
                    {showAudienceMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-72 sm:w-80 lg:w-96 bg-gray-800 border border-gray-700 rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden z-20"
                      >
                        <div className="p-2 sm:p-3 lg:p-4">
                          <h3 className="text-white font-semibold mb-2 sm:mb-3 lg:mb-4 text-sm sm:text-base lg:text-lg">Who can reply?</h3>
                          <div className="space-y-1">
                            {[
                              { id: 'everyone', icon: Globe, label: 'Everyone', desc: 'Anyone can reply' },
                              { id: 'community', icon: Users, label: `r/Blockchain members`, desc: 'Only community members' },
                              { id: 'followers', icon: Lock, label: 'People you follow', desc: 'People you follow can reply' },
                            ].map(({ id, icon: Icon, label, desc }) => (
                              <button
                                key={id}
                                onClick={() => {
                                  setAudience(id as any);
                                  setShowAudienceMenu(false);
                                }}
                                className={`w-full flex items-center space-x-2 sm:space-x-3 lg:space-x-4 p-2 sm:p-3 lg:p-4 rounded-lg hover:bg-gray-700 transition-colors ${
                                  audience === id ? 'bg-gray-700' : ''
                                }`}
                              >
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  audience === id ? 'bg-primary-500' : 'bg-gray-600'
                                }`}>
                                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <div className="text-white font-medium text-sm sm:text-base lg:text-lg truncate">{label}</div>
                                  <div className="text-gray-400 text-xs sm:text-sm lg:text-base hidden sm:block">{desc}</div>
                                </div>
                                {audience === id && (
                                  <div className="ml-auto w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title Input */}
                <div className="mb-3 sm:mb-4 lg:mb-5">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-full bg-transparent text-gray-400 text-base sm:text-lg lg:text-xl placeholder-gray-500 border-none outline-none"
                  />
                </div>

                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    adjustTextareaHeight();
                  }}
                  placeholder="What's happening?"
                  className="w-full bg-transparent text-white text-lg sm:text-xl lg:text-2xl placeholder-gray-500 resize-none border-none outline-none min-h-[80px] sm:min-h-[120px] lg:min-h-[140px]"
                  style={{ fontFamily: 'inherit' }}
                  maxLength={maxLength}
                />

                {/* Media Preview */}
                {mediaPreview.length > 0 && (
                  <div className={`mt-3 sm:mt-4 lg:mt-6 grid gap-1.5 sm:gap-2 lg:gap-3 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden ${
                    mediaPreview.length === 1 ? 'grid-cols-1' :
                    mediaPreview.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {mediaPreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 sm:h-48 lg:h-56 xl:h-64 object-cover"
                        />
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 lg:top-3 lg:right-3 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Community Tag */}
                <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 text-primary-400 text-xs sm:text-sm lg:text-base">
                  <span>Posting in</span>
                  <span className="font-medium truncate">r/Blockchain</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 lg:pt-6 border-t border-gray-700">
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 xl:space-x-4 overflow-x-auto">
                {/* Media Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0"
                  disabled={selectedMedia.length >= 4}
                >
                  <Image className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Video Button */}
                <button className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Tags Button - This will open the modal */}
                <button 
                  onClick={() => setShowTagsModal(true)}
                  className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0"
                >
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Poll Button */}
                <button className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0 hidden sm:block">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Emoji Button */}
                <button className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0 hidden sm:block">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Schedule Button */}
                <button className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0 hidden lg:block">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Location Button */}
                <button className="p-1.5 sm:p-2 lg:p-2.5 text-primary-400 hover:bg-primary-500/10 rounded-full transition-colors flex-shrink-0 hidden lg:block">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0">
                {/* Character Count */}
                {content.length > 0 && (
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 transform -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-gray-700"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - content.length / maxLength)}`}
                          className={`transition-all duration-200 ${
                            remainingChars < 20 ? 'text-red-500' :
                            remainingChars < 50 ? 'text-yellow-500' : 'text-primary-500'
                          }`}
                        />
                      </svg>
                      {remainingChars < 20 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-medium ${
                            remainingChars < 0 ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {remainingChars}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Post Button */}
                <button
                  onClick={handlePost}
                  disabled={(!content.trim() && selectedMedia.length === 0) || remainingChars < 0}
                  className="px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 lg:py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full transition-colors disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaSelect}
            className="hidden"
          />
        </motion.div>

        {/* Tags Modal - Rendered separately via portal */}
        <TagsModal />
      </div>
    </AnimatePresence>
  );
};

export default TwitterStyleCreatePost;