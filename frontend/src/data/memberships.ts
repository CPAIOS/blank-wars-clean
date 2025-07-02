// Training Membership System for _____ Wars

export type MembershipTier = 'free' | 'bronze' | 'elite' | 'legendary';
export type FacilityType = 'community' | 'bronze' | 'elite' | 'legendary';

export interface TrainingLimits {
  dailyTrainingSessions: number | 'unlimited';
  dailyEnergyRefills: number | 'unlimited';
  skillLearningSessions: number;
  xpMultiplier: number;
  statGainMultiplier: number;
  trainingPointMultiplier: number;
}

export interface MembershipBenefit {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Membership {
  tier: MembershipTier;
  name: string;
  price: number; // Monthly price in USD
  color: string; // For UI theming
  icon: string;
  tagline: string;
  
  // Training Limits
  limits: TrainingLimits;
  
  // Available Facilities
  facilities: FacilityType[];
  
  // Available Training Types
  trainingTypes: {
    basic: boolean;
    intermediate: boolean;
    advanced: boolean;
    master: boolean;
    legendary: boolean;
  };
  
  // Special Benefits
  benefits: MembershipBenefit[];
  
  // Skill Learning
  skillAccess: {
    coreSkills: boolean;
    archetypeSkills: boolean;
    signatureSkills: boolean;
    crossCharacterSkills: boolean; // Learn skills from other characters
  };
}

export const memberships: Record<MembershipTier, Membership> = {
  free: {
    tier: 'free',
    name: 'Free Trainer',
    price: 0,
    color: 'gray',
    icon: '🏃',
    tagline: 'Start your journey',
    
    limits: {
      dailyTrainingSessions: 3,
      dailyEnergyRefills: 1,
      skillLearningSessions: 0,
      xpMultiplier: 1.0,
      statGainMultiplier: 1.0,
      trainingPointMultiplier: 0.5
    },
    
    facilities: ['community'],
    
    trainingTypes: {
      basic: true,
      intermediate: false,
      advanced: false,
      master: false,
      legendary: false
    },
    
    benefits: [
      {
        id: 'basic_training',
        name: 'Basic Training',
        description: '3 training sessions per day',
        icon: '💪'
      },
      {
        id: 'energy_recovery',
        name: 'Energy Recovery',
        description: '1 free energy refill daily',
        icon: '⚡'
      },
      {
        id: 'core_skills_preview',
        name: 'Core Skills Preview',
        description: 'View (but not learn) core skills',
        icon: '👁️'
      }
    ],
    
    skillAccess: {
      coreSkills: false,
      archetypeSkills: false,
      signatureSkills: false,
      crossCharacterSkills: false
    }
  },
  
  bronze: {
    tier: 'bronze',
    name: 'Bronze Gym Pass',
    price: 2.99,
    color: 'orange',
    icon: '🥉',
    tagline: 'Train like a champion',
    
    limits: {
      dailyTrainingSessions: 10,
      dailyEnergyRefills: 3,
      skillLearningSessions: 1,
      xpMultiplier: 1.25,
      statGainMultiplier: 1.2,
      trainingPointMultiplier: 1.0
    },
    
    facilities: ['community', 'bronze'],
    
    trainingTypes: {
      basic: true,
      intermediate: true,
      advanced: false,
      master: false,
      legendary: false
    },
    
    benefits: [
      {
        id: 'extended_training',
        name: 'Extended Training',
        description: '10 training sessions per day',
        icon: '🏋️'
      },
      {
        id: 'skill_learning',
        name: 'Skill Learning',
        description: '1 skill learning session per week',
        icon: '📚'
      },
      {
        id: 'xp_boost',
        name: 'XP Boost',
        description: '+25% XP from all activities',
        icon: '⬆️'
      },
      {
        id: 'bronze_facilities',
        name: 'Bronze Facilities',
        description: 'Access to better equipment',
        icon: '🏢'
      }
    ],
    
    skillAccess: {
      coreSkills: true,
      archetypeSkills: false,
      signatureSkills: false,
      crossCharacterSkills: false
    }
  },
  
  elite: {
    tier: 'elite',
    name: 'Elite Academy',
    price: 7.99,
    color: 'purple',
    icon: '🏆',
    tagline: 'Master your potential',
    
    limits: {
      dailyTrainingSessions: 'unlimited',
      dailyEnergyRefills: 'unlimited',
      skillLearningSessions: 7,
      xpMultiplier: 2.0,
      statGainMultiplier: 1.5,
      trainingPointMultiplier: 2.0
    },
    
    facilities: ['community', 'bronze', 'elite'],
    
    trainingTypes: {
      basic: true,
      intermediate: true,
      advanced: true,
      master: true,
      legendary: false
    },
    
    benefits: [
      {
        id: 'unlimited_training',
        name: 'Unlimited Training',
        description: 'Train as much as you want',
        icon: '♾️'
      },
      {
        id: 'daily_skills',
        name: 'Daily Skill Learning',
        description: 'Learn new skills every day',
        icon: '🎯'
      },
      {
        id: 'double_xp',
        name: 'Double XP',
        description: '2x XP from all activities',
        icon: '💫'
      },
      {
        id: 'ai_coach',
        name: 'AI Personal Trainer',
        description: 'Get personalized training tips',
        icon: '🤖'
      },
      {
        id: 'elite_facilities',
        name: 'Elite Academy Access',
        description: 'Train in state-of-the-art facilities',
        icon: '🏛️'
      }
    ],
    
    skillAccess: {
      coreSkills: true,
      archetypeSkills: true,
      signatureSkills: true,
      crossCharacterSkills: false
    }
  },
  
  legendary: {
    tier: 'legendary',
    name: 'Legendary Dojo',
    price: 14.99,
    color: 'gold',
    icon: '⚜️',
    tagline: 'Transcend all limits',
    
    limits: {
      dailyTrainingSessions: 'unlimited',
      dailyEnergyRefills: 'unlimited',
      skillLearningSessions: 'unlimited',
      xpMultiplier: 3.0,
      statGainMultiplier: 2.0,
      trainingPointMultiplier: 3.0
    },
    
    facilities: ['community', 'bronze', 'elite', 'legendary'],
    
    trainingTypes: {
      basic: true,
      intermediate: true,
      advanced: true,
      master: true,
      legendary: true
    },
    
    benefits: [
      {
        id: 'legendary_training',
        name: 'Legendary Training',
        description: 'Access to mythical techniques',
        icon: '🌟'
      },
      {
        id: 'unlimited_skills',
        name: 'Unlimited Skill Learning',
        description: 'Learn as many skills as you want',
        icon: '🧠'
      },
      {
        id: 'triple_xp',
        name: 'Triple XP',
        description: '3x XP from all activities',
        icon: '🚀'
      },
      {
        id: 'cross_training',
        name: 'Cross-Character Training',
        description: 'Learn skills from other characters',
        icon: '🔄'
      },
      {
        id: 'legendary_dojo',
        name: 'Legendary Dojo',
        description: 'Train where legends are born',
        icon: '🏯'
      },
      {
        id: 'priority_features',
        name: 'Priority Access',
        description: 'Early access to new features',
        icon: '👑'
      }
    ],
    
    skillAccess: {
      coreSkills: true,
      archetypeSkills: true,
      signatureSkills: true,
      crossCharacterSkills: true
    }
  }
};

// Training Facilities
export interface TrainingFacility {
  type: FacilityType;
  name: string;
  description: string;
  icon: string;
  
  // Bonuses
  xpBonus: number;
  statBonus: number;
  energyCostReduction: number;
  
  // Environment
  crowdLevel: 'empty' | 'moderate' | 'crowded';
  equipment: 'basic' | 'standard' | 'advanced' | 'legendary';
  
  // Special Features
  features: string[];
}

export const facilities: Record<FacilityType, TrainingFacility> = {
  community: {
    type: 'community',
    name: 'Community Gym',
    description: 'A basic gym with essential equipment',
    icon: '🏋️',
    xpBonus: 1.0,
    statBonus: 1.0,
    energyCostReduction: 0,
    crowdLevel: 'crowded',
    equipment: 'basic',
    features: [
      'Basic weights and machines',
      'Limited hours (6AM - 10PM)',
      'Shared equipment',
      'Basic training programs'
    ]
  },
  
  bronze: {
    type: 'bronze',
    name: 'Bronze Fitness Center',
    description: 'A well-equipped fitness center',
    icon: '🏢',
    xpBonus: 1.2,
    statBonus: 1.1,
    energyCostReduction: 0.1,
    crowdLevel: 'moderate',
    equipment: 'standard',
    features: [
      'Modern equipment',
      'Extended hours (5AM - 11PM)',
      'Group classes available',
      'Personal locker included'
    ]
  },
  
  elite: {
    type: 'elite',
    name: 'Elite Training Academy',
    description: 'State-of-the-art training facility',
    icon: '🏛️',
    xpBonus: 1.5,
    statBonus: 1.3,
    energyCostReduction: 0.2,
    crowdLevel: 'empty',
    equipment: 'advanced',
    features: [
      'Cutting-edge technology',
      '24/7 access',
      'Personal trainers available',
      'Recovery spa included',
      'Nutrition bar'
    ]
  },
  
  legendary: {
    type: 'legendary',
    name: 'Legendary Dojo',
    description: 'Where myths and legends train',
    icon: '⛩️',
    xpBonus: 2.0,
    statBonus: 1.5,
    energyCostReduction: 0.3,
    crowdLevel: 'empty',
    equipment: 'legendary',
    features: [
      'Mystical training grounds',
      'Ancient artifacts and techniques',
      'Master instructors',
      'Dimensional training rooms',
      'Time dilation chambers',
      'Legendary weapon vault access'
    ]
  }
};

// Helper functions
export function canAccessFacility(membershipTier: MembershipTier, facilityType: FacilityType): boolean {
  return memberships[membershipTier].facilities.includes(facilityType);
}

export function getTrainingMultipliers(membershipTier: MembershipTier, facilityType: FacilityType) {
  const membership = memberships[membershipTier];
  const facility = facilities[facilityType];
  
  return {
    xp: membership.limits.xpMultiplier * facility.xpBonus,
    stat: membership.limits.statGainMultiplier * facility.statBonus,
    trainingPoints: membership.limits.trainingPointMultiplier,
    energyCost: 1 - facility.energyCostReduction
  };
}

export function getDailyLimits(membershipTier: MembershipTier) {
  return memberships[membershipTier].limits;
}