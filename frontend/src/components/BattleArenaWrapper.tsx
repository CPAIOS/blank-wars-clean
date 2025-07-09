'use client';

import { ErrorBoundary } from 'react-error-boundary';
import ImprovedBattleArena from './ImprovedBattleArena';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
      <h2 className="text-xl font-bold text-red-400 mb-4">Battle Arena Error</h2>
      <p className="text-red-300 mb-4">{error.message}</p>
      <pre className="text-sm text-red-200 bg-red-900/30 p-4 rounded overflow-auto mb-4">
        {error.stack}
      </pre>
      <button 
        onClick={resetErrorBoundary}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Try Again
      </button>
    </div>
  );
}

export default function BattleArenaWrapper() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ImprovedBattleArena />
    </ErrorBoundary>
  );
}