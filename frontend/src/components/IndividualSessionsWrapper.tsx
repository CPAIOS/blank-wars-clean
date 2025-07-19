'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { User, MessageCircle, Clock, Users, Brain } from 'lucide-react';
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
            archetype: char.archetype || 'warrior',
            hp: char.current_health || char.base_health || 80,
            energy: char.energy || 100,
            experience: char.experience || 0,
            bond_level: char.bond_level || 75
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

  // Get currently selected character object
  const currentCharacter = useMemo(() => {
    return characters.find(c => c.baseName === selectedCharacter) || characters[0];
  }, [characters, selectedCharacter]);

  // Character image mapping for 1-on-1 coaching
  const getCharacterImage = (character: any) => {
    const characterImageMap: Record<string, string> = {
      'achilles': 'achilles__1-on-1.png',
      'agent x': 'agent_X_1-on-1.png',
      'billy the kid': 'billy_the_kid_1-on1.png',
      'cleopatra': 'cleopatra__1-on-1.png',
      'cyborg': 'agent_X_1-on-1.png',
      'dracula': 'dracula_1-on-1.png',
      'count dracula': 'dracula_1-on-1.png',
      'fenrir': 'fenrir_1-on-1.png',
      'frankenstein': 'frankenstein_1-on-1.png',
      'frankenstein\'s monster': 'frankenstein_1-on-1.png',
      'frankensteins monster': 'frankenstein_1-on-1.png',
      'genghis khan': 'genghis_kahn_1-on-1.png',
      'gengas khan': 'genghis_kahn_1-on-1.png',
      'joan of arc': 'joan_of_arc__1-on-1.png',
      'joan of ark': 'joan_of_arc__1-on-1.png',
      'merlin': 'merlin_1-on-1.png',
      'robin hood': 'robin_hood_1-on-1.png',
      'robin_hood': 'robin_hood_1-on-1.png',
      'sherlock holmes': 'sherlock_holmes_1-on-1.png',
      'sun wukong': 'sun_wukong__1-on-1.png',
      'tesla': 'tesla_1-on-1.png',
      'nikola tesla': 'tesla_1-on-1.png',
      'zeta': 'zeta__1-on-1.png',
      'zeta reticulan': 'zeta__1-on-1.png',
      'sammy "slugger" sullivan': 'sammy_slugger_1-on-1.png',
      'sammy_slugger': 'sammy_slugger_1-on-1.png',
      'cleopatra vii': 'cleopatra__1-on-1.png',
      'space cyborg': 'vega_1-on-1.png',
    };
    
    const characterName = character?.name?.toLowerCase()?.trim();
    if (characterName && characterImageMap[characterName]) {
      return `/images/1-on-1_coaching/${characterImageMap[characterName]}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Character Sidebar */}
        <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Characters
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {charactersLoading ? (
              <div className="text-center text-gray-400 py-4">Loading characters...</div>
            ) : (
              characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.baseName)}
                  className={`w-full p-3 rounded-lg border transition-all text-left cursor-pointer ${
                    selectedCharacter === character.baseName
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {currentCharacter ? (
            <>
              {/* Character Image Display - TOP CENTER */}
              <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-8 text-center mb-8">
                <div className="flex flex-col items-center gap-6">
                  {/* Character Image */}
                  <div className="w-72 h-72 rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl">
                    <img 
                      src={getCharacterImage(currentCharacter)}
                      alt={currentCharacter?.name || 'Character'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ 1-on-1 coaching image failed to load:', e.currentTarget.src);
                        // Hide the image element instead of showing wrong character
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Character Info */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                      <div className="text-3xl">{currentCharacter?.avatar || '⚔️'}</div>
                      <div>
                        <div>{currentCharacter?.name || 'Loading...'}</div>
                        <div className="text-sm text-gray-400">Level {currentCharacter?.level || 1} {currentCharacter?.archetype || 'warrior'}</div>
                      </div>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Chat Window - MIDDLE */}
              <CoachingSessionChat 
                selectedCharacterId={selectedCharacter}
                sessionType={sessionType}
                onCharacterChange={setSelectedCharacter}
              />

              {/* Development Insights Panel - BOTTOM */}
              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">Development Insights for {currentCharacter?.name}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-green-300 font-semibold text-sm">Strengths</div>
                      <div className="text-white">Combat Leadership</div>
                      <div className="text-gray-400 text-sm">Natural battle instincts</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-yellow-300 font-semibold text-sm">Growth Areas</div>
                      <div className="text-white">Team Collaboration</div>
                      <div className="text-gray-400 text-sm">Working with others</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-purple-300 font-semibold text-sm">Recent Progress</div>
                      <div className="text-white">+15% Battle Focus</div>
                      <div className="text-gray-400 text-sm">Last 7 days</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-blue-300 font-semibold text-sm">Next Goals</div>
                      <div className="text-white">Strategic Thinking</div>
                      <div className="text-gray-400 text-sm">Long-term planning</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-black/40 rounded-lg p-6 min-h-[600px] flex flex-col items-center justify-center text-center">
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
  );
}