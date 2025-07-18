'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Activity, Users, Gamepad2, Brain, Music, Coffee, Trophy, Clock, 
  MapPin, Heart, Calendar, MessageCircle, Send, User, Crown,
  Play, Pause, Settings, Plus, ChevronRight, Target, DollarSign, BarChart3
} from 'lucide-react';
import { createDemoCharacterCollection } from '@/data/characters';
import ConflictDatabaseService, { ConflictData, TherapyContext } from '@/services/ConflictDatabaseService';
import { characterAPI } from '@/services/apiClient';
import { therapyChatService } from '@/data/therapyChatService';
import { io, Socket } from 'socket.io-client';

// Team Building Events (from TeamBuildingWrapper)
interface TeamEvent {
  id: string;
  title: string;
  type: 'dinner' | 'retreat' | 'activity' | 'celebration';
  description: string;
  duration: string;
  participants: number;
  mood: 'casual' | 'formal' | 'fun' | 'competitive';
  icon: any;
  color: string;
}

const teamEvents: TeamEvent[] = [
  {
    id: 'team-dinner',
    title: 'Team Dinner',
    type: 'dinner',
    description: 'Casual dining experience to build rapport and discuss non-battle topics',
    duration: '2 hours',
    participants: 8,
    mood: 'casual',
    icon: Coffee,
    color: 'orange'
  },
  {
    id: 'weekend-retreat',
    title: 'Weekend Retreat',
    type: 'retreat',
    description: 'Multi-day bonding experience with workshops and recreational activities',
    duration: '2-3 days',
    participants: 12,
    mood: 'casual',
    icon: MapPin,
    color: 'green'
  },
  {
    id: 'victory-celebration',
    title: 'Victory Celebration',
    type: 'celebration',
    description: 'Celebrate recent wins and milestones with the entire team',
    duration: '3 hours',
    participants: 15,
    mood: 'fun',
    icon: Trophy,
    color: 'yellow'
  },
  {
    id: 'team-building-games',
    title: 'Team Building Games',
    type: 'activity',
    description: 'Structured activities designed to improve communication and trust',
    duration: '4 hours',
    participants: 10,
    mood: 'competitive',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'karaoke-night',
    title: 'Karaoke Night',
    type: 'activity',
    description: 'Fun musical evening to let loose and see different sides of teammates',
    duration: '2 hours',
    participants: 12,
    mood: 'fun',
    icon: Music,
    color: 'purple'
  }
];

// Group Activities (from GroupActivitiesWrapper)
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
    minParticipants: 2,
    maxParticipants: 3,
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
    minParticipants: 2,
    maxParticipants: 3,
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
    minParticipants: 2,
    maxParticipants: 3,
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
    minParticipants: 2,
    maxParticipants: 3,
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
    minParticipants: 2,
    maxParticipants: 3,
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
    minParticipants: 2,
    maxParticipants: 3,
    benefits: ['Casual bonding', 'Open communication', 'Relaxation'],
    icon: Coffee,
    color: 'brown',
    difficulty: 'easy'
  }
];

interface ChatMessage {
  id: string;
  sender: 'coach' | 'character' | 'facilitator';
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  characterId?: string;
  conflictTriggered?: boolean;
  relationshipContext?: string;
}

interface ConflictContext {
  activeConflicts: ConflictData[];
  characterRelationships: Record<string, string[]>; // characterId -> roommate IDs
  recentDisputes: ConflictData[];
  teamChemistry: number;
  housingStress: number;
}

interface ActiveSession {
  eventId: string;
  eventTitle: string;
  eventType: string;
  participants: string[];
  startTime: Date;
  isActive: boolean;
  chatMessages: ChatMessage[];
  currentRound: number;
  sessionStage: 'icebreaker' | 'conflict_exploration' | 'resolution' | 'team_building';
  conflictContext?: ConflictContext;
  facilitatorStyle: 'supportive' | 'challenging' | 'neutral';
  activityObjectives: string[];
  relationshipDynamics: Record<string, string>; // characterId -> relationship status with others
}

export default function CombinedGroupActivitiesWrapper() {
  // State for team building events (from TeamBuildingWrapper)
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [plannedEvents, setPlannedEvents] = useState<TeamEvent[]>([]);
  
  // State for group activities (from GroupActivitiesWrapper)
  const [selectedActivity, setSelectedActivity] = useState<GroupActivity | null>(null);
  const [ongoingActivities, setOngoingActivities] = useState<GroupActivity[]>([]);
  
  // Combined state for chat functionality
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
  
  // Enhanced conflict-aware state
  const [characters, setCharacters] = useState<any[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [conflictContext, setConflictContext] = useState<ConflictContext | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activityPrompts, setActivityPrompts] = useState<string[]>([]);
  
  // Chat window refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const groupSocketRef = useRef<Socket | null>(null);
  const conflictService = ConflictDatabaseService.getInstance();

  // Load characters with conflict data on component mount
  useEffect(() => {
    const loadCharactersAndConflicts = async () => {
      setCharactersLoading(true);
      try {
        console.log('🏰 Loading characters for enhanced group activities...');
        const response = await characterAPI.getUserCharacters();
        const charactersData = response.characters || [];
        
        const mappedCharacters = charactersData.map((char: any) => {
          const baseName = char.name?.toLowerCase() || char.id?.split('_')[0] || 'unknown';
          return {
            ...char,
            baseName,
            templateId: char.character_id, // For conflict tracking
            avatar: char.avatar_emoji || char.avatar || '⚔️',
            name: char.name || 'Unknown Character',
            level: char.level || 1,
            archetype: char.archetype || 'warrior',
            bond_level: char.bond_level || 0
          };
        });
        
        setCharacters(mappedCharacters);
        console.log('🏰 Loaded', mappedCharacters.length, 'characters for group activities');
        
        // Load conflict context for all characters
        await loadConflictContext(mappedCharacters);
        
      } catch (error) {
        console.error('❌ Failed to load characters for group activities:', error);
      } finally {
        setCharactersLoading(false);
      }
    };
    
    loadCharactersAndConflicts();
  }, []);

  // Initialize Socket.IO connection like working components
  useEffect(() => {
    // Determine backend URL based on environment
    let socketUrl: string;
    
    if (process.env.NODE_ENV === 'production') {
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://blank-wars-clean-production.up.railway.app';
    } else {
      socketUrl = 'http://localhost:3006';
    }
    
    console.log('🔌 [GroupChat] Connecting to backend:', socketUrl);
    
    groupSocketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    groupSocketRef.current.on('connect', () => {
      console.log('✅ GroupChat Socket connected!');
    });

    groupSocketRef.current.on('disconnect', () => {
      console.log('❌ GroupChat Socket disconnected');
    });

    return () => {
      groupSocketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeSession?.chatMessages]);

  // Character image mapping for group activities
  const getCharacterImage = (characterName: string) => {
    const characterImageMap: Record<string, string> = {
      'achilles': 'achilles_group_activity.png',
      'agent x': 'agent_x_group_activity.png',
      'billy the kid': 'billy_the_kid_group_activity.png',
      'cleopatra': 'cleopatra_group_activity.png',
      'cleopatra vii': 'cleopatra_group_activity.png', // Fix for Cleopatra VII character name
      'cyborg': 'agent_x_group_activity.png', // Using agent_x as fallback
      'dracula': 'dracula_group_activity.png',
      'count dracula': 'dracula_group_activity.png',
      'fenrir': 'fenrir_group_activity.png',
      'frankenstein': 'frankenstein_group_activity.png',
      'frankenstein\'s monster': 'frankenstein_group_activity.png',
      'frankensteins monster': 'frankenstein_group_activity.png',
      'genghis khan': 'genghis_khan_group_activity.png',
      'gengas khan': 'genghis_khan_group_activity.png',
      'joan of arc': 'joan_of_arc_group_activity.jpg',
      'joan of ark': 'joan_of_arc_group_activity.jpg',
      'merlin': 'merlin_group_activity.jpg',
      'robin hood': 'robin_hood_group_activity.jpg',
      'robin_hood': 'robin_hood_group_activity.jpg',
      'sherlock holmes': 'Sherlock_holmes_group_activities.png',
      'sun wukong': 'sun_wukong_group_activities.png',
      'tesla': 'tesla_ground_activity .png', // Note: has space and typo in filename
      'nikola tesla': 'tesla_ground_activity .png',
      'zeta': 'zeta_group_activities.png',
      'zeta reticulan': 'zeta_group_activities.png',
      'sammy "slugger" sullivan': 'sammy_slugger_group_activity.png',
      'sammy_slugger': 'sammy_slugger_group_activity.png',
      'vega-x': 'vega_group_activity.png',
    };
    
    const normalizedName = characterName?.toLowerCase()?.trim();
    if (normalizedName && characterImageMap[normalizedName]) {
      return `/images/Coaching/Group Activities/${characterImageMap[normalizedName]}`;
    }
    return '';
  };

  // Load conflict context for enhanced group activities
  const loadConflictContext = async (characterList: any[]) => {
    try {
      console.log('🔍 Loading conflict context for group activities...');
      
      // Get all active conflicts involving the characters
      const allConflicts: ConflictData[] = [];
      const characterRelationships: Record<string, string[]> = {};
      
      for (const character of characterList) {
        const characterKey = character.templateId || character.id;
        try {
          // Get conflicts for this character
          const conflicts = conflictService.getConflictsByCharacter(characterKey);
          allConflicts.push(...conflicts.filter(c => !c.resolved));
          
          // Build relationship mapping (roommates, team members, etc.)
          const roommates = characterList
            .filter(c => c.id !== character.id)
            .slice(0, 3) // Limit roommates for now
            .map(c => c.id);
          characterRelationships[character.id] = roommates;
          
        } catch (error) {
          console.warn(`⚠️ Could not load conflicts for ${character.name}:`, error);
        }
      }
      
      // Calculate team dynamics
      const teamChemistry = Math.max(20, 100 - (allConflicts.length * 15)); // More conflicts = lower chemistry
      const housingStress = Math.min(100, characterList.length > 8 ? (characterList.length - 8) * 20 : 0);
      
      const context: ConflictContext = {
        activeConflicts: allConflicts,
        characterRelationships,
        recentDisputes: allConflicts.filter(c => 
          new Date().getTime() - c.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        ),
        teamChemistry,
        housingStress
      };
      
      setConflictContext(context);
      console.log('✅ Conflict context loaded:', {
        totalConflicts: allConflicts.length,
        recentDisputes: context.recentDisputes.length,
        teamChemistry,
        housingStress
      });
      
    } catch (error) {
      console.error('❌ Failed to load conflict context:', error);
    }
  };

  // Team building event handlers (from TeamBuildingWrapper)
  const handlePlanEvent = (event: TeamEvent) => {
    setPlannedEvents(prev => [...prev, { ...event, id: `${event.id}-${Date.now()}` }]);
    setSelectedEvent(null);
  };

  const handleStartTeamEvent = (event: TeamEvent) => {
    if (selectedParticipants.length >= 1) {
      const participantConflicts = conflictContext?.activeConflicts.filter(conflict =>
        conflict.characters_involved.some(charId => 
          selectedParticipants.some(participant => 
            characters.find(c => c.name === participant)?.templateId === charId
          )
        )
      ) || [];

      const session: ActiveSession = {
        eventId: event.id,
        eventTitle: event.title,
        eventType: event.type,
        participants: selectedParticipants,
        startTime: new Date(),
        isActive: true,
        chatMessages: [],
        currentRound: 1,
        sessionStage: 'icebreaker',
        conflictContext: conflictContext || undefined,
        facilitatorStyle: participantConflicts.length > 2 ? 'challenging' : 'supportive',
        activityObjectives: generateActivityObjectives(event.type, participantConflicts),
        relationshipDynamics: buildRelationshipDynamics(selectedParticipants)
      };
      
      setActiveSession(session);
      setSelectedEvent(null);
      // DON'T clear participants - keep them selected
      setIsPaused(false);
      
      // Don't auto-start - let coach send first message
    }
  };

  // Generate conflict-aware facilitator opening
  const generateFacilitatorOpening = (event: TeamEvent, participants: string[], conflicts: ConflictData[]): string => {
    const hasConflicts = conflicts.length > 0;
    const isHighConflict = conflicts.some(c => c.severity === 'high' || c.severity === 'critical');

    if (hasConflicts && isHighConflict) {
      return `Welcome to our ${event.title}. I can sense some tension in the room today. ${participants.join(', ')}, we're going to work through some team challenges together. Sometimes the best teams are forged through overcoming their differences. Let's see what comes up.`;
    } else if (hasConflicts) {
      return `Welcome everyone to our ${event.title}! ${participants.join(', ')}, I know there have been some minor disagreements lately, but this is a perfect opportunity to strengthen our team bonds. Let's start with something positive.`;
    } else {
      return `Welcome to our ${event.title}! I'm excited to have ${participants.join(', ')} here today. This should be a great opportunity for team building and getting to know each other better.`;
    }
  };

  // Generate activity objectives based on conflicts
  const generateActivityObjectives = (activityType: string, conflicts: ConflictData[]): string[] => {
    const baseObjectives = {
      'dinner': ['Build rapport', 'Casual conversation', 'Team bonding'],
      'retreat': ['Deep connection', 'Conflict resolution', 'Strategic planning'],
      'celebration': ['Positive reinforcement', 'Achievement recognition', 'Morale boost'],
      'activity': ['Collaboration', 'Trust building', 'Communication'],
      'game_night': ['Fun interaction', 'Friendly competition', 'Stress relief'],
      'group_therapy': ['Conflict resolution', 'Emotional processing', 'Relationship repair'],
      'meditation': ['Stress reduction', 'Mindfulness', 'Inner peace'],
      'tournament': ['Healthy competition', 'Skill demonstration', 'Team spirit'],
      'workshop': ['Creative expression', 'Skill sharing', 'Collaborative learning']
    };

    const objectives = baseObjectives[activityType as keyof typeof baseObjectives] || ['Team building', 'Communication', 'Cooperation'];
    
    // Add conflict-specific objectives
    if (conflicts.length > 0) {
      const conflictTypes = conflicts.map(c => c.category);
      if (conflictTypes.some(t => t.includes('housing') || t.includes('room'))) {
        objectives.push('Address living space tensions');
      }
      if (conflictTypes.some(t => t.includes('kitchen') || t.includes('resource'))) {
        objectives.push('Resolve resource sharing issues');
      }
      if (conflictTypes.some(t => t.includes('leadership') || t.includes('authority'))) {
        objectives.push('Clarify team roles and hierarchy');
      }
    }

    return objectives;
  };

  // Build relationship dynamics for participants
  const buildRelationshipDynamics = (participants: string[]): Record<string, string> => {
    const dynamics: Record<string, string> = {};
    
    participants.forEach(participant => {
      const character = characters.find(c => c.name === participant);
      if (character && conflictContext) {
        const characterConflicts = conflictContext.activeConflicts.filter(c => 
          c.characters_involved.includes(character.templateId || character.id)
        );
        
        if (characterConflicts.length > 2) {
          dynamics[participant] = 'Highly conflicted';
        } else if (characterConflicts.length > 0) {
          dynamics[participant] = 'Some tensions';
        } else {
          dynamics[participant] = 'Stable';
        }
      } else {
        dynamics[participant] = 'Unknown';
      }
    });

    return dynamics;
  };

  // Group activity handlers (from GroupActivitiesWrapper)
  const handleStartActivity = (activity: GroupActivity) => {
    if (selectedParticipants.length >= activity.minParticipants) {
      const participantConflicts = conflictContext?.activeConflicts.filter(conflict =>
        conflict.characters_involved.some(charId => 
          selectedParticipants.some(participant => 
            characters.find(c => c.name === participant)?.templateId === charId
          )
        )
      ) || [];

      const session: ActiveSession = {
        eventId: activity.id,
        eventTitle: activity.title,
        eventType: activity.type,
        participants: selectedParticipants,
        startTime: new Date(),
        isActive: true,
        chatMessages: [],
        currentRound: 1,
        sessionStage: activity.type === 'group_therapy' ? 'conflict_exploration' : 'icebreaker',
        conflictContext: conflictContext || undefined,
        facilitatorStyle: activity.difficulty === 'hard' ? 'challenging' : 'supportive',
        activityObjectives: generateActivityObjectives(activity.type, participantConflicts),
        relationshipDynamics: buildRelationshipDynamics(selectedParticipants)
      };
      
      setActiveSession(session);
      setOngoingActivities(prev => [...prev, { ...activity, id: `${activity.id}-${Date.now()}` }]);
      setSelectedActivity(null);
      // DON'T clear participants - keep them selected  
      setIsPaused(false);
      
      // Don't auto-start - let coach send first message
    }
  };

  // Generate activity-specific opening messages
  const generateActivitySpecificOpening = (activity: GroupActivity, participants: string[], conflicts: ConflictData[]): string => {
    const hasConflicts = conflicts.length > 0;
    
    switch (activity.type) {
      case 'group_therapy':
        if (hasConflicts) {
          const conflictAreas = [...new Set(conflicts.map(c => c.category.replace('_', ' ')))];
          return `Welcome to group therapy. ${participants.join(', ')}, I can see we have some work to do today. I'm noticing patterns around ${conflictAreas.slice(0, 2).join(' and ')} that we need to address. This is a safe space to explore what's really going on between you.`;
        }
        return `Welcome to group therapy, ${participants.join(', ')}. Even when things seem calm on the surface, there's always growth work to be done. Let's explore your team dynamics and see what comes up.`;
      
      case 'meditation':
        if (hasConflicts) {
          return `Welcome to our meditation circle. ${participants.join(', ')}, I can sense some tension that needs releasing. Let's use this time to find inner peace and perhaps clarity about your relationships with each other.`;
        }
        return `Welcome, ${participants.join(', ')}. Let's create a peaceful space together and find some inner calm.`;
      
      case 'game_night':
        if (hasConflicts) {
          return `Game night time! ${participants.join(', ')}, I hope some friendly competition will help you work through whatever's been going on lately. Sometimes playing together reminds us why we're on the same team.`;
        }
        return `Game night! ${participants.join(', ')}, ready for some fun competition? Let's see how well you work together... or against each other!`;
      
      case 'tournament':
        if (hasConflicts) {
          return `Tournament time! ${participants.join(', ')}, this competition might bring out some of the tensions I've been hearing about. Let's see if you can channel that energy into victory instead of conflicts.`;
        }
        return `Welcome to the tournament! ${participants.join(', ')}, time to show your skills and compete with honor.`;
      
      case 'workshop':
        if (hasConflicts) {
          return `Welcome to our creative workshop. ${participants.join(', ')}, sometimes working together on something new helps us see each other differently. Let's focus on collaboration and see what we can create.`;
        }
        return `Welcome to our creative workshop! ${participants.join(', ')}, I'm excited to see what we can create together.`;
      
      default:
        return generateFacilitatorOpening({ title: activity.title, type: activity.type } as any, participants, conflicts);
    }
  };

  // Enhanced chat functionality with multi-agent patterns
  const sendCoachMessage = async () => {
    if (!chatMessage.trim()) return;
    
    console.log('🔍 DEBUG: selectedParticipants:', selectedParticipants);
    console.log('🔍 DEBUG: selectedParticipants.length:', selectedParticipants.length);
    
    // Use selected participants or create default if none selected
    const participants = selectedParticipants.length > 0 ? selectedParticipants : ['General Chat'];
    console.log('🔍 DEBUG: Using participants:', participants);
    
    // Ensure we have an active session with conflict context
    if (!activeSession) {
      const participantConflicts = conflictContext?.activeConflicts.filter(conflict =>
        conflict.characters_involved.some(charId => 
          participants.some(participant => 
            characters.find(c => c.name === participant)?.templateId === charId
          )
        )
      ) || [];

      const session: ActiveSession = {
        eventId: 'general-chat',
        eventTitle: 'Group Chat',
        eventType: 'group_chat',
        participants: participants,
        startTime: new Date(),
        isActive: true,
        chatMessages: [],
        currentRound: 1,
        sessionStage: 'icebreaker',
        conflictContext: conflictContext || undefined,
        facilitatorStyle: 'neutral',
        activityObjectives: ['Open communication', 'Team interaction', 'Relationship building'],
        relationshipDynamics: buildRelationshipDynamics(participants)
      };
      setActiveSession(session);
    }

    // Add coach message
    const coachMsg: ChatMessage = {
      id: `coach-${Date.now()}`,
      sender: 'coach',
      senderName: 'Coach',
      senderAvatar: '👨‍💼',
      message: chatMessage,
      timestamp: new Date()
    };

    setActiveSession(prev => prev ? {
      ...prev,
      chatMessages: [...prev.chatMessages, coachMsg]
    } : null);

    setChatMessage('');
    setIsGeneratingResponses(true);

    // Generate responses from participants (in random order for variety)
    try {
      const currentParticipants = activeSession?.participants || participants;
      console.log('👥 Generating responses from participants:', currentParticipants);
      
      // Shuffle participants order for more natural conversation flow
      const shuffledParticipants = [...currentParticipants].sort(() => Math.random() - 0.5);
      
      // Have most participants respond each time - ensure good participation
      const respondingParticipants = shuffledParticipants.slice(0, Math.max(1, Math.floor(shuffledParticipants.length * 0.9)));
      
      for (let i = 0; i < respondingParticipants.length; i++) {
        const characterName = respondingParticipants[i];
        const character = characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
        
        if (character) {
          console.log(`🎭 Generating response from ${character.name} (${i + 1}/${respondingParticipants.length})`);
          // Simulate API call delay with more variation
          await new Promise(resolve => setTimeout(resolve, 1000 + (i * 800) + Math.random() * 1000));
          
          const characterResponse = await generateCharacterResponse(
            character,
            chatMessage,
            activeSession?.eventTitle || 'group_chat',
            activeSession?.chatMessages || []
          );

          const characterMsg: ChatMessage = {
            id: `char-${character.id}-${Date.now()}`,
            sender: 'character',
            senderName: character.name,
            senderAvatar: character.avatar,
            message: characterResponse,
            timestamp: new Date(),
            characterId: character.id
          };

          setActiveSession(prev => prev ? {
            ...prev,
            chatMessages: [...prev.chatMessages, characterMsg]
          } : null);
        }
      }
    } catch (error) {
      console.error('Error generating character responses:', error);
    } finally {
      setIsGeneratingResponses(false);
    }
  };

  const generateCharacterResponse = async (
    character: any, 
    facilitatorMessage: string, 
    eventType: string, 
    chatHistory: ChatMessage[]
  ): Promise<string> => {
    console.log('🎭 Generating response for:', character.name, 'to message:', facilitatorMessage.substring(0, 50) + '...');
    
    return new Promise((resolve, reject) => {
      try {
        // Build conflict-aware character prompt
        const characterPrompt = buildConflictAwareCharacterPrompt(
          character, 
          facilitatorMessage, 
          eventType, 
          chatHistory
        );
        
        console.log('📝 Generated prompt length:', characterPrompt.length);
        
        // Use Socket.IO like working components
        if (!groupSocketRef.current) {
          reject(new Error('Socket not connected'));
          return;
        }
        
        const requestData = {
          characterId: character.templateId || character.id,
          characterName: character.name,
          message: facilitatorMessage,
          eventType: eventType,
          promptOverride: characterPrompt,
          context: {
            sessionStage: activeSession?.sessionStage,
            conflictContext: activeSession?.conflictContext,
            relationshipDynamics: activeSession?.relationshipDynamics,
            personality: {
              traits: character.personality_traits || ['Determined'],
              speechStyle: character.speaking_style || 'Direct',
              motivations: ['Team success', 'Personal growth'],
              fears: ['Failure', 'Rejection']
            },
            recentMessages: chatHistory.slice(-6).map(msg => ({
              role: msg.sender === 'character' ? 'assistant' : 'user',
              content: msg.message
            }))
          }
        };
        
        // Create unique response handler
        const responseHandler = (data: { character: string; message: string }) => {
          if (data.character === character.name) {
            groupSocketRef.current?.off('chat_response', responseHandler);
            console.log('✅ Received socket response for:', character.name);
            resolve(data.message);
          }
        };
        
        const errorHandler = (error: { message: string }) => {
          groupSocketRef.current?.off('chat_response', responseHandler);
          groupSocketRef.current?.off('chat_error', errorHandler);
          console.error('❌ Socket error for:', character.name, error);
          reject(new Error(error.message));
        };
        
        // Set up listeners
        groupSocketRef.current.on('chat_response', responseHandler);
        groupSocketRef.current.on('chat_error', errorHandler);
        
        // Send message via socket  
        console.log('📤 Sending group chat message for:', character.name);
        groupSocketRef.current.emit('chat_message', {
          message: facilitatorMessage,
          character: character.baseName || character.name?.toLowerCase() || character.id,
          characterData: requestData
        });
        
        // Timeout after 15 seconds
        setTimeout(() => {
          groupSocketRef.current?.off('chat_response', responseHandler);
          groupSocketRef.current?.off('chat_error', errorHandler);
          reject(new Error('Response timeout'));
        }, 15000);
        
      } catch (error) {
        console.error('❌ Error setting up socket response:', error);
        reject(error);
      }
    });
  };

  // Build conflict-aware character prompt for group activities
  const buildConflictAwareCharacterPrompt = (
    character: any,
    facilitatorMessage: string,
    eventType: string,
    chatHistory: ChatMessage[]
  ): string => {
    try {
      // Get character's specific conflicts
      const characterKey = character.templateId || character.id;
      const characterConflicts = conflictContext?.activeConflicts.filter(c => 
        c.characters_involved.includes(characterKey)
      ) || [];

      // Get relationship context with other participants
      const otherParticipants = activeSession?.participants.filter(p => p !== character.name) || [];
      const relationshipTensions = characterConflicts.filter(c => 
        c.characters_involved.some(id => 
          otherParticipants.some(participant =>
            characters.find(char => char.name === participant)?.templateId === id
          )
        )
      );

      // Generate specific conflict context
      const conflictDetails = relationshipTensions.length > 0 
        ? relationshipTensions.map(c => `- ${c.description} (${c.severity} severity)`).join('\n')
        : 'No major conflicts with current participants';

      const prompt = `
GROUP ACTIVITY SESSION - CHARACTER RESPONSE

You are ${character.name}, a ${character.archetype} from ${character.historicalPeriod || 'ancient times'} participating in a ${eventType} group activity.

CURRENT SITUATION:
Activity: ${activeSession?.eventTitle || 'Group Activity'}
Stage: ${activeSession?.sessionStage || 'icebreaker'}  
Other Participants: ${otherParticipants.join(', ')}
Facilitator Style: ${activeSession?.facilitatorStyle || 'neutral'}

YOUR CONFLICT HISTORY WITH THIS GROUP:
${conflictDetails}

RECENT CONVERSATION (Read carefully - this is a GROUP conversation):
${chatHistory.slice(-6).map(msg => `${msg.senderName}: ${msg.message}`).join('\n')}

${facilitatorMessage === 'Start a natural conversation' 
  ? 'SITUATION: You are starting a natural group conversation. No facilitator present - just you and the other characters gathering together.'
  : `FACILITATOR JUST SAID: "${facilitatorMessage}"`
}

YOUR UNIQUE CHARACTER IDENTITY:
- Name: ${character.name}
- Archetype: ${character.archetype}
- Background: ${character.description || 'A legendary figure with a complex history'}
- Speaking Style: ${character.speaking_style || 'Direct'}
- Conflict Response: ${character.conflict_response || 'Confrontational'}
- Personality Traits: ${character.personality_traits?.join(', ') || 'Determined'}
- Historical Period: ${character.historicalPeriod || 'Ancient times'}
- Mythology: ${character.mythology || 'Various legends'}

STAY TRUE TO YOUR CHARACTER:
- Speak in a way that reflects your background and time period
- Your responses should feel authentic to ${character.name}'s legendary persona
- Draw on your character's historical/mythological experiences when relevant
- Show your character's unique perspective shaped by their life experiences
- Use vocabulary and speech patterns appropriate to your era and status
- Reference things from your time period, not modern concepts
- Show your character's personality through speech - formal, casual, poetic, etc.

RESPONSE GUIDELINES:
${facilitatorMessage === 'Start a natural conversation' 
  ? `1. START A NATURAL CONVERSATION - You're initiating or joining a casual group gathering
2. Be the first to speak up or respond naturally to what others just said
3. Don't mention facilitators, activities, or structured exercises - this is just characters talking
4. Start with a greeting, observation, or comment that fits your character
5. Keep it natural and conversational - like friends meeting up`
  : `1. This is a GROUP CONVERSATION - react to what others have said, not just the facilitator
2. Build on, agree with, disagree with, or add to what other participants have said
3. Don't just repeat what others said - bring your unique perspective as ${character.name}
4. Reference other participants by name when responding to them`
}
5. CRITICAL: Stay true to your character's personality, background, and historical period
6. Keep response 1-2 sentences maximum
7. Be conversational and interactive - this is a group chat, not individual responses
8. Show character growth potential while maintaining authentic flaws
9. Use language and references that fit your character's time period and background
10. Don't be generic - be distinctly ${character.name} in your response
11. Avoid modern slang unless it fits your character - speak authentically to your time period

${relationshipTensions.length > 0 ? 
  '13. Feel free to address or avoid the tensions as fits your character' : 
  '13. Be open to building relationships but stay authentic to your character'
}

${facilitatorMessage === 'Start a natural conversation' 
  ? `IMPORTANT: This is a NATURAL GROUP GATHERING. You're just hanging out with other characters - no structured activities or facilitators. Start a conversation as ${character.name} would naturally do.`
  : `IMPORTANT: This is a GROUP CONVERSATION. Don't just respond to the facilitator - respond to what the GROUP is discussing. If someone just said something, react to THEM.`
}

CRITICAL REMINDER: You are ${character.name}, not a generic character. Your response must reflect your unique personality, background, and legendary status. Speak as ${character.name} would speak, with the wisdom, experiences, and mannerisms of your character.

FORBIDDEN RESPONSES:
- Do NOT use generic phrases like "Hey team!" or "Let's do this!"
- Do NOT use modern slang or corporate speak
- Do NOT sound like a motivational speaker or team coach
- Do NOT ignore your character's historical context
- Do NOT be overly enthusiastic about "team building" - stay in character

AUTHENTIC EXAMPLES:
- Tesla: "Fascinating! The electrical currents of human interaction intrigue me..."
- Fenrir: "The scent of warriors gathers. I sense strength in this pack..."
- Agent X: "The shadows reveal interesting alliances forming here..."

RESPOND AS ${character.name}: ${facilitatorMessage === 'Start a natural conversation' 
  ? 'Start or join this natural group conversation, staying true to your legendary persona.'
  : 'Participate in this group conversation naturally, staying true to your legendary persona.'
}
      `.trim();

      return prompt;
      
    } catch (error) {
      console.error('Error building character prompt:', error);
      // Fallback to simple but character-specific prompt
      return `You are ${character.name}, a ${character.archetype} from ${character.historicalPeriod || 'ancient times'} in a ${eventType} group activity. The facilitator said: "${facilitatorMessage}". Respond authentically as ${character.name}, staying true to your legendary persona and background.`;
    }
  };

  const generateFallbackResponse = (character: any, coachMessage: string, eventType: string): string => {
    // Character-specific responses based on archetype and personality
    const characterResponses = {
      'Merlin': [
        `*adjusts robes thoughtfully* The arcane energies suggest this ${eventType} will yield interesting results. Magic flows stronger when minds unite.`,
        `I sense wisdom in these words, though the future remains clouded. Perhaps we should explore this matter more deeply.`,
        `*strokes beard* In my centuries of experience, such gatherings often reveal hidden truths about ourselves and others.`
      ],
      'Achilles': [
        `*clenches fist* You speak truth! A warrior's strength comes not just from the blade, but from the bonds forged with comrades.`,
        `This reminds me of the camaraderie before Troy. Even the greatest heroes need allies they can trust.`,
        `Honor demands that I give my honest thoughts here. We must face our challenges head-on, together.`
      ],
      'Loki': [
        `*grins mischievously* How delightfully... revealing. I wonder what secrets this little gathering might uncover?`,
        `Truth is such a slippery thing, isn't it? But perhaps that's what makes it so entertaining to pursue.`,
        `*chuckles* Oh, the stories I could tell about team dynamics. But where's the fun in spoiling the surprise?`
      ]
    };
    
    const responses = characterResponses[character.name as keyof typeof characterResponses] || [
      `As ${character.name}, I believe this ${eventType} offers valuable insights into our team dynamics.`,
      `*in character as ${character.name}* This discussion resonates with my experiences and perspectives.`,
      `I appreciate the opportunity to share my thoughts with the group. Unity of purpose guides us forward.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Trigger first round of responses for a new session
  const triggerFirstRound = async (session: ActiveSession) => {
    if (isGeneratingResponses) {
      console.log('⚠️ Already generating responses, skipping triggerFirstRound');
      return;
    }
    
    setIsPaused(false);
    setIsGeneratingResponses(true);
    
    try {
      console.log('🎯 Starting first round for session:', session.eventTitle);
      console.log('👥 Participants to process:', session.participants);
      
      // Shuffle participants for natural conversation flow
      const shuffledParticipants = [...session.participants].sort(() => Math.random() - 0.5);
      
      // Have most participants respond initially (ensure good participation)
      const respondingCount = Math.max(1, Math.floor(shuffledParticipants.length * 0.8));
      const respondingParticipants = shuffledParticipants.slice(0, respondingCount);
      
      // Get responses from selected participants
      for (let i = 0; i < respondingParticipants.length; i++) {
        const participantName = respondingParticipants[i];
        const character = characters.find(c => c.name.toLowerCase() === participantName.toLowerCase());
        
        if (character) {
          console.log(`🎭 Getting first response from ${character.name} (${i + 1}/${respondingParticipants.length})`);
          
          try {
            const characterResponse = await generateCharacterResponse(
              character,
              'Start a natural conversation', // Natural conversation starter
              session.eventType,
              session.chatMessages
            );

            const characterMsg: ChatMessage = {
              id: `char-${character.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              sender: 'character',
              senderName: character.name,
              senderAvatar: character.avatar,
              message: characterResponse,
              timestamp: new Date(),
              characterId: character.id
            };

            setActiveSession(prev => prev ? {
              ...prev,
              chatMessages: [...prev.chatMessages, characterMsg]
            } : null);
            
            // Variable delay between character responses
            if (i < respondingParticipants.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
            }
          } catch (error) {
            console.error(`❌ Failed to get first response from ${character.name}:`, error);
            // Continue to next character even if this one fails
            console.log(`⏭️ Continuing to next character after ${character.name} failed`);
          }
        }
      }
      
      setIsPaused(true); // Pause for user to continue
      
    } catch (error) {
      console.error('❌ Error in first round:', error);
      setIsPaused(true);
    } finally {
      setIsGeneratingResponses(false);
    }
  };

  // Session control functions (inspired by therapy system)
  const continueSession = async () => {
    if (!activeSession || isGeneratingResponses) return;
    
    setIsPaused(false);
    setIsGeneratingResponses(true);
    
    try {
      console.log('🎯 Continuing group activity session:', activeSession.eventTitle);
      
      // Skip facilitator - go directly to character responses
      console.log('🎯 Continuing session without facilitator - characters only');
      
      // Get responses from participants (randomized and not everyone)
      const shuffledParticipants = [...activeSession.participants].sort(() => Math.random() - 0.5);
      const respondingCount = Math.max(1, Math.floor(shuffledParticipants.length * 0.9));
      const respondingParticipants = shuffledParticipants.slice(0, respondingCount);
      
      for (let i = 0; i < respondingParticipants.length; i++) {
        const participantName = respondingParticipants[i];
        const character = characters.find(c => c.name.toLowerCase() === participantName.toLowerCase());
        
        if (character) {
          console.log(`🎭 Getting response from ${character.name} (${i + 1}/${respondingParticipants.length})`);
          
          try {
            const characterResponse = await generateCharacterResponse(
              character,
              'Continue the group conversation naturally',
              activeSession.eventType,
              activeSession.chatMessages
            );

            const characterMsg: ChatMessage = {
              id: `char-${character.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              sender: 'character',
              senderName: character.name,
              senderAvatar: character.avatar,
              message: characterResponse,
              timestamp: new Date(),
              characterId: character.id
            };

            setActiveSession(prev => prev ? {
              ...prev,
              chatMessages: [...prev.chatMessages, characterMsg]
            } : null);
            
            // Variable delay between character responses
            if (i < respondingParticipants.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
            }
          } catch (error) {
            console.error(`❌ Failed to get response from ${character.name}:`, error);
          }
        }
      }
      
      // Update session state
      setActiveSession(prev => prev ? {
        ...prev,
        currentRound: prev.currentRound + 1
      } : null);
      
      setIsPaused(true); // Pause for user to continue
      
    } catch (error) {
      console.error('❌ Error continuing session:', error);
      setIsPaused(true);
    } finally {
      setIsGeneratingResponses(false);
    }
  };

  // Generate facilitator follow-up messages
  const generateFacilitatorFollowUp = async (): Promise<string> => {
    if (!activeSession) return 'Let\'s continue our discussion.';
    
    const currentRound = activeSession.currentRound;
    const hasConflicts = (activeSession.conflictContext?.activeConflicts.length || 0) > 0;
    const recentMessages = activeSession.chatMessages.slice(-3);
    
    // Analyze recent character responses for tension or harmony
    const hasCharacterTension = recentMessages.some(msg => 
      msg.sender === 'character' && (
        msg.message.toLowerCase().includes('disagree') ||
        msg.message.toLowerCase().includes('wrong') ||
        msg.message.toLowerCase().includes('annoying') ||
        msg.message.toLowerCase().includes('problem')
      )
    );

    switch (activeSession.sessionStage) {
      case 'icebreaker':
        if (hasCharacterTension || hasConflicts) {
          return `I'm noticing some interesting dynamics here. ${activeSession.participants.join(', ')}, let's dig a little deeper. What's really going on between you all lately?`;
        }
        return `Great responses! Let's explore this further. What would you each say is your biggest challenge working as a team right now?`;
      
      case 'conflict_exploration':
        if (hasCharacterTension) {
          return `Now we're getting somewhere. I can feel the tension in the room. ${activeSession.participants.join(', ')}, this is exactly what we need to work through. Who wants to address what just came up?`;
        }
        return `I appreciate the honesty. Let's focus on solutions now. How can you each contribute to resolving these team challenges?`;
      
      case 'resolution':
        return `We've made real progress today. ${activeSession.participants.join(', ')}, what's one specific thing you'll commit to doing differently going forward?`;
      
      case 'team_building':
        return `Excellent! I can see the team chemistry improving. Let's end on a high note - share one thing you appreciate about working with each other.`;
      
      default:
        return `Let's keep this conversation going. What other thoughts do you have about today's topic?`;
    }
  };

  // End session
  const endSession = () => {
    if (activeSession) {
      console.log('🏁 Ending group activity session:', activeSession.eventTitle);
      setActiveSession(null);
      setIsPaused(false);
      setIsGeneratingResponses(false);
      // Don't clear selected participants - let user keep their selection
    }
  };

  // Clear all sessions and reset state
  const clearAllSessions = () => {
    console.log('🧹 Clearing all sessions and resetting state');
    setActiveSession(null);
    setIsPaused(false);
    setIsGeneratingResponses(false);
    // Don't clear selected participants - let user keep their selection
    setChatMessage('');
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      orange: 'border-orange-500/50 bg-orange-600/20 text-orange-400',
      green: 'border-green-500/50 bg-green-600/20 text-green-400',
      yellow: 'border-yellow-500/50 bg-yellow-600/20 text-yellow-400',
      blue: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
      purple: 'border-purple-500/50 bg-purple-600/20 text-purple-400',
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

  const toggleParticipant = (characterName: string) => {
    setSelectedParticipants(prev => {
      // If trying to add a character and already at max (3), don't add
      if (!prev.includes(characterName) && prev.length >= 3) {
        console.log('⚠️ Maximum 3 participants allowed');
        return prev;
      }
      
      const newParticipants = prev.includes(characterName) 
        ? prev.filter(name => name !== characterName)
        : [...prev, characterName];
      
      // Clear session if no participants selected
      if (newParticipants.length === 0 && activeSession?.eventId === 'general-chat') {
        setActiveSession(null);
      }
      
      return newParticipants;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Left Sidebar - Characters */}
        <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Characters
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {selectedParticipants.length}/3 selected
            {selectedParticipants.length >= 3 && (
              <span className="text-yellow-400 ml-2">(Max reached)</span>
            )}
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {characters.map((character) => {
              const characterName = character.name;
              const isSelected = selectedParticipants.includes(characterName);
              const isDisabled = !isSelected && selectedParticipants.length >= 3;
              
              return (
                <button
                  key={character.id}
                  onClick={() => toggleParticipant(characterName)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : isDisabled
                      ? 'border-gray-700 bg-gray-800/30 text-gray-500 cursor-not-allowed opacity-50'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{character.avatar}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level}</div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {/* Character Images Display - Shows 1-3 selected characters */}
          {selectedParticipants.length > 0 && (
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-6">
              <div className="flex justify-center items-center gap-4">
                {selectedParticipants.slice(0, 3).map((participantName, index) => {
                  const character = characters.find(c => c.name === participantName);
                  const imageUrl = getCharacterImage(participantName);
                  
                  return (
                    <div key={participantName} className="flex flex-col items-center">
                      <div className={`rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl ${
                        selectedParticipants.length === 1 ? 'w-72 h-72' : 
                        selectedParticipants.length === 2 ? 'w-48 h-48' : 
                        'w-32 h-32'
                      }`}>
                        {imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={character?.name || participantName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Group activity image failed to load:', e.currentTarget.src);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <span className="text-6xl">{character?.avatar || '⚔️'}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-white font-semibold text-sm">{character?.name || participantName}</div>
                        <div className="text-gray-400 text-xs">Lv.{character?.level || 1}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Window */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 h-[500px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                  {activeSession ? activeSession.eventTitle : 'Group Activities Chat'}
                </h2>
                <p className="text-sm text-gray-400">
                  {activeSession 
                    ? `Live session with ${activeSession.participants.length} participants` 
                    : 'Start an activity to begin group chat'
                  }
                </p>
              </div>
              {activeSession && (
                <div className="flex items-center gap-4">
                  {/* Session Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-purple-300 font-semibold">
                      {isPaused ? 'PAUSED' : 'LIVE'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      (Round {activeSession.currentRound})
                    </span>
                  </div>
                  
                  {/* Session Controls */}
                  <button
                    onClick={continueSession}
                    disabled={isGeneratingResponses || !isPaused}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                  
                  <button
                    onClick={() => setIsPaused(true)}
                    disabled={isGeneratingResponses || isPaused}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Pause
                  </button>
                  
                  <button
                    onClick={endSession}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    End Session
                  </button>
                  
                  <button
                    onClick={clearAllSessions}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900"
          >
            {activeSession ? (
              <>
                {activeSession.chatMessages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.sender === 'coach' ? 'flex-row-reverse' : ''}`}>
                    <div className="text-2xl flex-shrink-0">{message.senderAvatar}</div>
                    <div className={`flex-1 max-w-md ${message.sender === 'coach' ? 'text-right' : ''}`}>
                      <div className="text-sm text-gray-400 mb-1">
                        {message.senderName} • {message.timestamp.toLocaleTimeString()}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.sender === 'coach' 
                          ? 'bg-blue-600/20 border border-blue-500/50 ml-auto' 
                          : 'bg-gray-700/50 border border-gray-600'
                      }`}>
                        <p className="text-white">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isGeneratingResponses && (
                  <div className="flex gap-3">
                    <div className="text-2xl">⏳</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">Characters are responding...</div>
                      <div className="p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                        <div className="animate-pulse text-gray-400">Thinking...</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Chat</h3>
                  <p className="text-gray-400 mb-4">
                    {selectedParticipants.length > 0 
                      ? `${selectedParticipants.length} participants selected` 
                      : 'Select participants to begin group chat'}
                  </p>
                  {selectedParticipants.length > 0 && (
                    <button
                      onClick={async () => {
                        // Start a general group chat session
                        const session: ActiveSession = {
                          eventId: 'general-chat',
                          eventTitle: 'Group Chat',
                          eventType: 'group_chat',
                          participants: selectedParticipants,
                          startTime: new Date(),
                          isActive: true,
                          chatMessages: [],
                          currentRound: 1,
                          sessionStage: 'icebreaker',
                          conflictContext: conflictContext || undefined,
                          facilitatorStyle: 'supportive',
                          activityObjectives: ['Build team rapport', 'Open communication', 'Share perspectives'],
                          relationshipDynamics: buildRelationshipDynamics(selectedParticipants)
                        };
                        
                        // Start with empty messages - let characters naturally begin
                        session.chatMessages = [];
                        setActiveSession(session);
                        setIsPaused(false);
                        
                        // Trigger first round of responses
                        setTimeout(() => {
                          if (session.participants.length > 0) {
                            triggerFirstRound(session);
                          }
                        }, 1000);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Start Group Chat
                    </button>
                  )}
                  <p className="text-gray-500 text-sm mt-4">
                    Or select an activity below for structured team building
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-3">
              <div className="text-2xl">👨‍💼</div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendCoachMessage()}
                  placeholder="Type your message..."
                  disabled={false}
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={sendCoachMessage}
                  disabled={!chatMessage.trim() || isGeneratingResponses}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area Below Chat */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-800 min-h-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Team Activities & Group Events</h1>
            <p className="text-gray-300">
              Organize team building events and group activities with enhanced conflict awareness
            </p>
          </div>

          {/* Conflict Context Panel */}
          {conflictContext && (
            <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-red-900/30 rounded-xl p-4 border border-purple-500/30">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Team Dynamics Context
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-purple-300 font-semibold">Active Conflicts</div>
                  <div className="text-2xl font-bold text-red-400">{conflictContext.activeConflicts.length}</div>
                  <div className="text-sm text-gray-400">
                    {conflictContext.recentDisputes.length} recent disputes
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-blue-300 font-semibold">Team Chemistry</div>
                  <div className="text-2xl font-bold text-blue-400">{conflictContext.teamChemistry}%</div>
                  <div className="text-sm text-gray-400">Overall harmony level</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-orange-300 font-semibold">Housing Stress</div>
                  <div className="text-2xl font-bold text-orange-400">{conflictContext.housingStress}%</div>
                  <div className="text-sm text-gray-400">Living space tensions</div>
                </div>
              </div>
              {conflictContext.activeConflicts.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-white mb-2">Recent Conflict Areas:</div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(conflictContext.activeConflicts.slice(0, 4).map(c => c.category.replace('_', ' ')))].map((category, index) => (
                      <span key={index} className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded-full border border-red-500/30">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Suggestions based on conflicts */}
          {selectedParticipants.length > 0 && conflictContext && (
            <div className="mb-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30">
              <h3 className="text-lg font-semibold text-white mb-3">Suggested Activities for Selected Group</h3>
              <div className="text-sm text-gray-300 mb-3">
                Selected: {selectedParticipants.join(', ')}
              </div>
              {(() => {
                const participantConflicts = conflictContext.activeConflicts.filter(conflict =>
                  conflict.characters_involved.some(charId => 
                    selectedParticipants.some(participant => 
                      characters.find(c => c.name === participant)?.templateId === charId
                    )
                  )
                );
                
                if (participantConflicts.length > 2) {
                  return (
                    <div className="text-yellow-300">
                      ⚠️ High conflict group detected. Recommended: Group Therapy or Conflict Resolution activities.
                    </div>
                  );
                } else if (participantConflicts.length > 0) {
                  return (
                    <div className="text-blue-300">
                      💡 Some tensions present. Recommended: Team Building or Workshop activities.
                    </div>
                  );
                } else {
                  return (
                    <div className="text-green-300">
                      ✅ Harmonious group. Recommended: Game Night or Celebration activities.
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* Team Building Events Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="w-6 h-6" />
              Team Building Activities
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {teamEvents.map((event) => {
                const IconComponent = event.icon;
                const canStart = selectedParticipants.length >= 1;
                
                return (
                  <div key={event.id} className={`border rounded-lg p-4 transition-all ${getColorClasses(event.color)}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className="w-6 h-6 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-sm text-gray-400 capitalize">{event.type} • {event.mood}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-4">{event.description}</p>
                    
                    <button
                      onClick={() => handleStartTeamEvent(event)}
                      disabled={!canStart}
                      className={`w-full py-2 px-4 rounded-lg transition-colors ${
                        canStart 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canStart ? 'Start Session' : 'Select participants'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Activities Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Activity className="w-6 h-6" />
              Group Activities
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {groupActivities.map((activity) => {
                const IconComponent = activity.icon;
                const canStart = selectedParticipants.length >= activity.minParticipants;
                
                return (
                  <div key={activity.id} className={`border rounded-lg p-4 transition-all ${getColorClasses(activity.color)}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className="w-6 h-6 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{activity.title}</h3>
                        <p className="text-sm text-gray-400 capitalize">{activity.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{activity.description}</p>
                    
                    <button
                      onClick={() => handleStartActivity(activity)}
                      disabled={!canStart}
                      className={`w-full py-2 px-4 rounded-lg transition-colors ${
                        canStart 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canStart 
                        ? 'Start Session' 
                        : `Need ${activity.minParticipants - selectedParticipants.length} more`}
                    </button>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}