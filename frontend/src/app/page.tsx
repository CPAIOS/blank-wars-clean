'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Play, LogIn, UserPlus, BookOpen, Camera, Tv, Drama, Users, Sparkles, Crown, Skull, Rainbow, Brain, HeartHandshake, Home, Target, Sword, Shield, Zap } from 'lucide-react'; // Added new icons for features
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import Homepage from '@/components/Homepage';
import LogoutButton from '@/components/LogoutButton';

function HomePageContent() {
  const { user, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle auth required redirect from middleware
  useEffect(() => {
    const authRequired = searchParams.get('authRequired');
    if (authRequired === 'true') {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  }, [searchParams]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      router.push(redirectTo);
    }
    // Stay on homepage to show game dashboard
  };

  const handleStartCoaching = () => {
    if (user) {
      router.push('/coach');
    } else {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };
  const characters = [
    { name: 'Sherlock Holmes', avatar: '🕵️', type: 'Historical', quote: 'Elementary, my dear coach.' },
    { name: 'Dracula', avatar: '🧛', type: 'Mythological', quote: 'I vant to suck... your strategy.' },
    { name: 'Joan of Arc', avatar: '⚔️', type: 'Historical', quote: 'By God\'s will, we shall clean this kitchen!' },
    { name: 'Skeleton Mage', avatar: '💀🔮', type: 'Fantastical', quote: 'My spells are bone-chillingly effective.' },
    { name: 'Rainbow Unicorn', avatar: '🦄🌈', type: 'Fantastical', quote: 'Sparkle and fight, that\'s my motto!' },
    { name: 'Genghis Khan', avatar: '🐎', type: 'Historical', quote: 'My horde will conquer... the laundry.' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'Psychology-Driven Combat',
      description: 'Every decision, every conflict, every victory shapes your team mental state and performance.',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20'
    },
    {
      icon: HeartHandshake,
      title: 'Team Dynamics & Coaching',
      description: 'Manage egos, resolve disputes, and build unbreakable bonds within your eccentric cast.',
      color: 'text-pink-400',
      bgColor: 'bg-pink-900/20'
    },
    {
      icon: Home,
      title: 'Headquarters & Training',
      description: 'Upgrade your living conditions, hone skills, and prepare your team for both the arena and the house.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20'
    },
    {
      icon: Target,
      title: 'Strategic Depth',
      description: 'Formulate game plans, equip your fighters, and adapt on the fly to unpredictable reality show twists.',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20'
    },
  ];

  // If user is logged in, show the homepage
  if (user && !isLoading) {
    return (
      <>
        <LogoutButton />
        <Homepage />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <LogoutButton />
      {/* Background elements - subtle blend of arena and living quarters */}
      <div className="absolute inset-0 z-0">
        {/* Arena-like gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black/50 to-red-900/30 animate-gradient-shift"></div>
        {/* Subtle pattern overlay for "cramped living quarters" feel */}
        <div className="absolute inset-0 bg-[url('/images/cramped_quarters_pattern.png')] opacity-5 pointer-events-none"></div>
        {/* Optional: Placeholder for a subtle video loop or animation */}
        {/* <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-20">
          <source src="/videos/homepage_bg_loop.mp4" type="video/mp4" />
        </video> */}
      </div>

      {/* Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8 mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-lg">
            A Game of AI Strategy, Psychology, Danger, and ______.
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-200 drop-shadow-md">
            Welcome to <span className="font-bold text-purple-400">_____ Wars: A documentary-style reality show about characters from _____ time, place, universe or lore, living, training, and fighting together in an epic team deathmatch competition.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Master unpredictable combat, uncomfortable circumstances, and personality clashes to keep your team together and vanquish your enemies.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartCoaching}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xl rounded-lg shadow-lg flex items-center justify-center gap-3 transition-all duration-300"
            >
              <Play className="w-6 h-6" /> 
              {user ? 'Continue Coaching' : 'Start Coaching Now'}
            </motion.button>
            {!user && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegisterClick}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-xl rounded-lg shadow-md flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <UserPlus className="w-6 h-6" /> Register
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginClick}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-xl rounded-lg shadow-md flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <LogIn className="w-6 h-6" /> Login
                </motion.button>
              </>
            )}
          </div>
        </motion.section>

        {/* The Premise Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto p-8 bg-gray-900/70 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm mb-20"
        >
          <h3 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-red-500 drop-shadow-lg">
            It's Not Just a Battle, it’s Great Television!
          </h3>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
            Over 10 unique chat experiences in formats ranging from one-on-one coaching to group therapy. Hang around the kitchen table long enough and you can’t help but get caught up in a conflict as historic myths and legends squabble over petty chores and grievances. Take a peak into the confessional or head on over to the Clubhouse for a chance to catch some live, unscripted trash talking from dynamic AI characters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <Camera className="w-16 h-16 text-yellow-400 mb-4" />
              <h4 className="text-2xl font-bold text-white mb-2">Behind the Scenes Drama</h4>
              <p className="text-gray-400">Witness the hilarious and heartbreaking conflicts that arise when larger-than-life personalities are forced to live, train, and cook together.</p>
            </div>
            <div className="flex flex-col items-center">
              <Tv className="w-16 h-16 text-blue-400 mb-4" />
              <h4 className="text-2xl font-bold text-white mb-2">Life-or-Death Stakes</h4>
              <p className="text-gray-400">Every battle in the arena carries real consequences. Your characters aren't just playing for glory; they’re modern day gladiators, fighting for their very lives.</p>
            </div>
            <div className="flex flex-col items-center">
              <Drama className="w-16 h-16 text-green-400 mb-4" />
              <h4 className="text-2xl font-bold text-white mb-2">Your Role: The Coach</h4>
              <p className="text-400">As their coach you set strategy, manage training, mediate disputes, and help steer your characters through storms in their personal lives.</p>
            </div>
          </div>
        </motion.section>

        {/* Character Showcase Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto p-8 bg-gray-900/70 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm mb-20"
        >
          <h3 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-500 drop-shadow-lg">
            A Team of Characters from _____ = Endless Possible Hilarious Combos
          </h3>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-12">
            Assemble an unforgettable cast from across history, myth, and imagination. Each character brings unique skills, personalities, and a whole lot of baggage to the show.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((char, index) => (
              <motion.div
                key={char.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }} // Purple glow
                className="relative bg-gray-800 rounded-xl p-6 border border-gray-700 overflow-hidden cursor-pointer"
              >
                <div className="text-5xl mb-4">{char.avatar}</div>
                <h4 className="text-2xl font-bold text-white mb-1">{char.name}</h4>
                <p className="text-sm text-gray-400 mb-4">{char.type}</p>
                
                {/* Quote Overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-center"
                >
                  <p className="text-lg italic text-gray-200">"{char.quote}"</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features Showcase Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-6xl mx-auto p-8 bg-gray-900/70 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm mb-20"
        >
          <h3 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-lg">
            Beyond the Battlefield
          </h3>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-12">
            _____ Wars offers a unique blend of strategic combat and
    conflict management. Master these key features to lead your team
     to victory and stardom.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`p-6 rounded-xl border ${feature.bgColor} ${feature.color} shadow-lg flex flex-col items-center text-center`}
              >
                <feature.icon className="w-16 h-16 mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tutorial Gateway Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto p-8 bg-gray-900/70 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm mb-20"
        >
          <h3 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
            Hostmaster's Orientation
          </h3>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
            New to the game? Let the Hostmaster v8.72 be your guide.
     through the rules of the Arena and the drama of the House. Get ready
     for your close-up!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold text-xl rounded-lg shadow-lg flex items-center justify-center gap-3 transition-all duration-300"
          >
            <BookOpen className="w-6 h-6" /> Meet the Hostmaster & Start Tutorial
          </motion.button>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full p-8 bg-gray-900/70 border-t border-gray-700 text-gray-400 text-sm"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2025 _____ Wars. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </motion.footer>
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}