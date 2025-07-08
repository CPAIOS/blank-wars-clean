import { useCallback } from 'react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseCardCollectionSystemProps {
  state: BattleStateData;
  actions: {
    setPlayerCards: (cards: TeamCharacter[]) => void;
    setSelectedTeamCards: (cards: string[]) => void;
    setPlayerCurrency: (currency: number) => void;
    setShowCardCollection: (show: boolean) => void;
  };
}

export const useCardCollectionSystem = ({ 
  state, 
  actions 
}: UseCardCollectionSystemProps) => {

  // Initialize card collection with current team characters
  const initializeCardCollection = useCallback(() => {
    const availableCards = [
      ...state.playerTeam.characters,
      ...state.opponentTeam.characters
    ];
    actions.setPlayerCards(availableCards);
  }, [state.playerTeam.characters, state.opponentTeam.characters, actions]);

  // Handle selecting a character card for team building
  const handleCardSelect = useCallback((characterId: string) => {
    if (state.selectedTeamCards.length < 3 && !state.selectedTeamCards.includes(characterId)) {
      actions.setSelectedTeamCards([...state.selectedTeamCards, characterId]);
    }
  }, [state.selectedTeamCards, actions]);

  // Handle deselecting a character card
  const handleCardDeselect = useCallback((characterId: string) => {
    actions.setSelectedTeamCards(state.selectedTeamCards.filter(id => id !== characterId));
  }, [state.selectedTeamCards, actions]);

  // Handle receiving new cards from card pack opening
  const handleCardsReceived = useCallback((newCards: TeamCharacter[]) => {
    actions.setPlayerCards([...state.playerCards, ...newCards]);
    // Grant bonus currency for new cards
    actions.setPlayerCurrency(state.playerCurrency + 100);
  }, [actions, state.playerCards, state.playerCurrency]);

  // Handle spending in-game currency
  const handleCurrencySpent = useCallback((amount: number) => {
    actions.setPlayerCurrency(Math.max(0, state.playerCurrency - amount));
  }, [actions, state.playerCurrency]);

  // Build team from selected cards (integrates with coaching system)
  const buildTeamFromCards = useCallback(() => {
    const selectedCards = state.playerCards.filter(card => 
      state.selectedTeamCards.includes(card.id)
    );
    if (selectedCards.length === 3) {
      const newTeam = {
        ...state.playerTeam,
        characters: selectedCards,
        teamChemistry: 50, // Will be recalculated
      };
      // This would need to be passed as an action or handled through parent
      console.log('Building team from cards:', newTeam);
      actions.setShowCardCollection(false);
      actions.setSelectedTeamCards([]);
      return newTeam;
    }
    return null;
  }, [state.playerCards, state.selectedTeamCards, state.playerTeam, actions]);

  // Get card collection statistics
  const getCardCollectionStats = useCallback(() => {
    const totalCards = state.playerCards.length;
    const selectedCards = state.selectedTeamCards.length;
    const isTeamComplete = selectedCards === 3;
    const availableCurrency = state.playerCurrency;

    return {
      totalCards,
      selectedCards,
      isTeamComplete,
      availableCurrency,
      canBuildTeam: isTeamComplete
    };
  }, [state.playerCards.length, state.selectedTeamCards.length, state.playerCurrency]);

  return {
    // Card selection functions
    initializeCardCollection,
    handleCardSelect,
    handleCardDeselect,
    
    // Card pack functions
    handleCardsReceived,
    handleCurrencySpent,
    
    // Team building functions
    buildTeamFromCards,
    
    // Utilities
    getCardCollectionStats,
  };
};