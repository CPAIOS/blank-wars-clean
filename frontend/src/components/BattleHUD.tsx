'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Settings, Timer, CreditCard, Gift } from 'lucide-react';

interface BattleHUDProps {
  // Announcer state
  isAnnouncerEnabled: boolean;
  isAnnouncerSpeaking: boolean;
  currentAnnouncement: string;
  announcementRef: React.RefObject<HTMLDivElement>;
  
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: any;
  
  // Timer state
  timer: number | null;
  isTimerActive: boolean;
  
  // Currency and cards
  playerCurrency: number;
  
  // Handlers
  toggleAnnouncer: (enabled: boolean) => void;
  onToggleAudioSettings: () => void;
  onShowCardCollection: () => void;
  onShowCardPacks: () => void;
}

export default function BattleHUD({
  isAnnouncerEnabled,
  isAnnouncerSpeaking,
  currentAnnouncement,
  announcementRef,
  isConnected,
  isAuthenticated,
  currentUser,
  timer,
  isTimerActive,
  playerCurrency,
  toggleAnnouncer,
  onToggleAudioSettings,
  onShowCardCollection,
  onShowCardPacks
}: BattleHUDProps) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-orange-900/60 via-red-900/60 to-purple-900/60 rounded-xl backdrop-blur-sm border-2 border-orange-500/50 shadow-2xl h-full flex flex-col"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 border-b border-orange-500/30">
        <div className="flex items-center gap-3">
          {isAnnouncerEnabled ? (
            <Volume2 className={`w-6 h-6 ${isAnnouncerSpeaking ? 'text-yellow-400 animate-pulse' : 'text-orange-300'}`} />
          ) : (
            <VolumeX className="w-6 h-6 text-gray-500" />
          )}
          <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            🎤 BATTLE ANNOUNCER
          </h2>
        </div>

        {/* Compact Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAnnouncer(!isAnnouncerEnabled)}
            className={`p-2 rounded-lg transition-all ${
              isAnnouncerEnabled 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
            title={isAnnouncerEnabled ? 'Disable Voice' : 'Enable Voice'}
          >
            {isAnnouncerEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={onToggleAudioSettings}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-all"
            title="Audio Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {timer !== null && (
            <div className="flex items-center gap-2 ml-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <span className="text-lg font-mono text-yellow-400">{timer}s</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Announcement Display - Full Height */}
      <div 
        ref={announcementRef}
        className="relative p-4 flex-1 flex items-center justify-center"
      >
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 rounded-b-xl" />
        
        {/* Announcement Text - Big, Bold, Engaging */}
        <motion.div
          key={currentAnnouncement}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
          className="relative z-10 text-center"
        >
          <div className={`font-extrabold leading-tight ${
            isAnnouncerSpeaking 
              ? 'text-lg md:text-xl text-yellow-300 animate-pulse drop-shadow-2xl' 
              : 'text-base md:text-lg text-white drop-shadow-lg'
          }`}>
            {currentAnnouncement || "🏟️ Welcome to the Arena! Prepare for epic battles where psychology and team chemistry determine victory!"}
          </div>
          
          {/* Speaking Indicator */}
          {isAnnouncerSpeaking && (
            <motion.div 
              className="flex justify-center gap-1 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Quick Access Bar */}
      <div className="flex items-center justify-between p-3 bg-black/20 rounded-b-xl border-t border-orange-500/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className={`text-xs ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShowCardCollection}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-all"
            title="Card Collection"
          >
            <CreditCard className="w-3 h-3 inline mr-1" />
            Cards
          </button>
          
          <button
            onClick={onShowCardPacks}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-all"
            title="Buy Card Packs"
          >
            <Gift className="w-3 h-3 inline mr-1" />
            Packs
          </button>
          
          <div className="text-yellow-400 font-mono text-sm font-bold">
            {playerCurrency} 💰
          </div>
        </div>
      </div>
    </motion.div>
  );
}