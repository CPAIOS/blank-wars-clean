'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Users, Sword, Shield, Home, 
  TrendingUp, Trophy, Star, ChevronRight,
  Sparkles, Target, Brain, HeartHandshake,
  Dumbbell, MessageCircle, Building, Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { characterAPI } from '@/services/apiClient';
import MainTabSystem from './MainTabSystem';

interface NavigationPanel {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  route: string;
}

export default function Homepage() {
  const { user } = useAuth();
  const [showMainGame, setShowMainGame] = useState(false);
  const [activeTab, setActiveTab] = useState('characters');
  const [activeSubtab, setActiveSubtab] = useState('progression');
  const [userStats, setUserStats] = useState({
    unopenedPacks: 0,
    totalCharacters: 0,
    victories: 0,
    currentRank: 'Rookie Coach'
  });

  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          setUserStats({
            unopenedPacks: 0, // TODO: Implement pack system
            totalCharacters: characters.length,
            victories: characters.reduce((total: number, char: any) => total + (char.total_wins || 0), 0),
            currentRank: characters.length > 10 ? 'Veteran Coach' : characters.length > 5 ? 'Rising Star' : 'Rookie Coach'
          });
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Fallback to default values
          setUserStats({
            unopenedPacks: 0,
            totalCharacters: 0,
            victories: 0,
            currentRank: 'Rookie Coach'
          });
        }
      }
    };

    fetchUserData();
  }, [user]);

  const navigationPanels: NavigationPanel[] = [
    {
      id: 'characters',
      title: 'Character Collection',
      description: 'View and manage your roster of legendary characters',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      route: '/characters'
    },
    {
      id: 'packs',
      title: 'Open Card Packs',
      description: 'Reveal new characters and expand your collection',
      icon: Package,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      route: '/packs'
    },
    {
      id: 'training',
      title: 'Training Grounds',
      description: 'Hone your team\'s skills and prepare for battle',
      icon: Dumbbell,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      route: '/training'
    },
    {
      id: 'battle',
      title: 'Battle Arena',
      description: 'Enter the arena and prove your coaching prowess',
      icon: Sword,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      route: '/battle'
    },
    {
      id: 'headquarters',
      title: 'Team Headquarters',
      description: 'Manage your living quarters and team dynamics',
      icon: Home,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      route: '/headquarters'
    },
    {
      id: 'coaching',
      title: 'Coaching Sessions',
      description: 'One-on-one sessions to guide your characters',
      icon: MessageCircle,
      color: 'text-pink-400',
      bgColor: 'bg-pink-900/20',
      route: '/coaching'
    },
    {
      id: 'facilities',
      title: 'Facilities Manager',
      description: 'Upgrade your training facilities and equipment',
      icon: Building,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-900/20',
      route: '/facilities'
    },
    {
      id: 'leaderboard',
      title: 'Rankings & Stats',
      description: 'Track your progress and compete with other coaches',
      icon: Trophy,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      route: '/leaderboard'
    }
  ];

  const handlePanelClick = (route: string) => {
    // Map routes to MainTabSystem tabs and subtabs based on actual tab structure
    const routeToTabAndSubtab: Record<string, { tab: string; subtab?: string }> = {
      '/characters': { tab: 'characters', subtab: 'progression' }, // Character progression
      '/packs': { tab: 'battle', subtab: 'packs' }, // Packs are under battle tab
      '/training': { tab: 'training', subtab: 'activities' }, // Training activities
      '/battle': { tab: 'battle', subtab: 'team-arena' }, // Team battle arena
      '/headquarters': { tab: 'headquarters', subtab: 'overview' }, // Team base
      '/coaching': { tab: 'coach', subtab: 'individual-sessions' }, // Individual coaching sessions
      '/facilities': { tab: 'headquarters', subtab: 'overview' }, // Team Base (includes facilities)
      '/leaderboard': { tab: 'social', subtab: 'clubhouse' } // Community/clubhouse
    };
    
    const config = routeToTabAndSubtab[route] || { tab: 'characters', subtab: 'progression' };
    console.log(`Switching to tab: ${config.tab}, subtab: ${config.subtab} from route: ${route}`);
    
    // Instead of navigation, set the active tab/subtab and show MainTabSystem
    setActiveTab(config.tab);
    if (config.subtab) {
      setActiveSubtab(config.subtab);
    }
    setShowMainGame(true);
  };

  // If user selected a game section, show MainTabSystem
  if (showMainGame) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Back to homepage button */}
        <div className="absolute top-4 left-4 z-50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMainGame(false)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
          >
            ← Back to Homepage
          </motion.button>
        </div>
        
        <MainTabSystem 
          defaultTab={activeTab}
          defaultSubtab={activeSubtab}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero image section */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img 
            src="/images/Homepage/spartan_group_welcome.png"
            alt="Blank Wars Homepage"
            className="w-full h-full object-contain bg-gray-900"
          />
        </motion.div>

      </div>

      {/* Spacer */}
      <div className="h-8"></div>

      {/* User Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 py-16"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 rounded-xl p-6 border border-yellow-700/30"
          >
            <Package className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-3xl font-bold text-yellow-400">{userStats.unopenedPacks}</h3>
            <p className="text-gray-400">Unopened Packs</p>
            {userStats.unopenedPacks > 0 && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-sm text-yellow-300 mt-2"
              >
                Ready to open!
              </motion.p>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-xl p-6 border border-blue-700/30"
          >
            <Users className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-3xl font-bold text-blue-400">{userStats.totalCharacters}</h3>
            <p className="text-gray-400">Total Characters</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-green-900/30 to-green-900/10 rounded-xl p-6 border border-green-700/30"
          >
            <Trophy className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-3xl font-bold text-green-400">{userStats.victories}</h3>
            <p className="text-gray-400">Victories</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 rounded-xl p-6 border border-purple-700/30"
          >
            <Crown className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-purple-400">{userStats.currentRank}</h3>
            <p className="text-gray-400">Current Rank</p>
          </motion.div>
        </div>

        {/* Navigation Panels */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 text-center">Where would you like to go?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationPanels.map((panel, index) => (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handlePanelClick(panel.route)}
              className={`cursor-pointer rounded-xl p-6 border ${panel.bgColor} ${panel.color} 
                         border-gray-700 hover:border-current transition-all duration-300 
                         shadow-lg hover:shadow-2xl hover:shadow-current/20 min-h-[200px] sm:min-h-[220px]
                         active:scale-95 touch-manipulation`}
            >
              <panel.icon className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{panel.title}</h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{panel.description}</p>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                className="mt-4 flex items-center text-current"
              >
                <span className="text-sm font-semibold">Enter</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}