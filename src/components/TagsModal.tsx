import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Tag, Check, Sparkles, Zap, Hash, Filter, ArrowRight, AlertTriangle, Shield, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  communityName?: string;
}

const TagsModal: React.FC<TagsModalProps> = ({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  communityName = 'Blockchain'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialTags, setSelectedSpecialTags] = useState<string[]>([]);

  // Etiquetas especiales (toggles independientes)
  const specialTags = [
    {
      id: 'contenido-adulto',
      name: 'Contenido adulto (18+)',
      description: 'Contiene contenido para adultos',
      icon: '🔞',
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500/10 to-pink-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      iconComponent: Shield
    },
    {
      id: 'spoiler',
      name: 'Spoiler',
      description: 'Que puedan estropear una sorpresa',
      icon: '⚠️',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      iconComponent: AlertTriangle
    },
    {
      id: 'marca-afiliada',
      name: 'Marca afiliada',
      description: 'Hecho para una marca o empresa',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      iconComponent: Target
    }
  ];

  // Etiquetas de categoría (solo una seleccionable)
  const availableTags = [
    { 
      id: 'sin-etiqueta', 
      name: 'Sin etiqueta', 
      description: 'Publicación general', 
      color: 'from-slate-500 to-gray-500',
      bgColor: 'from-slate-500/10 to-gray-500/10',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-400',
      emoji: '🏷️',
      isDefault: true
    },
    { 
      id: 'politica', 
      name: 'Política', 
      description: 'Temas políticos y gobierno', 
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'from-blue-500/10 to-indigo-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      emoji: '🏛️',
      isDefault: false
    },
    { 
      id: 'economia', 
      name: 'Economía', 
      description: 'Finanzas y mercados', 
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      emoji: '📈',
      isDefault: false
    },
    { 
      id: 'serio', 
      name: 'Serio', 
      description: 'Discusiones formales', 
      color: 'from-purple-600 to-violet-600',
      bgColor: 'from-purple-500/10 to-violet-500/10',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      emoji: '💼',
      isDefault: false
    },
    { 
      id: 'tecnologia', 
      name: 'Tecnología', 
      description: 'Innovación y desarrollo', 
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'from-cyan-500/10 to-blue-500/10',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      emoji: '💻',
      isDefault: false
    },
    { 
      id: 'ciencia', 
      name: 'Ciencia', 
      description: 'Investigación y descubrimientos', 
      color: 'from-violet-500 to-purple-500',
      bgColor: 'from-violet-500/10 to-purple-500/10',
      borderColor: 'border-violet-500/30',
      textColor: 'text-violet-400',
      emoji: '🔬',
      isDefault: false
    },
    { 
      id: 'noticias', 
      name: 'Noticias', 
      description: 'Actualidad y eventos', 
      color: 'from-red-500 to-rose-500',
      bgColor: 'from-red-500/10 to-rose-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      emoji: '📰',
      isDefault: false
    },
    { 
      id: 'discusion', 
      name: 'Discusión', 
      description: 'Debates y opiniones', 
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-500/10 to-amber-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      emoji: '💭',
      isDefault: false
    },
    { 
      id: 'tutorial', 
      name: 'Tutorial', 
      description: 'Guías y contenido educativo', 
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'from-teal-500/10 to-cyan-500/10',
      borderColor: 'border-teal-500/30',
      textColor: 'text-teal-400',
      emoji: '📚',
      isDefault: false
    },
    { 
      id: 'pregunta', 
      name: 'Pregunta', 
      description: 'Consultas y ayuda', 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      emoji: '❓',
      isDefault: false
    },
    { 
      id: 'analisis', 
      name: 'Análisis', 
      description: 'Estudios detallados', 
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-500/10 to-blue-500/10',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
      emoji: '📊',
      isDefault: false
    },
    { 
      id: 'meme', 
      name: 'Meme', 
      description: 'Humor y entretenimiento', 
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-500/10 to-rose-500/10',
      borderColor: 'border-pink-500/30',
      textColor: 'text-pink-400',
      emoji: '😂',
      isDefault: false
    }
  ];

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSpecialTags = specialTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tagId: string) => {
    if (tagId === 'sin-etiqueta') {
      onTagsChange(['sin-etiqueta']);
    } else {
      let newTags = selectedTags.filter(id => id !== 'sin-etiqueta');
      
      if (newTags.includes(tagId)) {
        newTags = newTags.filter(id => id !== tagId);
        if (newTags.length === 0) {
          newTags = ['sin-etiqueta'];
        }
      } else {
        newTags = [...newTags, tagId];
      }
      
      onTagsChange(newTags);
    }
  };

  const handleSpecialTagToggle = (tagId: string) => {
    setSelectedSpecialTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleSave = () => {
    // Combinar etiquetas de categoría y especiales
    const allSelectedTags = [...selectedTags, ...selectedSpecialTags];
    onTagsChange(allSelectedTags);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 lg:p-6">
      {/* Enhanced Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Enhanced Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto z-[9999999]"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)'
        }}
      >
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-700/30">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Enhanced Icon */}
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Tag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                {/* Sparkle Effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                >
                  Etiquetas y Categorías
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-gray-300 text-sm sm:text-base mt-1"
                >
                  Categoriza tu publicación en <span className="text-purple-400 font-semibold">r/{communityName}</span>
                </motion.p>
              </div>
            </div>
            
            {/* Enhanced Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              onClick={onClose}
              className="group relative p-2 sm:p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-200" />
            </motion.button>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-4 sm:p-6 lg:p-8 border-b border-gray-700/30"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar etiquetas por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:bg-gray-800/70 transition-all duration-200 text-sm sm:text-base"
              />
              {/* Search Enhancement Icon */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Category Tags Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Etiquetas de Categoría</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent"></div>
            </div>

            {/* Default Tag Display (Sin etiqueta) */}
            {selectedTags.includes('sin-etiqueta') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="mb-6"
              >
                <div className="relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-bold text-base sm:text-lg flex items-center space-x-2">
                          <span>Sin etiqueta</span>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </h4>
                        <p className="text-gray-300 text-sm sm:text-base">
                          Publicación general sin categoría específica
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-xl sm:text-2xl">🏷️</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Category Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredTags.filter(tag => !tag.isDefault).map((tag, index) => (
                <motion.button
                  key={tag.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 1.1 + index * 0.05,
                    ease: "easeOut"
                  }}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`group relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
                    selectedTags.includes(tag.id) ? 'scale-[1.01]' : ''
                  }`}
                >
                  {/* Clean Background */}
                  <div className="absolute inset-0 rounded-xl bg-gray-800/60 backdrop-blur-sm"></div>
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tag.bgColor} rounded-xl transition-all duration-300 ${
                    selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}></div>
                  
                  {/* Subtle Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${tag.color} rounded-xl blur-xl transition-all duration-300 ${
                    selectedTags.includes(tag.id) ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'
                  }`}></div>
                  
                  {/* Main Content Container */}
                  <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    selectedTags.includes(tag.id)
                      ? `${tag.borderColor} bg-white/5`
                      : 'border-gray-600/30 hover:border-gray-500/50 bg-gray-800/20'
                  }`}>
                    
                    {/* Header with Icon and Title */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Status Indicator */}
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          selectedTags.includes(tag.id) 
                            ? `bg-gradient-to-r ${tag.color}` 
                            : 'bg-gray-500/50'
                        }`}></div>
                        
                        {/* Title */}
                        <h4 className={`font-semibold text-base transition-all duration-300 ${
                          selectedTags.includes(tag.id) ? tag.textColor : 'text-white'
                        }`}>
                          {tag.name}
                        </h4>
                      </div>
                      
                      {/* Emoji Icon */}
                      <div className="flex items-center space-x-2">
                        {selectedTags.includes(tag.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`${tag.textColor}`}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          selectedTags.includes(tag.id)
                            ? `bg-gradient-to-br ${tag.color}`
                            : 'bg-gray-700/50'
                        }`}>
                          <span className="text-lg">
                            {tag.emoji}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed transition-colors duration-300 group-hover:text-gray-300">
                      {tag.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Special Tags Section - Moved to the end */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Etiquetas</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {filteredSpecialTags.map((tag, index) => {
                const IconComponent = tag.iconComponent;
                return (
                  <motion.button
                    key={tag.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    onClick={() => handleSpecialTagToggle(tag.id)}
                    className={`group relative overflow-hidden transition-all duration-300 ${
                      selectedSpecialTags.includes(tag.id) ? 'scale-[1.01]' : ''
                    }`}
                  >
                    {/* Background */}
                    <div className="absolute inset-0 rounded-xl bg-gray-800/60 backdrop-blur-sm"></div>
                    
                    {/* Selection Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tag.bgColor} rounded-xl transition-all duration-300 ${
                      selectedSpecialTags.includes(tag.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                    }`}></div>
                    
                    {/* Content */}
                    <div className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      selectedSpecialTags.includes(tag.id)
                        ? `${tag.borderColor} bg-white/5`
                        : 'border-gray-600/30 hover:border-gray-500/50 bg-gray-800/20'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedSpecialTags.includes(tag.id)
                            ? `bg-gradient-to-br ${tag.color}`
                            : 'bg-gray-700/50'
                        }`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className={`font-bold text-lg transition-all duration-300 ${
                            selectedSpecialTags.includes(tag.id) ? tag.textColor : 'text-white'
                          }`}>
                            {tag.name}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {tag.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <div className="relative">
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          selectedSpecialTags.includes(tag.id) 
                            ? `bg-gradient-to-r ${tag.color}` 
                            : 'bg-gray-600'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                            selectedSpecialTags.includes(tag.id) ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Enhanced Selected Tags Summary */}
          {(selectedTags.length > 0 && !selectedTags.includes('sin-etiqueta')) || selectedSpecialTags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="mt-8"
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                <div className="relative p-4 sm:p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-600/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    <h4 className="text-white font-bold text-base sm:text-lg">Etiquetas Seleccionadas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* Category Tags */}
                    {selectedTags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <motion.span
                          key={tagId}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r ${tag.bgColor} ${tag.textColor} rounded-full text-sm sm:text-base border ${tag.borderColor} shadow-lg`}
                        >
                          <span className="text-base sm:text-lg">{tag.emoji}</span>
                          <span className="font-medium">{tag.name}</span>
                        </motion.span>
                      );
                    })}
                    
                    {/* Special Tags */}
                    {selectedSpecialTags.map(tagId => {
                      const tag = specialTags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <motion.span
                          key={tagId}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r ${tag.bgColor} ${tag.textColor} rounded-full text-sm sm:text-base border ${tag.borderColor} shadow-lg`}
                        >
                          <span className="text-base sm:text-lg">{tag.icon}</span>
                          <span className="font-medium">{tag.name}</span>
                        </motion.span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-700/30"
          >
            <button
              onClick={onClose}
              className="flex-1 group relative overflow-hidden px-6 py-3 sm:py-4 border-2 border-gray-600/50 text-gray-300 rounded-2xl hover:border-gray-500/50 hover:bg-gray-700/30 transition-all duration-300 text-base sm:text-lg font-medium"
            >
              <span className="relative z-10">Cancelar</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 group relative overflow-hidden px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all duration-300 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Aplicar Etiquetas</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </button>
          </motion.div>

          {/* Bottom Padding for Mobile */}
          <div className="h-4 sm:h-0"></div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
export default TagsModal;
