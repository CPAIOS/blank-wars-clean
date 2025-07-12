'use client';

import { useState } from 'react';
import FacilitiesManager from './FacilitiesManager';

const FacilitiesManagerWrapper = () => {
  console.log('🔧 FacilitiesManagerWrapper rendering!');
  // Demo facilities state
  const [demoFacilities, setDemoFacilities] = useState([
    { id: 'gym', level: 2, purchaseDate: new Date(), maintenancePaid: true, bonusesActive: true },
    { id: 'medical_bay', level: 1, purchaseDate: new Date(), maintenancePaid: false, bonusesActive: false }
  ]);
  
  const demoCurrency = { coins: 50000, gems: 100 };
  const demoTeamLevel = 12;
  const demoAchievements = ['team_harmony', 'inner_peace', 'tech_pioneer'];
  
  const handlePurchaseFacility = (facilityId: string) => {
    console.log('Purchasing facility:', facilityId);
    setDemoFacilities(prev => [...prev, {
      id: facilityId,
      level: 1,
      purchaseDate: new Date(),
      maintenancePaid: true,
      bonusesActive: true
    }]);
  };
  
  const handleUpgradeFacility = (facilityId: string) => {
    console.log('Upgrading facility:', facilityId);
    setDemoFacilities(prev => prev.map(f => 
      f.id === facilityId ? { ...f, level: f.level + 1 } : f
    ));
  };
  
  const handlePayMaintenance = (facilityId: string) => {
    console.log('Paying maintenance for facility:', facilityId);
    setDemoFacilities(prev => prev.map(f => 
      f.id === facilityId ? { ...f, maintenancePaid: true, bonusesActive: true } : f
    ));
  };
  
  return (
    <FacilitiesManager
      teamLevel={demoTeamLevel}
      currency={demoCurrency}
      unlockedAchievements={demoAchievements}
      ownedFacilities={demoFacilities}
      onPurchaseFacility={handlePurchaseFacility}
      onUpgradeFacility={handleUpgradeFacility}
      onPayMaintenance={handlePayMaintenance}
    />
  );
};

export default FacilitiesManagerWrapper;