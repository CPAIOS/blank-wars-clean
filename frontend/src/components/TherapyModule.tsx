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
// Removed demo characters - now using database characters consistently

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
  const [isPaused, setIsPaused] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [exchangesInRound, setExchangesInRound] = useState(0);
  const conflictService = ConflictDatabaseService.getInstance();

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        // Use database characters for consistency with kitchen chat and conflict tracking
        const response = await characterAPI.getUserCharacters();
        const characters = response.characters || [];
        
        // Map database characters to therapy format
        const mappedCharacters = characters.map((char: any) => ({
          id: char.character_id, // Use base character ID from database
          name: char.name,
          archetype: char.archetype || 'warrior',
          level: char.level || 1,
          base_health: char.max_health || char.base_health,
          base_attack: char.base_attack || 50,
          experience: char.experience || 0,
          bond_level: char.bond_level || 0,
          templateId: char.character_id  // Use database character ID for conflict matching
        }));
        
        console.log('🎭 Loaded therapy characters from database:', mappedCharacters.map(c => c.name));
        setAvailableCharacters(mappedCharacters);
      } catch (error) {
        console.error('Error loading characters:', error);
        setAvailableCharacters([]);
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
          // Use templateId which matches the database character IDs
          const characterKey = (selectedCharacter as any).templateId || selectedCharacter.id;
          console.log('🔍 Loading therapy context for:', characterKey);
          
          const context = await conflictService.getTherapyContextForCharacter(characterKey);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSession) {
        therapyChatService.unsubscribeFromSession(activeSession.id);
      }
    };
  }, [activeSession]);

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

      if (therapyType === 'individual' && selectedCharacter && selectedTherapist) {
        // Start individual therapy session
        session = await therapyChatService.startIndividualSession(
          (selectedCharacter as any).templateId || selectedCharacter.id,
          selectedTherapist.id
        );
        
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
      
      console.log('📌 SESSION STARTED - Setting up auto-play');
      console.log('📌 Session history length:', session.sessionHistory.length);
      
      // Auto-start logic based on therapy type
      if (session.sessionHistory.length > 0) {
        if (therapyType === 'individual' && selectedCharacter) {
          console.log('🚀 IMMEDIATE AUTO-START: Triggering first individual patient response');
          // Individual therapy auto-start
          setTimeout(() => {
            setExchangesInRound(1);
            setIsGeneratingResponse(true);
            
            // Get the last therapist message
            const lastTherapistMessage = session.sessionHistory
              .slice()
              .reverse()
              .find(msg => msg.speakerType === 'therapist');
            
            const therapistQuestion = lastTherapistMessage?.message || 'What brings you to therapy today?';
            
            console.log('🚀 Calling therapyChatService.generatePatientResponse directly');
            therapyChatService.generatePatientResponse(
              session.id,
              selectedCharacter.id,
              therapistQuestion
            ).then((response) => {
              console.log('🚀 First individual patient response generated:', response);
              setExchangesInRound(0);
              setIsGeneratingResponse(false);
              
              // Continue automatically to next therapist question
              console.log('🚀 Continuing to next therapist question...');
              setTimeout(() => {
                setExchangesInRound(0); // Ensure therapist turn
                autoAdvanceTherapy();
              }, 2000);
            }).catch(error => {
              console.error('❌ Direct patient response failed:', error);
              setIsGeneratingResponse(false);
            });
          }, 2000);
        } else if (therapyType === 'group' && selectedGroupMembers.length === 3) {
          console.log('🚀 IMMEDIATE AUTO-START: Triggering first group patient responses');
          // Group therapy auto-start - session already has therapist opening, just get patient responses
          setTimeout(async () => {
            setExchangesInRound(1);
            setIsGeneratingResponse(true);
            
            // Get the FIRST (original) therapist message, not the duplicate
            const firstTherapistMessage = session.sessionHistory.find(msg => msg.speakerType === 'therapist');
            const therapistQuestion = firstTherapistMessage?.message || 'Welcome to group therapy. Let\'s explore what\'s happening between you three.';
            
            console.log('🚀 Starting group patient responses to ORIGINAL opening question');
            console.log('🚀 Using therapist question:', therapistQuestion.substring(0, 100) + '...');
            
            try {
              // Get all three characters to respond in sequence to the ORIGINAL opening question
              for (let i = 0; i < selectedGroupMembers.length; i++) {
                const character = selectedGroupMembers[i];
                console.log(`🎬 GROUP: Patient ${i + 1}/3 responding (${character.name})`);
                
                try {
                  await therapyChatService.generateGroupPatientResponse(
                    session.id,
                    character.id,
                    therapistQuestion
                  );
                  
                  console.log(`🎬 GROUP: Patient ${i + 1}/3 response generated (${character.name})`);
                  
                  // Small delay between responses for readability
                  if (i < selectedGroupMembers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                  }
                } catch (error) {
                  console.error(`❌ GROUP: Patient ${i + 1} failed (${character.name}):`, error);
                  // Continue with other patients even if one fails
                }
              }
              
              // All patients have responded, now pause for user to continue
              console.log('🚀 All group patients responded, pausing for user');
              setExchangesInRound(0);
              setRoundCount(prev => prev + 1);
              setIsPaused(true);
              setIsGeneratingResponse(false);
              
            } catch (error) {
              console.error('❌ GROUP AUTO-START ERROR:', error);
              setIsGeneratingResponse(false);
            }
          }, 2000);
        }
      }
      
      // Reset round counters
      setRoundCount(0);
      setExchangesInRound(0);
      setIsPaused(false);
      setIsGeneratingResponse(false);

      // Subscribe to session messages
      therapyChatService.subscribeToSession(session.id, (message: TherapyMessage) => {
        console.log('📨 New message received:', message.speakerType);
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

  // Auto-advance group therapy session with dual API
  const autoAdvanceGroupTherapy = async (therapistQuestion: string) => {
    console.log('🎬 Auto-advance GROUP therapy called:', { 
      hasSession: !!activeSession, 
      isPaused, 
      isGeneratingResponse, 
      exchangesInRound,
      groupSize: selectedGroupMembers.length
    });
    
    if (!activeSession || activeSession.type !== 'group' || isPaused || isGeneratingResponse) {
      console.log('🚫 GROUP AUTO-ADVANCE BLOCKED');
      return;
    }

    try {
      setIsGeneratingResponse(true);
      
      // Get all three characters to respond in sequence
      for (let i = 0; i < selectedGroupMembers.length; i++) {
        const character = selectedGroupMembers[i];
        console.log(`🎬 GROUP: Patient ${i + 1}/3 responding (${character.name})`);
        
        try {
          await therapyChatService.generateGroupPatientResponse(
            activeSession.id,
            character.id,
            therapistQuestion
          );
          
          console.log(`🎬 GROUP: Patient ${i + 1}/3 response generated (${character.name})`);
          
          // Small delay between responses for readability
          if (i < selectedGroupMembers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`❌ GROUP: Patient ${i + 1} failed (${character.name}):`, error);
          // Continue with other patients even if one fails
        }
      }
      
      // All patients have responded, now pause for user to continue
      setExchangesInRound(0);
      setRoundCount(prev => prev + 1);
      setIsPaused(true);
      setIsGeneratingResponse(false);
      
      console.log('🎬 GROUP ROUND COMPLETE: All 3 patients responded, paused for user');
      
    } catch (error) {
      console.error('❌ GROUP AUTO-ADVANCE ERROR:', error);
      setIsGeneratingResponse(false);
      setIsPaused(true);
    }
  };

  // Auto-advance therapy session (like confessional)
  const autoAdvanceTherapy = async () => {
    console.log('🎬 Auto-advance therapy called:', { 
      hasSession: !!activeSession, 
      isPaused, 
      isGeneratingResponse, 
      exchangesInRound,
      roundCount 
    });
    
    console.log('🎬 Current state check:', {
      hasActiveSession: !!activeSession,
      isPausedState: isPaused,
      isGeneratingState: isGeneratingResponse,
      shouldContinue: !!activeSession && !isPaused && !isGeneratingResponse
    });
    
    if (!activeSession || isPaused || isGeneratingResponse) {
      console.log('🚫 AUTO-ADVANCE BLOCKED:', {
        noSession: !activeSession,
        isPaused: isPaused,
        isGenerating: isGeneratingResponse
      });
      return;
    }

    try {
      setIsGeneratingResponse(true);

      if (activeSession.type === 'individual' && selectedCharacter) {
        // Individual therapy: therapist question → character response → therapist response (1 round = 2 exchanges)
        if (exchangesInRound === 0) {
          // Therapist asks question
          console.log('🎬 THERAPIST TURN: exchangesInRound =', exchangesInRound);
          try {
            await handleTherapistIntervention('question');
            setExchangesInRound(1);
            console.log('🎬 THERAPIST DONE: setting exchangesInRound to 1');
            
            // Force patient turn immediately with updated state
            setTimeout(() => {
              console.log('🎬 FORCING PATIENT TURN after therapist');
              handleCharacterResponse(selectedCharacter.id).then(() => {
                setExchangesInRound(0);
                setRoundCount(prev => prev + 1);
                setIsPaused(true);
                console.log('🎬 ROUND COMPLETE: paused for user');
              }).catch(error => {
                console.error('❌ PATIENT FAILED:', error);
                setIsPaused(true);
              });
            }, 2000);
          } catch (error) {
            console.error('❌ THERAPIST FAILED:', error);
            setIsPaused(true); // Stop the loop if therapist fails
          }
        } else if (exchangesInRound === 1) {
          // Initial patient response to opening question
          console.log('🎬 INITIAL PATIENT TURN: exchangesInRound =', exchangesInRound, 'roundCount =', roundCount);
          try {
            await handleCharacterResponse(selectedCharacter.id);
            
            // Immediately update state to prevent loops
            setExchangesInRound(0); // Reset for next round
            setIsGeneratingResponse(false);
            
            if (roundCount === 0) {
              // First round - continue automatically to next therapist question
              console.log('🎬 INITIAL PATIENT DONE: continuing to therapist...');
              // Force therapist turn by explicitly running with exchangesInRound = 0
              setTimeout(async () => {
                console.log('🎬 FORCING THERAPIST TURN after initial patient');
                setExchangesInRound(0);
                setIsGeneratingResponse(true);
                
                // Run therapist turn directly
                if (activeSession && selectedCharacter) {
                  try {
                    await handleTherapistIntervention('question');
                    setExchangesInRound(1);
                    console.log('🎬 THERAPIST DONE: now forcing next patient turn');
                    
                    // Then force patient turn
                    setTimeout(() => {
                      console.log('🎬 FORCING PATIENT TURN after therapist');
                      handleCharacterResponse(selectedCharacter.id).then(() => {
                        setExchangesInRound(0);
                        setRoundCount(prev => prev + 1);
                        setIsPaused(true);
                        console.log('🎬 ROUND COMPLETE: paused for user');
                      }).catch(error => {
                        console.error('❌ PATIENT FAILED:', error);
                        setIsPaused(true);
                      });
                    }, 2000);
                  } catch (error) {
                    console.error('❌ THERAPIST FAILED:', error);
                    setIsPaused(true);
                  } finally {
                    setIsGeneratingResponse(false);
                  }
                }
              }, 2000);
            } else {
              // Subsequent rounds - pause for user
              console.log('🎬 PATIENT DONE: pausing for user');
              setRoundCount(prev => prev + 1);
              setIsPaused(true);
            }
          } catch (error) {
            console.error('❌ PATIENT FAILED:', error);
            setIsPaused(true); // Stop the loop if patient fails
          }
        }
      } else if (activeSession.type === 'group' && selectedGroupMembers.length === 3) {
        // Group therapy with dual API: therapist question → all 3 patients respond → pause
        if (exchangesInRound === 0) {
          // Therapist asks question using dual API
          console.log('🎬 GROUP THERAPIST TURN: generating question');
          try {
            const therapistQuestion = await therapyChatService.generateGroupTherapistQuestion(activeSession.id);
            console.log('🎬 GROUP THERAPIST DONE: question generated');
            
            // Now get all patients to respond to this question
            setExchangesInRound(1);
            setTimeout(() => {
              console.log('🎬 GROUP: Starting patient responses to:', therapistQuestion.substring(0, 100) + '...');
              autoAdvanceGroupTherapy(therapistQuestion);
            }, 2000);
          } catch (error) {
            console.error('❌ GROUP THERAPIST FAILED:', error);
            setIsPaused(true);
          }
        }
        // Note: Patient responses are handled by autoAdvanceGroupTherapy
      }
    } catch (error) {
      console.error('Error in auto-advance therapy:', error);
      setIsPaused(true);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Continue therapy session (like confessional continue)
  const continueTherapy = () => {
    console.log('🔧 Continue button triggered (using direct advance)');
    setIsPaused(false);
    // Use the same logic as the working Force button
    autoAdvanceTherapy();
  };

  // Pause therapy session
  const pauseTherapy = () => {
    setIsPaused(true);
  };

  // Handle character response in therapy session
  const handleCharacterResponse = async (characterId: string, trigger?: string) => {
    if (!activeSession) return;

    try {
      setIsGeneratingResponse(true);
      
      // Get the last therapist question from session history
      const lastTherapistMessage = activeSession.sessionHistory
        .slice()
        .reverse()
        .find(msg => msg.speakerType === 'therapist');
      
      const therapistQuestion = lastTherapistMessage?.message || 'What brings you to therapy today?';
      
      console.log('🎭 Patient responding to therapist question:', therapistQuestion.substring(0, 50) + '...');

      // Use new dual API system - patient response only
      const response = await therapyChatService.generatePatientResponse(
        activeSession.id,
        characterId,
        therapistQuestion
      );
      
      console.log('🎭 Patient response generated:', response);
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
      
      let response: string;
      
      if (activeSession.type === 'individual') {
        // Use new dual API system for individual therapy
        response = await therapyChatService.generateTherapistQuestion(activeSession.id);
        console.log('🧠 Therapist question generated (dual API):', response);
      } else if (activeSession.type === 'group') {
        // Use new dual API system for group therapy
        response = await therapyChatService.generateGroupTherapistQuestion(activeSession.id);
        console.log('🧠 Group therapist question generated (dual API):', response);
      } else {
        // Fallback to old method
        response = await therapyChatService.generateTherapistIntervention(
          activeSession.id,
          interventionType
        );
        console.log('🧠 Therapist intervention generated (fallback API):', response);
      }
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

      {/* Live Therapy Session Interface */}
      {isSessionActive && activeSession && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="text-purple-400" />
              Live Therapy Session - {activeSession.type === 'individual' ? 'Individual' : 'Group'}
            </h2>
            <div className="flex items-center gap-4">
              {/* Live/Paused Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-purple-300 font-semibold">
                  {isPaused ? 'PAUSED' : 'LIVE SESSION'}
                </span>
                <span className="text-gray-500 text-sm">
                  (Round {roundCount})
                </span>
              </div>
              
              
              <button
                onClick={handleEndSession}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Session Messages */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6 min-h-96 max-h-[600px] overflow-y-auto">
            <div className="space-y-4">
              {sessionMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.speakerType === 'therapist'
                      ? 'bg-purple-900/30 border border-purple-500/30'
                      : 'bg-blue-900/30 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-lg font-bold ${
                      message.speakerType === 'therapist' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {message.speakerType === 'therapist' 
                        ? selectedTherapist?.name 
                        : activeSession.type === 'individual' 
                          ? selectedCharacter?.name
                          : selectedGroupMembers.find(c => c.id === message.speakerId)?.name
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-white text-lg leading-relaxed">{message.message}</div>
                </div>
              ))}
              
              {isGeneratingResponse && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    <span className="text-sm">Generating response...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue/Pause Controls */}
          <div className="flex justify-center gap-3 mt-4 mb-4">
            <button
              onClick={async () => {
                console.log('🔧 Continue button clicked');
                setIsPaused(false);
                
                // Handle group therapy directly to avoid closure issues
                if (activeSession?.type === 'group' && selectedGroupMembers.length === 3) {
                  console.log('🔧 Continue: Group therapy direct handling');
                  setIsGeneratingResponse(true);
                  
                  try {
                    // Step 1: Generate therapist question
                    console.log('🔧 Continue: Generating group therapist question');
                    const therapistQuestion = await therapyChatService.generateGroupTherapistQuestion(activeSession.id);
                    console.log('🔧 Continue: Therapist question generated:', therapistQuestion.substring(0, 100) + '...');
                    
                    // Small delay to let the therapist question settle
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Step 2: Get all patients to respond to the NEW question
                    for (let i = 0; i < selectedGroupMembers.length; i++) {
                      const character = selectedGroupMembers[i];
                      console.log(`🔧 Continue: Patient ${i + 1}/3 responding to NEW question (${character.name})`);
                      
                      try {
                        await therapyChatService.generateGroupPatientResponse(
                          activeSession.id,
                          character.id,
                          therapistQuestion
                        );
                        console.log(`🔧 Continue: Patient ${i + 1}/3 response generated (${character.name})`);
                        
                        // Small delay between responses
                        if (i < selectedGroupMembers.length - 1) {
                          await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                      } catch (error) {
                        console.error(`❌ Continue: Patient ${i + 1} failed (${character.name}):`, error);
                      }
                    }
                    
                    // Step 3: Pause for next continue
                    setRoundCount(prev => prev + 1);
                    setIsPaused(true);
                    console.log('🔧 Continue: Group round complete, paused for user');
                    
                  } catch (error) {
                    console.error('❌ Continue: Group therapy error:', error);
                    setIsPaused(true);
                  } finally {
                    setIsGeneratingResponse(false);
                  }
                } else {
                  // Individual therapy or fallback
                  autoAdvanceTherapy();
                }
              }}
              disabled={isGeneratingResponse}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
            
            <button
              onClick={() => {
                console.log('⏸️ Pause button clicked');
                setIsPaused(true);
              }}
              disabled={isGeneratingResponse}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Pause
            </button>
          </div>

          {/* Session Status */}
          <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
            <div className="text-center">
              {isPaused ? (
                <span className="text-yellow-400">
                  ⏸️ Session paused - Click "Continue" below to watch the next round of therapy
                </span>
              ) : isGeneratingResponse ? (
                <span className="text-blue-400">
                  🎬 Therapy session in progress... {activeSession.type === 'individual' ? 'Character and therapist' : 'Characters and therapist'} are working through their issues
                </span>
              ) : (
                <span className="text-green-400">
                  ✨ Ready for next round - Click "Continue" below to advance the therapy session
                </span>
              )}
            </div>
            {activeSession.type === 'group' && (
              <div className="text-center mt-2 text-sm text-gray-400">
                Next speakers: {selectedGroupMembers.map(c => c.name).join(' → ')} → Therapist
              </div>
            )}
            
          </div>

          {/* Session Info */}
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
            <div className="text-xs text-gray-400">
              Session ID: {activeSession.id} | Started: {new Date(activeSession.startTime).toLocaleString()}
              {activeSession.type === 'individual' && therapyContext && (
                <span> | Conflicts: {activeConflicts.length} | Team Chemistry: {therapyContext.teamChemistry}%</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Start Session Button */}
      {!isSessionActive && (
        <div className="text-center">
          <button
            onClick={handleStartSession}
            disabled={
              isGeneratingResponse ||
              !selectedTherapist || 
              (therapyType === 'individual' && !selectedCharacter) ||
              (therapyType === 'group' && selectedGroupMembers.length !== 3)
            }
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedTherapist && (
                (therapyType === 'individual' && selectedCharacter) ||
                (therapyType === 'group' && selectedGroupMembers.length === 3)
              ) && !isGeneratingResponse
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGeneratingResponse ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting Session...
              </div>
            ) : (
              <>
                {therapyType === 'individual' 
                  ? 'Start Individual Therapy Session' 
                  : `Start Group Therapy Session ${selectedGroupMembers.length}/3`
                }
              </>
            )}
          </button>
        
          {therapyType === 'group' && selectedGroupMembers.length < 3 && (
            <div className="mt-2 text-sm text-gray-400">
              Please select {3 - selectedGroupMembers.length} more character{3 - selectedGroupMembers.length !== 1 ? 's' : ''} to start group therapy
            </div>
          )}
        </div>
      )}

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