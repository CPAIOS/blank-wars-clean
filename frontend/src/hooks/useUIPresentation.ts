import { useCallback } from 'react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseUIPresentationProps {
  state: BattleStateData;
  actions: {
    setCurrentAnnouncement: (announcement: string) => void;
    setIsCharacterTyping: (typing: boolean) => void;
    setSelectedChatCharacter: (character: TeamCharacter | null) => void;
    setShowRewards: (show: boolean) => void;
    setShowSkillProgression: (show: boolean) => void;
    setShowAudioSettings: (show: boolean) => void;
    setShowCardCollection: (show: boolean) => void;
    setShowCardPacks: (show: boolean) => void;
    setShowCoachingModal: (show: boolean) => void;
    setShowMatchmaking: (show: boolean) => void;
    setTimer: (time: number | null) => void;
    setIsTimerActive: (active: boolean) => void;
    setBattleCries: (cries: { player1: string; player2: string }) => void;
    setPhase: (phase: string) => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  speak: (text: string) => void;
}

export const useUIPresentation = ({
  state,
  actions,
  timeoutManager,
  speak
}: UseUIPresentationProps) => {

  // Generic message announcer with type handling
  const announceMessage = useCallback(async (message: string, type: string = 'general') => {
    actions.setCurrentAnnouncement(message);

    // Handle different message types with appropriate delays and effects
    switch (type) {
      case 'battle-start':
        speak(`${message} Let the battle begin!`);
        break;
      case 'round-start':
        speak(`Round ${state.currentRound}: ${message}`);
        break;
      case 'victory':
        speak(`Victory! ${message}`);
        actions.setBattleCries({ player1: '🎉 VICTORY! 🎉', player2: 'Well fought!' });
        break;
      case 'defeat':
        speak(`Defeat... ${message}`);
        actions.setBattleCries({ player1: '😔 Defeat...', player2: 'Better luck next time' });
        break;
      case 'phase-transition':
        speak(message);
        break;
      case 'strategy':
        speak(`Strategy time: ${message}`);
        break;
      case 'battle-cry':
        speak(message);
        actions.setBattleCries({ player1: message, player2: '' });
        break;
      case 'special-event':
        speak(`Special event: ${message}`);
        break;
      default:
        speak(message);
    }
  }, [actions, speak, state.currentRound]);

  // Handle character selection for chat with visual feedback
  const handleSelectChatCharacter = useCallback((character: TeamCharacter) => {
    // Show typing indicator
    actions.setIsCharacterTyping(true);

    // Set selected character
    actions.setSelectedChatCharacter(character);

    // Clear typing indicator after a short delay
    timeoutManager.setTimeout(() => {
      actions.setIsCharacterTyping(false);
    }, 2000);
  }, [actions, timeoutManager]);

  // Get current player fighter for display
  const getCurrentPlayerFighter = useCallback((): TeamCharacter | null => {
    return state.player1 || (state.playerTeam.characters.length > 0 ? state.playerTeam.characters[0] : null);
  }, [state.player1, state.playerTeam.characters]);

  // Get current opponent fighter for display
  const getCurrentOpponentFighter = useCallback((): TeamCharacter | null => {
    return state.player2 || (state.opponentTeam.characters.length > 0 ? state.opponentTeam.characters[0] : null);
  }, [state.player2, state.opponentTeam.characters]);

  // Calculate team power for display purposes
  const calculateTeamPower = useCallback((teamCharacters: TeamCharacter[]): number => {
    return teamCharacters.reduce((total, char) => {
      return total + char.level * 10 + char.traditionalStats.strength + char.traditionalStats.vitality;
    }, 0);
  }, []);

  // Handle timer expiration with visual feedback
  const handleTimerExpired = useCallback(() => {
    if (state.phase === 'strategy_selection') {
      // Auto-proceed when strategy timer expires
      actions.setTimer(null);
      actions.setIsTimerActive(false);

      // Announce time's up
      announceMessage('Time\'s up! Proceeding with current strategies.', 'phase-transition');

      // Move to next phase after announcement
      timeoutManager.setTimeout(() => {
        actions.setPhase('pre_battle_huddle');
      }, 2000);
    } else if (state.phase === 'character_strategy_selection') {
      // Handle character strategy timeout
      actions.setTimer(null);
      actions.setIsTimerActive(false);

      announceMessage('Strategy selection time expired! Using default strategies.', 'phase-transition');

      timeoutManager.setTimeout(() => {
        actions.setPhase('pre_battle_huddle');
      }, 2000);
    }
  }, [state.phase, actions, announceMessage, timeoutManager]);

  // Modal management helpers
  const showModal = useCallback((modalType: string) => {
    switch (modalType) {
      case 'rewards':
        actions.setShowRewards(true);
        break;
      case 'skillProgression':
        actions.setShowSkillProgression(true);
        break;
      case 'audioSettings':
        actions.setShowAudioSettings(true);
        break;
      case 'cardCollection':
        actions.setShowCardCollection(true);
        break;
      case 'cardPacks':
        actions.setShowCardPacks(true);
        break;
      case 'coaching':
        actions.setShowCoachingModal(true);
        break;
      case 'matchmaking':
        actions.setShowMatchmaking(true);
        break;
    }
  }, [actions]);

  const hideModal = useCallback((modalType: string) => {
    switch (modalType) {
      case 'rewards':
        actions.setShowRewards(false);
        break;
      case 'skillProgression':
        actions.setShowSkillProgression(false);
        break;
      case 'audioSettings':
        actions.setShowAudioSettings(false);
        break;
      case 'cardCollection':
        actions.setShowCardCollection(false);
        break;
      case 'cardPacks':
        actions.setShowCardPacks(false);
        break;
      case 'coaching':
        actions.setShowCoachingModal(false);
        break;
      case 'matchmaking':
        actions.setShowMatchmaking(false);
        break;
    }
  }, [actions]);

  // Timer management functions
  const startTimer = useCallback((duration: number) => {
    actions.setTimer(duration);
    actions.setIsTimerActive(true);
  }, [actions]);

  const stopTimer = useCallback(() => {
    actions.setTimer(null);
    actions.setIsTimerActive(false);
  }, [actions]);

  // Visual feedback helpers
  const showBattleCries = useCallback((cries: string[]) => {
    actions.setBattleCries({ player1: cries[0] || '', player2: cries[1] || '' });

    // Clear battle cries after display time
    timeoutManager.setTimeout(() => {
      actions.setBattleCries({ player1: '', player2: '' });
    }, 5000);
  }, [actions, timeoutManager]);

  // Phase transition with announcement
  const transitionToPhase = useCallback((newPhase: string, announcement?: string) => {
    actions.setPhase(newPhase);

    if (announcement) {
      announceMessage(announcement, 'phase-transition');
    }
  }, [actions, announceMessage]);

  // UI state getters for display calculations
  const getUIDisplayStats = useCallback(() => {
    const playerFighter = getCurrentPlayerFighter();
    const opponentFighter = getCurrentOpponentFighter();
    const playerTeamPower = calculateTeamPower(state.playerTeam.characters);
    const opponentTeamPower = calculateTeamPower(state.opponentTeam.characters);

    return {
      playerFighter,
      opponentFighter,
      playerTeamPower,
      opponentTeamPower,
      hasActiveTimer: state.isTimerActive,
      currentPhase: state.phase,
      isTyping: state.isCharacterTyping
    };
  }, [
    getCurrentPlayerFighter,
    getCurrentOpponentFighter,
    calculateTeamPower,
    state.playerTeam.characters,
    state.opponentTeam.characters,
    state.isTimerActive,
    state.phase,
    state.isCharacterTyping
  ]);

  return {
    // Announcement functions
    announceMessage,

    // Character display functions
    handleSelectChatCharacter,
    getCurrentPlayerFighter,
    getCurrentOpponentFighter,
    calculateTeamPower,

    // Timer management
    handleTimerExpired,
    startTimer,
    stopTimer,

    // Modal management
    showModal,
    hideModal,

    // Visual effects
    showBattleCries,
    transitionToPhase,

    // UI state utilities
    getUIDisplayStats,
  };
};
