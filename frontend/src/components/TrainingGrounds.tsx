'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  Target, 
  Brain, 
  Zap, 
  Clock, 
  Star, 
  TrendingUp, 
  Play, 
  Pause, 
  RotateCcw,
  Award,
  Coins,
  Battery,
  Heart,
} from 'lucide-react';
import { memberships, MembershipTier, getTrainingMultipliers, getDailyLimits, FacilityType } from '@/data/memberships';
import { getBaseStatsForLevel, getLevelData } from '@/data/characterProgression';

interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  energy: number;
  maxEnergy: number;
  avatar: string;
  archetype: 'warrior' | 'mage' | 'trickster' | 'leader' | 'scholar' | 'beast';
  trainingBonuses: {
    strength: number;
    defense: number;
    speed: number;
    special: number;
  };
}

interface TrainingActivity {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'defense' | 'speed' | 'special' | 'endurance';
  duration: number; // in seconds
  energyCost: number;
  xpGain: number;
  statBonus: number;
  icon: any;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requirements: {
    level: number;
    archetype?: string[];
  };
  trainingPointsGain?: number;
}

export default function TrainingGrounds() {
  // Mock character data with progression system integration
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
    const level = 12;
    const levelData = getLevelData(level);
    const baseStats = getBaseStatsForLevel(level, 'warrior');
    
    return {
      id: 'achilles',
      name: 'Achilles',
      level,
      xp: 2400,
      xpToNext: levelData?.xpToNext || 800,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      atk: baseStats.atk,
      def: baseStats.def,
      spd: baseStats.spd,
      energy: 75,
      maxEnergy: 100,
      avatar: '⚔️',
      archetype: 'warrior',
      trainingBonuses: {
        strength: 5,
        defense: 3,
        speed: 4,
        special: 2
      }
    };
  });

  const [isTraining, setIsTraining] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<TrainingActivity | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingTimeLeft, setTrainingTimeLeft] = useState(0);
  // Removed tabs - TrainingGrounds now focuses only on training activities
  const [membershipTier] = useState<MembershipTier>('free');
  const [selectedFacility] = useState<FacilityType>('community');
  const [dailyTrainingSessions, setDailyTrainingSessions] = useState(0);
  const [dailyEnergyRefills, setDailyEnergyRefills] = useState(0);

  // Training activities
  const trainingActivities: TrainingActivity[] = [
    {
      id: 'strength_basic',
      name: 'Weapon Mastery',
      description: 'Practice combat techniques to increase attack power',
      type: 'strength',
      duration: 30,
      energyCost: 15,
      xpGain: 50,
      statBonus: 1,
      icon: Dumbbell,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'defense_basic',
      name: 'Shield Training',
      description: 'Learn defensive stances and blocking techniques',
      type: 'defense',
      duration: 25,
      energyCost: 12,
      xpGain: 45,
      statBonus: 1,
      icon: Target,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'speed_basic',
      name: 'Agility Course',
      description: 'Run through obstacle courses to improve speed',
      type: 'speed',
      duration: 20,
      energyCost: 18,
      xpGain: 40,
      statBonus: 1,
      icon: Zap,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'special_basic',
      name: 'Mental Focus',
      description: 'Meditation and concentration exercises',
      type: 'special',
      duration: 35,
      energyCost: 10,
      xpGain: 55,
      statBonus: 1,
      icon: Brain,
      difficulty: 'medium',
      requirements: { level: 5 }
    },
    {
      id: 'endurance_basic',
      name: 'Stamina Building',
      description: 'Build endurance and recover energy faster',
      type: 'endurance',
      duration: 40,
      energyCost: 5,
      xpGain: 35,
      statBonus: 0,
      icon: Heart,
      difficulty: 'medium',
      requirements: { level: 3 }
    },
    {
      id: 'strength_advanced',
      name: 'Elite Combat Training',
      description: 'Advanced warrior techniques for massive strength gains',
      type: 'strength',
      duration: 60,
      energyCost: 30,
      xpGain: 120,
      statBonus: 3,
      icon: Award,
      difficulty: 'extreme',
      requirements: { level: 15, archetype: ['warrior', 'leader'] }
    },
    
    // === WARRIOR ARCHETYPE TRAINING ===
    {
      id: 'warrior_berserker_rage',
      name: 'Berserker Rage Training',
      description: 'Unleash controlled fury to devastate enemies',
      type: 'strength',
      duration: 45,
      energyCost: 35,
      xpGain: 80,
      statBonus: 2,
      icon: Award,
      difficulty: 'hard',
      requirements: { level: 8, archetype: ['warrior'] }
    },
    {
      id: 'warrior_shield_mastery',
      name: 'Shield Wall Mastery',
      description: 'Perfect defensive formations and protection techniques',
      type: 'defense',
      duration: 50,
      energyCost: 25,
      xpGain: 70,
      statBonus: 2,
      icon: Target,
      difficulty: 'medium',
      requirements: { level: 6, archetype: ['warrior'] }
    },
    {
      id: 'warrior_weapon_expertise',
      name: 'Weapon Expertise Training',
      description: 'Master multiple weapon types and combat styles',
      type: 'special',
      duration: 60,
      energyCost: 40,
      xpGain: 100,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Sparkles,
      difficulty: 'hard',
      requirements: { level: 12, archetype: ['warrior'] }
    },
    
    // === MAGE ARCHETYPE TRAINING ===
    {
      id: 'mage_elemental_mastery',
      name: 'Elemental Mastery',
      description: 'Control fire, ice, lightning and earth magic',
      type: 'special',
      duration: 70,
      energyCost: 45,
      xpGain: 110,
      statBonus: 1,
      trainingPointsGain: 3,
      icon: Zap,
      difficulty: 'hard',
      requirements: { level: 10, archetype: ['mage'] }
    },
    {
      id: 'mage_mana_channeling',
      name: 'Mana Channeling Focus',
      description: 'Improve magical energy efficiency and recovery',
      type: 'endurance',
      duration: 40,
      energyCost: 15,
      xpGain: 60,
      statBonus: 0,
      icon: Brain,
      difficulty: 'medium',
      requirements: { level: 5, archetype: ['mage'] }
    },
    {
      id: 'mage_spell_weaving',
      name: 'Advanced Spell Weaving',
      description: 'Combine multiple spells for devastating effects',
      type: 'special',
      duration: 80,
      energyCost: 50,
      xpGain: 130,
      statBonus: 1,
      trainingPointsGain: 4,
      icon: Star,
      difficulty: 'extreme',
      requirements: { level: 16, archetype: ['mage'] }
    },
    
    // === TRICKSTER ARCHETYPE TRAINING ===
    {
      id: 'trickster_stealth_mastery',
      name: 'Shadow Stealth Training',
      description: 'Move unseen and strike from the shadows',
      type: 'speed',
      duration: 35,
      energyCost: 30,
      xpGain: 75,
      statBonus: 2,
      icon: Zap,
      difficulty: 'medium',
      requirements: { level: 7, archetype: ['trickster'] }
    },
    {
      id: 'trickster_trap_crafting',
      name: 'Trap Crafting Workshop',
      description: 'Learn to create and deploy various traps',
      type: 'special',
      duration: 55,
      energyCost: 35,
      xpGain: 85,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Target,
      difficulty: 'medium',
      requirements: { level: 9, archetype: ['trickster'] }
    },
    {
      id: 'trickster_illusion_mastery',
      name: 'Master of Illusions',
      description: 'Create complex illusions to confuse enemies',
      type: 'special',
      duration: 65,
      energyCost: 40,
      xpGain: 105,
      statBonus: 1,
      trainingPointsGain: 3,
      icon: Sparkles,
      difficulty: 'hard',
      requirements: { level: 14, archetype: ['trickster'] }
    },
    
    // === LEADER ARCHETYPE TRAINING ===
    {
      id: 'leader_tactical_training',
      name: 'Tactical Command Training',
      description: 'Learn battlefield strategy and unit coordination',
      type: 'special',
      duration: 50,
      energyCost: 30,
      xpGain: 90,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Brain,
      difficulty: 'medium',
      requirements: { level: 8, archetype: ['leader'] }
    },
    {
      id: 'leader_inspiration_mastery',
      name: 'Inspirational Leadership',
      description: 'Boost ally morale and performance in battle',
      type: 'special',
      duration: 45,
      energyCost: 25,
      xpGain: 80,
      statBonus: 0,
      trainingPointsGain: 3,
      icon: Heart,
      difficulty: 'medium',
      requirements: { level: 6, archetype: ['leader'] }
    },
    {
      id: 'leader_diplomatic_training',
      name: 'Diplomatic Mastery',
      description: 'Master negotiation and conflict resolution',
      type: 'special',
      duration: 40,
      energyCost: 20,
      xpGain: 70,
      statBonus: 0,
      trainingPointsGain: 2,
      icon: BookOpen,
      difficulty: 'easy',
      requirements: { level: 4, archetype: ['leader'] }
    },
    
    // === SCHOLAR ARCHETYPE TRAINING ===
    {
      id: 'scholar_ancient_research',
      name: 'Ancient Text Research',
      description: 'Study forgotten knowledge and lost techniques',
      type: 'special',
      duration: 75,
      energyCost: 35,
      xpGain: 120,
      statBonus: 0,
      trainingPointsGain: 4,
      icon: BookOpen,
      difficulty: 'hard',
      requirements: { level: 11, archetype: ['scholar'] }
    },
    {
      id: 'scholar_memory_palace',
      name: 'Memory Palace Construction',
      description: 'Build mental structures to store vast knowledge',
      type: 'special',
      duration: 60,
      energyCost: 30,
      xpGain: 95,
      statBonus: 0,
      trainingPointsGain: 3,
      icon: Brain,
      difficulty: 'medium',
      requirements: { level: 7, archetype: ['scholar'] }
    },
    {
      id: 'scholar_analysis_training',
      name: 'Combat Analysis Training',
      description: 'Learn to identify enemy weaknesses instantly',
      type: 'special',
      duration: 45,
      energyCost: 25,
      xpGain: 75,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Target,
      difficulty: 'medium',
      requirements: { level: 9, archetype: ['scholar'] }
    },
    
    // === BEAST ARCHETYPE TRAINING ===
    {
      id: 'beast_primal_instincts',
      name: 'Primal Instinct Training',
      description: 'Embrace your wild nature for enhanced combat',
      type: 'strength',
      duration: 40,
      energyCost: 35,
      xpGain: 85,
      statBonus: 2,
      icon: Award,
      difficulty: 'medium',
      requirements: { level: 6, archetype: ['beast'] }
    },
    {
      id: 'beast_pack_hunting',
      name: 'Pack Hunting Techniques',
      description: 'Learn coordinated hunting and teamwork skills',
      type: 'speed',
      duration: 50,
      energyCost: 30,
      xpGain: 80,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Zap,
      difficulty: 'medium',
      requirements: { level: 8, archetype: ['beast'] }
    },
    {
      id: 'beast_territory_mastery',
      name: 'Territory Control Mastery',
      description: 'Dominate any environment through territorial awareness',
      type: 'special',
      duration: 55,
      energyCost: 40,
      xpGain: 100,
      statBonus: 1,
      trainingPointsGain: 2,
      icon: Star,
      difficulty: 'hard',
      requirements: { level: 12, archetype: ['beast'] }
    }
  ];

  // Check membership limits
  const membershipLimits = getDailyLimits(membershipTier);
  const canTrain = () => {
    if (membershipLimits.dailyTrainingSessions === 'unlimited') return true;
    return dailyTrainingSessions < membershipLimits.dailyTrainingSessions;
  };


  // Available activities based on character and membership
  const availableActivities = trainingActivities.filter(activity => {
    const meetsLevel = selectedCharacter.level >= activity.requirements.level;
    const meetsArchetype = !activity.requirements.archetype || 
      activity.requirements.archetype.includes(selectedCharacter.archetype);
    const hasEnergy = selectedCharacter.energy >= activity.energyCost;
    const withinLimits = canTrain();
    
    // Skill activities require membership access
    return meetsLevel && meetsArchetype && hasEnergy && withinLimits;
  });

  // Start training
  const startTraining = async (activity: TrainingActivity) => {
    if (selectedCharacter.energy < activity.energyCost) return;
    if (!canTrain()) return;
    
    try {
      // Get user ID from auth context (you'll need to implement this)
      const userId = 'user123'; // Replace with actual user ID from auth context
      
      // Load the training system manager
      const trainingManager = TrainingSystemManager.loadProgress();
      
      // Start training with usage tracking following battle service pattern
      const session = await trainingManager.startTraining(
        selectedCharacter.id, 
        activity.id, 
        userId, 
        selectedFacility
      );
      
      if (!session) {
        throw new Error('Failed to start training session');
      }
      
      setCurrentActivity(activity);
      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingTimeLeft(activity.duration);
      
      // Increment daily sessions
      setDailyTrainingSessions(prev => prev + 1);
      
      // Deduct energy (with membership cost reduction)
      const multipliers = getTrainingMultipliers(membershipTier, selectedFacility);
      const energyCost = Math.ceil(activity.energyCost * multipliers.energyCost);
      
      setSelectedCharacter(prev => ({
        ...prev,
        energy: prev.energy - energyCost
      }));
      
    } catch (error) {
      console.error('Training failed:', error);
      alert(error instanceof Error ? error.message : 'Training failed');
    }
  };

  // Training timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTraining && trainingTimeLeft > 0) {
      interval = setInterval(() => {
        setTrainingTimeLeft(prev => {
          const newTime = prev - 1;
          setTrainingProgress(((currentActivity?.duration || 0) - newTime) / (currentActivity?.duration || 1) * 100);
          return newTime;
        });
      }, 1000);
    } else if (trainingTimeLeft === 0 && isTraining) {
      completeTraining();
    }
    
    return () => clearInterval(interval);
  }, [isTraining, trainingTimeLeft]);

  // Complete training
  const completeTraining = () => {
    if (!currentActivity) return;
    
    // Apply membership multipliers
    const multipliers = getTrainingMultipliers(membershipTier, selectedFacility);
    const xpGain = Math.floor(currentActivity.xpGain * multipliers.xp);
    const statBonus = Math.floor(currentActivity.statBonus * multipliers.stat);
    const trainingPointsGain = currentActivity.trainingPointsGain 
      ? Math.floor(currentActivity.trainingPointsGain * multipliers.trainingPoints)
      : 0;
    
    // Apply rewards with progression system
    setSelectedCharacter(prev => {
      const newXp = prev.xp + xpGain;
      const leveledUp = newXp >= prev.xpToNext;
      let newLevel = prev.level;
      let remainingXp = newXp;
      let newXpToNext = prev.xpToNext;
      
      // Handle level up with new progression system
      if (leveledUp && newLevel < 50) {
        newLevel = prev.level + 1;
        remainingXp = newXp - prev.xpToNext;
        const nextLevelData = getLevelData(newLevel + 1);
        newXpToNext = nextLevelData?.xpToNext || prev.xpToNext;
        
        // Update stats based on new level
        const newStats = getBaseStatsForLevel(newLevel, prev.archetype);
        return {
          ...prev,
          level: newLevel,
          xp: remainingXp,
          xpToNext: newXpToNext,
          // Use progression-based stats as base, then apply training bonuses
          hp: newStats.hp,
          maxHp: newStats.hp,
          atk: newStats.atk + (currentActivity.type === 'strength' ? statBonus : 0),
          def: newStats.def + (currentActivity.type === 'defense' ? statBonus : 0),
          spd: newStats.spd + (currentActivity.type === 'speed' ? statBonus : 0),
          // Recover some energy after training
          energy: Math.min(prev.maxEnergy, prev.energy + 5)
        };
      } else {
        // No level up, just apply training bonuses
        return {
          ...prev,
          xp: remainingXp,
          // Apply stat bonus based on training type
          atk: currentActivity.type === 'strength' ? prev.atk + statBonus : prev.atk,
          def: currentActivity.type === 'defense' ? prev.def + statBonus : prev.def,
          spd: currentActivity.type === 'speed' ? prev.spd + statBonus : prev.spd,
          // Recover some energy after training
          energy: Math.min(prev.maxEnergy, prev.energy + 5)
        };
      }
    });
    
    // Award training points for skill activities
    if (trainingPointsGain > 0) {
      setTrainingPoints(prev => prev + trainingPointsGain);
    }
    
    setIsTraining(false);
    setCurrentActivity(null);
    setTrainingProgress(0);
  };

  // Stop training early
  const stopTraining = () => {
    setIsTraining(false);
    setCurrentActivity(null);
    setTrainingProgress(0);
    setTrainingTimeLeft(0);
    
    // Refund partial energy
    if (currentActivity) {
      setSelectedCharacter(prev => ({
        ...prev,
        energy: Math.min(prev.maxEnergy, prev.energy + Math.floor(currentActivity.energyCost * 0.5))
      }));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-orange-400 bg-orange-400/10';
      case 'extreme': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Dumbbell className="w-8 h-8 text-orange-400" />
          Training Grounds
          <Dumbbell className="w-8 h-8 text-orange-400" />
        </h1>
        <p className="text-gray-400 text-lg">
          Strengthen your warriors through focused training and unlock their true potential
        </p>
      </div>


      <div className="grid lg:grid-cols-3 gap-6">
        {/* Character Info Panel */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">{selectedCharacter.avatar}</div>
              <h3 className="text-2xl font-bold text-white">{selectedCharacter.name}</h3>
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Star className="w-4 h-4" />
                <span>Level {selectedCharacter.level}</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Experience</span>
                <span>{selectedCharacter.xp}/{selectedCharacter.xp + selectedCharacter.xpToNext}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(selectedCharacter.xp / (selectedCharacter.xp + selectedCharacter.xpToNext)) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Health</span>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-white">{selectedCharacter.hp}/{selectedCharacter.maxHp}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Attack</span>
                <span className="text-red-400 font-bold">{selectedCharacter.atk}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Defense</span>
                <span className="text-blue-400 font-bold">{selectedCharacter.def}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Speed</span>
                <span className="text-green-400 font-bold">{selectedCharacter.spd}</span>
              </div>
            </div>

            {/* Energy */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                  <Battery className="w-4 h-4" />
                  Energy
                </span>
                <span>{selectedCharacter.energy}/{selectedCharacter.maxEnergy}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(selectedCharacter.energy / selectedCharacter.maxEnergy) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Daily Training Limits */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Daily Training</span>
                <span className="text-xs px-2 py-1 bg-gray-700 rounded capitalize">
                  {membershipTier}
                </span>
              </div>
              <div className="text-sm text-white">
                Sessions: {dailyTrainingSessions}/{membershipLimits.dailyTrainingSessions === 'unlimited' ? '∞' : membershipLimits.dailyTrainingSessions}
              </div>
              <div className="text-sm text-white">
                Refills: {dailyEnergyRefills}/{membershipLimits.dailyEnergyRefills === 'unlimited' ? '∞' : membershipLimits.dailyEnergyRefills}
              </div>
              {membershipLimits.xpMultiplier > 1 && (
                <div className="text-sm text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {membershipLimits.xpMultiplier}x XP Bonus
                </div>
              )}
            </div>
          </motion.div>

          {/* Current Training Status */}
          {isTraining && currentActivity && (
            <motion.div 
              className="bg-orange-900/30 border border-orange-500/50 rounded-xl p-6 mt-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center">
                <div className="text-orange-400 text-xl mb-2">Training in Progress</div>
                <div className="text-white font-bold text-lg mb-3">{currentActivity.name}</div>
                
                {/* Progress Circle */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - trainingProgress / 100)}`}
                      className="text-orange-400 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold">{Math.round(trainingProgress)}%</span>
                  </div>
                </div>

                <div className="text-gray-300 mb-4">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(trainingTimeLeft)} remaining
                </div>

                <button
                  onClick={stopTraining}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <Pause className="w-4 h-4" />
                  Stop Training
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Training Activities */}
        <div className="lg:col-span-2">
          <motion.div 
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Available Training
            </h2>

            <div className="grid gap-4">
              {availableActivities.map((activity) => {
                const Icon = activity.icon;
                const canTrain = !isTraining && selectedCharacter.energy >= activity.energyCost;
                
                return (
                  <motion.div
                    key={activity.id}
                    className={`border rounded-xl p-4 transition-all ${
                      canTrain 
                        ? 'border-gray-600 hover:border-blue-500 cursor-pointer' 
                        : 'border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={canTrain ? { scale: 1.02 } : {}}
                    onClick={() => canTrain && startTraining(activity)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{activity.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getDifficultyColor(activity.difficulty)}`}>
                              {activity.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{activity.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-300">{formatTime(activity.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400">{activity.energyCost} Energy</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400">+{activity.xpGain} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">
                                +{activity.statBonus} {activity.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {canTrain && (
                        <div className="ml-4">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {availableActivities.length === 0 && (
              <div className="text-center py-12">
                <Battery className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Training Available</h3>
                <p className="text-gray-500">
                  Your character needs more energy or higher level to access training activities.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}