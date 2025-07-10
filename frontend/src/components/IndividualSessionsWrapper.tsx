'use client';

import { useState, useEffect, Suspense } from 'react';
import { User, MessageCircle, Clock, Users } from 'lucide-react';
import { characterAPI } from '@/services/apiClient';
import CoachingSessionChat from './CoachingSessionChat';

export default function IndividualSessionsWrapper() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [sessionType, setSessionType] = useState<string>('general');

  // Load characters on component mount
  useEffect(() => {
    const loadCharacters = async () => {
      setCharactersLoading(true);
      try {
        const response = await characterAPI.getUserCharacters();
        const charactersData = response.characters || [];
        
        const mappedCharacters = charactersData.map((char: any) => {
          const baseName = char.name?.toLowerCase() || char.id?.split('_')[0] || 'unknown';
          return {
            ...char,
            baseName,
            // Map database fields for compatibility
            avatar: char.avatar_emoji || char.avatar || '⚔️',
            name: char.name || 'Unknown Character',
            level: char.level || 1,
            hp: char.current_health || char.base_health || 80,
            energy: char.energy || 100,
            experience: char.experience || 0
          };
        });
        
        setCharacters(mappedCharacters);
      } catch (error) {
        console.error('Failed to load characters:', error);
      } finally {
        setCharactersLoading(false);
      }
    };
    
    loadCharacters();
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8" />
            Individual Coaching Sessions
          </h1>
          <p className="text-gray-300">
            One-on-one coaching with team members to address personal development and performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Character Selection Sidebar */}
          <div className="bg-black/40 rounded-lg p-4 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </h2>
            
            <div className="space-y-2">
              {charactersLoading ? (
                <div className="text-center text-gray-400 py-4">Loading characters...</div>
              ) : (
                characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacter(character.baseName)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedCharacter === character.baseName
                        ? 'bg-purple-600/40 border border-purple-500'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{character.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{character.name}</div>
                        <div className="text-sm text-gray-400">Level {character.level}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Coaching Session Area */}
          <div className="lg:col-span-3 h-full">
            {selectedCharacter ? (
              <CoachingSessionChat 
                selectedCharacterId={selectedCharacter}
                sessionType={sessionType}
                onCharacterChange={setSelectedCharacter}
              />
            ) : (
              <div className="bg-black/40 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
                <MessageCircle className="w-16 h-16 text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a Team Member
                </h3>
                <p className="text-gray-400 max-w-md">
                  Choose a character from the sidebar to start an individual coaching session.
                  Address their personal challenges, motivate them, and help them grow.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}