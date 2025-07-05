'use client';

import { useState, useEffect } from 'react';
import { Sparkles, LogIn, User, HelpCircle } from 'lucide-react';
import MainTabSystem from '@/components/MainTabSystem';
import NewUserOnboarding from '@/components/NewUserOnboarding';
import AuthModal from '@/components/AuthModal';
import TutorialSystem from '@/components/TutorialSystem';
import { useAuth, getCoachDisplayName } from '@/contexts/AuthContext';

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Debug logging
  console.log('HomePage render:', { user, isAuthenticated, isLoading });

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing render');
      setForceRender(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Check if authenticated user is new (has completed onboarding)
    if (isAuthenticated && user) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.id}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (isLoading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading WiseSage...</p>
          <p className="text-xs text-gray-500 mt-2">If this takes too long, the app will auto-load...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              _____ WARS
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          
          {/* Authentication UI */}
          <div className="flex items-center space-x-4">
            {/* Help Button */}
            <button
              onClick={() => setShowTutorial(true)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
              title="Help & Tutorials"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
            
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{getCoachDisplayName(user)}</p>
                  <p className="text-sm text-gray-400">{user.total_wins}W/{user.total_battles - user.total_wins}L • {user.rating} Rating</p>
                </div>
                <div className="bg-blue-600/20 rounded-full p-2">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            A Reality Show about Warriors from _____ time, place or legend living, training, and fighting together in a multiverse team combat league
          </p>
          {isAuthenticated && user && (
            <p className="text-blue-400 font-semibold">
              Welcome back, {getCoachDisplayName(user)}! Ready for your next battle?
            </p>
          )}
        </div>
      </div>

      {/* Main Tab System */}
      <MainTabSystem />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-4 text-center bg-gray-900">
        <div className="flex items-center justify-center gap-4 text-gray-400">
          <Sparkles className="w-5 h-5" />
          <span>_____ Wars - Character Management Gaming v2.0</span>
          <Sparkles className="w-5 h-5" />
        </div>
      </footer>

      {/* New User Onboarding */}
      {showOnboarding && isAuthenticated && user && (
        <NewUserOnboarding 
          username={user.username}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Tutorial System */}
      <TutorialSystem
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
