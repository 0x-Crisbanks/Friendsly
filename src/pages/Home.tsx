import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Users, Compass, Star, TrendingUp, Play, Eye, ChevronRight, Sparkles, Award, Rocket, Crown, Quote, ChevronLeft } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import featuresHomeData from '../data/featuresHome';
import statsHomeData from '../data/statsHome';
import testimonialsHomeData from '../data/testimonialsHome';
import featuredCreatorsHomeData from '../data/featuredCreatorsHome';

const Home = () => {
  const { isAuthenticated } = useWeb3();
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  const testimonials = testimonialsHomeData;

  // Auto-rotate testimonials
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <motion.div 
            style={{ y: y1 }}
            className="absolute top-10 sm:top-20 left-5 sm:left-10 w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary-500/30 rounded-full blur-xl"
          />
          <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-secondary-500/30 rounded-full blur-xl"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full text-primary-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>The Future of Creator Economy</span>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.div>

            {/* Updated H1 with new text */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-4 lg:gap-8">
                <span className="text-white">Share.</span>
                <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent animate-gradient bg-300% bg-pos-0">
                  Monetize.
                </span>
                <span className="text-white">Thrive.</span>
              </div>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Join the first fully <span className="text-primary-400 font-semibold">decentralized creator platform</span>. 
              Connect directly with your audience, receive crypto payments, and maintain complete control over your content.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-14 lg:mb-16 px-4 sm:px-0"
          >
            {isAuthenticated ? (
              <Link
                to="/explore"
                className="group relative overflow-hidden w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl sm:rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2 sm:space-x-3">
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Explore Creators</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ) : (
              <button className="group relative overflow-hidden w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl sm:rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2 sm:space-x-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            )}
            
            <Link
              to="/explore"
              className="group flex items-center justify-center space-x-2 sm:space-x-3 w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 border-2 border-gray-600 text-gray-300 rounded-xl sm:rounded-2xl hover:border-primary-500 hover:text-white hover:bg-primary-500/10 transition-all duration-300 text-base sm:text-lg backdrop-blur-sm"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Watch Demo</span>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-gray-400 text-xs sm:text-sm"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span>Creator Owned</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span>Instant Payments</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Clean Stats Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-3 sm:px-4 lg:px-6 xl:px-8 relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-gray-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Platform Statistics</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Trusted by Creators
              <span className="block text-transparent bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text">
                Worldwide
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto">
              Join thousands of creators building their future on the decentralized web
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {statsHomeData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 group-hover:scale-105 group-hover:border-white/20">
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    
                    {/* Value */}
                    <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-base sm:text-lg font-semibold text-gray-300 mb-1 sm:mb-2 group-hover:text-white transition-colors duration-300">
                      {stat.label}
                    </div>
                    
                    {/* Description */}
                    <div className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                      {stat.description}
                    </div>
                  </div>

                  {/* Subtle Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl sm:rounded-3xl`}></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12 mt-12 sm:mt-16 lg:mt-20 pt-8 sm:pt-12 border-t border-white/10"
          >
            <div className="flex items-center space-x-3 text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-400">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-400">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-xs sm:text-sm font-medium">Instant Settlements</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-400">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-xs sm:text-sm font-medium">Global Access</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Featured Creators Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-3 sm:px-4 lg:px-6 xl:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-secondary-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            {/* Enhanced Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Top Creators</span>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>

            {/* Enhanced Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8">
              <span className="text-white">Featured </span>
              <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                Creators
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
              Discover amazing content from our <span className="text-primary-400 font-semibold">top creators</span> earning thousands monthly
            </p>
          </motion.div>

          {/* Enhanced Creator Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {featuredCreatorsHomeData.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className="group relative"
              >
                {/* Main Card Container */}
                <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-700 group-hover:scale-105 group-hover:shadow-2xl">
                  
                  {/* Gradient Border Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${creator.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl sm:rounded-3xl blur-sm`}></div>
                  
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${creator.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                  {/* Cover Image Section */}
                  <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                    <img
                      src={creator.cover}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Enhanced Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Live Indicator */}
                    {creator.isLive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-semibold shadow-lg"
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </motion.div>
                    )}

                    {/* Enhanced Category Badge */}
                    <div className={`absolute top-4 sm:top-6 right-4 sm:right-6 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r ${creator.gradient} backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-semibold shadow-lg`}>
                      {creator.category}
                    </div>
                  </div>

                  {/* Enhanced Content Section */}
                  <div className="relative z-10 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 text-center">
                    {/* Floating Avatar */}
                    <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2">
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-4 border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500"
                        />
                        {creator.isVerified && (
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${creator.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                            <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Creator Name */}
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-secondary-400 group-hover:bg-clip-text transition-all duration-500">
                      {creator.name}
                    </h3>
                    
                    {/* Subscriber Count */}
                    <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4 sm:mb-6 group-hover:text-gray-300 transition-colors duration-500">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium text-sm sm:text-base">{creator.subscribers} subscribers</span>
                    </div>

                    {/* Enhanced CTA Button */}
                    <Link
                      to={`/creator/${creator.id}`}
                      className={`group/btn relative overflow-hidden w-full flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r ${creator.gradient} text-white rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 font-semibold text-sm sm:text-base`}
                    >
                      {/* Button Background Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center space-x-2 sm:space-x-3">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>View Profile</span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Link>
                  </div>

                  {/* Subtle Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${creator.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700 rounded-2xl sm:rounded-3xl`}></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Explore All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12 sm:mt-16 lg:mt-20"
          >
            <Link
              to="/explore"
              className="group relative inline-flex items-center space-x-3 sm:space-x-4 px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white rounded-xl sm:rounded-2xl hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-500 text-base sm:text-lg font-semibold overflow-hidden"
            >
              {/* Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-base sm:text-lg font-bold">Explore All Creators</div>
                  <div className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300">Discover thousands more</div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 xl:px-8 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose Friendsly?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-xs sm:max-w-lg lg:max-w-3xl mx-auto">
              Built for creators, by creators. Experience the power of decentralized technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {featuresHomeData.map((feature, index) => (
              <motion.div
                key={`${index}-${feature.title}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                viewport={{ once: true }}
                className="group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-700 hover:border-primary-500/50 transition-all duration-500 hover:transform hover:scale-105"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl sm:rounded-3xl`}></div>
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 group-hover:text-primary-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 xl:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full text-primary-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Creator Success Stories</span>
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              What Creators Say
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto">
              Real stories from real creators earning on Friendsly
            </p>
          </motion.div>

          {/* Testimonial Carousel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative"
              >
                <div className={`relative bg-gradient-to-br ${testimonials[currentTestimonial].bgColor} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700/50 overflow-hidden`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
                  <div className={`absolute -top-10 sm:-top-20 -right-10 sm:-right-20 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-br ${testimonials[currentTestimonial].gradient} opacity-20 rounded-full blur-2xl`}></div>
                  <div className={`absolute -bottom-10 sm:-bottom-20 -left-10 sm:-left-20 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-br ${testimonials[currentTestimonial].gradient} opacity-20 rounded-full blur-2xl`}></div>
                  
                  <div className="relative z-10">
                    {/* Quote Icon */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${testimonials[currentTestimonial].gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 mx-auto`}>
                      <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>

                    {/* Rating Stars */}
                    <div className="flex justify-center mb-6 sm:mb-8">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current mx-1" />
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Testimonial Content */}
                    <blockquote className="text-lg sm:text-xl lg:text-2xl text-white mb-8 sm:mb-10 leading-relaxed text-center font-medium">
                      "{testimonials[currentTestimonial].content}"
                    </blockquote>
                    
                    {/* Creator Info */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={testimonials[currentTestimonial].avatar}
                            alt={testimonials[currentTestimonial].name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gray-600"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${testimonials[currentTestimonial].gradient} rounded-full flex items-center justify-center`}>
                            <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-white font-bold text-base sm:text-lg">
                            {testimonials[currentTestimonial].name}
                          </div>
                          <div className="text-gray-400 font-medium text-sm sm:text-base">
                            {testimonials[currentTestimonial].role}
                          </div>
                        </div>
                      </div>
                      
                      {/* Earnings Badge */}
                      <div className={`px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r ${testimonials[currentTestimonial].gradient} rounded-full`}>
                        <div className="text-white font-bold text-base sm:text-lg">
                          Earned {testimonials[currentTestimonial].earnings}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-700/80 hover:border-primary-500 transition-all duration-300 group"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-primary-400" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-700/80 hover:border-primary-500 transition-all duration-300 group"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-primary-400" />
            </button>
          </div>

          {/* Enhanced Testimonial Indicators */}
          <div className="flex justify-center space-x-3 mt-8 sm:mt-12">
            {testimonials.map((testimonial, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`relative w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? `bg-gradient-to-r ${testimonial.gradient} shadow-lg` 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {index === currentTestimonial && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${testimonial.gradient} rounded-full animate-ping opacity-75`}></div>
                )}
              </button>
            ))}
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-400 mb-2">98%</div>
              <div className="text-gray-400 text-sm sm:text-base">Creator Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">$2.5M+</div>
              <div className="text-gray-400 text-sm sm:text-base">Total Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-400 text-sm sm:text-base">Platform Uptime</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-primary-500/10 to-secondary-500/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700 text-center overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
                Ready to Start Your Creator Journey?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto">
                Join thousands of creators who have already embraced the decentralized future. 
                Start earning crypto from your content today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Link
                  to="/profile"
                  className="group flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl sm:rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105"
                >
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Become a Creator</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/explore"
                  className="flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 lg:px-10 py-4 sm:py-5 border-2 border-gray-600 text-gray-300 rounded-xl sm:rounded-2xl hover:border-primary-500 hover:text-white hover:bg-primary-500/10 transition-all duration-300 text-base sm:text-lg backdrop-blur-sm"
                >
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Explore Content</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;