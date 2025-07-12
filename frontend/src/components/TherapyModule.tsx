'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Users, MessageCircle, Star, Crown, 
  Sparkles, Heart, Zap, Shield, User
} from 'lucide-react';
import { characterAPI } from '@/services/apiClient';
import ConflictDatabaseService, { ConflictData, TherapyContext, TherapistPromptStyle } from '@/services/ConflictDatabaseService';
import { therapyChatService } from '@/data/therapyChatService';

interface TherapySession {
  id: string;
  type: 'individual' | 'group';
  therapistId: string;
  participantIds: string[];
  stage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory: TherapyMessage[];
  startTime: Date;
  context?: TherapyContext;
  groupDynamics?: string[];
}

interface TherapyMessage {
  id: string;
  sessionId: string;
  speakerId: string;
  speakerType: 'character' | 'therapist';
  message: string;
  timestamp: Date;
  messageType: 'response' | 'question' | 'intervention';
}

interface Character {
  id: string;
  name: string;
  archetype: string;
  level: number;
  base_health: number;
  base_attack: number;
  experience: number;
  bond_level: number;
}

interface Therapist {
  id: string;
  name: string;
  title: string;
  description: string;
  specialties: string[];
  bonuses: {
    type: string;
    value: number;
    description: string;
  }[];
  rarity: 'common' | 'rare' | 'legendary';
  unlocked: boolean;
  portrait: string;
}

const baseTherapists: Therapist[] = [
  {
    id: 'carl-jung',
    name: 'Carl Jung',
    title: 'The Archetype Master',
    description: 'Legendary psychologist who understands the depths of character archetypes and the collective unconscious.',
    specialties: ['Archetype Analysis', 'Dream Work', 'Shadow Integration', 'Team Harmony'],
    bonuses: [
      { type: 'bond_level', value: 15, description: '+15% Bond Level growth' },
      { type: 'team_harmony', value: 20, description: '+20% Team coordination' },
      { type: 'character_insight', value: 25, description: '+25% Character development speed' }
    ],
    rarity: 'common',
    unlocked: true,
    portrait: '🧠'
  },
  {
    id: 'zxk14bw7',
    name: 'Zxk14bW^7',
    title: 'The Cosmic Sage',
    description: 'Ancient extraterrestrial therapist with millennia of wisdom from across seventeen galaxies.',
    specialties: ['Cosmic Perspective', 'Logic Matrices', 'Conflict Resolution', 'Strategic Thinking'],
    bonuses: [
      { type: 'strategy', value: 30, description: '+30% Strategic planning effectiveness' },
      { type: 'conflict_resolution', value: 25, description: '+25% Conflict resolution speed' },
      { type: 'mental_clarity', value: 20, description: '+20% Mental clarity and focus' }
    ],
    rarity: 'common',
    unlocked: true,
    portrait: '👽'
  },
  {
    id: 'seraphina',
    name: 'Fairy Godmother Seraphina',
    title: 'The Enchanted Healer',
    description: 'Magical therapist who uses ancient enchantments and fairy wisdom to heal hearts and transform souls.',
    specialties: ['Emotional Healing', 'Magical Transformation', 'Morale Boosting', 'Personal Growth'],
    bonuses: [
      { type: 'morale', value: 35, description: '+35% Team morale boost' },
      { type: 'healing', value: 20, description: '+20% Emotional healing rate' },
      { type: 'transformation', value: 25, description: '+25% Personal growth acceleration' }
    ],
    rarity: 'common',
    unlocked: true,
    portrait: '🧚‍♀️'
  }
];

const TherapyModule = () => {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [therapyType, setTherapyType] = useState<'individual' | 'group'>('individual');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [therapyContext, setTherapyContext] = useState<TherapyContext | null>(null);
  const [activeConflicts, setActiveConflicts] = useState<ConflictData[]>([]);
  const [sessionStage, setSessionStage] = useState<'initial' | 'resistance' | 'breakthrough'>('initial');
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  const [groupDynamics, setGroupDynamics] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<TherapySession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<TherapyMessage[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const conflictService = ConflictDatabaseService.getInstance();

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const response = await characterAPI.getUserCharacters();
        if (response.success && response.characters) {
          const mappedCharacters = response.characters.map((char: any) => ({
            id: char.id,
            name: char.name,
            archetype: char.archetype || 'Unknown',
            level: char.level || 1,
            base_health: char.base_health || 100,
            base_attack: char.base_attack || 50,
            experience: char.experience || 0,
            bond_level: char.bond_level || 0
          }));
          setAvailableCharacters(mappedCharacters);
        }
      } catch (error) {
        console.error('Error loading characters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, []);

  // Load therapy context when character is selected
  useEffect(() => {
    const loadTherapyContext = async () => {
      if (selectedCharacter && therapyType === 'individual') {
        try {
          const context = await conflictService.getTherapyContextForCharacter(selectedCharacter.id);
          setTherapyContext(context);
          setActiveConflicts(context.activeConflicts);
          
          // Generate dynamic prompts based on context
          const prompts = generateDynamicPrompts(context);
          setDynamicPrompts(prompts);
        } catch (error) {
          console.error('Error loading therapy context:', error);
        }
      }
    };

    loadTherapyContext();
  }, [selectedCharacter, therapyType]);

  // Generate dynamic prompts based on therapy context
  const generateDynamicPrompts = (context: TherapyContext): string[] => {
    const prompts: string[] = [];
    
    // Housing-based prompts
    if (context.currentOccupancy > context.roomCapacity) {
      prompts.push(`Living with ${context.currentOccupancy} people in a ${context.roomCapacity}-person space must be stressful...`);
    }
    
    // Performance-based prompts
    if (context.leagueRanking > 10) {
      prompts.push(`How does being ranked #${context.leagueRanking} in the league affect your mindset?`);
    }
    
    // Roommate-based prompts
    if (context.roommates.length > 0) {
      prompts.push(`Tell me about your relationship with ${context.roommates[0].name}...`);
    }
    
    // Team chemistry prompts
    if (context.teamChemistry < 70) {
      prompts.push(`Your team chemistry is at ${context.teamChemistry}%. What's causing the friction?`);
    }
    
    // Conflict-specific prompts
    context.activeConflicts.forEach(conflict => {
      if (conflict.severity === 'high' || conflict.severity === 'critical') {
        prompts.push(`I sense there's something about ${conflict.category.replace('_', ' ')} that's really bothering you...`);
      }
    });
    
    return prompts.slice(0, 6); // Limit to 6 prompts
  };

  // Generate group therapy dynamics for selected trio
  const generateGroupDynamics = (members: Character[]): string[] => {
    if (members.length !== 3) return [];
    
    const [char1, char2, char3] = members;
    // Safety check - ensure all characters exist
    if (!char1 || !char2 || !char3) return [];
    
    const dynamics: string[] = [];
    
    // Cultural/temporal conflicts
    const eras = members.map(m => getCharacterEra(m));
    if (new Set(eras).size === 3) {
      dynamics.push(`${char1.name} (${eras[0]}) clashes with ${char2.name} (${eras[1]}) and ${char3.name} (${eras[2]}) over vastly different worldviews`);
    }
    
    // Archetype triangles
    const archetypes = members.map(m => m.archetype);
    if (archetypes.includes('warrior') && archetypes.includes('scholar') && archetypes.includes('leader')) {
      dynamics.push(`Classic power triangle: ${char1.name}'s ${char1.archetype} nature vs ${char2.name}'s ${char2.archetype} approach vs ${char3.name}'s ${char3.archetype} style`);
    }
    
    // Personality combustion
    const personalityClashes = [
      `${char1.name} judges ${char2.name}'s lifestyle while ${char3.name} enables the behavior`,
      `${char2.name} feels ganged up on by ${char1.name} and ${char3.name}`,
      `${char3.name} plays mediator between ${char1.name} and ${char2.name} but secretly resents both`,
      `All three compete for the same recognition, creating underlying tension`,
      `${char1.name} and ${char2.name} have history that ${char3.name} doesn't understand`
    ];
    
    dynamics.push(...personalityClashes.slice(0, 3));
    
    // Specific character combinations
    if (members.some(m => m.name.toLowerCase().includes('dracula'))) {
      dynamics.push(`Someone's nocturnal schedule is disrupting the group's rhythm`);
    }
    
    if (members.some(m => m.archetype === 'trickster')) {
      dynamics.push(`One member uses humor to deflect serious conversations, frustrating the others`);
    }
    
    if (members.some(m => m.archetype === 'leader')) {
      dynamics.push(`Leadership power struggle - who's really in charge of this trio?`);
    }
    
    return dynamics.slice(0, 4);
  };

  // Helper function to determine character era
  const getCharacterEra = (character: Character): string => {
    const name = character.name.toLowerCase();
    if (name.includes('tesla')) return 'Modern Era';
    if (name.includes('joan') || name.includes('arthur')) return 'Medieval';
    if (name.includes('cleopatra') || name.includes('caesar')) return 'Ancient';
    if (name.includes('dracula') || name.includes('holmes')) return 'Victorian';
    if (name.includes('achilles') || name.includes('hercules')) return 'Mythological';
    return 'Unknown Era';
  };

  // Handle group member selection
  const handleGroupMemberToggle = (character: Character) => {
    setSelectedGroupMembers(prev => {
      const isSelected = prev.some(m => m.id === character.id);
      
      if (isSelected) {
        // Remove character
        const newSelection = prev.filter(m => m.id !== character.id);
        setGroupDynamics(generateGroupDynamics(newSelection));
        return newSelection;
      } else if (prev.length < 3) {
        // Add character if under limit
        const newSelection = [...prev, character];
        setGroupDynamics(generateGroupDynamics(newSelection));
        return newSelection;
      }
      
      return prev; // No change if already at limit
    });
  };

  const handleStartSession = async () => {
    const isReadyForSession = selectedTherapist && (
      (therapyType === 'individual' && selectedCharacter) ||
      (therapyType === 'group' && selectedGroupMembers.length === 3)
    );
    
    if (!isReadyForSession) return;

    try {
      setIsSessionActive(true);
      setIsGeneratingResponse(true);

      // Wait for socket connection
      const connected = await therapyChatService.waitForConnection();
      if (!connected) {
        throw new Error('Unable to connect to therapy service. Please check your connection and try again.');
      }

      let session: TherapySession;

      if (therapyType === 'individual' && selectedCharacter && therapyContext && selectedTherapist) {
        // Start individual therapy session
        session = await therapyChatService.startIndividualSession({
          character: selectedCharacter,
          therapistId: selectedTherapist.id,
          therapyContext: therapyContext,
          sessionStage: sessionStage
        });
        
        console.log('🧠 Individual therapy session started:', session.id);
      } else if (therapyType === 'group' && selectedGroupMembers.length === 3 && selectedTherapist) {
        // Start group therapy session
        session = await therapyChatService.startGroupSession({
          characters: selectedGroupMembers,
          therapistId: selectedTherapist.id,
          groupDynamics: groupDynamics,
          sessionStage: sessionStage
        });
        
        console.log('🧠 Group therapy session started:', session.id);
      } else {
        throw new Error('Invalid session configuration');
      }

      setActiveSession(session);
      setSessionMessages(session.sessionHistory);

      // Subscribe to session messages
      therapyChatService.subscribeToSession(session.id, (message: TherapyMessage) => {
        setSessionMessages(prev => [...prev, message]);
      });

    } catch (error) {
      console.error('Error starting therapy session:', error);
      alert(error instanceof Error ? error.message : 'Failed to start therapy session');
      setIsSessionActive(false);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Handle character response in therapy session
  const handleCharacterResponse = async (characterId: string, trigger?: string) => {
    if (!activeSession) return;

    try {
      setIsGeneratingResponse(true);
      
      const response = await therapyChatService.generateCharacterResponse(
        activeSession.id,
        characterId,
        trigger
      );
      
      console.log('🎭 Character response generated:', response);
      // The response will be automatically added to sessionMessages via subscription
      
    } catch (error) {
      console.error('Error generating character response:', error);
      if (error instanceof Error && error.message === 'USAGE_LIMIT_REACHED') {
        alert('AI usage limit reached. Please try again later.');
      } else {
        alert('Failed to generate character response. Please try again.');
      }
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Handle therapist intervention
  const handleTherapistIntervention = async (interventionType: 'question' | 'intervention' = 'question') => {
    if (!activeSession) return;

    try {
      setIsGeneratingResponse(true);
      
      const response = await therapyChatService.generateTherapistIntervention(
        activeSession.id,
        interventionType
      );
      
      console.log('🧠 Therapist intervention generated:', response);
      // The response will be automatically added to sessionMessages via subscription
      
    } catch (error) {
      console.error('Error generating therapist intervention:', error);
      alert('Failed to generate therapist response. Please try again.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // End therapy session
  const handleEndSession = () => {
    if (activeSession) {
      therapyChatService.endSession(activeSession.id);
      setActiveSession(null);
      setSessionMessages([]);
      setIsSessionActive(false);
      console.log('🧠 Therapy session ended');
    }
  };

  // Advance session stage
  const handleAdvanceStage = () => {
    if (activeSession) {
      const newStage = therapyChatService.advanceSessionStage(activeSession.id);
      setSessionStage(newStage);
      console.log('🧠 Session stage advanced to:', newStage);
    }
  };

  // Generate group therapy prompt
  const generateGroupTherapyPrompt = (): string => {
    if (selectedGroupMembers.length !== 3) return '';
    
    const [char1, char2, char3] = selectedGroupMembers;
    
    return `
GROUP THERAPY SESSION CONTEXT:
You are participating in a group therapy session with ${char1.name}, ${char2.name}, and ${char3.name}. This is a documentary-style reality show about legendary characters from different eras living and competing together.

CURRENT GROUP DYNAMIC:
${groupDynamics.join('\n')}

THERAPIST: ${selectedTherapist?.name || 'Unknown'}
SESSION STAGE: ${sessionStage}

BEHAVIORAL SCRIPT FOR GROUP SESSION:
1. Each character must stay true to their personality and era
2. Conflicts should emerge naturally from the established dynamics
3. Characters will resist opening up initially, creating tension
4. The therapist will work to get each character to reveal their deeper issues
5. Breakthrough moments should be dramatic and authentic to each character
6. Group members will trigger each other's defensive responses
7. Unexpected alliances and rivalries will form during the session

INDIVIDUAL CHARACTER NOTES:
- ${char1.name} (${char1.archetype}): ${getCharacterEra(char1)} background, Level ${char1.level}
- ${char2.name} (${char2.archetype}): ${getCharacterEra(char2)} background, Level ${char2.level}  
- ${char3.name} (${char3.archetype}): ${getCharacterEra(char3)} background, Level ${char3.level}

Remember: This is group therapy for entertainment value. Drama, conflict, and character growth are essential for compelling viewing.
`;
  };

  // Generate group therapist opening question
  const generateGroupTherapistQuestion = (): string => {
    if (!selectedTherapist || selectedGroupMembers.length !== 3) return '';
    
    const therapistStyle = conflictService.getTherapistStyles()[selectedTherapist.id];
    if (!therapistStyle) return 'Let\'s begin our group session.';
    
    const [char1, char2, char3] = selectedGroupMembers;
    
    // Generate opening based on therapist style
    switch (selectedTherapist.id) {
      case 'carl-jung':
        return `I sense powerful archetypal forces at play between ${char1.name}, ${char2.name}, and ${char3.name}. The collective unconscious speaks through your conflicts. Who wants to begin by sharing what brought you three together in this moment?`;
      
      case 'zxk14bw7':
        return `Fascinating. My analysis of ${groupDynamics.length} distinct interaction patterns indicates ${Math.floor(Math.random() * 85) + 15}% probability of therapeutic breakthrough. ${char1.name}, your energy signature suggests primary resistance. Explain your reluctance to engage with these entities.`;
      
      case 'seraphina':
        return `Oh my precious stars! I can feel so much beautiful, tangled energy between you three. ${char1.name}, ${char2.name}, and ${char3.name} - your hearts are all protected by different kinds of armor. Who's brave enough to show mama fairy godmother what's really hurting underneath?`;
      
      default:
        return `Welcome to group therapy. I can already sense the dynamics between you three. Let's explore what's really going on.`;
    }
  };

  const handleTherapistSelection = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    
    // Generate therapist-specific preview question
    if (therapyContext) {
      const previewQuestion = conflictService.getTherapistQuestion(therapist.id, therapyContext, 'initial');
      console.log(`${therapist.name} preview question:`, previewQuestion);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading therapy module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Brain className="text-purple-400" />
          Therapy Center
        </h1>
        <p className="text-gray-400">
          Choose your therapist and begin your journey of healing and growth
        </p>
      </div>

      {/* Therapy Type Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="text-blue-400" />
          Session Type
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setTherapyType('individual')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              therapyType === 'individual'
                ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <MessageCircle className="mx-auto mb-2" size={24} />
            <div className="font-medium">Individual Session</div>
            <div className="text-sm opacity-75">One-on-one therapy</div>
          </button>
          <button
            onClick={() => setTherapyType('group')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              therapyType === 'group'
                ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <Users className="mx-auto mb-2" size={24} />
            <div className="font-medium">Group Session</div>
            <div className="text-sm opacity-75">Team therapy</div>
          </button>
        </div>
      </div>

      {/* Character Selection (for individual sessions) */}
      {therapyType === 'individual' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User className="text-green-400" />
            Select Character
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableCharacters.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedCharacter?.id === character.id
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-white">{character.name}</div>
                <div className="text-sm text-gray-400">Lv.{character.level} {character.archetype}</div>
                <div className="text-xs text-gray-500">Bond: {character.bond_level}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group Selection (for group therapy) */}
      {therapyType === 'group' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="text-blue-400" />
            Select 3 Characters for Group Therapy
          </h2>
          <div className="mb-4">
            <div className="text-sm text-gray-400">
              Selected: {selectedGroupMembers.length}/3 characters
            </div>
            {selectedGroupMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGroupMembers.map((character) => (
                  <div
                    key={character.id}
                    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {character.name}
                    <button
                      onClick={() => handleGroupMemberToggle(character)}
                      className="text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableCharacters.map((character) => {
              const isSelected = selectedGroupMembers.some(m => m.id === character.id);
              const isDisabled = !isSelected && selectedGroupMembers.length >= 3;
              
              return (
                <button
                  key={character.id}
                  onClick={() => handleGroupMemberToggle(character)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-400 bg-blue-400/10'
                      : isDisabled
                      ? 'border-gray-600 bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-white">{character.name}</div>
                  <div className="text-sm text-gray-400">Lv.{character.level} {character.archetype}</div>
                  <div className="text-xs text-gray-500">Era: {getCharacterEra(character)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Dynamics Preview */}
      {therapyType === 'group' && selectedGroupMembers.length === 3 && groupDynamics.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="text-orange-400" />
            Group Dynamics Preview
          </h2>
          <div className="text-sm text-gray-400 mb-4">
            This trio will create these potential conflicts and dynamics:
          </div>
          <div className="space-y-3">
            {groupDynamics.map((dynamic, index) => (
              <div key={index} className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                <div className="text-orange-200 text-sm">{dynamic}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            💡 Each combination creates unique therapeutic challenges and breakthroughs!
          </div>
        </div>
      )}

      {/* Therapist Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="text-purple-400" />
          Choose Your Therapist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baseTherapists.map((therapist) => (
            <motion.div
              key={therapist.id}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTherapist?.id === therapist.id
                  ? 'border-purple-400 bg-purple-400/10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
              onClick={() => handleTherapistSelection(therapist)}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{therapist.portrait}</div>
                <div className="font-bold text-white">{therapist.name}</div>
                <div className="text-sm text-purple-400 font-medium">{therapist.title}</div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{therapist.description}</p>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Specialties:</div>
                <div className="flex flex-wrap gap-1">
                  {therapist.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-300"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <div className="text-sm font-medium text-white">Bonuses:</div>
                {therapist.bonuses.map((bonus, index) => (
                  <div key={index} className="text-xs text-green-400">
                    {bonus.description}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dynamic Context Display */}
      {therapyContext && therapyType === 'individual' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="text-yellow-400" />
            Live Therapy Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Living Situation</div>
              <div className="text-xs text-gray-300">
                {therapyContext.housingTier} ({therapyContext.currentOccupancy}/{therapyContext.roomCapacity} capacity)
              </div>
              <div className="text-xs text-gray-300">
                Roommates: {therapyContext.roommates.map(r => r.name).join(', ')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Team Performance</div>
              <div className="text-xs text-gray-300">
                League Ranking: #{therapyContext.leagueRanking}
              </div>
              <div className="text-xs text-gray-300">
                Team Chemistry: {therapyContext.teamChemistry}%
              </div>
            </div>
          </div>
          
          {activeConflicts.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-white mb-2">Active Conflicts</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeConflicts.slice(0, 4).map((conflict, index) => (
                  <div key={index} className={`p-2 rounded text-xs ${
                    conflict.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                    conflict.severity === 'high' ? 'bg-orange-900/30 text-orange-300' :
                    'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {conflict.category.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dynamicPrompts.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-white mb-2">Dynamic Prompts</div>
              <div className="space-y-1">
                {dynamicPrompts.slice(0, 3).map((prompt, index) => (
                  <div key={index} className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded">
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Session Button */}
      <div className="text-center">
        <button
          onClick={handleStartSession}
          disabled={
            !selectedTherapist || 
            (therapyType === 'individual' && !selectedCharacter) ||
            (therapyType === 'group' && selectedGroupMembers.length !== 3)
          }
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            selectedTherapist && (
              (therapyType === 'individual' && selectedCharacter) ||
              (therapyType === 'group' && selectedGroupMembers.length === 3)
            )
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {therapyType === 'individual' 
            ? 'Start Individual Therapy Session' 
            : `Start Group Therapy Session ${selectedGroupMembers.length}/3`
          }
        </button>
        
        {therapyType === 'group' && selectedGroupMembers.length < 3 && (
          <div className="mt-2 text-sm text-gray-400">
            Please select {3 - selectedGroupMembers.length} more character{3 - selectedGroupMembers.length !== 1 ? 's' : ''} to start group therapy
          </div>
        )}
      </div>

      {/* Future: Rare Therapist Acquisition */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 opacity-50">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Crown className="text-yellow-400" />
          Rare Therapists
        </h2>
        <p className="text-gray-400 text-center py-8">
          Unlock legendary therapists through card packs, tournament victories, and special events!
          <br />
          <span className="text-sm text-gray-500">Coming soon...</span>
        </p>
      </div>
    </div>
  );
};

export default TherapyModule;