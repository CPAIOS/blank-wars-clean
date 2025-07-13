import { useCallback, useEffect } from 'react';
import { CoachingEngine, CoachingSession } from '@/data/coachingSystem';
import { TeamCharacter, Team } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseCoachingSystemProps {
  state: BattleStateData;
  actions: {
    setActiveCoachingSession: (session: CoachingSession | null) => void;
    setShowCoachingModal: (show: boolean) => void;
    setSelectedCharacterForCoaching: (character: TeamCharacter | null) => void;
    setCoachingMessages: (messages: string[]) => void;
    setCharacterResponse: (response: string) => void;
    setShowDisagreement: (show: boolean) => void;
    setSelectedStrategies: (strategies: any) => void;
    setPendingStrategy: (strategy: any) => void;
    setCharacterStrategies: (strategies: Map<string, any>) => void;
    setPlayerTeam: (team: Team | ((prev: Team) => Team)) => void;
    setPhase?: (phase: string) => void;
    setCurrentAnnouncement?: (announcement: string) => void;
    startStrategySelection?: () => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  speak: (text: string) => void;
}

export const useCoachingSystem = ({ 
  state, 
  actions, 
  timeoutManager, 
  speak 
}: UseCoachingSystemProps) => {
  const { setTimeout: safeSetTimeout } = timeoutManager;

  // Start a coaching session with a character
  const startCoachingSession = useCallback(async (character: TeamCharacter, sessionType: 'strategy' | 'motivation' | 'skill_development') => {
    try {
      const session = await CoachingEngine.startSession({
        character,
        sessionType,
        battleContext: {
          phase: state.phase,
          currentRound: state.currentRound,
          playerMorale: state.playerMorale,
          teamChemistry: state.playerTeam.teamChemistry || 0,
          recentPerformance: calculateRecentPerformance(character)
        }
      });

      actions.setActiveCoachingSession(session);
      actions.setSelectedCharacterForCoaching(character);
      actions.setCoachingMessages(session.messages || []);
      actions.setShowCoachingModal(true);

      // Announce coaching session start
      const announcement = `Starting ${sessionType} session with ${character.name}`;
      speak(announcement);

    } catch (error) {
      console.error('Error starting coaching session:', error);
    }
  }, [state.phase, state.currentRound, state.playerMorale, state.playerTeam.teamChemistry]);

  // Calculate recent performance for coaching context
  const calculateRecentPerformance = useCallback((character: TeamCharacter) => {
    // This would typically analyze recent battle performance
    // For now, return basic performance metrics
    return {
      winRate: 0.7, // 70% win rate
      averageDamage: character.attack * 1.2,
      healthRetention: character.health / character.maxHealth,
      teamworkScore: 0.8
    };
  }, []);

  // Send message in coaching session
  const sendCoachingMessage = useCallback(async (message: string) => {
    if (!state.activeCoachingSession || !state.selectedCharacterForCoaching) return;

    try {
      // Add coach message to session
      const updatedMessages = [...state.coachingMessages, `Coach: ${message}`];
      actions.setCoachingMessages(updatedMessages);

      // Generate character response
      const response = await CoachingEngine.generateCharacterResponse(
        state.selectedCharacterForCoaching,
        message,
        {
          sessionHistory: state.coachingMessages,
          battleContext: {
            phase: state.phase,
            currentRound: state.currentRound,
            playerMorale: state.playerMorale
          }
        }
      );

      // Add character response
      const responseMessage = `${state.selectedCharacterForCoaching.name}: ${response.message}`;
      actions.setCoachingMessages([...updatedMessages, responseMessage]);
      actions.setCharacterResponse(response.message);

      // Handle strategy suggestions if any
      if (response.strategySuggestion) {
        actions.setPendingStrategy({
          characterId: state.selectedCharacterForCoaching.id,
          strategyType: response.strategySuggestion.type,
          strategy: response.strategySuggestion.strategy
        });
      }

      // Handle disagreement if character pushes back
      if (response.disagreementLevel > 0.7) {
        actions.setShowDisagreement(true);
        safeSetTimeout(() => actions.setShowDisagreement(false), 5000);
      }

    } catch (error) {
      console.error('Error sending coaching message:', error);
    }
  }, [state.activeCoachingSession, state.selectedCharacterForCoaching, state.coachingMessages, state.phase, state.currentRound, state.playerMorale]);

  // Apply strategy from coaching session
  const applyCoachingStrategy = useCallback(async (strategy: any) => {
    if (!strategy || !state.selectedCharacterForCoaching) return;

    try {
      const characterId = state.selectedCharacterForCoaching.id;
      const updatedStrategies = new Map(state.characterStrategies);
      
      const currentStrategy = updatedStrategies.get(characterId) || {
        general: '',
        specific: '',
        lastUpdated: Date.now()
      };

      if (strategy.strategyType === 'general') {
        currentStrategy.general = strategy.strategy;
      } else {
        currentStrategy.specific = strategy.strategy;
      }
      currentStrategy.lastUpdated = Date.now();

      updatedStrategies.set(characterId, currentStrategy);
      actions.setCharacterStrategies(updatedStrategies);

      // Update selected strategies for immediate use
      const updatedSelectedStrategies = { ...state.selectedStrategies };
      if (characterId === state.player1.id) {
        updatedSelectedStrategies.player1[strategy.strategyType] = strategy.strategy;
      } else if (characterId === state.player2.id) {
        updatedSelectedStrategies.player2[strategy.strategyType] = strategy.strategy;
      }
      actions.setSelectedStrategies(updatedSelectedStrategies);

      // Clear pending strategy
      actions.setPendingStrategy(null);

      const message = `Applied ${strategy.strategyType} strategy for ${state.selectedCharacterForCoaching.name}`;
      speak(message);

    } catch (error) {
      console.error('Error applying coaching strategy:', error);
    }
  }, [state.selectedCharacterForCoaching, state.characterStrategies, state.selectedStrategies, state.player1.id, state.player2.id]);

  // End coaching session
  const endCoachingSession = useCallback(async () => {
    if (!state.activeCoachingSession) return;

    try {
      // Calculate session effectiveness
      const effectiveness = CoachingEngine.calculateSessionEffectiveness(
        state.activeCoachingSession,
        state.coachingMessages.length,
        state.characterResponse ? 1 : 0 // Response quality metric
      );

      // Apply coaching benefits to character
      if (state.selectedCharacterForCoaching && effectiveness > 0.5) {
        await applyCoachingBenefits(state.selectedCharacterForCoaching, effectiveness);
      }

      // Clean up session state
      actions.setActiveCoachingSession(null);
      actions.setSelectedCharacterForCoaching(null);
      actions.setCoachingMessages([]);
      actions.setCharacterResponse('');
      actions.setShowCoachingModal(false);
      actions.setShowDisagreement(false);
      actions.setPendingStrategy(null);

      const message = `Coaching session completed. Effectiveness: ${Math.round(effectiveness * 100)}%`;
      speak(message);

    } catch (error) {
      console.error('Error ending coaching session:', error);
    }
  }, [state.activeCoachingSession, state.coachingMessages, state.characterResponse, state.selectedCharacterForCoaching]);

  // Apply coaching benefits to character
  const applyCoachingBenefits = useCallback(async (character: TeamCharacter, effectiveness: number) => {
    // This would modify character stats based on coaching effectiveness
    // For now, we'll just calculate what the benefits would be
    const benefits = {
      moraleBoost: Math.round(effectiveness * 20),
      focusImprovement: effectiveness * 0.1,
      teamworkBonus: effectiveness * 0.05
    };

    console.log(`Coaching benefits for ${character.name}:`, benefits);
    
    // In a full implementation, you would apply these benefits to the character
    // and update the team state accordingly
  }, []);

  // Quick coaching actions
  const provideMotivation = useCallback(async (character: TeamCharacter) => {
    const motivationalMessages = [
      "You've got this! Trust your training!",
      "Remember why you're fighting - for the team!",
      "Focus on your strengths and stay confident!",
      "One round at a time. You're doing great!",
      "Your teammates believe in you!"
    ];
    
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    await startCoachingSession(character, 'motivation');
    await safeSetTimeout(() => sendCoachingMessage(message), 1000);
  }, [startCoachingSession, sendCoachingMessage]);

  const suggestStrategy = useCallback(async (character: TeamCharacter, strategyType: 'aggressive' | 'defensive' | 'balanced') => {
    const strategies = {
      aggressive: "Focus on high-damage attacks and pressure your opponent early",
      defensive: "Prioritize blocking and counterattacks, wait for openings",
      balanced: "Mix offense and defense, adapt to your opponent's style"
    };

    await startCoachingSession(character, 'strategy');
    await safeSetTimeout(() => sendCoachingMessage(`I suggest a ${strategyType} approach: ${strategies[strategyType]}`), 1000);
  }, [startCoachingSession, sendCoachingMessage]);

  // Extracted functions from component
  const conductIndividualCoaching = useCallback((character: TeamCharacter) => {
    actions.setSelectedCharacterForCoaching(character);
    actions.setShowCoachingModal(true);
  }, [actions]);

  const executeCoachingSession = useCallback((focus: 'performance' | 'mental_health' | 'team_relations' | 'strategy') => {
    if (!state.selectedCharacterForCoaching) return;

    const session = CoachingEngine.conductIndividualCoaching(
      state.selectedCharacterForCoaching,
      state.playerTeam,
      focus,
      75 // Coach skill level
    );

    actions.setActiveCoachingSession(session);
    
    // Apply the coaching effects
    actions.setPlayerTeam(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === state.selectedCharacterForCoaching!.id
          ? {
              ...char,
              psychStats: {
                ...char.psychStats,
                mentalHealth: Math.max(0, Math.min(100, char.psychStats.mentalHealth + session.outcome.mentalHealthChange)),
                training: Math.max(0, Math.min(100, char.psychStats.training + session.outcome.trainingChange)),
                teamPlayer: Math.max(0, Math.min(100, char.psychStats.teamPlayer + session.outcome.teamPlayerChange)),
                ego: Math.max(0, Math.min(100, char.psychStats.ego + session.outcome.egoChange)),
                communication: Math.max(0, Math.min(100, char.psychStats.communication + session.outcome.communicationChange))
              }
            }
          : char
      )
    }));

    actions.setCoachingMessages(prev => [...prev, 
      `Coaching ${state.selectedCharacterForCoaching!.name} on ${focus}:`,
      `${state.selectedCharacterForCoaching!.name}: ${session.outcome.characterResponse}`,
      `Coach Notes: ${session.outcome.coachNotes}`
    ]);

    actions.setShowCoachingModal(false);
  }, [state.selectedCharacterForCoaching, state.playerTeam, actions]);

  // Strategy Management Functions
  const handleStrategyRecommendation = useCallback(async (type: 'attack' | 'defense' | 'special', strategy: string) => {
    // Coach recommends a strategy
    actions.setCoachingMessages(prev => [...prev, `Coach: I recommend ${strategy} for ${type}!`]);
    actions.setPendingStrategy({ type, strategy });
    
    // Character may disagree based on training level
    const obedienceRoll = Math.random() * 100;
    const disagreementChance = 100 - (state.player1?.trainingLevel || 50);
    
    if (obedienceRoll < disagreementChance) {
      // Character disagrees
      actions.setShowDisagreement(true);
      const response = await getCharacterOpinion(type, strategy);
      actions.setCharacterResponse(response);
      actions.setCoachingMessages(prev => [...prev, `${state.player1?.name}: ${response}`]);
    } else {
      // Character agrees
      actions.setSelectedStrategies(prev => ({ ...prev, [type]: strategy }));
      actions.setCoachingMessages(prev => [...prev, `${state.player1?.name}: Understood, coach!`]);
      actions.setPendingStrategy(null);
    }
  }, [state.player1, actions]);

  const getCharacterOpinion = useCallback(async (type: string, strategy: string): Promise<string> => {
    // Generate fallback response based on character personality
    const fallbackResponses = [
      `I think ${strategy} could work, but I prefer my own approach.`,
      `${strategy} for ${type}? I've got a better idea, coach.`,
      `Trust me coach, I know what I'm doing better than that ${strategy} plan.`,
      `I'll consider ${strategy}, but I might improvise based on what I see.`,
      `That ${strategy} strategy might work, but I'm feeling something different.`
    ];
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        timeoutManager.setTimeout(() => reject(new Error('API timeout')), 2000)
      );
        
      const response = await Promise.race([
        fetch('http://localhost:3006/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: state.player1?.name,
            message: `Coach wants me to use ${strategy} for ${type}. What do you think?`,
            battleContext: {
              round: state.currentRound,
              playerHealth: Math.round(((state.player1?.currentHp || 0) / (state.player1?.maxHp || 1)) * 100),
              enemyHealth: Math.round(((state.player2?.currentHp || 0) / (state.player2?.maxHp || 1)) * 100)
            }
          })
        }),
        timeoutPromise
      ]);

      if (response && response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.warn('Character opinion API not available, using fallback');
    }
    
    return fallback;
  }, [state.player1, state.player2, state.currentRound, timeoutManager]);

  const insistOnStrategy = useCallback(() => {
    if (!state.pendingStrategy) return;
    
    // Coach insists - another training check
    const insistRoll = Math.random() * 100;
    const coachingBonus = 20; // Insisting gives a bonus to adherence
    const adherenceBonus = 10; // Base adherence bonus
    
    if (insistRoll < (state.player1?.trainingLevel || 50) + adherenceBonus) {
      actions.setCoachingMessages(prev => [...prev, 
        'Coach: I insist! Trust me on this!',
        `${state.player1?.name}: Fine... I'll follow your lead, coach.`
      ]);
      actions.setSelectedStrategies(prev => ({ 
        ...prev, 
        [state.pendingStrategy!.type]: state.pendingStrategy!.strategy 
      }));
      actions.setShowDisagreement(false);
      actions.setPendingStrategy(null);
    } else {
      // Character still refuses
      actions.setCoachingMessages(prev => [...prev, 
        'Coach: You must listen to me!',
        `${state.player1?.name}: No! I know what I'm doing!`
      ]);
      checkForBerserk();
    }
  }, [state.pendingStrategy, state.player1, actions]);

  const checkForBerserk = useCallback(() => {
    // Small chance of going berserk when refusing orders
    const berserkChance = (state.player1?.trainingLevel || 50) < 50 ? 10 : 2;
    const berserkRoll = Math.random() * 100;
    
    if (berserkRoll < berserkChance) {
      actions.setCoachingMessages(prev => [...prev, 
        `⚠️ ${state.player1?.name} has gone BERSERK! They're fighting on pure instinct!`
      ]);
      // Note: status effects modification would need to be handled in the component
      speak(`${state.player1?.name} has entered a berserk rage!`);
    }
  }, [state.player1, actions, speak]);

  const handleCharacterStrategyChange = useCallback((characterId: string, category: 'attack' | 'defense' | 'special', strategy: string) => {
    const newMap = new Map(state.characterStrategies);
    const currentStrategy = newMap.get(characterId) || {
      characterId,
      attack: null,
      defense: null,
      special: null,
      isComplete: false
    };
    
    const updatedStrategy = {
      ...currentStrategy,
      [category]: strategy
    };
    
    // Check if all categories are selected
    updatedStrategy.isComplete = !!(updatedStrategy.attack && updatedStrategy.defense && updatedStrategy.special);
    
    newMap.set(characterId, updatedStrategy);
    actions.setCharacterStrategies(newMap);
  }, [actions, state.characterStrategies]);

  const initializeCharacterStrategies = useCallback(() => {
    const newMap = new Map<string, any>();
    state.playerTeam.characters.forEach(character => {
      newMap.set(character.id, {
        characterId: character.id,
        attack: null,
        defense: null,
        special: null,
        isComplete: false
      });
    });
    actions.setCharacterStrategies(newMap);
  }, [state.playerTeam.characters, actions]);

  const areAllCharacterStrategiesComplete = useCallback(() => {
    return Array.from(state.characterStrategies.values()).every(strategy => strategy.isComplete);
  }, [state.characterStrategies]);

  const handleAllCharacterStrategiesComplete = useCallback(() => {
    if (areAllCharacterStrategiesComplete()) {
      // Timer management would need to be handled in the component or passed as an action
      // actions.setTimer(null);
      // actions.setIsTimerActive(false);
      // actions.handleTimerExpired();
      console.log('All character strategies complete');
    }
  }, [areAllCharacterStrategiesComplete]);

  // Team Chemistry & Communication Functions
  const handleTeamChatMessage = useCallback((message: string) => {
    // Add coach message to team chat log
    actions.setCoachingMessages(prev => [...prev, `Coach: ${message}`]);
    
    // Could trigger team chemistry changes based on message tone
    // TODO: Analyze message sentiment and adjust team morale
  }, [actions]);

  const conductTeamHuddle = useCallback(() => {
    // Set phase and announcement
    if (actions.setPhase) actions.setPhase('pre_battle_huddle');
    if (actions.setCurrentAnnouncement) {
      actions.setCurrentAnnouncement('The teams gather for their pre-battle huddles! Team chemistry and psychology will be tested!');
    }
    
    // Show team chemistry and psychology info
    const huddleMessages = [
      `Team ${state.playerTeam.name} - Coach ${state.playerTeam.coachName} is leading the huddle.`, 
      `Current Team Chemistry: ${Math.round(state.playerTeam.teamChemistry * 10) / 10}% | Team Morale: ${state.playerMorale}%`,
      `Your starting lineup: ${state.playerTeam.characters.map(char => char.name).join(', ')}.`,
      `Review their strengths and weaknesses before battle.`
    ];

    const delay = 2000;
    huddleMessages.forEach((msg, index) => {
      const capturedMsg = msg;
      timeoutManager.setTimeout(() => {
        if (actions.setCurrentAnnouncement) actions.setCurrentAnnouncement(capturedMsg);
        speak(capturedMsg);
      }, delay * (index + 1));
    });

    const totalDelay = delay * huddleMessages.length + 2000;
    timeoutManager.setTimeout(() => {
      // Start strategy selection after huddle
      if (actions.startStrategySelection) actions.startStrategySelection();
    }, totalDelay);
  }, [state.playerTeam, state.playerMorale, actions, timeoutManager, speak]);

  const buildTeamFromCards = useCallback((playerCards: any[], selectedTeamCards: string[], setShowCardCollection: (show: boolean) => void, setSelectedTeamCards: (cards: string[]) => void) => {
    const selectedCards = playerCards.filter(card => selectedTeamCards.includes(card.id));
    if (selectedCards.length === 3) {
      const newTeam = {
        ...state.playerTeam,
        characters: selectedCards,
        teamChemistry: 50, // Will be recalculated
      };
      actions.setPlayerTeam(newTeam);
      setShowCardCollection(false);
      setSelectedTeamCards([]);
    }
  }, [state.playerTeam, actions]);

  // Get coaching statistics
  const getCoachingStats = useCallback(() => {
    const hasActiveSession = state.activeCoachingSession !== null;
    const messageCount = state.coachingMessages.length;
    const characterResponsiveness = state.characterResponse ? 1 : 0;
    
    return {
      hasActiveSession,
      messageCount,
      characterResponsiveness,
      selectedCharacter: state.selectedCharacterForCoaching?.name || 'None',
      hasPendingStrategy: state.pendingStrategy !== null,
      showingDisagreement: state.showDisagreement
    };
  }, [state.activeCoachingSession, state.coachingMessages, state.characterResponse, state.selectedCharacterForCoaching, state.pendingStrategy, state.showDisagreement]);

  return {
    // Core coaching functions
    startCoachingSession,
    sendCoachingMessage,
    applyCoachingStrategy,
    endCoachingSession,
    
    // Quick actions
    provideMotivation,
    suggestStrategy,
    
    // Extracted component functions
    conductIndividualCoaching,
    executeCoachingSession,
    
    // Strategy management functions
    handleStrategyRecommendation,
    getCharacterOpinion,
    insistOnStrategy,
    checkForBerserk,
    handleCharacterStrategyChange,
    initializeCharacterStrategies,
    areAllCharacterStrategiesComplete,
    handleAllCharacterStrategiesComplete,
    
    // Team chemistry & communication functions
    handleTeamChatMessage,
    conductTeamHuddle,
    buildTeamFromCards,
    
    // Utilities
    getCoachingStats,
    
    // Computed values
    isCoachingActive: state.activeCoachingSession !== null,
    canSendCoachingMessage: state.activeCoachingSession !== null,
    hasSelectedCharacter: state.selectedCharacterForCoaching !== null,
    coachingMessages: state.coachingMessages,
    availableCharacters: state.playerTeam.characters,
    pendingStrategy: state.pendingStrategy,
    showingDisagreement: state.showDisagreement
  };
};