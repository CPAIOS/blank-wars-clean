import { query } from '../database/postgres';

export const HEALING_FACILITIES = [
  {
    id: 'basic_medical_bay',
    name: 'Basic Medical Bay',
    facilityType: 'basic_medical',
    healingRateMultiplier: 1.5,
    currencyCostPerHour: 25,
    premiumCostPerHour: 0,
    maxInjurySeverity: 'moderate',
    headquartersTierRequired: 'basic_house',
    description: 'Simple medical facility that speeds up recovery by 50%'
  },
  {
    id: 'advanced_medical_center',
    name: 'Advanced Medical Center',
    facilityType: 'advanced_medical',
    healingRateMultiplier: 2.0,
    currencyCostPerHour: 50,
    premiumCostPerHour: 1,
    maxInjurySeverity: 'severe',
    headquartersTierRequired: 'team_mansion',
    description: 'Modern medical facility that doubles recovery speed'
  },
  {
    id: 'premium_healing_chamber',
    name: 'Premium Healing Chamber',
    facilityType: 'premium_medical',
    healingRateMultiplier: 3.0,
    currencyCostPerHour: 100,
    premiumCostPerHour: 2,
    maxInjurySeverity: 'critical',
    headquartersTierRequired: 'elite_compound',
    description: 'State-of-the-art medical pod that triples recovery speed'
  },
  {
    id: 'resurrection_chamber',
    name: 'Resurrection Chamber',
    facilityType: 'resurrection_chamber',
    healingRateMultiplier: 1.0,
    currencyCostPerHour: 200,
    premiumCostPerHour: 5,
    maxInjurySeverity: 'dead',
    headquartersTierRequired: 'elite_compound',
    description: 'Ancient technology capable of bringing the dead back to life'
  }
];

/**
 * Initialize healing facilities in the database
 */
export async function initializeHealingFacilities(): Promise<void> {
  try {
    console.log('🏥 Initializing healing facilities...');
    
    for (const facility of HEALING_FACILITIES) {
      await query(
        `INSERT INTO healing_facilities 
         (id, name, facility_type, healing_rate_multiplier, currency_cost_per_hour, 
          premium_cost_per_hour, max_injury_severity, headquarters_tier_required, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           facility_type = EXCLUDED.facility_type,
           healing_rate_multiplier = EXCLUDED.healing_rate_multiplier,
           currency_cost_per_hour = EXCLUDED.currency_cost_per_hour,
           premium_cost_per_hour = EXCLUDED.premium_cost_per_hour,
           max_injury_severity = EXCLUDED.max_injury_severity,
           headquarters_tier_required = EXCLUDED.headquarters_tier_required,
           description = EXCLUDED.description`,
        [
          facility.id,
          facility.name,
          facility.facilityType,
          facility.healingRateMultiplier,
          facility.currencyCostPerHour,
          facility.premiumCostPerHour,
          facility.maxInjurySeverity,
          facility.headquartersTierRequired,
          facility.description
        ]
      );
    }
    
    console.log(`✅ Initialized ${HEALING_FACILITIES.length} healing facilities`);
  } catch (error) {
    console.error('❌ Error initializing healing facilities:', error);
    throw error;
  }
}

/**
 * Get available facilities for a user based on their headquarters tier
 */
export async function getAvailableFacilities(headquartersTier: string): Promise<any[]> {
  try {
    const tierHierarchy = {
      'spartan_apartment': 0,
      'basic_house': 1,
      'team_mansion': 2,
      'elite_compound': 3
    };
    
    const userTierLevel = tierHierarchy[headquartersTier as keyof typeof tierHierarchy] || 0;
    
    const result = await query(
      `SELECT * FROM healing_facilities 
       WHERE headquarters_tier_required IS NULL 
       OR headquarters_tier_required = ANY($1)
       ORDER BY healing_rate_multiplier ASC`,
      [Object.keys(tierHierarchy).filter(tier => 
        tierHierarchy[tier as keyof typeof tierHierarchy] <= userTierLevel
      )]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting available facilities:', error);
    return [];
  }
}