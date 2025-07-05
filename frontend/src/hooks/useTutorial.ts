import { useState, useEffect } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetSelector?: string;
  highlightElements?: string[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  actionRequired?: 'click' | 'drag' | 'none';
  nextButtonText?: string;
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  hasSeenTutorial: boolean;
}

const TUTORIAL_STORAGE_KEY = 'blank-wars-tutorial-state';

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    // Load tutorial state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            isActive: false,
            currentStep: 0,
            steps: [],
            hasSeenTutorial: parsed.hasSeenTutorial || false
          };
        } catch (e) {
          console.warn('Failed to parse tutorial state from localStorage');
        }
      }
    }
    
    return {
      isActive: false,
      currentStep: 0,
      steps: [],
      hasSeenTutorial: false
    };
  });

  // Save tutorial state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({
        hasSeenTutorial: tutorialState.hasSeenTutorial
      }));
    }
  }, [tutorialState.hasSeenTutorial]);

  const startTutorial = (steps: TutorialStep[]) => {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      steps,
      hasSeenTutorial: true
    }));
  };

  const nextStep = () => {
    setTutorialState(prev => {
      if (prev.currentStep < prev.steps.length - 1) {
        return { ...prev, currentStep: prev.currentStep + 1 };
      }
      // Tutorial completed
      return { ...prev, isActive: false, currentStep: 0, steps: [] };
    });
  };

  const prevStep = () => {
    setTutorialState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  };

  const skipTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0,
      steps: [],
      hasSeenTutorial: true
    }));
  };

  const resetTutorial = () => {
    setTutorialState({
      isActive: false,
      currentStep: 0,
      steps: [],
      hasSeenTutorial: false
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }
  };

  const isFirstTimeUser = () => {
    return !tutorialState.hasSeenTutorial;
  };

  const getCurrentStep = () => {
    if (!tutorialState.isActive || tutorialState.steps.length === 0) {
      return null;
    }
    return tutorialState.steps[tutorialState.currentStep];
  };

  return {
    tutorialState,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    resetTutorial,
    isFirstTimeUser,
    getCurrentStep,
    isActive: tutorialState.isActive,
    currentStepIndex: tutorialState.currentStep,
    totalSteps: tutorialState.steps.length
  };
};