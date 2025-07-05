'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Coins,
  Clock,
  Heart,
  TrendingUp,
  Coffee,
  Mountain,
  Dumbbell,
  Gamepad2,
  Brain,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Video,
  Star
} from 'lucide-react';
import { CoachingEngine } from '../data/coachingSystem';

interface TeamBuildingActivity {
  id: string;
  type: 'dinner' | 'retreat' | 'training' | 'game_night' | 'group_therapy';
  name: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  duration: number; // hours
  chemistryGain: number;
  individualGain: number;
  color: string;
  hostmasterIntro: string;
  benefits: string[];
}

const activities: TeamBuildingActivity[] = [
  {
    id: 'dinner',
    type: 'dinner',
    name: 'Team Dinner',
    description: 'A relaxed meal where fighters bond over food and stories from their different eras',
    icon: Coffee,
    cost: 100,
    duration: 2,
    chemistryGain: 8,
    individualGain: 5,
    color: 'amber',
    hostmasterIntro: "Cameras rolling, Coach! Tonight's dinner promises some fascinating cross-cultural conversations...",
    benefits: ['Reduces stress', 'Builds friendships', 'Cultural exchange', 'Improves team mood']
  },
  {
    id: 'game_night',
    type: 'game_night',
    name: 'Game Night',
    description: 'Board games, video games, and competitions that bring out playful team dynamics',
    icon: Gamepad2,
    cost: 50,
    duration: 3,
    chemistryGain: 12,
    individualGain: 8,
    color: 'blue',
    hostmasterIntro: "HOSTMASTER here - game night often reveals hidden competitive dynamics. Should be entertaining!",
    benefits: ['Increases bonding', 'Reveals personalities', 'Builds trust', 'Reduces tension']
  },
  {
    id: 'training',
    type: 'training',
    name: 'Group Training',
    description: 'Team-focused training sessions that improve coordination and mutual understanding',
    icon: Dumbbell,
    cost: 200,
    duration: 4,
    chemistryGain: 5,
    individualGain: 3,
    color: 'green',
    hostmasterIntro: "Coach organizing a group training session. Let's see how well they work together under pressure...",
    benefits: ['Improves teamwork', 'Builds coordination', 'Enhances skills', 'Develops strategy']
  },
  {
    id: 'group_therapy',
    type: 'group_therapy',
    name: 'Group Therapy',
    description: 'Professional counseling session to address team conflicts and mental health',
    icon: Brain,
    cost: 300,
    duration: 2,
    chemistryGain: 15,
    individualGain: 10,
    color: 'purple',
    hostmasterIntro: "Our cameras capture a rare behind-the-scenes therapy session. The raw emotions should be compelling television.",
    benefits: ['Resolves conflicts', 'Improves mental health', 'Builds understanding', 'Reduces stress']
  },
  {
    id: 'retreat',
    type: 'retreat',
    name: 'Team Retreat',
    description: 'A full-day getaway with activities, reflection, and intensive team bonding',
    icon: Mountain,
    cost: 500,
    duration: 24,
    chemistryGain: 20,
    individualGain: 12,
    color: 'emerald',
    hostmasterIntro: "HOSTMASTER documenting an exclusive retreat. This intensive bonding experience could transform team dynamics...",
    benefits: ['Maximum bonding', 'Deep connections', 'Resolves major issues', 'Transforms relationships']
  }
];

interface TeamBuildingActivitiesProps {
  teamBudget: number;
  teamMembers: Array<{
    id: string;
    name: string;
    avatar: string;
    mood: string;
  }>;
  onActivitySelect?: (activity: TeamBuildingActivity) => void;
  onActivityComplete?: (result: {
    activity: TeamBuildingActivity;
    chemistryGained: number;
    individualEffects: Array<{ characterId: string; effect: string; statChange: number }>;
    conflicts: Array<{ character1: string; character2: string; description: string }>;
    bonds: Array<{ character1: string; character2: string; description: string }>;
  }) => void;
}

export default function TeamBuildingActivities({ 
  teamBudget = 1000, 
  teamMembers = [],
  onActivitySelect,
  onActivityComplete 
}: TeamBuildingActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<TeamBuildingActivity | null>(null);
  const [showHostmasterIntro, setShowHostmasterIntro] = useState(false);
  const [isExecutingActivity, setIsExecutingActivity] = useState(false);
  const [activityResult, setActivityResult] = useState<any>(null);

  const handleActivityClick = (activity: TeamBuildingActivity) => {
    if (activity.cost <= teamBudget) {
      setSelectedActivity(activity);
      setShowHostmasterIntro(true);
    }
  };

  const confirmActivity = async () => {
    if (!selectedActivity) return;
    
    setIsExecutingActivity(true);
    
    try {
      // Create team object for backend
      const team = {
        id: 'current_team',
        characters: teamMembers.map(member => ({
          id: member.id,
          name: member.name,
          psychStats: {
            mentalHealth: 80, // Default values - in real implementation, get from character data
            stress: 20,
            confidence: 70,
            ego: 50
          },
          personalityTraits: ['adaptive'] // Default - in real implementation, get from character data
        }))
      };

      // Call backend coaching system
      const activityResult = CoachingEngine.planTeamBuildingActivity(
        team as any,
        selectedActivity.type,
        teamBudget
      );

      // Process the result
      const result = {
        activity: selectedActivity,
        chemistryGained: activityResult.teamChemistryGain,
        individualEffects: activityResult.individualEffects,
        conflicts: activityResult.conflicts,
        bonds: activityResult.bonds
      };

      setActivityResult(result);
      
      // Call parent callback if provided
      if (onActivityComplete) {
        onActivityComplete(result);
      }
      
      // Legacy callback support
      if (onActivitySelect) {
        onActivitySelect(selectedActivity);
      }

    } catch (error) {
      console.error('Failed to execute team building activity:', error);
      // Handle error - show user message
      alert('Failed to organize activity: ' + (error as Error).message);
    } finally {
      setIsExecutingActivity(false);
      setSelectedActivity(null);
      setShowHostmasterIntro(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Team Building Activities
        </h2>
        <p className="text-gray-400">Organize activities to improve team chemistry and individual morale</p>
        
        {/* Budget Display */}
        <div className="mt-4 flex items-center gap-2 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-amber-200 font-medium">Available Budget: {teamBudget} coins</span>
        </div>
      </div>

      {/* HOSTMASTER Intro Modal */}
      <AnimatePresence>
        {showHostmasterIntro && selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-purple-500/30"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-mono text-sm">[HOSTMASTER v8.72]</span>
                </div>
                <div className="bg-purple-900/30 rounded p-3">
                  <p className="text-purple-200 text-sm italic">
                    "{selectedActivity.hostmasterIntro}"
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <selectedActivity.icon className={`w-12 h-12 mx-auto mb-2 text-${selectedActivity.color}-400`} />
                  <h3 className="text-xl font-bold text-white">{selectedActivity.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedActivity.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-gray-300">Cost: {selectedActivity.cost}</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">{selectedActivity.duration}h</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-gray-300">+{selectedActivity.chemistryGain} Chemistry</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">+{selectedActivity.individualGain} Morale</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedActivity(null);
                      setShowHostmasterIntro(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmActivity}
                    disabled={isExecutingActivity}
                    className={`flex-1 px-4 py-2 bg-${selectedActivity.color}-600 text-white rounded-lg hover:bg-${selectedActivity.color}-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isExecutingActivity ? 'Organizing...' : 'Organize Activity'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Results */}
      {activityResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/20 rounded-xl p-4 border border-green-500/30"
        >
          <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Activity Complete: {activityResult.activity.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-800/20 rounded p-3">
              <div className="font-medium text-green-300">Team Chemistry</div>
              <div className="text-2xl font-bold text-green-400">+{activityResult.chemistryGained}</div>
            </div>
            
            <div className="bg-blue-800/20 rounded p-3">
              <div className="font-medium text-blue-300">Individual Effects</div>
              <div className="text-lg text-blue-400">{activityResult.individualEffects.length} fighters affected</div>
            </div>
            
            <div className="bg-purple-800/20 rounded p-3">
              <div className="font-medium text-purple-300">Relationships</div>
              <div className="text-sm text-purple-400">
                {activityResult.bonds.length} bonds, {activityResult.conflicts.length} conflicts
              </div>
            </div>
          </div>

          <div className="mt-3 bg-gray-800/50 rounded p-3">
            <div className="text-purple-400 font-mono text-xs mb-1">[HOSTMASTER ANALYSIS]</div>
            <p className="text-gray-300 text-sm italic">
              "Excellent coaching decision! The team chemistry boost should improve battle performance. 
              Our cameras captured some fascinating interpersonal dynamics during this activity..."
            </p>
          </div>
        </motion.div>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => {
          const canAfford = activity.cost <= teamBudget;
          
          return (
            <motion.div
              key={activity.id}
              whileHover={{ scale: canAfford ? 1.02 : 1 }}
              whileTap={{ scale: canAfford ? 0.98 : 1 }}
              className={`bg-gray-800 rounded-xl p-4 border transition-all cursor-pointer ${
                canAfford 
                  ? `border-${activity.color}-500/30 hover:border-${activity.color}-500/60` 
                  : 'border-gray-600/30 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canAfford && handleActivityClick(activity)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-${activity.color}-900/30`}>
                  <activity.icon className={`w-6 h-6 text-${activity.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{activity.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="text-gray-300">{activity.cost} coins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-300">{activity.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span className="text-gray-300">+{activity.chemistryGain} team</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-gray-300">+{activity.individualGain} each</span>
                </div>
              </div>

              <div className="space-y-1">
                {activity.benefits.slice(0, 2).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs">{benefit}</span>
                  </div>
                ))}
              </div>

              {!canAfford && (
                <div className="mt-3 flex items-center gap-1 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">Insufficient budget</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Team Members Preview */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members ({teamMembers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2">
              <span className="text-2xl">{member.avatar}</span>
              <div>
                <div className="text-white text-sm font-medium">{member.name}</div>
                <div className="text-gray-400 text-xs">{member.mood}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}