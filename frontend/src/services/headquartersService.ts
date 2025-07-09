/**
 * Headquarters Service
 * 
 * This service handles headquarters-specific business logic including
 * tier-based capacity calculations. Extracted from TeamHeadquarters.tsx
 * to provide focused headquarters management logic.
 */

// getElementCapacity function - extracted from TeamHeadquarters.tsx (lines 301-309)
export const getElementCapacity = (currentTier: string) => {
  const tierCapacity = {
    'spartan_apartment': 2,
    'basic_house': 3,
    'team_mansion': 5,
    'elite_compound': 10
  };
  return tierCapacity[currentTier as keyof typeof tierCapacity] || 2;
};