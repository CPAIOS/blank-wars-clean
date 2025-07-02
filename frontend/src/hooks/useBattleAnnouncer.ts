// Battle Announcer Hook
// Manages battle announcements with voice synthesis and timing

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioService, VoiceProfile } from '@/services/audioService';

export interface AnnouncementConfig {
  text: string;
  type: 'intro' | 'round' | 'action' | 'victory' | 'defeat';
  delay?: number; // milliseconds to wait before speaking
  priority?: 'low' | 'normal' | 'high'; // high priority interrupts others
}

export interface BattleAnnouncerState {
  isAnnouncerSpeaking: boolean;
  currentAnnouncement: string;
  announcementQueue: AnnouncementConfig[];
  isEnabled: boolean;
  selectedVoice: VoiceProfile | null;
  availableVoices: VoiceProfile[];
}

export function useBattleAnnouncer() {
  const [state, setState] = useState<BattleAnnouncerState>({
    isAnnouncerSpeaking: false,
    currentAnnouncement: '',
    announcementQueue: [],
    isEnabled: true,
    selectedVoice: null,
    availableVoices: []
  });

  const processingQueue = useRef(false);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voices on mount
  useEffect(() => {
    const initializeVoices = async () => {
      await audioService.waitForInitialization();
      const voices = audioService.getAvailableVoices();
      
      // Find best announcer voice (prefer male, heroic/dramatic voices)
      const announcerVoice = voices.find(v => 
        v.gender === 'male' && (v.personality === 'heroic' || v.personality === 'wise')
      ) || voices.find(v => v.gender === 'male') || voices[0] || null;

      setState(prev => ({
        ...prev,
        availableVoices: voices,
        selectedVoice: announcerVoice
      }));
    };

    initializeVoices();
    audioService.loadSettings();
  }, []);

  // Process announcement queue
  const processQueue = useCallback(async () => {
    setState(prevState => {
      if (processingQueue.current || prevState.announcementQueue.length === 0) return prevState;

      processingQueue.current = true;
      const announcement = prevState.announcementQueue[0];

      // Handle delay if specified
      if (announcement.delay && announcement.delay > 0) {
        currentTimeoutRef.current = setTimeout(async () => {
          await speakAnnouncement(announcement);
          processingQueue.current = false;
        }, announcement.delay);
      } else {
        speakAnnouncement(announcement).then(() => {
          processingQueue.current = false;
        });
      }

      return {
        ...prevState,
        announcementQueue: prevState.announcementQueue.slice(1),
        currentAnnouncement: announcement.text
      };
    });
  }, []);

  const speakAnnouncement = useCallback(async (announcement: AnnouncementConfig) => {
    return new Promise<void>((resolve) => {
      setState(prevState => {
        if (!prevState.isEnabled) {
          resolve();
          return { ...prevState, currentAnnouncement: '' };
        }

        // Start speaking
        audioService.speakBattleAnnouncement(
          announcement.text,
          announcement.type,
          undefined, // onStart
          () => {
            setState(prev => ({
              ...prev,
              isAnnouncerSpeaking: false,
              currentAnnouncement: ''
            }));
            resolve();
          }
        );

        return { ...prevState, isAnnouncerSpeaking: true };
      });
    });
  }, []);

  // Process queue when it changes
  useEffect(() => {
    processQueue();
  }, [processQueue]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
    };
  }, []);

  const announce = useCallback((config: AnnouncementConfig) => {
    setState(prev => {
      let newQueue = [...prev.announcementQueue];

      // Handle priority - high priority clears queue and interrupts
      if (config.priority === 'high') {
        newQueue = [config];
        audioService.stopSpeaking();
        if (currentTimeoutRef.current) {
          clearTimeout(currentTimeoutRef.current);
          currentTimeoutRef.current = null;
        }
        processingQueue.current = false;
      } else {
        newQueue.push(config);
      }

      return {
        ...prev,
        announcementQueue: newQueue
      };
    });
  }, []);

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      announcementQueue: [],
      currentAnnouncement: '',
      isAnnouncerSpeaking: false
    }));
    audioService.stopSpeaking();
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }
    processingQueue.current = false;
  }, []);

  const toggleEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isEnabled: enabled }));
    if (!enabled) {
      clearQueue();
    }
  }, [clearQueue]);

  const setVoice = useCallback((voice: VoiceProfile | null) => {
    setState(prev => ({ ...prev, selectedVoice: voice }));
  }, []);

  // Pre-defined announcement helpers
  const announceBattleStart = useCallback((player1: string, player2: string) => {
    announce({
      text: `Ladies and gentlemen, welcome to the arena! In the red corner, we have ${player1}! And in the blue corner, ${player2}! Let the battle... BEGIN!`,
      type: 'intro',
      priority: 'high'
    });
  }, [announce]);

  const announceRoundStart = useCallback((round: number) => {
    announce({
      text: `Round ${round}... FIGHT!`,
      type: 'round',
      priority: 'normal'
    });
  }, [announce]);

  const announceAction = useCallback((text: string, delay?: number) => {
    announce({
      text,
      type: 'action',
      delay,
      priority: 'normal'
    });
  }, [announce]);

  const announceVictory = useCallback((winner: string, isFlawless?: boolean) => {
    const flawlessText = isFlawless ? ' What a FLAWLESS victory!' : '';
    announce({
      text: `Victory goes to ${winner}!${flawlessText} An incredible display of skill and power!`,
      type: 'victory',
      priority: 'high'
    });
  }, [announce]);

  const announceDefeat = useCallback((loser: string) => {
    announce({
      text: `${loser} has fallen. A valiant effort, but not enough to claim victory today.`,
      type: 'defeat',
      priority: 'high'
    });
  }, [announce]);

  const announceSpecialMoment = useCallback((text: string) => {
    announce({
      text,
      type: 'action',
      priority: 'normal'
    });
  }, [announce]);

  const announceStrategySelection = useCallback(() => {
    announce({
      text: 'Warriors, select your battle strategies! The fate of this battle rests in your choices!',
      type: 'round',
      priority: 'normal'
    });
  }, [announce]);

  const announceBattleCry = useCallback(() => {
    announce({
      text: 'The warriors let out their battle cries! Feel the power and determination in their voices!',
      type: 'action',
      priority: 'normal'
    });
  }, [announce]);

  const announcePhaseTransition = useCallback((phase: string) => {
    const phaseTexts: Record<string, string> = {
      'strategy-selection': 'Time to choose your strategies! Think carefully, warriors!',
      'battle-cry': 'The battlefield echoes with mighty battle cries!',
      'round-combat': 'The clash of weapons rings through the arena!',
      'round-end': 'The dust settles as this round comes to an end!',
      'battle-end': 'The battle has reached its conclusion!'
    };

    const text = phaseTexts[phase] || `Entering ${phase} phase!`;
    announce({
      text,
      type: 'round',
      priority: 'normal'
    });
  }, [announce]);

  return {
    // State
    isAnnouncerSpeaking: state.isAnnouncerSpeaking,
    currentAnnouncement: state.currentAnnouncement,
    queueLength: state.announcementQueue.length,
    isEnabled: state.isEnabled,
    selectedVoice: state.selectedVoice,
    availableVoices: state.availableVoices,

    // Actions
    announce,
    clearQueue,
    toggleEnabled,
    setVoice,

    // Pre-defined announcements
    announceBattleStart,
    announceRoundStart,
    announceAction,
    announceVictory,
    announceDefeat,
    announceSpecialMoment,
    announceStrategySelection,
    announceBattleCry,
    announcePhaseTransition,

    // Utility
    isSpeaking: () => audioService.isSpeaking(),
    stopSpeaking: () => audioService.stopSpeaking()
  };
}