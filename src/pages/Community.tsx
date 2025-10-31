import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Share2, Bookmark, ArrowUp, ArrowDown, MoreHorizontal, Star, Pin, Plus, Search, TrendingUp, Clock, Siren as Fire, Shield, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import InlineCreatePost from '../components/InlineCreatePost';
import CommentsModal from '../components/CommentsModal';

const Community = () => {
  const { id } = useParams();
  const { isConnected } = useWeb3();
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [votedPosts, setVotedPosts] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postCommentCounts, setPostCommentCounts] = useState<{[key: number]: number}>({});

  // Mock community data
  const community = {
    id: 'blockchain',
    name: 'r/Blockchain',
    icon: '⛓️',
    description: 'A community for discussing blockchain technology, cryptocurrencies, and decentralized applications.',
    members: '234K',
    online: '3.1K',
    created: 'Dec 1, 2022',
    rules: [
      'Be respectful and civil in discussions',
      'No spam or self-promotion without permission',
      'Use appropriate flairs for your posts',
      'No financial advice or investment recommendations'
    ]
  };

  const posts = [
    {
      id: 1,
      author: 'u/BlockchainDev',
      authorAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
      timeAgo: '2 hours ago',
      title: 'Ethereum 2.0 staking rewards hit new all-time high',
      content: 'With the recent network upgrades, ETH staking rewards have reached unprecedented levels. Current APR is sitting at 5.2%, the highest we\'ve seen since the merge.',
      upvotes: 3187,
      downvotes: 234,
      comments: 567,
      awards: ['📈', '💎'],
      isPinned: false,
      flair: 'News',
      flairColor: 'bg-yellow-500',
      highlights: [
        'Network security at all-time high',
        'Validator queue decreasing',
        'Gas fees remain stable',
        'DeFi protocols adapting quickly'
      ]
    },
    {
      id: 2,
      author: 'u/CryptoAnalyst',
      authorAvatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100',
      timeAgo: '4 hours ago',
      title: 'Layer 2 solutions comparison: Arbitrum vs Optimism vs Polygon',
      content: 'Deep dive analysis of the top Layer 2 scaling solutions. Performance metrics, costs, and ecosystem development compared.',
      upvotes: 2456,
      downvotes: 89,
      comments: 342,
      awards: ['🔥', '🧠'],
      isPinned: false,
      flair: 'Analysis',
      flairColor: 'bg-blue-500',
    },
    {
      id: 3,
      author: 'u/DeFiExplorer',
      authorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      timeAgo: '6 hours ago',
      title: '[DISCUSSION] The future of cross-chain interoperability',
      content: 'What are your thoughts on the current state of cross-chain bridges and protocols? Which projects are leading the way?',
      upvotes: 1892,
      downvotes: 156,
      comments: 234,
      awards: ['💭'],
      isPinned: false,
      flair: 'Discussion',
      flairColor: 'bg-green-500',
    },
    {
      id: 4,
      author: 'u/SmartContractDev',
      authorAvatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
      timeAgo: '8 hours ago',
      title: 'Tutorial: Building your first DApp with Hardhat and React',
      content: 'Step-by-step guide for beginners to create a decentralized application. Includes smart contract deployment and frontend integration.',
      upvotes: 1567,
      downvotes: 45,
      comments: 189,
      awards: ['📚', '⚡'],
      isPinned: true,
      flair: 'Tutorial',
      flairColor: 'bg-purple-500',
    }
  ];

  const [communityPosts, setCommunityPosts] = useState(posts);

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

  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
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

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return (b.upvotes - b.downvotes + b.comments * 0.5) - (a.upvotes - a.downvotes + a.comments * 0.5);
      case 'new':
        return new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'rising':
        return (b.upvotes / (Date.now() - new Date(b.timeAgo).getTime())) - (a.upvotes / (Date.now() - new Date(a.timeAgo).getTime()));
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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/communities"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Communities</span>
          </Link>
        </div>

        {/* Community Header */}
        {/* Community Cover Image */}
        <div className="relative h-64 sm:h-80 overflow-hidden rounded-2xl mb-8">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop"
            alt="Community Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/50 to-gray-900/80">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
            <div className="absolute inset-0 backdrop-blur-[2px]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNhODU1ZjcxMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30"></div>
          </div>
          
          {/* Community Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between">
              <div className="flex items-end space-x-4 mb-4 sm:mb-0">
                {/* Community Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl border-4 border-white/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-transparent"></div>
                    {community.icon}
                    <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-blue-500/20 rounded-full blur-xl"></div>
                  </div>
                </div>
                
                {/* Community Info */}
                <div className="pb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{community.name}</h1>
                  <p className="text-gray-200 mb-3 max-w-2xl">{community.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{community.members} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>{community.online} online</span>
                    </div>
                    <span>Created {community.created}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleJoinCommunity} 
                  className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isJoined
                      ? 'bg-gray-600/90 backdrop-blur-sm text-white hover:bg-gray-700/90' 
                      : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
                  }`}
                >
                  {!isJoined && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <span className="relative z-10 flex items-center">
                  {isJoined ? 'Joined' : 'Join Community'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post Section */}
            <div className="mb-6">
              <InlineCreatePost
                communityName={community.name}
                communityIcon={community.icon}
                communityMembers={community.members}
                placeholder="What's on your mind?"
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
                  setCommunityPosts([completePost, ...communityPosts]);
                }}
              />
            </div>

            {/* Sort Options */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 mb-6 shadow-lg">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'hot', label: 'Hot', icon: Fire },
                  { id: 'new', label: 'New', icon: Clock },
                  { id: 'top', label: 'Top', icon: TrendingUp },
                  { id: 'rising', label: 'Rising', icon: ArrowUp },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSortBy(id as any)}
                    className={`group relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      sortBy === id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md shadow-primary-500/20'
                        : 'bg-gray-700/70 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                    }`}
                  >
                    {sortBy === id && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    <Icon className={`w-4 h-4 ${sortBy === id ? 'animate-pulse' : ''}`} />
                    <span className="text-sm font-medium relative z-10">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {communityPosts.map((post, index) => (
                <motion.div
                  key={post.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-primary-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-primary-500/5"
                >
                  <div className="flex">
                    {/* Voting Section */}
                    <div className="flex flex-col items-center p-4 bg-gradient-to-b from-gray-800/40 to-gray-900/40 border-r border-gray-700/30 group-hover:from-gray-800/60 group-hover:to-gray-900/60 transition-colors duration-500">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                          votedPosts[post.id] === 'up'
                            ? 'text-orange-400 bg-orange-500/20 shadow-md shadow-orange-500/10'
                            : 'text-gray-400 hover:text-orange-400 hover:bg-gray-700/70'
                        }`}
                      >
                        <ArrowUp className={`w-5 h-5 ${votedPosts[post.id] === 'up' ? 'animate-pulse' : ''}`} />
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
                        className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                          votedPosts[post.id] === 'down'
                            ? 'text-blue-400 bg-blue-500/20 shadow-md shadow-blue-500/10'
                            : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/70'
                        }`}
                      >
                        <ArrowDown className={`w-5 h-5 ${votedPosts[post.id] === 'down' ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      {/* Post Header */}
                      <div className="p-4 border-b border-gray-700/30 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg group-hover:scale-110 transition-transform duration-300">{community.icon}</span>
                              <span className="text-primary-400 font-medium text-sm group-hover:text-primary-300 transition-colors duration-300">
                                {community.name}
                              </span>
                              {post.isPinned && (
                                <Pin className="w-4 h-4 text-green-400 animate-pulse" />
                              )}
                              {post.flair && (
                                <span className={`px-2 py-1 ${post.flairColor} text-white text-xs rounded-full shadow-sm`}>
                                  {post.flair}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {post.awards.map((award, i) => (
                              <span key={i} className="text-lg transform hover:scale-125 transition-transform duration-300 cursor-pointer">{award}</span>
                            ))}
                            <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/70 transition-all duration-300 hover:shadow-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-400 text-sm mt-2">
                          <img
                            src={post.authorAvatar}
                            alt={post.author}
                          className="w-6 h-6 rounded-full cursor-pointer hover:border-primary-400 hover:border-2 transition-all duration-200 hover:shadow-md hover:shadow-primary-500/20"
                          onClick={() => window.location.href = `/creator/${post.author.replace('u/', '')}`}
                          />
                          <Link
                            to={`/creator/${post.author.replace('u/', '')}`}
                            className="hover:text-primary-400 transition-colors font-medium hover:underline decoration-primary-400/30"
                          >
                            {post.author}
                          </Link>
                          <span>•</span>
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-5">
                        <h2 className="text-xl font-semibold text-white mb-3 leading-tight hover:text-primary-400 transition-colors cursor-pointer group-hover:translate-x-0.5 duration-500">
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
                                  className={`inline-flex items-center space-x-1 px-2 py-1 ${tagInfo.bgColor} ${tagInfo.textColor} rounded-md text-xs font-medium border ${tagInfo.borderColor} hover:opacity-100 hover:scale-105 transition-all duration-300 cursor-pointer ml-1 shadow-sm`}
                                 >
                                   <span className="text-sm">{tagInfo.emoji}</span>
                                   <span>{tagInfo.name}</span>
                                 </span>
                               );
                             })}
                           </span>
                         )}
                        </h2>
                        <p className="text-gray-300 mb-4 leading-relaxed group-hover:text-gray-200 transition-colors duration-500">
                          {post.content}
                        </p>
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
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
                        
                        {/* Highlights for specific posts */}
                        {post.highlights && (
                          <div className="mb-4">
                            <p className="text-white font-medium mb-2">Key highlights:</p>
                            <ul className="space-y-1">
                              {post.highlights.map((highlight, i) => (
                                <li key={i} className="text-gray-300 text-sm flex items-start">
                                  <span className="text-primary-400 mr-2">•</span>
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-5 pb-5 pt-2">
                        <div className="flex items-center space-x-6 flex-wrap">
                          <button 
                            onClick={() => handleComments(post)}
                            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-105 transform"
                          >
                            <MessageCircle className="w-5 h-5 group-hover:animate-pulse" />
                            <span className="text-sm font-medium">{postCommentCounts[post.id] || post.comments}</span>
                          </button>

                          <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-all duration-300 hover:scale-105 transform">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Share</span>
                          </button>

                          <button
                            onClick={() => handleSave(post.id)}
                            className={`flex items-center space-x-2 transition-all duration-300 hover:scale-105 transform ${
                              savedPosts.has(post.id)
                                ? 'text-yellow-400'
                                : 'text-gray-400 hover:text-yellow-400'
                            }`}
                          >
                            <Bookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">Save</span>
                          </button>

                          <button className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 transform">
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
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Community Rules - Enhanced */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl hover:border-gray-600/50 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500/0 via-primary-500 to-primary-500/0"></div>
                <div className="absolute -top-24 -right-24 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
                
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-primary-400 mr-2" />
                  Community Rules
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  {community.rules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-700/30 transition-colors duration-300">
                      <span className="flex items-center justify-center w-6 h-6 bg-primary-500/20 text-primary-400 font-bold rounded-full flex-shrink-0">{index + 1}</span>
                      <span className="group-hover:text-white transition-colors duration-500">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Stats - Enhanced */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl hover:border-gray-600/50 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary-500/0 via-secondary-500 to-secondary-500/0"></div>
                <div className="absolute -bottom-24 -left-24 w-32 h-32 bg-secondary-500/5 rounded-full blur-3xl group-hover:bg-secondary-500/10 transition-colors duration-500"></div>
                
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-secondary-400 mr-2" />
                  Community Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group-hover:translate-x-1">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-sm">Members</div>
                      <div className="text-white font-medium text-lg">{community.members}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group-hover:translate-x-1">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <div className="relative">
                        <Users className="w-5 h-5 text-green-400" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-sm">Online</div>
                      <div className="text-green-400 font-medium text-lg">{community.online}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group-hover:translate-x-1">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-400 text-sm">Created</div>
                      <div className="text-white font-medium text-lg">{community.created}</div>
                    </div>
                  </div>
                </div>
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
          postAuthor={community.name}
          initialCommentCount={postCommentCounts[selectedPost.id] || selectedPost.comments || 0}
          onCommentCountChange={(newCount) => handleCommentCountChange(selectedPost.id, newCount)}
        />
      )}
    </div>
  );
};

export default Community;