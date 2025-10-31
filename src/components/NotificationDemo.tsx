import React from 'react';
import { Heart, MessageCircle, UserPlus, Crown, TrendingUp } from 'lucide-react';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { motion } from 'framer-motion';

/**
 * Demo Component for Testing Notifications
 * This component demonstrates how to use the notifications system
 * and provides buttons to generate test notifications
 */
const NotificationDemo = () => {
  const { notifyLike, notifyComment, notifyReply, notifyFollow, notifySubscribe, notifyTrending } = useNotificationActions();

  // Mock user data for testing
  const mockUsers = [
    {
      id: 'user1',
      name: 'Sarah Miller',
      username: 'sarahmiller',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    {
      id: 'user2',
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    {
      id: 'user3',
      name: 'Emma Wilson',
      username: 'emmawilson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
  ];

  const generateRandomUser = () => {
    return mockUsers[Math.floor(Math.random() * mockUsers.length)];
  };

  const handleTestLike = () => {
    const user = generateRandomUser();
    notifyLike(
      'post_123',
      {
        id: user.id,
        name: user.name,
        username: `@${user.username}`,
        avatar: user.avatar
      },
      'Amazing content! Keep it up 🔥'
    );
  };

  const handleTestComment = () => {
    const user = generateRandomUser();
    notifyComment(
      'post_123',
      {
        id: user.id,
        name: user.name,
        username: `@${user.username}`,
        avatar: user.avatar
      },
      'This is exactly what I was looking for! Thanks for sharing.'
    );
  };

  const handleTestReply = () => {
    const user = generateRandomUser();
    notifyReply(
      'post_123',
      {
        id: user.id,
        name: user.name,
        username: `@${user.username}`,
        avatar: user.avatar
      },
      'I totally agree with your point!'
    );
  };

  const handleTestFollow = () => {
    const user = generateRandomUser();
    notifyFollow({
      id: user.id,
      name: user.name,
      username: `@${user.username}`,
      avatar: user.avatar
    });
  };

  const handleTestSubscribe = () => {
    const user = generateRandomUser();
    notifySubscribe({
      id: user.id,
      name: user.name,
      username: `@${user.username}`,
      avatar: user.avatar
    });
  };

  const handleTestTrending = () => {
    const views = Math.floor(Math.random() * 10000) + 1000;
    notifyTrending('post_123', views);
  };

  const buttons = [
    { label: 'Test Like', onClick: handleTestLike, icon: Heart, color: 'from-red-500 to-pink-500' },
    { label: 'Test Comment', onClick: handleTestComment, icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
    { label: 'Test Reply', onClick: handleTestReply, icon: MessageCircle, color: 'from-purple-500 to-indigo-500' },
    { label: 'Test Follow', onClick: handleTestFollow, icon: UserPlus, color: 'from-green-500 to-emerald-500' },
    { label: 'Test Subscribe', onClick: handleTestSubscribe, icon: Crown, color: 'from-yellow-500 to-orange-500' },
    { label: 'Test Trending', onClick: handleTestTrending, icon: TrendingUp, color: 'from-primary-500 to-secondary-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-2">🔔 Notification System Demo</h2>
        <p className="text-gray-400 mb-8">
          Click any button below to generate a test notification. Check the bell icon in the navbar to see the results!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buttons.map((button, index) => {
            const Icon = button.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={button.onClick}
                className="relative group overflow-hidden rounded-xl p-6 bg-gray-700/30 border border-gray-600/50 hover:border-gray-500 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${button.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${button.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-medium">{button.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
          <h3 className="text-primary-400 font-semibold mb-2">💡 How it works:</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Each button generates a notification with random user data</li>
            <li>• Notifications appear in the navbar dropdown (bell icon)</li>
            <li>• Unread notifications show a blue badge</li>
            <li>• Click on a notification to mark it as read</li>
            <li>• Notifications persist in localStorage</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
          <h3 className="text-white font-semibold mb-2">📝 Integration Example:</h3>
          <pre className="text-xs text-gray-300 overflow-x-auto">
{`import { useNotificationActions } from '../hooks/useNotificationActions';

const MyComponent = () => {
  const { notifyLike } = useNotificationActions();
  
  const handleLike = () => {
    notifyLike(
      postId,
      {
        id: currentUser.id,
        name: currentUser.name,
        username: '@' + currentUser.username,
        avatar: currentUser.avatar
      },
      'Optional post excerpt'
    );
  };
};`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;

