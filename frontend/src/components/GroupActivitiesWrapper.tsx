'use client';

import { useState } from 'react';
import { Activity, Users, Gamepad2, Brain, Music, Coffee, Trophy, Clock } from 'lucide-react';
import { createDemoCharacterCollection } from '@/data/characters';

interface GroupActivity {
  id: string;
  title: string;
  type: 'game_night' | 'group_therapy' | 'meditation' | 'tournament' | 'workshop';
  description: string;
  duration: string;
  minParticipants: number;
  maxParticipants: number;
  benefits: string[];
  icon: any;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const groupActivities: GroupActivity[] = [
  {
    id: 'board-game-night',
    title: 'Board Game Night',
    type: 'game_night',
    description: 'Strategic board games to improve teamwork and critical thinking',
    duration: '3 hours',
    minParticipants: 4,
    maxParticipants: 8,
    benefits: ['Strategic thinking', 'Communication', 'Fun bonding'],
    icon: Gamepad2,
    color: 'blue',
    difficulty: 'easy'
  },
  {
    id: 'group-therapy-session',
    title: 'Group Therapy Session',
    type: 'group_therapy',
    description: 'Professional-led session to address team conflicts and stress',
    duration: '2 hours',
    minParticipants: 6,
    maxParticipants: 12,
    benefits: ['Mental health', 'Conflict resolution', 'Team trust'],
    icon: Brain,
    color: 'purple',
    difficulty: 'medium'
  },
  {
    id: 'meditation-circle',
    title: 'Meditation & Mindfulness',
    type: 'meditation',
    description: 'Guided meditation to reduce stress and improve focus',
    duration: '1 hour',
    minParticipants: 3,
    maxParticipants: 15,
    benefits: ['Stress reduction', 'Focus improvement', 'Inner peace'],
    icon: Brain,
    color: 'green',
    difficulty: 'easy'
  },
  {
    id: 'mini-tournament',
    title: 'Mini Tournament',
    type: 'tournament',
    description: 'Friendly competition to boost morale and showcase skills',
    duration: '4 hours',
    minParticipants: 8,
    maxParticipants: 16,
    benefits: ['Competitive spirit', 'Skill showcase', 'Achievement'],
    icon: Trophy,
    color: 'yellow',
    difficulty: 'hard'
  },
  {
    id: 'creative-workshop',
    title: 'Creative Workshop',
    type: 'workshop',
    description: 'Art, music, or writing workshop to explore creativity together',
    duration: '2.5 hours',
    minParticipants: 5,
    maxParticipants: 10,
    benefits: ['Creativity', 'Self-expression', 'Team bonding'],
    icon: Music,
    color: 'orange',
    difficulty: 'medium'
  },
  {
    id: 'coffee-talk-circle',
    title: 'Coffee Talk Circle',
    type: 'workshop',
    description: 'Informal discussion circle with coffee and light topics',
    duration: '1.5 hours',
    minParticipants: 4,
    maxParticipants: 8,
    benefits: ['Casual bonding', 'Open communication', 'Relaxation'],
    icon: Coffee,
    color: 'brown',
    difficulty: 'easy'
  }
];

export default function GroupActivitiesWrapper() {
  const [selectedActivity, setSelectedActivity] = useState<GroupActivity | null>(null);
  const [ongoingActivities, setOngoingActivities] = useState<GroupActivity[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const characters = createDemoCharacterCollection();

  const handleStartActivity = (activity: GroupActivity) => {
    if (selectedParticipants.length >= activity.minParticipants) {
      setOngoingActivities(prev => [...prev, { ...activity, id: `${activity.id}-${Date.now()}` }]);
      setSelectedActivity(null);
      setSelectedParticipants([]);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
      purple: 'border-purple-500/50 bg-purple-600/20 text-purple-400',
      green: 'border-green-500/50 bg-green-600/20 text-green-400',
      yellow: 'border-yellow-500/50 bg-yellow-600/20 text-yellow-400',
      orange: 'border-orange-500/50 bg-orange-600/20 text-orange-400',
      brown: 'border-amber-500/50 bg-amber-600/20 text-amber-400'
    };
    return colorMap[color] || 'border-gray-500/50 bg-gray-600/20 text-gray-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const toggleParticipant = (characterId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8" />
            Group Activities
          </h1>
          <p className="text-gray-300">
            Organize game nights, group therapy sessions, and team activities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Available Activities */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold text-white mb-4">Available Group Activities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {groupActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-opacity-30 ${getColorClasses(activity.color)}`}
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className="w-6 h-6 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{activity.title}</h3>
                        <p className="text-sm text-gray-400 capitalize">{activity.type.replace('_', ' ')}</p>
                      </div>
                      <span className={`text-xs font-semibold ${getDifficultyColor(activity.difficulty)} capitalize`}>
                        {activity.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{activity.description}</p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activity.minParticipants}-{activity.maxParticipants}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ongoing Activities */}
            {ongoingActivities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Current Activities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ongoingActivities.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="bg-black/40 border border-green-500/50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{activity.title}</h3>
                            <p className="text-sm text-gray-400">In progress...</p>
                          </div>
                          <div className="text-green-400 text-sm font-semibold">Active</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Duration: {activity.duration} • Participants: {activity.minParticipants}+
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Activity Details & Setup */}
          <div className="bg-black/40 rounded-lg p-4 h-fit">
            {selectedActivity ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <selectedActivity.icon className={`w-8 h-8 ${getColorClasses(selectedActivity.color).split(' ')[2]}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedActivity.title}</h3>
                    <p className="text-sm text-gray-400 capitalize">{selectedActivity.type.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">{selectedActivity.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Duration</div>
                      <div className="text-white font-semibold">{selectedActivity.duration}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Participants</div>
                      <div className="text-white font-semibold">{selectedActivity.minParticipants}-{selectedActivity.maxParticipants}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Difficulty</div>
                      <div className={`font-semibold capitalize ${getDifficultyColor(selectedActivity.difficulty)}`}>
                        {selectedActivity.difficulty}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Type</div>
                      <div className="text-white font-semibold capitalize">{selectedActivity.type.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm mb-2">Benefits:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedActivity.benefits.map((benefit, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Participant Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Select Participants ({selectedParticipants.length}/{selectedActivity.maxParticipants})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {characters.slice(0, 12).map((character) => (
                      <button
                        key={character.id}
                        onClick={() => toggleParticipant(character.id)}
                        disabled={!selectedParticipants.includes(character.id) && selectedParticipants.length >= selectedActivity.maxParticipants}
                        className={`w-full p-2 rounded text-left transition-all text-sm ${
                          selectedParticipants.includes(character.id)
                            ? 'bg-blue-600/40 border border-blue-500'
                            : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 disabled:opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{character.avatar}</span>
                          <span className="text-white">{character.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleStartActivity(selectedActivity)}
                    disabled={selectedParticipants.length < selectedActivity.minParticipants}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
                  >
                    {selectedParticipants.length < selectedActivity.minParticipants 
                      ? `Need ${selectedActivity.minParticipants - selectedParticipants.length} more` 
                      : 'Start Activity'}
                  </button>
                  
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Group Activities Hub</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Select an activity to set up group sessions
                </p>
                
                <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-3">
                  <div className="text-purple-400 text-sm font-semibold mb-1">Team Status</div>
                  <div className="text-xs text-gray-400">
                    <div>Available: {characters.length} members</div>
                    <div>Active Sessions: {ongoingActivities.length}</div>
                    <div>Team Morale: High</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}