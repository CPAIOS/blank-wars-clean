'use client';

import RealEstateAgentChat from '../../components/RealEstateAgentChat';

export default function TestFacilities() {
  const mockTeamStats = {
    level: 18,
    totalCharacters: 9,
    currentFacilities: ['basic_gym'],
    budget: 50000,
    
    livingArrangements: {
      currentTier: 'spartan_apartment',
      maxCapacity: 4,
      currentOccupancy: 9,
      overcrowding: 5,
      conflicts: ['dracula vs holmes', 'achilles vs joan'],
      unthemedRooms: 2,
      floorSleepers: 6
    },
    
    battlePerformance: {
      recentWins: 3,
      recentLosses: 2,
      currentStreak: 'W-L-W-W-L',
      teamChemistry: 33,
      battleEffects: {},
      performancePenalties: {
        overcrowding: -25,
        conflicts: -15,
        poorSleep: -12
      }
    },
    
    urgentIssues: [
      '6 fighters sleeping on floors',
      'Team chemistry at critical 33%',
      'Living in spartan apartment - major stat penalties',
      'Multiple character conflicts affecting teamwork'
    ]
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🏠 Real Estate Agent Test</h1>
          <p className="text-gray-400">Testing the integrated real estate agents with mock data</p>
        </div>
        
        <RealEstateAgentChat teamStats={mockTeamStats} />
      </div>
    </div>
  );
}