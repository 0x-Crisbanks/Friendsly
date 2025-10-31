import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Users, MessageCircle, ArrowUp, ArrowDown, Share2, Bookmark, MoreHorizontal, Crown, Pin, Siren as Fire, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';
import CommentsModal from '../components/CommentsModal';
import InlineCreatePost from '../components/InlineCreatePost';
import { createRoot } from 'react-dom/client';

// Helper function to convert relative time to ISO string
const convertRelativeToISO = (relativeTime: string): string => {
  const now = new Date();
  const match = relativeTime.match(/(\d+)\s+(hour|day|minute)s?\s+ago/);
  
  if (!match) return now.toISOString();
  
  const [, amount, unit] = match;
  const num = parseInt(amount);
  
  switch (unit) {
    case 'minute':
      return new Date(now.getTime() - num * 60 * 1000).toISOString();
    case 'hour':
      return new Date(now.getTime() - num * 60 * 60 * 1000).toISOString();
    case 'day':
      return new Date(now.getTime() - num * 24 * 60 * 60 * 1000).toISOString();
    default:
      return now.toISOString();
  }
};

// Helper function to format timestamp back to relative time
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const Communities = () => {
  const { isConnected } = useWeb3();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>('all');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [votedPosts, setVotedPosts] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postCommentCounts, setPostCommentCounts] = useState<{[key: number]: number}>({});

  const communities = [
    {
      id: 'all',
      name: 'Todas las Comunidades',
      icon: '🌐',
      members: '2.5M',
      description: 'All posts from all communities',
      isJoined: false,
      color: 'from-blue-500 to-purple-500',
    },
    {
      id: 'blockchain',
      name: 'r/Blockchain',
      icon: '⛓️',
      members: '234K',
      description: 'Blockchain technology and news',
      isJoined: true,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'cryptoart',
      name: 'r/CryptoArt',
      icon: '🎨',
      members: '125K',
      description: 'Digital art and NFT creations',
      isJoined: true,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'defi',
      name: 'r/DeFi',
      icon: '💰',
      members: '89K',
      description: 'Decentralized Finance discussions',
      isJoined: true,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'web3creators',
      name: 'r/Web3Creators',
      icon: '🚀',
      members: '67K',
      description: 'For creators in the Web3 space',
      isJoined: false,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'nfts',
      name: 'r/NFTs',
      icon: '🖼️',
      members: '156K',
      description: 'Non-Fungible Token discussions',
      isJoined: false,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  // Lista de comunidades a las que pertenece el usuario
  const userCommunities = [
    {
      id: 'argentina',
      name: 'r/argentina',
      icon: null,
      color: '#A855F7',
      letter: 'A',
      isStarred: true
    },
    {
      id: 'bitcoin',
      name: 'r/Bitcoin',
      icon: null,
      color: '#F59E0B',
      letter: 'B',
      isStarred: true
    },
    {
      id: '3dmodeling',
      name: 'r/3Dmodeling',
      icon: null,
      color: '#3B82F6',
      letter: '3',
      isStarred: false
    },
    {
      id: 'business',
      name: 'r/business',
      icon: null,
      color: '#10B981',
      letter: 'B',
      isStarred: false
    },
    {
      id: 'compsci',
      name: 'r/compsci',
      icon: null,
      color: '#6366F1',
      letter: 'C',
      isStarred: false
    },
    {
      id: 'cryptocurrency',
      name: 'r/CryptoCurrency',
      icon: null,
      color: '#EC4899',
      letter: 'C',
      isStarred: false
    },
    {
      id: 'datascience',
      name: 'r/datascience',
      icon: null,
      color: '#8B5CF6',
      letter: 'D',
      isStarred: false
    },
    {
      id: 'digitalpainting',
      name: 'r/DigitalPainting',
      icon: null,
      color: '#06B6D4',
      letter: 'D',
      isStarred: false
    },
    {
      id: 'economics',
      name: 'r/Economics',
      icon: null,
      color: '#F97316',
      letter: 'E',
      isStarred: false
    },
    {
      id: 'ethereum',
      name: 'r/ethereum',
      icon: null,
      color: '#6366F1',
      letter: 'E',
      isStarred: false
    },
    {
      id: 'gadgets',
      name: 'r/gadgets',
      icon: null,
      color: '#A855F7',
      letter: 'G',
      isStarred: false
    },
    {
      id: 'gpt3',
      name: 'r/GPT3',
      icon: null,
      color: '#EC4899',
      letter: 'G',
      isStarred: false
    },
    {
      id: 'nft',
      name: 'r/NFT',
      icon: null,
      color: '#3B82F6',
      letter: 'N',
      isStarred: false
    },
    {
      id: 'openai',
      name: 'r/OpenAI',
      icon: null,
      color: '#10B981',
      letter: 'O',
      isStarred: false
    },
    {
      id: 'personalfinance',
      name: 'r/personalfinance',
      icon: null,
      color: '#F59E0B',
      letter: 'P',
      isStarred: false
    },
    {
      id: 'programacion',
      name: 'r/programacion',
      icon: null,
      color: '#EF4444',
      letter: 'P',
      isStarred: false
    },
    {
      id: 'wallstreetbets',
      name: 'r/wallstreetbets',
      icon: null,
      color: '#F97316',
      letter: 'W',
      isStarred: false
    },
    {
      id: 'webdev',
      name: 'r/webdev',
      icon: null,
      color: '#8B5CF6',
      letter: 'W',
      isStarred: false
    }
  ];

  const posts = [
    {
      id: 1,
      community: 'cryptoart',
      communityName: 'r/CryptoArt',
      communityIcon: '🎨',
      author: 'u/ArtistLuna',
      authorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      timestamp: convertRelativeToISO('3 hours ago'),
      title: 'Just finished my latest NFT collection - "Digital Dreams"',
      content: 'After months of work, I\'m excited to share my new collection exploring the intersection of dreams and digital reality. Each piece represents a different aspect of our digital consciousness.',
      image: 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=600',
      upvotes: 1247,
      downvotes: 23,
      comments: 89,
      awards: ['🥇', '🎨'],
      isPinned: false,
      flair: 'Original Content',
      flairColor: 'bg-green-500',
    },
    {
      id: 2,
      community: 'defi',
      communityName: 'r/DeFi',
      communityIcon: '💰',
      author: 'u/DeFiExpert',
      authorAvatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
      timestamp: convertRelativeToISO('5 hours ago'),
      title: 'New yield farming opportunity with 150% APY - Is it too good to be true?',
      content: 'Found this new protocol offering 150% APY on stablecoin pairs. The tokenomics look solid but wanted to get the community\'s thoughts before diving in. Has anyone done their research on this?',
      upvotes: 892,
      downvotes: 156,
      comments: 234,
      awards: ['🔥'],
      isPinned: false,
      flair: 'Discussion',
      flairColor: 'bg-blue-500',
    },
    {
      id: 3,
      community: 'web3creators',
      communityName: 'r/Web3Creators',
      communityIcon: '🚀',
      author: 'u/CreatorDAO',
      authorAvatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
      timestamp: convertRelativeToISO('8 hours ago'),
      title: '[ANNOUNCEMENT] FriendsX Platform Launch - Decentralized Creator Economy',
      content: 'We\'re excited to announce the launch of FriendsX, a new decentralized platform for creators. Built on blockchain technology, it allows direct creator-fan interactions without intermediaries.',
      upvotes: 2156,
      downvotes: 89,
      comments: 445,
      awards: ['🚀', '🎉', '💎'],
      isPinned: true,
      flair: 'Announcement',
      flairColor: 'bg-red-500',
    },
    {
      id: 4,
      community: 'blockchain',
      communityName: 'r/Blockchain',
      communityIcon: '⛓️',
      author: 'u/BlockchainDev',
      authorAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
      timestamp: convertRelativeToISO('12 hours ago'),
      title: 'Ethereum 2.0 staking rewards hit new all-time high',
      content: 'With the recent network upgrades, ETH staking rewards have reached unprecedented levels. Current APR is sitting at 5.2%, the highest we\'ve seen since the merge.',
      upvotes: 3421,
      downvotes: 234,
      comments: 567,
      awards: ['📈', '💎'],
      isPinned: false,
      flair: 'News',
      flairColor: 'bg-yellow-500',
    },
  ];

  const [allPosts, setAllPosts] = useState(posts);

  const trendingCommunities = [
    { name: 'r/CryptoArt', members: '125K', growth: '+12%' },
    { name: 'r/DeFi', members: '89K', growth: '+8%' },
    { name: 'r/Web3Gaming', members: '45K', growth: '+25%' },
    { name: 'r/DAOs', members: '67K', growth: '+15%' },
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommunity = selectedCommunity === 'all' || post.community === selectedCommunity;
    return matchesSearch && matchesCommunity;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return (b.upvotes - b.downvotes + b.comments * 0.5) - (a.upvotes - a.downvotes + a.comments * 0.5);
      case 'new':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'rising':
        return (b.upvotes / (Date.now() - new Date(b.timestamp).getTime())) - (a.upvotes / (Date.now() - new Date(a.timestamp).getTime()));
      default:
        return 0;
    }
  });

  // Función para obtener información de estilo para cada etiqueta
  const getTagInfo = (tagId: string) => {
    // Etiquetas de categoría con sus estilos
    const tagStyles: {[key: string]: any} = {
      'sin-etiqueta': { 
        name: 'Sin etiqueta', 
        bgColor: 'bg-slate-500/10', 
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/30',
        emoji: '🏷️'
      },
      'politica': { 
        name: 'Política', 
        bgColor: 'bg-blue-600/10', 
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        emoji: '🏛️'
      },
      'economia': { 
        name: 'Economía', 
        bgColor: 'bg-emerald-500/10', 
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        emoji: '📈'
      },
      'serio': { 
        name: 'Serio', 
        bgColor: 'bg-purple-600/10', 
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        emoji: '💼'
      },
      'tecnologia': { 
        name: 'Tecnología', 
        bgColor: 'bg-cyan-500/10', 
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500/30',
        emoji: '💻'
      },
      'ciencia': { 
        name: 'Ciencia', 
        bgColor: 'bg-violet-500/10', 
        textColor: 'text-violet-400',
        borderColor: 'border-violet-500/30',
        emoji: '🔬'
      },
      'noticias': { 
        name: 'Noticias', 
        bgColor: 'bg-red-500/10', 
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        emoji: '📰'
      },
      'discusion': { 
        name: 'Discusión', 
        bgColor: 'bg-orange-500/10', 
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        emoji: '💭'
      },
      'tutorial': { 
        name: 'Tutorial', 
        bgColor: 'bg-teal-500/10', 
        textColor: 'text-teal-400',
        borderColor: 'border-teal-500/30',
        emoji: '📚'
      },
      'pregunta': { 
        name: 'Pregunta', 
        bgColor: 'bg-yellow-500/10', 
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
        emoji: '❓'
      },
      'analisis': { 
        name: 'Análisis', 
        bgColor: 'bg-indigo-500/10', 
        textColor: 'text-indigo-400',
        borderColor: 'border-indigo-500/30',
        emoji: '📊'
      },
      'meme': { 
        name: 'Meme', 
        bgColor: 'bg-pink-500/10', 
        textColor: 'text-pink-400',
        borderColor: 'border-pink-500/30',
        emoji: '😂'
      },
      // Etiquetas especiales
      'contenido-adulto': {
        name: 'Contenido adulto', 
        bgColor: 'bg-red-500/10', 
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        emoji: '🔞'
      },
      'spoiler': {
        name: 'Spoiler', 
        bgColor: 'bg-yellow-500/10', 
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
        emoji: '⚠️'
      },
      'marca-afiliada': {
        name: 'Marca afiliada', 
        bgColor: 'bg-blue-500/10', 
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        emoji: '🎯'
      }
    };
    
    // Devolver información de la etiqueta o un valor predeterminado
    return tagStyles[tagId] || { 
      name: tagId, 
      bgColor: 'bg-gray-500/10', 
      textColor: 'text-gray-400',
      borderColor: 'border-gray-500/30',
      emoji: '#'
    };
  };

  const handleVote = (postId: number, voteType: 'up' | 'down') => {
    setVotedPosts(prev => {
      const currentVote = prev[postId];
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        const newVotes = { ...prev };
        delete newVotes[postId];
        return newVotes;
      } else {
        // Set new vote
        return { ...prev, [postId]: voteType };
      }
    });
  };

  const handleSave = (postId: number) => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
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

  const handleJoinCommunity = (communityId: string) => {
    // Handle join/leave community logic here
    console.log(`Toggled membership for community ${communityId}`);
  };

  const toggleStar = (communityId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Actualizar el estado de favorito de la comunidad
    const updatedCommunities = userCommunities.map(comm => {
      if (comm.id === communityId) {
        return { ...comm, isStarred: !comm.isStarred };
      }
      return comm;
    });
    
    // En una aplicación real, aquí guardaríamos el cambio en la base de datos
    console.log(`Toggled star for community ${communityId}`);
  };

  // Add click outside handler to close community selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if clicking outside the dropdown
      const target = event.target as HTMLElement;
      if (showCommunitySelector && !target.closest('.community-selector')) {
        setShowCommunitySelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommunitySelector]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comunidades</h1>
          <p className="text-gray-400">Discover and join communities in the Web3 space</p>
        </div>

        {/* Mobile Communities Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 text-white"
          >
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="font-medium">Mis Comunidades</span>
            </div>
            <div className={`transform transition-transform duration-300 ${showMobileSidebar ? 'rotate-180' : ''}`}>
              <ArrowDown className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Mobile Communities Sidebar */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mb-6 overflow-hidden"
            >
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">COMUNIDADES</h3>
                  <button className="text-gray-400 hover:text-white">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {userCommunities.map((community) => {
                    // Create a community icon component
                    const CommunityIcon = () => {
                      if (community.icon) {
                        return (
                          <img 
                            src={community.icon} 
                            alt={community.name} 
                            className="w-8 h-8 rounded-full"
                          />
                        );
                      } else {
                        return (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: community.color }}
                          >
                            {community.letter}
                          </div>
                        );
                      }
                    };
                    
                    return (
                      <Link
                        key={community.id}
                        to={`/communities/${community.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <CommunityIcon />
                          <span className="text-gray-300 hover:text-white transition-colors">
                            {community.name}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => toggleStar(community.id, e)}
                          className={`p-1 rounded-full ${community.isStarred ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          <Star className={`w-5 h-5 ${community.isStarred ? 'fill-current' : ''}`} />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Communities Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <div className="sticky top-24 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">COMUNIDADES</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {userCommunities.map((community) => {
                  // Create a community icon component
                  const CommunityIcon = () => {
                    if (community.icon) {
                      return (
                        <img 
                          src={community.icon} 
                          alt={community.name} 
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      );
                    } else {
                      return (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: community.color }}
                        >
                          {community.letter}
                        </div>
                      );
                    }
                  };
                  
                  return (
                    <Link
                      key={community.id}
                      to={`/communities/${community.id}`}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors ${
                        selectedCommunity === community.id ? 'bg-primary-500/10 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <CommunityIcon />
                        <span className="text-gray-300 hover:text-white transition-colors truncate">
                          {community.name}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => toggleStar(community.id, e)}
                        className={`p-1 rounded-full ${community.isStarred ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <Star className={`w-4 h-4 ${community.isStarred ? 'fill-current' : ''}`} />
                      </button>
                    </Link>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-gray-700/50">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Crear una comunidad</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 xl:col-span-7">
            {/* Create Post Section */}
            <div className="mb-6">
              <InlineCreatePost
                communityName={selectedCommunity !== 'all' ? communities.find(c => c.id === selectedCommunity)?.name : undefined}
                communityIcon={selectedCommunity !== 'all' ? communities.find(c => c.id === selectedCommunity)?.icon : '🌐'}
                communityMembers={selectedCommunity !== 'all' ? communities.find(c => c.id === selectedCommunity)?.members : undefined}
                placeholder="What's happening in Web3?"
                onPostCreated={(newPost) => {
                  // Ensure the new post has all required properties
                  const completePost = {
                    id: newPost.id || Date.now(),
                    community: newPost.community || 'blockchain',
                    communityName: newPost.communityName || 'r/Blockchain',
                    communityIcon: newPost.communityIcon || '⛓️',
                    author: newPost.author || 'u/user',
                    authorAvatar: newPost.authorAvatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
                    timestamp: newPost.timestamp || new Date().toISOString(),
                    title: newPost.title || 'New Post',
                    content: newPost.content || '',
                    image: newPost.image || null,
                    // Add any missing properties with default values
                    upvotes: newPost.upvotes || 0,
                    downvotes: newPost.downvotes || 0,
                    comments: newPost.comments || 0,
                    shares: newPost.shares || 0,
                    awards: newPost.awards || [],
                    isPinned: newPost.isPinned || false,
                    flair: newPost.flair || 'Original Content',
                    flairColor: newPost.flairColor || 'bg-green-500',
                    tags: newPost.tags || ['sin-etiqueta']
                  };
                  
                  // Update the posts state with the new post
                  setAllPosts(prevPosts => [completePost, ...prevPosts]);
                }}
              />
            </div>

            {/* Search and Filters */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 mb-6 overflow-hidden shadow-lg">
              <div className="flex flex-col lg:flex-row items-center justify-between p-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md w-full px-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-400 w-5 h-5 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Buscar publicaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-primary-500/70 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-700/80 transition-all duration-200"
                  />
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex space-x-1 p-2 bg-gray-800/70 rounded-xl backdrop-blur-sm border border-gray-700/30 mx-2 my-3 lg:my-0">
                  {[
                    { id: 'hot', label: 'Destacado', icon: Fire, gradient: 'from-orange-500 to-red-500' },
                    { id: 'new', label: 'Nuevo', icon: Clock, gradient: 'from-blue-500 to-cyan-500' },
                    { id: 'top', label: 'Popular', icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' },
                    { id: 'rising', label: 'En ascenso', icon: ArrowUp, gradient: 'from-purple-500 to-pink-500' },
                  ].map(({ id, label, icon: Icon, gradient }) => (
                    <button
                      key={id}
                      onClick={() => setSortBy(id as any)}
                      className={`group relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        sortBy === id
                          ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-${id === 'hot' ? 'orange' : id === 'new' ? 'blue' : id === 'top' ? 'green' : 'purple'}-500/20`
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                      }`}
                    >
                      {sortBy === id && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                      <Icon className={`w-4 h-4 ${sortBy === id ? 'animate-pulse' : ''}`} />
                      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Create Post Button */}
              </div>
            </div>

            {/* Community Tabs */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {communities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => setSelectedCommunity(community.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCommunity === community.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{community.icon}</span>
                  <span className="text-sm font-medium">{community.name}</span>
                  <span className="text-xs opacity-75">{community.members}</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {allPosts.filter(post => {
                const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     post.content.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCommunity = selectedCommunity === 'all' || post.community === selectedCommunity;
                return matchesSearch && matchesCommunity;
              }).sort((a, b) => {
                switch (sortBy) {
                  case 'hot':
                    return (b.upvotes - b.downvotes + b.comments * 0.5) - (a.upvotes - a.downvotes + a.comments * 0.5);
                  case 'new':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                  case 'top':
                    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
                  case 'rising':
                    return (b.upvotes / (Date.now() - new Date(b.timestamp).getTime())) - (a.upvotes / (Date.now() - new Date(a.timestamp).getTime()));
                  default:
                    return 0;
                }
              }).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 flex"
                >
                  {post.isPinned && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 text-green-400">
                      <Pin className="w-4 h-4" />
                      <span className="text-xs font-medium">Pinned</span>
                    </div>
                  )}
                  
                  <div className="flex">
                    {/* Voting Section */}
                    <div className="flex flex-col items-center p-4 bg-gray-900/30 border-r border-gray-700/50">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          votedPosts[post.id] === 'up'
                            ? 'text-orange-400 bg-orange-500/20'
                            : 'text-gray-400 hover:text-orange-400 hover:bg-gray-700/50'
                        }`}
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      
                      <span className={`font-bold text-sm my-2 ${
                        votedPosts[post.id] === 'up' ? 'text-orange-400' :
                        votedPosts[post.id] === 'down' ? 'text-blue-400' :
                        'text-white'
                      }`}>
                        {post.upvotes - post.downvotes + 
                         (votedPosts[post.id] === 'up' ? 1 : 0) - 
                         (votedPosts[post.id] === 'down' ? 1 : 0)}
                      </span>
                      
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          votedPosts[post.id] === 'down'
                            ? 'text-blue-400 bg-blue-500/20'
                            : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/50'
                        }`}
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      {/* Post Header */}
                      <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{post.communityIcon}</span>
                              <Link
                                to={`/communities/${post.community}`}
                                className="text-primary-400 font-medium hover:text-primary-300 transition-colors text-sm"
                              >
                                {post.communityName}
                              </Link>
                              {post.isPinned && (
                                <Pin className="w-4 h-4 text-green-400" />
                              )}
                              {post.flair && (
                                <span className={`px-2 py-1 ${post.flairColor} text-white text-xs rounded-full`}>
                                  {post.flair}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {post.awards.map((award, i) => (
                              <span key={i} className="text-lg">{award}</span>
                            ))}
                            <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-400 text-sm mt-2">
                          <img
                            src={post.authorAvatar}
                            alt={post.author}
                          className="w-6 h-6 rounded-full cursor-pointer hover:border-primary-400 hover:border-2 transition-all duration-200"
                          onClick={() => window.location.href = `/creator/${post.author.replace('u/', '')}`}
                          />
                          <Link
                            to={`/creator/${post.author.replace('u/', '')}`}
                            className="hover:text-primary-400 transition-colors font-medium"
                          >
                            {post.author}
                          </Link>
                          <span>•</span>
                          <span>{formatTimeAgo(post.timestamp)}</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <h2 className="text-xl font-semibold text-white mb-3 leading-tight hover:text-primary-400 transition-colors cursor-pointer">
                          {post.title}
                          {/* Etiquetas de Categoría - Junto al título */}
                          {post.tags && post.tags.length > 0 && (
                            <span className="inline-flex ml-2">
                              {post.tags.map((tag: string) => {
                                // Buscar información de la etiqueta para aplicar estilos específicos
                                const tagInfo = getTagInfo(tag);
                                return (
                                  <span
                                    key={tag}
                                    className={`inline-flex items-center space-x-1 px-2 py-1 ${tagInfo.bgColor} ${tagInfo.textColor} rounded-md text-xs font-medium border ${tagInfo.borderColor} hover:opacity-80 transition-opacity cursor-pointer ml-1`}
                                  >
                                    <span className="text-sm">{tagInfo.emoji}</span>
                                    <span>{tagInfo.name}</span>
                                  </span>
                                );
                              })}
                            </span>
                          )}
                        </h2>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                          {post.content}
                        </p>
                        
                        {post.image && (
                          <div className="mb-4 rounded-xl overflow-hidden">
                            <img
                              src={post.image}
                              alt="Post content"
                              className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 pb-4">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleComments(post)}
                            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">{postCommentCounts[post.id] || post.comments}</span>
                          </button>

                          <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Share</span>
                          </button>

                          <button
                            onClick={() => handleSave(post.id)}
                            className={`flex items-center space-x-2 transition-colors ${
                              savedPosts.has(post.id)
                                ? 'text-yellow-400'
                                : 'text-gray-400 hover:text-yellow-400'
                            }`}
                          >
                            <Bookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">Save</span>
                          </button>

                          <button className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                            <Star className="w-5 h-5" />
                            <span className="text-sm font-medium">Award</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="space-y-6 sticky top-24">
              {/* Community Info */}
              {selectedCommunity !== 'all' && (
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  {(() => {
                    const community = communities.find(c => c.id === selectedCommunity);
                    if (!community) return null;
                    
                    return (
                      <>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${community.color} rounded-full flex items-center justify-center text-2xl`}>
                            {community.icon}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{community.name}</h3>
                            <p className="text-gray-400 text-sm">{community.members} members</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{community.description}</p>
                        <button
                          onClick={() => handleJoinCommunity(community.id)}
                          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                            community.isJoined
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
                          }`}
                        >
                          {community.isJoined ? 'Joined' : 'Join Community'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Trending Communities */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">Comunidades Populares</h3>
                </div>
                <div className="space-y-4">
                  {trendingCommunities.map((community, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{community.name}</p>
                        <p className="text-gray-400 text-sm">{community.members} members</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 text-sm font-medium">{community.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Rules */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Reglas de la Comunidad</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">1.</span>
                    <span>Sé respetuoso y cordial en las discusiones</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">2.</span>
                    <span>No spam ni autopromoción sin permiso</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">3.</span>
                    <span>Usa etiquetas apropiadas para tus publicaciones</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">4.</span>
                    <span>No consejos financieros ni recomendaciones de inversión</span>
                  </div>
                </div>
              </div>

              {/* Create Community */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Crear Comunidad</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Inicia tu propia comunidad y reúne a personas con intereses similares.
                </p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-colors font-medium">
                  Crear Comunidad
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          postAuthor={selectedPost.author}
          initialCommentCount={postCommentCounts[selectedPost.id] || selectedPost.comments || 0}
          onCommentCountChange={(newCount) => handleCommentCountChange(selectedPost.id, newCount)}
        />
      )}
    </div>
  );
};

export default Communities;