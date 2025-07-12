'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Award,
  Coins,
  Battery,
  Heart,
  Sparkles,
  BookOpen,
  MessageCircle,
  Send,
  User,
  Users,
} from 'lucide-react';
import { memberships, MembershipTier, getTrainingMultipliers, getDailyLimits, FacilityType } from '@/data/memberships';
import { getBaseStatsForLevel, getLevelData } from '@/data/characterProgression';
import { TrainingSystemManager } from '@/systems/trainingSystem';
import { trainingChatService } from '@/services/trainingChatService';
import PersonalTrainerChat from './PersonalTrainerChat';

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

interface TrainingGroundsProps {
  globalSelectedCharacterId: string;
  setGlobalSelectedCharacterId: (id: string) => void;
  selectedCharacter: any;
  availableCharacters: any[];
}

export default function TrainingGrounds({ 
  globalSelectedCharacterId, 
  setGlobalSelectedCharacterId, 
  selectedCharacter: globalCharacter, 
  availableCharacters 
}: TrainingGroundsProps) {
  // Convert global character to training character format and make it state
  const createTrainingCharacter = (characterToUse: any): Character => {
    if (!characterToUse) {
      // Create default character if no characters available
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
    }
    
    // Convert from global character format to training character format
    console.log('🔍 Converting character:', characterToUse.name, 'Level from API:', characterToUse.level);
    return {
      id: characterToUse.baseName || characterToUse.id,
      name: characterToUse.name,
      level: characterToUse.level || 1,
      xp: characterToUse.experience?.currentXP || 0,
      xpToNext: characterToUse.experience?.xpToNextLevel || 1000,
      hp: characterToUse.combatStats?.health || characterToUse.baseStats?.vitality * 10 || 200,
      maxHp: characterToUse.combatStats?.maxHealth || characterToUse.baseStats?.vitality * 10 || 200,
      atk: characterToUse.combatStats?.attack || characterToUse.baseStats?.strength || 50,
      def: characterToUse.combatStats?.defense || characterToUse.baseStats?.vitality || 40,
      spd: characterToUse.combatStats?.speed || characterToUse.baseStats?.agility || 60,
      energy: characterToUse.energy || 75,
      maxEnergy: characterToUse.maxEnergy || 100,
      avatar: characterToUse?.avatar || '⚔️',
      archetype: characterToUse.archetype,
      trainingBonuses: {
        strength: Math.floor(characterToUse.level / 3),
        defense: Math.floor(characterToUse.level / 4),
        speed: Math.floor(characterToUse.level / 3.5),
        special: Math.floor(characterToUse.level / 2.5)
      }
    };
  };

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Track previous character to prevent duplicate auto-triggers
  const [previousCharacterId, setPreviousCharacterId] = useState<string>('');
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [lastAnalyzedCharacter, setLastAnalyzedCharacter] = useState<string>('');

  // Update selected character when global character changes and trigger Argock analysis
  useEffect(() => {
    if (!globalCharacter) {
      console.error('❌ No globalCharacter provided - Training requires real character from API');
      setSelectedCharacter(null);
      return;
    }
    
    const newCharacter = createTrainingCharacter(globalCharacter);
    setSelectedCharacter(newCharacter);
    
    // Only trigger Argock analysis if character actually changed
    if (newCharacter.id !== previousCharacterId) {
      console.log('🔄 Character changed from', previousCharacterId, 'to', newCharacter.id);
      setPreviousCharacterId(newCharacter.id);
      
      // Clear chat when character changes to start fresh
      setChatMessages([]);
      
      // Reset analysis tracking for new character
      setLastAnalyzedCharacter('');
      
      // Trigger analysis after a short delay to ensure state is settled
      setTimeout(() => {
        triggerArgockAnalysis(newCharacter);
      }, 500);
    }
  }, [globalCharacter]);


  // Auto-trigger Argock analysis when character is selected
  const triggerArgockAnalysis = async (character: Character) => {
    if (isAutoAnalyzing) {
      console.log('🚫 Already auto-analyzing, skipping...');
      return;
    }
    
    // Prevent duplicate analysis for the same character
    if (lastAnalyzedCharacter === character.id) {
      console.log('🚫 Character already analyzed, skipping duplicate:', character.name);
      return;
    }
    
    console.log('🎯 Triggering Argock analysis for:', character.name, character.id);
    setLastAnalyzedCharacter(character.id);
    
    // Verify socket connection
    if (!trainingChatService.socketConnection?.connected) {
      console.error('❌ Socket not connected - cannot trigger analysis');
      setIsAutoAnalyzing(false);
      return;
    }
    
    setIsAutoAnalyzing(true);
    
    try {
      // Use the real character directly - NO FALLBACKS
      const currentCharacter = character;
      
      // Prepare training context
      const trainingContext = {
        character: currentCharacter,
        teammates: [], // No teammates for training - focus on individual character
        coachName: 'Coach',
        trainingEnvironment: {
          facilityTier: selectedFacility,
          equipment: ['Weights', 'Treadmill', 'Combat dummies', 'Resistance bands'],
          currentActivity: 'Character Assessment',
          energyLevel: Math.round((character.energy / character.maxEnergy) * 100),
          trainingProgress: 0,
          trainingPhase: trainingPhase,
          sessionDuration: 0
        },
        recentTrainingEvents: [`${character.name} entered the training facility`]
      };

      console.log('🤖 Calling training chat service for auto-analysis...');
      
      // Get Argock's immediate analysis with live AI call
      const agentResponses = await trainingChatService.startTrainingConversation(
        currentCharacter,
        trainingContext,
        `${character.name} just walked into the training facility`,
        true // Character selection trigger
      );

      console.log('✅ Auto-analysis responses received:', agentResponses.length, agentResponses);

      // Add Argock's analysis to chat - but only ONCE
      agentResponses.forEach((agent, index) => {
        const messageId = `auto_${agent.agentType}_${character.id}_${Date.now()}_${index}`;
        const analysisMessage = {
          id: messageId,
          sender: agent.agentType as 'character' | 'argock',
          message: agent.message,
          timestamp: new Date(),
          characterName: agent.agentName,
          agentType: agent.agentType,
          agentName: agent.agentName
        };
        console.log('📝 Adding auto-analysis message:', messageId, 'Message:', agent.message.substring(0, 50) + '...');
        
        // Check for duplicate messages before adding
        setChatMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg.message === analysisMessage.message && 
            msg.agentType === analysisMessage.agentType &&
            Math.abs(msg.timestamp.getTime() - analysisMessage.timestamp.getTime()) < 5000 // within 5 seconds
          );
          if (isDuplicate) {
            console.warn('🚫 Duplicate message detected, skipping:', messageId);
            return prev;
          }
          return [...prev, analysisMessage];
        });
      });

    } catch (error) {
      console.error('Auto-trigger Argock analysis error:', error);
      // No fallback message - let manual chat handle it
    } finally {
      setIsAutoAnalyzing(false);
    }
  };

  const [isTraining, setIsTraining] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<TrainingActivity | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingTimeLeft, setTrainingTimeLeft] = useState(0);
  // Removed tabs - TrainingGrounds now focuses only on training activities
  const [membershipTier] = useState<MembershipTier>('free');
  const [selectedFacility] = useState<FacilityType>('community');
  const [dailyTrainingSessions, setDailyTrainingSessions] = useState(0);
  const [dailyEnergyRefills, setDailyEnergyRefills] = useState(0);
  const [trainingPoints, setTrainingPoints] = useState(0);
  
  // Training chat state
  // Training phases: 'planning' | 'active' | 'recovery'
  const [trainingPhase, setTrainingPhase] = useState<'planning' | 'active' | 'recovery'>('planning');
  const [showTrainingChat, setShowTrainingChat] = useState(true); // Always show for Argock
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'coach' | 'character' | 'argock';
    message: string;
    timestamp: Date;
    characterName?: string;
    agentType?: string;
    agentName?: string;
  }>>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

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
  const availableActivities = selectedCharacter ? trainingActivities.filter(activity => {
    const meetsLevel = selectedCharacter.level >= activity.requirements.level;
    const meetsArchetype = !activity.requirements.archetype || 
      activity.requirements.archetype.includes(selectedCharacter.archetype);
    const hasEnergy = selectedCharacter.energy >= activity.energyCost;
    const withinLimits = canTrain();
    
    // Skill activities require membership access
    return meetsLevel && meetsArchetype && hasEnergy && withinLimits;
  }) : [];

  // Start training
  const startTraining = async (activity: TrainingActivity) => {
    if (!selectedCharacter || selectedCharacter.energy < activity.energyCost) return;
    if (!canTrain()) return;
    
    try {
      // Get user ID from auth context (you'll need to implement this)
      const userId = 'user123'; // Replace with actual user ID from auth context
      
      // Load the training system manager - ensure client-side only
      if (typeof window === 'undefined') {
        console.warn('Training attempted during SSR, skipping');
        return;
      }
      
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
      setTrainingPhase('active');
      setSessionStartTime(new Date());
      
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

  // Complete training
  const completeTraining = React.useCallback(() => {
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
    setTrainingPhase('recovery');
    // Keep currentActivity for recovery discussion, clear after 5 minutes
    setTimeout(() => {
      setCurrentActivity(null);
      setTrainingPhase('planning');
    }, 300000); // 5 minutes recovery discussion
    setTrainingProgress(0);
  }, [currentActivity, membershipTier, selectedFacility]);

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
  }, [isTraining, trainingTimeLeft, completeTraining, currentActivity?.duration]);

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

  // Multi-agent training chat functions with live AI-to-AI interactions
  const sendTrainingChatMessage = async () => {
    if (!currentChatMessage.trim() || isChatLoading || !selectedCharacter) return;

    const messageText = currentChatMessage.trim();
    setCurrentChatMessage('');
    setIsChatLoading(true);

    // Add coach message to chat
    const coachMessage = {
      id: `coach_${Date.now()}`,
      sender: 'coach' as const,
      message: messageText,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, coachMessage]);

    try {
      // Get available characters for context - use the real characters from props
      const currentCharacter = availableCharacters.find(c => c.name === selectedCharacter.name) || availableCharacters[0];
      
      // Prepare training context with phase information
      const trainingContext = {
        character: currentCharacter,
        teammates: availableCharacters.filter(c => c.id !== currentCharacter.id).slice(0, 5),
        coachName: 'Coach',
        trainingEnvironment: {
          facilityTier: selectedFacility,
          equipment: ['Weights', 'Treadmill', 'Combat dummies', 'Resistance bands'],
          currentActivity: currentActivity?.name || 'Free training',
          energyLevel: Math.round((selectedCharacter.energy / selectedCharacter.maxEnergy) * 100),
          trainingProgress: Math.round(trainingProgress),
          trainingPhase: trainingPhase,
          sessionDuration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 60000) : 0
        },
        recentTrainingEvents: [
          `Training phase: ${trainingPhase}`,
          `Completed ${dailyTrainingSessions} training sessions today`,
          `Current energy: ${selectedCharacter.energy}/${selectedCharacter.maxEnergy}`,
          `Training points earned: ${trainingPoints}`
        ]
      };

      // Get multi-agent responses with live AI calls
      const agentResponses = await trainingChatService.startTrainingConversation(
        currentCharacter,
        trainingContext,
        messageText,
        false // Not character selection
      );

      // Add all agent responses to chat
      agentResponses.forEach((agent, index) => {
        const agentMessage = {
          id: `${agent.agentType}_${Date.now()}_${index}`,
          sender: agent.agentType as 'character' | 'argock',
          message: agent.message,
          timestamp: new Date(),
          characterName: agent.agentName,
          agentType: agent.agentType,
          agentName: agent.agentName
        };
        setChatMessages(prev => [...prev, agentMessage]);
      });

    } catch (error) {
      console.error('Multi-agent training chat error:', error);
      const errorMessage = {
        id: `error_${Date.now()}`,
        sender: 'character' as const,
        message: 'Sorry, we\'re having trouble responding right now. Let\'s focus on training!',
        timestamp: new Date(),
        characterName: selectedCharacter.name
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTrainingChatMessage();
    }
  };


  // Show error if no real character available
  if (!selectedCharacter) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Training Grounds</h1>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-400 text-lg font-semibold">❌ No Character Available</p>
            <p className="text-red-300 mt-2">Training requires a real character from the API.</p>
            <p className="text-red-300 text-sm mt-2">Check authentication and backend connection.</p>
          </div>
        </div>
      </div>
    );
  }

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


      <div className="space-y-6">
        {/* Dynamic Training Experience with Argock */}
        <motion.div 
          className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-orange-400" />
              {trainingPhase === 'planning' && 'Training Planning with Argock'}
              {trainingPhase === 'active' && `Training Session: ${currentActivity?.name}`}
              {trainingPhase === 'recovery' && 'Post-Workout Recovery Chat'}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                trainingPhase === 'planning' ? 'bg-blue-500/20 text-blue-400' :
                trainingPhase === 'active' ? 'bg-orange-500/20 text-orange-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {trainingPhase.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Phase-specific content description */}
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 text-sm">
              {trainingPhase === 'planning' && `Plan your workout with Argock and ${selectedCharacter.name}. Discuss goals, exercises, and get motivated!`}
              {trainingPhase === 'active' && `Training in progress! Chat with Argock and your character during the workout. Stay motivated!`}
              {trainingPhase === 'recovery' && `${selectedCharacter.name} is winded from training! Reflect on the workout and get recovery advice from Argock.`}
            </p>
          </div>

          {/* Dynamic Training Chat */}
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    {trainingPhase === 'planning' && `Start planning your workout with ${selectedCharacter.name}!`}
                    {trainingPhase === 'active' && `Training in progress! Keep the motivation going!`}
                    {trainingPhase === 'recovery' && `How was that workout? Let's discuss recovery!`}
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-4 py-3 rounded-lg ${
                      msg.sender === 'coach'
                        ? 'bg-orange-600 text-white'
                        : msg.sender === 'argock'
                        ? 'bg-red-700 text-white border-l-4 border-red-400'
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {(msg.sender === 'character' || msg.sender === 'argock') && (
                        <div className={`text-xs mb-1 flex items-center gap-2 ${
                          msg.sender === 'argock' ? 'text-red-200' : 'text-gray-400'
                        }`}>
                          <span>{msg.agentName || msg.characterName}</span>
                          {msg.sender === 'argock' && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              TRAINER
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentChatMessage}
                  onChange={(e) => setCurrentChatMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder={
                    trainingPhase === 'planning' ? `Plan your workout with ${selectedCharacter.name}...` :
                    trainingPhase === 'active' ? `Motivate ${selectedCharacter.name} during training...` :
                    `Ask ${selectedCharacter.name} about the workout...`
                  }
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendTrainingChatMessage}
                  disabled={!currentChatMessage.trim() || isChatLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Training Management - Bottom */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Character Info & Training Status */}
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

            {/* Current Training Status */}
            {isTraining && currentActivity ? (
              <div className="bg-orange-900/30 border border-orange-500/50 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-orange-400 text-lg mb-2">Training: {currentActivity.name}</div>
                  <div className="text-gray-300 mb-4">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatTime(trainingTimeLeft)} remaining
                  </div>
                  <button
                    onClick={stopTraining}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Stop Training
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                Ready for training
              </div>
            )}
          </motion.div>

          {/* Available Training Activities */}
          <motion.div 
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Available Training
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableActivities.slice(0, 5).map((activity) => {
                const Icon = activity.icon;
                const canStartTraining = !isTraining && selectedCharacter.energy >= activity.energyCost;
                
                return (
                  <div
                    key={activity.id}
                    className={`border rounded-lg p-3 transition-all ${
                      canStartTraining 
                        ? 'border-gray-600 hover:border-blue-500 cursor-pointer' 
                        : 'border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canStartTraining && startTraining(activity)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-700 p-2 rounded">
                        <Icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{activity.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatTime(activity.duration)} • {activity.energyCost} Energy • +{activity.xpGain} XP
                        </div>
                      </div>
                      {canStartTraining && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded">
                          <Play className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}