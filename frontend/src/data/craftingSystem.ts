// Equipment Crafting and Progression System
// Complete crafting mechanics with materials, recipes, and progression

import { Equipment, EquipmentRarity } from './equipment';
import { Item } from './items';

export interface CraftingMaterial {
  id: string;
  name: string;
  description: string;
  rarity: EquipmentRarity;
  icon: string;
  stackable: boolean;
  maxStack: number;
  obtainMethod: 'drop' | 'salvage' | 'mine' | 'harvest' | 'battle' | 'shop';
  value: number;
}

export interface CraftingRecipe {
  id: string;
  resultEquipmentId: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'accessory' | 'upgrade';
  requiredLevel: number;
  requiredSkill?: string;
  requiredSkillLevel?: number;
  
  materials: {
    materialId: string;
    quantity: number;
  }[];
  
  gold: number;
  craftingTime: number; // in minutes
  experienceGained: number;
  successRate: number; // 0-100
  
  // Upgrade-specific
  baseEquipmentId?: string; // For upgrades
  preserveEnchantments?: boolean;
  
  unlockConditions?: {
    completedQuests?: string[];
    defeatedEnemies?: string[];
    discoveredRecipes?: string[];
    characterLevel?: number;
  };
}

export interface CraftingStation {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  categories: ('weapon' | 'armor' | 'accessory' | 'upgrade')[];
  bonuses: {
    successRateBonus: number;
    timeReduction: number;
    materialSaving: number; // percentage chance to save materials
    experienceBonus: number;
  };
  requiredMaterials?: {
    materialId: string;
    quantity: number;
  }[];
  cost: number;
}

export interface PlayerCrafting {
  craftingLevel: number;
  craftingExperience: number;
  unlockedRecipes: string[];
  ownedStations: string[];
  activeCrafts: {
    recipeId: string;
    startTime: Date;
    completionTime: Date;
    stationId?: string;
  }[];
  materials: {
    materialId: string;
    quantity: number;
  }[];
}

// Crafting materials database
export const craftingMaterials: CraftingMaterial[] = [
  // Basic materials
  {
    id: 'iron_ore',
    name: 'Iron Ore',
    description: 'Raw iron ore for basic metalwork',
    rarity: 'common',
    icon: '⚫',
    stackable: true,
    maxStack: 999,
    obtainMethod: 'mine',
    value: 5
  },
  {
    id: 'leather_hide',
    name: 'Leather Hide',
    description: 'Tough animal hide for armor crafting',
    rarity: 'common',
    icon: '🦬',
    stackable: true,
    maxStack: 99,
    obtainMethod: 'drop',
    value: 8
  },
  {
    id: 'wood_plank',
    name: 'Wood Plank',
    description: 'Sturdy wooden plank for weapon handles',
    rarity: 'common',
    icon: '🪵',
    stackable: true,
    maxStack: 999,
    obtainMethod: 'harvest',
    value: 3
  },
  
  // Rare materials
  {
    id: 'mithril_ore',
    name: 'Mithril Ore',
    description: 'Legendary light metal with magical properties',
    rarity: 'rare',
    icon: '✨',
    stackable: true,
    maxStack: 99,
    obtainMethod: 'mine',
    value: 100
  },
  {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    description: 'Incredibly tough scale from an ancient dragon',
    rarity: 'epic',
    icon: '🐲',
    stackable: true,
    maxStack: 10,
    obtainMethod: 'battle',
    value: 500
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    description: 'Mystical feather that burns with eternal flame',
    rarity: 'legendary',
    icon: '🪶',
    stackable: true,
    maxStack: 5,
    obtainMethod: 'battle',
    value: 2000
  },
  
  // Historical materials
  {
    id: 'bronze_ingot',
    name: 'Bronze Ingot',
    description: 'Refined bronze for ancient weaponry',
    rarity: 'common',
    icon: '🟫',
    stackable: true,
    maxStack: 99,
    obtainMethod: 'shop',
    value: 12
  },
  {
    id: 'steel_ingot',
    name: 'Steel Ingot',
    description: 'High-quality steel for medieval weapons',
    rarity: 'uncommon',
    icon: '⚪',
    stackable: true,
    maxStack: 99,
    obtainMethod: 'shop',
    value: 25
  },
  {
    id: 'titanium_alloy',
    name: 'Titanium Alloy',
    description: 'Advanced metal alloy for futuristic equipment',
    rarity: 'rare',
    icon: '🔹',
    stackable: true,
    maxStack: 50,
    obtainMethod: 'salvage',
    value: 150
  },
  
  // Magical components
  {
    id: 'mana_crystal',
    name: 'Mana Crystal',
    description: 'Crystallized magical energy',
    rarity: 'uncommon',
    icon: '💎',
    stackable: true,
    maxStack: 50,
    obtainMethod: 'drop',
    value: 40
  },
  {
    id: 'rune_stone',
    name: 'Rune Stone',
    description: 'Ancient stone inscribed with mystical runes',
    rarity: 'rare',
    icon: '🗿',
    stackable: true,
    maxStack: 20,
    obtainMethod: 'drop',
    value: 200
  },
  {
    id: 'void_essence',
    name: 'Void Essence',
    description: 'Dark energy from the space between worlds',
    rarity: 'mythic',
    icon: '🌑',
    stackable: true,
    maxStack: 3,
    obtainMethod: 'battle',
    value: 5000
  }
];

// Crafting stations
export const craftingStations: CraftingStation[] = [
  {
    id: 'basic_forge',
    name: 'Basic Forge',
    description: 'Simple forge for basic metalworking',
    icon: '🔥',
    level: 1,
    categories: ['weapon', 'armor'],
    bonuses: {
      successRateBonus: 0,
      timeReduction: 0,
      materialSaving: 0,
      experienceBonus: 0
    },
    cost: 500
  },
  {
    id: 'master_forge',
    name: 'Master Forge',
    description: 'Advanced forge with magical enhancements',
    icon: '⚒️',
    level: 2,
    categories: ['weapon', 'armor', 'upgrade'],
    bonuses: {
      successRateBonus: 15,
      timeReduction: 25,
      materialSaving: 10,
      experienceBonus: 25
    },
    requiredMaterials: [
      { materialId: 'mithril_ore', quantity: 10 },
      { materialId: 'rune_stone', quantity: 3 }
    ],
    cost: 2500
  },
  {
    id: 'enchanting_table',
    name: 'Enchanting Table',
    description: 'Mystical table for magical enhancements',
    icon: '🔮',
    level: 1,
    categories: ['accessory', 'upgrade'],
    bonuses: {
      successRateBonus: 20,
      timeReduction: 0,
      materialSaving: 5,
      experienceBonus: 50
    },
    requiredMaterials: [
      { materialId: 'mana_crystal', quantity: 20 },
      { materialId: 'rune_stone', quantity: 5 }
    ],
    cost: 1500
  },
  {
    id: 'quantum_fabricator',
    name: 'Quantum Fabricator',
    description: 'Futuristic device for advanced manufacturing',
    icon: '🛸',
    level: 3,
    categories: ['weapon', 'armor', 'accessory', 'upgrade'],
    bonuses: {
      successRateBonus: 30,
      timeReduction: 50,
      materialSaving: 25,
      experienceBonus: 75
    },
    requiredMaterials: [
      { materialId: 'titanium_alloy', quantity: 50 },
      { materialId: 'void_essence', quantity: 1 }
    ],
    cost: 10000
  }
];

// Crafting recipes
export const craftingRecipes: CraftingRecipe[] = [
  // Basic weapon crafting
  {
    id: 'craft_iron_sword',
    resultEquipmentId: 'iron_sword',
    name: 'Iron Sword',
    description: 'Craft a basic iron sword',
    category: 'weapon',
    requiredLevel: 1,
    materials: [
      { materialId: 'iron_ore', quantity: 5 },
      { materialId: 'wood_plank', quantity: 2 }
    ],
    gold: 50,
    craftingTime: 30,
    experienceGained: 25,
    successRate: 90
  },
  
  // Character-specific weapon upgrades
  {
    id: 'upgrade_achilles_spear',
    resultEquipmentId: 'iron_sword_achilles',
    name: 'Upgrade Achilles Spear',
    description: 'Upgrade bronze spear to iron sword of Troy',
    category: 'upgrade',
    requiredLevel: 15,
    baseEquipmentId: 'bronze_spear_achilles',
    materials: [
      { materialId: 'steel_ingot', quantity: 3 },
      { materialId: 'rune_stone', quantity: 1 }
    ],
    gold: 200,
    craftingTime: 60,
    experienceGained: 100,
    successRate: 75,
    preserveEnchantments: true
  },
  
  {
    id: 'craft_divine_shield',
    resultEquipmentId: 'shield_invulnerability',
    name: 'Divine Shield',
    description: 'Forge the legendary shield of invulnerability',
    category: 'upgrade',
    requiredLevel: 30,
    baseEquipmentId: 'iron_sword_achilles',
    materials: [
      { materialId: 'mithril_ore', quantity: 10 },
      { materialId: 'phoenix_feather', quantity: 1 },
      { materialId: 'dragon_scale', quantity: 3 }
    ],
    gold: 1000,
    craftingTime: 180,
    experienceGained: 500,
    successRate: 50,
    unlockConditions: {
      characterLevel: 25,
      completedQuests: ['divine_blessing_quest']
    }
  },
  
  // Merlin's staff progression
  {
    id: 'upgrade_merlin_staff',
    resultEquipmentId: 'crystal_orb_merlin',
    name: 'Crystal Orb of Avalon',
    description: 'Transform wooden staff into mystical orb',
    category: 'upgrade',
    requiredLevel: 15,
    baseEquipmentId: 'wooden_staff_merlin',
    materials: [
      { materialId: 'mana_crystal', quantity: 5 },
      { materialId: 'rune_stone', quantity: 2 }
    ],
    gold: 300,
    craftingTime: 90,
    experienceGained: 150,
    successRate: 80
  },
  
  // Holmes' weapon progression
  {
    id: 'craft_sword_cane',
    resultEquipmentId: 'sword_cane_holmes',
    name: 'Gentleman\'s Sword Cane',
    description: 'Craft a concealed blade walking stick',
    category: 'upgrade',
    requiredLevel: 15,
    baseEquipmentId: 'police_club_holmes',
    materials: [
      { materialId: 'steel_ingot', quantity: 2 },
      { materialId: 'leather_hide', quantity: 1 }
    ],
    gold: 150,
    craftingTime: 45,
    experienceGained: 75,
    successRate: 85
  },
  
  // Futuristic crafting
  {
    id: 'craft_quantum_disruptor',
    resultEquipmentId: 'quantum_disruptor',
    name: 'Quantum Reality Disruptor',
    description: 'Craft an advanced reality-warping weapon',
    category: 'upgrade',
    requiredLevel: 30,
    baseEquipmentId: 'plasma_rifle_vega',
    materials: [
      { materialId: 'titanium_alloy', quantity: 20 },
      { materialId: 'void_essence', quantity: 1 },
      { materialId: 'mana_crystal', quantity: 10 }
    ],
    gold: 2000,
    craftingTime: 240,
    experienceGained: 750,
    successRate: 40,
    unlockConditions: {
      characterLevel: 28,
      defeatedEnemies: ['quantum_entity']
    }
  },
  
  // Material refinement recipes
  {
    id: 'smelt_iron',
    resultEquipmentId: 'steel_ingot',
    name: 'Smelt Steel Ingot',
    description: 'Refine iron ore into steel ingot',
    category: 'weapon',
    requiredLevel: 5,
    materials: [
      { materialId: 'iron_ore', quantity: 3 }
    ],
    gold: 10,
    craftingTime: 15,
    experienceGained: 10,
    successRate: 95
  }
];

// Crafting system functions
export class CraftingSystem {
  static canCraftRecipe(recipe: CraftingRecipe, playerCrafting: PlayerCrafting, characterLevel: number): {
    canCraft: boolean;
    missingRequirements: string[];
  } {
    const missing: string[] = [];
    
    // Check level requirement
    if (characterLevel < recipe.requiredLevel) {
      missing.push(`Character level ${recipe.requiredLevel} required`);
    }
    
    // Check crafting level
    if (playerCrafting.craftingLevel < recipe.requiredLevel) {
      missing.push(`Crafting level ${recipe.requiredLevel} required`);
    }
    
    // Check materials
    recipe.materials.forEach(req => {
      const owned = playerCrafting.materials.find(m => m.materialId === req.materialId);
      if (!owned || owned.quantity < req.quantity) {
        const material = craftingMaterials.find(m => m.id === req.materialId);
        missing.push(`${req.quantity}x ${material?.name || req.materialId} (have ${owned?.quantity || 0})`);
      }
    });
    
    // Check unlock conditions
    if (recipe.unlockConditions) {
      if (recipe.unlockConditions.characterLevel && characterLevel < recipe.unlockConditions.characterLevel) {
        missing.push(`Character level ${recipe.unlockConditions.characterLevel} required`);
      }
      
      if (recipe.unlockConditions.completedQuests) {
        recipe.unlockConditions.completedQuests.forEach(quest => {
          missing.push(`Complete quest: ${quest}`);
        });
      }
    }
    
    return {
      canCraft: missing.length === 0,
      missingRequirements: missing
    };
  }
  
  static calculateCraftingSuccess(recipe: CraftingRecipe, stationId?: string): number {
    let successRate = recipe.successRate;
    
    if (stationId) {
      const station = craftingStations.find(s => s.id === stationId);
      if (station) {
        successRate += station.bonuses.successRateBonus;
      }
    }
    
    return Math.min(successRate, 100);
  }
  
  static calculateCraftingTime(recipe: CraftingRecipe, stationId?: string): number {
    let time = recipe.craftingTime;
    
    if (stationId) {
      const station = craftingStations.find(s => s.id === stationId);
      if (station) {
        time = Math.max(time * (1 - station.bonuses.timeReduction / 100), 5);
      }
    }
    
    return Math.round(time);
  }
  
  static startCrafting(recipe: CraftingRecipe, playerCrafting: PlayerCrafting, stationId?: string): {
    success: boolean;
    updatedPlayer: PlayerCrafting;
    message: string;
  } {
    const canCraft = this.canCraftRecipe(recipe, playerCrafting, 50); // Assume max level for now
    
    if (!canCraft.canCraft) {
      return {
        success: false,
        updatedPlayer: playerCrafting,
        message: `Cannot craft: ${canCraft.missingRequirements.join(', ')}`
      };
    }
    
    const updatedPlayer = { ...playerCrafting };
    
    // Consume materials
    recipe.materials.forEach(req => {
      const materialIndex = updatedPlayer.materials.findIndex(m => m.materialId === req.materialId);
      if (materialIndex >= 0) {
        updatedPlayer.materials[materialIndex].quantity -= req.quantity;
        if (updatedPlayer.materials[materialIndex].quantity <= 0) {
          updatedPlayer.materials.splice(materialIndex, 1);
        }
      }
    });
    
    // Calculate completion time
    const craftingTime = this.calculateCraftingTime(recipe, stationId);
    const startTime = new Date();
    const completionTime = new Date(startTime.getTime() + craftingTime * 60000);
    
    // Add to active crafts
    updatedPlayer.activeCrafts.push({
      recipeId: recipe.id,
      startTime,
      completionTime,
      stationId
    });
    
    return {
      success: true,
      updatedPlayer,
      message: `Started crafting ${recipe.name}. Will complete in ${craftingTime} minutes.`
    };
  }
  
  static completeCrafting(activeCarft: { recipeId: string; startTime: number; duration: number }, playerCrafting: PlayerCrafting): {
    success: boolean;
    equipment?: Equipment;
    experience: number;
    message: string;
  } {
    const recipe = craftingRecipes.find(r => r.id === activeCarft.recipeId);
    if (!recipe) {
      return {
        success: false,
        experience: 0,
        message: 'Recipe not found'
      };
    }
    
    const successRate = this.calculateCraftingSuccess(recipe, activeCarft.stationId);
    const success = Math.random() * 100 < successRate;
    
    if (success) {
      return {
        success: true,
        experience: recipe.experienceGained,
        message: `Successfully crafted ${recipe.name}!`
      };
    } else {
      return {
        success: false,
        experience: Math.floor(recipe.experienceGained * 0.25),
        message: `Crafting failed, but gained some experience.`
      };
    }
  }
}

// Helper functions
export function getMaterialsByRarity(rarity: EquipmentRarity): CraftingMaterial[] {
  return craftingMaterials.filter(m => m.rarity === rarity);
}

export function getRecipesForCharacter(characterId: string): CraftingRecipe[] {
  return craftingRecipes.filter(r => 
    r.resultEquipmentId.includes(characterId) || 
    r.baseEquipmentId?.includes(characterId)
  );
}

export function calculateMaterialValue(materials: { materialId: string; quantity: number }[]): number {
  return materials.reduce((total, mat) => {
    const material = craftingMaterials.find(m => m.id === mat.materialId);
    return total + ((material?.value || 0) * mat.quantity);
  }, 0);
}