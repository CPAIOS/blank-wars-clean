// Equipment Progression and Upgrade System
// Tracks character equipment advancement and unlock conditions

import { Equipment } from './equipment';
import { Character } from './characters';
import { CraftingRecipe, craftingRecipes } from './craftingSystem';

export interface EquipmentProgressionNode {
  equipmentId: string;
  level: number;
  rarity: 'common' | 'rare' | 'legendary';
  unlockConditions: {
    characterLevel: number;
    previousEquipment?: string;
    completedQuests?: string[];
    defeatedEnemies?: string[];
    materialsGathered?: { materialId: string; quantity: number }[];
    battlesWon?: number;
  };
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface CharacterEquipmentProgression {
  characterId: string;
  weaponTree: EquipmentProgressionNode[];
  armorTree: EquipmentProgressionNode[];
  accessoryTree: EquipmentProgressionNode[];
  totalProgress: number; // 0-100 percentage
  nextUnlock?: {
    equipment: Equipment;
    requirements: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

export interface ProgressionQuest {
  id: string;
  name: string;
  description: string;
  characterId: string;
  targetEquipment: string;
  steps: {
    id: string;
    description: string;
    type: 'battle' | 'gather' | 'craft' | 'explore';
    target: string;
    quantity?: number;
    completed: boolean;
  }[];
  rewards: {
    experience: number;
    materials?: { materialId: string; quantity: number }[];
    equipment?: string[];
    unlocksRecipe?: string;
  };
  isCompleted: boolean;
}

// Equipment progression trees for each character
export const characterProgressionTrees: Record<string, CharacterEquipmentProgression> = {
  achilles: {
    characterId: 'achilles',
    weaponTree: [
      {
        equipmentId: 'bronze_spear_achilles',
        level: 1,
        rarity: 'common',
        unlockConditions: {
          characterLevel: 1
        },
        isUnlocked: true,
        isEquipped: false
      },
      {
        equipmentId: 'iron_sword_achilles',
        level: 15,
        rarity: 'rare',
        unlockConditions: {
          characterLevel: 15,
          previousEquipment: 'bronze_spear_achilles',
          materialsGathered: [
            { materialId: 'steel_ingot', quantity: 3 },
            { materialId: 'rune_stone', quantity: 1 }
          ]
        },
        isUnlocked: false,
        isEquipped: false
      },
      {
        equipmentId: 'shield_invulnerability',
        level: 30,
        rarity: 'legendary',
        unlockConditions: {
          characterLevel: 30,
          previousEquipment: 'iron_sword_achilles',
          completedQuests: ['divine_blessing_quest'],
          battlesWon: 100,
          materialsGathered: [
            { materialId: 'mithril_ore', quantity: 10 },
            { materialId: 'phoenix_feather', quantity: 1 },
            { materialId: 'dragon_scale', quantity: 3 }
          ]
        },
        isUnlocked: false,
        isEquipped: false
      }
    ],
    armorTree: [],
    accessoryTree: [],
    totalProgress: 33 // 1 out of 3 unlocked
  },
  
  sherlock_holmes: {
    characterId: 'sherlock_holmes',
    weaponTree: [
      {
        equipmentId: 'police_club_holmes',
        level: 1,
        rarity: 'common',
        unlockConditions: {
          characterLevel: 1
        },
        isUnlocked: true,
        isEquipped: false
      },
      {
        equipmentId: 'sword_cane_holmes',
        level: 15,
        rarity: 'rare',
        unlockConditions: {
          characterLevel: 15,
          previousEquipment: 'police_club_holmes',
          completedQuests: ['investigate_mystery'],
          materialsGathered: [
            { materialId: 'steel_ingot', quantity: 2 },
            { materialId: 'leather_hide', quantity: 1 }
          ]
        },
        isUnlocked: false,
        isEquipped: false
      },
      {
        equipmentId: 'minds_eye_revolver',
        level: 30,
        rarity: 'legendary',
        unlockConditions: {
          characterLevel: 30,
          previousEquipment: 'sword_cane_holmes',
          completedQuests: ['solve_impossible_case'],
          materialsGathered: [
            { materialId: 'titanium_alloy', quantity: 5 },
            { materialId: 'mana_crystal', quantity: 3 }
          ]
        },
        isUnlocked: false,
        isEquipped: false
      }
    ],
    armorTree: [],
    accessoryTree: [],
    totalProgress: 33
  }
};

// Progression quests
export const progressionQuests: ProgressionQuest[] = [
  {
    id: 'divine_blessing_quest',
    name: 'Divine Blessing',
    description: 'Seek the blessing of the gods to forge a legendary shield',
    characterId: 'achilles',
    targetEquipment: 'shield_invulnerability',
    steps: [
      {
        id: 'defeat_hydra',
        description: 'Defeat the Hydra in battle',
        type: 'battle',
        target: 'hydra',
        completed: false
      },
      {
        id: 'gather_phoenix_feather',
        description: 'Obtain a Phoenix Feather from the eternal flame',
        type: 'gather',
        target: 'phoenix_feather',
        quantity: 1,
        completed: false
      },
      {
        id: 'visit_olympus',
        description: 'Journey to Mount Olympus',
        type: 'explore',
        target: 'mount_olympus',
        completed: false
      }
    ],
    rewards: {
      experience: 1000,
      materials: [
        { materialId: 'divine_essence', quantity: 1 }
      ],
      unlocksRecipe: 'craft_divine_shield'
    },
    isCompleted: false
  },
  
  {
    id: 'investigate_mystery',
    name: 'The Case of the Hidden Blade',
    description: 'Investigate a mysterious weapon hidden in Victorian London',
    characterId: 'sherlock_holmes',
    targetEquipment: 'sword_cane_holmes',
    steps: [
      {
        id: 'gather_clues',
        description: 'Gather clues around London',
        type: 'explore',
        target: 'london_streets',
        quantity: 5,
        completed: false
      },
      {
        id: 'craft_sword_cane',
        description: 'Craft the concealed weapon',
        type: 'craft',
        target: 'craft_sword_cane',
        completed: false
      }
    ],
    rewards: {
      experience: 200,
      materials: [
        { materialId: 'steel_ingot', quantity: 2 }
      ]
    },
    isCompleted: false
  },
  
  {
    id: 'solve_impossible_case',
    name: 'The Impossible Crime',
    description: 'Solve a case that defies all logic and reasoning',
    characterId: 'sherlock_holmes',
    targetEquipment: 'minds_eye_revolver',
    steps: [
      {
        id: 'analyze_evidence',
        description: 'Use deductive reasoning to analyze impossible evidence',
        type: 'explore',
        target: 'crime_scene',
        quantity: 10,
        completed: false
      },
      {
        id: 'defeat_master_criminal',
        description: 'Confront and defeat the master criminal',
        type: 'battle',
        target: 'moriarty',
        completed: false
      },
      {
        id: 'forge_enhanced_weapon',
        description: 'Create a weapon enhanced by pure logic',
        type: 'craft',
        target: 'craft_minds_eye_revolver',
        completed: false
      }
    ],
    rewards: {
      experience: 800,
      materials: [
        { materialId: 'logic_crystal', quantity: 1 }
      ]
    },
    isCompleted: false
  }
];

// Progression system functions
export class EquipmentProgressionSystem {
  static getCharacterProgression(characterId: string): CharacterEquipmentProgression | null {
    return characterProgressionTrees[characterId] || null;
  }
  
  static checkUnlockConditions(
    node: EquipmentProgressionNode, 
    character: Character,
    playerProgress: Record<string, { unlockedNodes: string[]; currentTier: number; experience: number }> = {}
  ): {
    canUnlock: boolean;
    missingRequirements: string[];
  } {
    const missing: string[] = [];
    const conditions = node.unlockConditions;
    
    // Check character level
    if (character.level < conditions.characterLevel) {
      missing.push(`Character level ${conditions.characterLevel} required (current: ${character.level})`);
    }
    
    // Check previous equipment
    if (conditions.previousEquipment) {
      const hasEquipment = character.equippedItems.weapon?.id === conditions.previousEquipment ||
                          character.inventory.some(item => item.id === conditions.previousEquipment);
      if (!hasEquipment) {
        missing.push(`Must have ${conditions.previousEquipment} first`);
      }
    }
    
    // Check completed quests
    if (conditions.completedQuests) {
      conditions.completedQuests.forEach(questId => {
        const quest = progressionQuests.find(q => q.id === questId);
        if (quest && !quest.isCompleted) {
          missing.push(`Complete quest: ${quest.name}`);
        }
      });
    }
    
    // Check materials
    if (conditions.materialsGathered) {
      conditions.materialsGathered.forEach(req => {
        // This would check player's material inventory
        missing.push(`Gather ${req.quantity}x ${req.materialId}`);
      });
    }
    
    // Check battles won
    if (conditions.battlesWon) {
      // This would check player's battle statistics
      missing.push(`Win ${conditions.battlesWon} battles`);
    }
    
    return {
      canUnlock: missing.length === 0,
      missingRequirements: missing
    };
  }
  
  static getNextAvailableUpgrade(characterId: string, character: Character): EquipmentProgressionNode | null {
    const progression = this.getCharacterProgression(characterId);
    if (!progression) return null;
    
    // Find next unlockable weapon
    const nextWeapon = progression.weaponTree.find(node => 
      !node.isUnlocked && this.checkUnlockConditions(node, character).canUnlock
    );
    
    return nextWeapon || null;
  }
  
  static calculateProgressionPercentage(characterId: string): number {
    const progression = this.getCharacterProgression(characterId);
    if (!progression) return 0;
    
    const totalNodes = progression.weaponTree.length + progression.armorTree.length + progression.accessoryTree.length;
    const unlockedNodes = [
      ...progression.weaponTree,
      ...progression.armorTree,
      ...progression.accessoryTree
    ].filter(node => node.isUnlocked).length;
    
    return totalNodes > 0 ? Math.round((unlockedNodes / totalNodes) * 100) : 0;
  }
  
  static unlockEquipment(characterId: string, equipmentId: string): boolean {
    const progression = this.getCharacterProgression(characterId);
    if (!progression) return false;
    
    // Find the node in any tree
    const allNodes = [...progression.weaponTree, ...progression.armorTree, ...progression.accessoryTree];
    const node = allNodes.find(n => n.equipmentId === equipmentId);
    
    if (node) {
      node.isUnlocked = true;
      progression.totalProgress = this.calculateProgressionPercentage(characterId);
      return true;
    }
    
    return false;
  }
  
  static getAvailableQuests(characterId: string): ProgressionQuest[] {
    return progressionQuests.filter(quest => 
      quest.characterId === characterId && !quest.isCompleted
    );
  }
  
  static updateQuestProgress(questId: string, stepId: string): boolean {
    const quest = progressionQuests.find(q => q.id === questId);
    if (!quest) return false;
    
    const step = quest.steps.find(s => s.id === stepId);
    if (!step) return false;
    
    step.completed = true;
    
    // Check if all steps are completed
    const allCompleted = quest.steps.every(s => s.completed);
    if (allCompleted) {
      quest.isCompleted = true;
    }
    
    return true;
  }
  
  static getEquipmentUpgradePath(equipmentId: string): CraftingRecipe[] {
    return craftingRecipes.filter(recipe => 
      recipe.baseEquipmentId === equipmentId || recipe.resultEquipmentId === equipmentId
    );
  }
  
  static generateProgressionSummary(characterId: string, character: Character): {
    currentProgress: number;
    nextUpgrade: EquipmentProgressionNode | null;
    availableQuests: ProgressionQuest[];
    completedUpgrades: string[];
    totalUpgrades: number;
  } {
    const progression = this.getCharacterProgression(characterId);
    const currentProgress = this.calculateProgressionPercentage(characterId);
    const nextUpgrade = this.getNextAvailableUpgrade(characterId, character);
    const availableQuests = this.getAvailableQuests(characterId);
    
    let completedUpgrades: string[] = [];
    let totalUpgrades = 0;
    
    if (progression) {
      const allNodes = [...progression.weaponTree, ...progression.armorTree, ...progression.accessoryTree];
      completedUpgrades = allNodes.filter(n => n.isUnlocked).map(n => n.equipmentId);
      totalUpgrades = allNodes.length;
    }
    
    return {
      currentProgress,
      nextUpgrade,
      availableQuests,
      completedUpgrades,
      totalUpgrades
    };
  }
}

// Helper functions
export function createProgressionTree(characterId: string, equipmentIds: string[]): EquipmentProgressionNode[] {
  return equipmentIds.map((id, index) => ({
    equipmentId: id,
    level: 1 + (index * 14), // Levels 1, 15, 29, etc.
    rarity: index === 0 ? 'common' : index === 1 ? 'rare' : 'legendary',
    unlockConditions: {
      characterLevel: 1 + (index * 14),
      previousEquipment: index > 0 ? equipmentIds[index - 1] : undefined
    },
    isUnlocked: index === 0, // First item is always unlocked
    isEquipped: false
  }));
}

export function getProgressionRecommendations(characterId: string, character: Character): {
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  requirements?: string[];
}[] {
  const recommendations = [];
  const progression = EquipmentProgressionSystem.getCharacterProgression(characterId);
  
  if (!progression) return [];
  
  // Check for available upgrades
  const nextUpgrade = EquipmentProgressionSystem.getNextAvailableUpgrade(characterId, character);
  if (nextUpgrade) {
    const check = EquipmentProgressionSystem.checkUnlockConditions(nextUpgrade, character);
    recommendations.push({
      priority: 'high' as const,
      action: `Unlock ${nextUpgrade.equipmentId}`,
      description: 'Next weapon upgrade available',
      requirements: check.missingRequirements
    });
  }
  
  // Check for available quests
  const quests = EquipmentProgressionSystem.getAvailableQuests(characterId);
  quests.forEach(quest => {
    recommendations.push({
      priority: 'medium' as const,
      action: `Complete ${quest.name}`,
      description: quest.description
    });
  });
  
  return recommendations;
}