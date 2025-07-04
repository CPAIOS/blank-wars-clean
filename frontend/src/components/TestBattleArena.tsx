'use client';

import React from 'react';

// Simple test component to check if ImprovedBattleArena loads
const TestBattleArena = () => {
  try {
    // Try to dynamically import and render ImprovedBattleArena
    const ImprovedBattleArena = React.lazy(() => import('./ImprovedBattleArena'));
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-white">🧪 Battle Arena Test</h1>
        <p className="text-green-400 mb-4">✅ TestBattleArena component loaded successfully</p>
        
        <div className="border border-gray-600 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-white">Attempting to load ImprovedBattleArena:</h2>
          <React.Suspense fallback={
            <div className="text-yellow-400">🔄 Loading ImprovedBattleArena...</div>
          }>
            <ImprovedBattleArena />
          </React.Suspense>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-400">❌ Battle Arena Test Failed</h1>
        <p className="text-red-300">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded">
          <h3 className="font-semibold text-red-400">Debug Info:</h3>
          <pre className="text-sm text-red-300 mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }
};

export default TestBattleArena;