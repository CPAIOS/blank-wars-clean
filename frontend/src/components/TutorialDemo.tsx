'use client';

import { useTutorial } from '../hooks/useTutorial';
import { teamHeadquartersTutorialSteps } from '../data/tutorialSteps';

export const TutorialDemo: React.FC = () => {
  const { resetTutorial, startTutorial, isFirstTimeUser } = useTutorial();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <h3 className="text-white font-bold mb-2">Tutorial Demo Controls</h3>
      <div className="space-y-2">
        <p className="text-gray-300 text-sm">
          First time user: {isFirstTimeUser() ? 'Yes' : 'No'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => startTutorial(teamHeadquartersTutorialSteps)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
          >
            Start Tutorial
          </button>
          <button
            onClick={resetTutorial}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
          >
            Reset Tutorial State
          </button>
        </div>
      </div>
    </div>
  );
};