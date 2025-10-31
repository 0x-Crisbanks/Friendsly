import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { FollowProvider } from './context/FollowContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { MessagesProvider } from './context/MessagesContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Communities from './pages/Communities';
import Profile from './pages/Profile';
import Creator from './pages/Creator';
import Community from './pages/Community';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Earnings from './pages/Earnings';
import NotificationDemo from './components/NotificationDemo';
import { PriceConverter } from './utils/priceConverter';

function App() {
  // Load real-time crypto prices on app start
  useEffect(() => {
    // console.log('🚀 Friendsly App initialized');
    
    // Initial price update
    PriceConverter.updateExchangeRates();
    
    // Update prices every 5 minutes
    const intervalId = setInterval(() => {
      PriceConverter.updateExchangeRates();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Web3Provider>
      <FollowProvider>
        <NotificationsProvider>
          <MessagesProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
              <Navbar />
              <main className="pt-20">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/feed" 
                    element={
                      <ProtectedRoute>
                        <Feed />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/communities/:id" element={<Community />} />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/creator/:id" element={<Creator />} />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } 
                  />
                <Route 
                  path="/earnings" 
                  element={
                    <ProtectedRoute>
                      <Earnings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notification-demo" 
                  element={
                    <ProtectedRoute>
                      <NotificationDemo />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </MessagesProvider>
    </NotificationsProvider>
  </FollowProvider>
</Web3Provider>
);
}

export default App;