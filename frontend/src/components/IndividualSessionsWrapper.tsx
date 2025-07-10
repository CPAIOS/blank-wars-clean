'use client';

import { useState, Suspense } from 'react';
import { User, MessageCircle, Clock, Users } from 'lucide-react';
import { createDemoCharacterCollection } from '@/data/characters';

export default function IndividualSessionsWrapper() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const characters = createDemoCharacterCollection();

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
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedCharacter === character.id
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
              ))}
            </div>
          </div>

          {/* Coaching Session Area */}
          <div className="lg:col-span-3 bg-black/40 rounded-lg p-6 h-full">
            {selectedCharacter ? (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Loading coaching session...</div>
                </div>
              }>
                <CoachingSessionContent characterId={selectedCharacter} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
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

function CoachingSessionContent({ characterId }: { characterId: string }) {
  const characters = createDemoCharacterCollection();
  const character = characters.find(c => c.id === characterId);
  
  if (!character) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Character not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{character.avatar}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
            <p className="text-gray-400">Individual Coaching Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Session Active</span>
        </div>
      </div>

      {/* Session Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Performance Review</h3>
          <p className="text-sm text-gray-400 mb-3">
            Discuss recent battles and performance metrics
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
            Start Review
          </button>
        </div>

        <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Personal Development</h3>
          <p className="text-sm text-gray-400 mb-3">
            Work on skills, mindset, and personal goals
          </p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
            Start Session
          </button>
        </div>

        <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Conflict Resolution</h3>
          <p className="text-sm text-gray-400 mb-3">
            Address team conflicts and relationship issues
          </p>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors">
            Resolve Issues
          </button>
        </div>

        <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Mental Health Check</h3>
          <p className="text-sm text-gray-400 mb-3">
            Support mental well-being and stress management
          </p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
            Check In
          </button>
        </div>
      </div>

      {/* Character Stats */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Current Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Level</div>
            <div className="text-white font-semibold">{character.level}</div>
          </div>
          <div>
            <div className="text-gray-400">HP</div>
            <div className="text-white font-semibold">{character.hp}</div>
          </div>
          <div>
            <div className="text-gray-400">Energy</div>
            <div className="text-white font-semibold">{character.energy}</div>
          </div>
          <div>
            <div className="text-gray-400">XP</div>
            <div className="text-white font-semibold">{character.experience}</div>
          </div>
        </div>
      </div>
    </div>
  );
}