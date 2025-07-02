// Items System for _____ Wars
// ALL GENRES & TIME PERIODS - From Ancient Times to Future Sci-Fi
// Consumables, enhancers, and special items for battle and training

export type ItemType = 'healing' | 'enhancement' | 'training' | 'battle' | 'special' | 'material';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type UsageContext = 'battle' | 'training' | 'anytime' | 'specific';

export interface ItemEffect {
  type: 'heal' | 'stat_boost' | 'energy_restore' | 'xp_boost' | 'training_boost' | 'protection' | 'special';
  value: number;
  duration?: number; // in turns for battle, minutes for training
  target?: 'self' | 'enemy' | 'all_allies';
  stat?: 'atk' | 'def' | 'spd' | 'hp' | 'energy' | 'all';
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  effects: ItemEffect[];
  usageContext: UsageContext;
  stackable: boolean;
  maxStack: number;
  cooldown?: number; // turns in battle
  price: number;
  craftingCost?: { materials: { item: string; quantity: number }[]; gold: number };
  obtainMethod: 'shop' | 'craft' | 'drop' | 'quest' | 'event' | 'premium';
  flavor: string;
  consumeOnUse: boolean;
}

// Item rarity configuration
export const itemRarityConfig: Record<ItemRarity, {
  name: string;
  color: string;
  textColor: string;
  dropRate: number;
  icon: string;
  valueMultiplier: number;
}> = {
  common: {
    name: 'Common',
    color: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-300',
    dropRate: 0.7,
    icon: '⚪',
    valueMultiplier: 1.0
  },
  uncommon: {
    name: 'Uncommon',
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-300',
    dropRate: 0.2,
    icon: '🟢',
    valueMultiplier: 1.5
  },
  rare: {
    name: 'Rare',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-300',
    dropRate: 0.08,
    icon: '🔵',
    valueMultiplier: 2.5
  },
  epic: {
    name: 'Epic',
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-300',
    dropRate: 0.015,
    icon: '🟣',
    valueMultiplier: 5.0
  },
  legendary: {
    name: 'Legendary',
    color: 'from-yellow-500 to-orange-500',
    textColor: 'text-yellow-300',
    dropRate: 0.005,
    icon: '🟡',
    valueMultiplier: 10.0
  }
};

// ALL GENRES & TIME PERIODS ITEMS
export const allItems: Item[] = [
  // ANCIENT MYTHOLOGY
  {
    id: 'ambrosia',
    name: 'Ambrosia',
    description: 'Food of the gods that grants divine healing',
    type: 'healing',
    rarity: 'legendary',
    icon: '🍯',
    effects: [{ type: 'heal', value: 100, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 5,
    price: 10000,
    obtainMethod: 'quest',
    flavor: 'Sweet nectar that flows from Mount Olympus itself',
    consumeOnUse: true
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    description: 'Mystical feather that resurrects fallen allies',
    type: 'special',
    rarity: 'epic',
    icon: '🪶',
    effects: [{ type: 'heal', value: 50, target: 'self' }, { type: 'protection', value: 25, duration: 3 }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 3,
    price: 5000,
    obtainMethod: 'drop',
    flavor: 'Burning with eternal flame, yet cool to the touch',
    consumeOnUse: true
  },

  // MEDIEVAL FANTASY
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Standard red healing potion',
    type: 'healing',
    rarity: 'common',
    icon: '🧪',
    effects: [{ type: 'heal', value: 25, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 20,
    price: 50,
    obtainMethod: 'shop',
    flavor: 'Tastes like cherries and questionable alchemy',
    consumeOnUse: true
  },
  {
    id: 'mana_crystal',
    name: 'Mana Crystal',
    description: 'Crystallized magical energy',
    type: 'enhancement',
    rarity: 'uncommon',
    icon: '💎',
    effects: [{ type: 'energy_restore', value: 30, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 15,
    price: 120,
    obtainMethod: 'shop',
    flavor: 'Hums with arcane power',
    consumeOnUse: true
  },

  // MODERN ERA
  {
    id: 'energy_drink',
    name: 'Extreme Energy Drink',
    description: 'High-caffeine energy drink for instant alertness',
    type: 'enhancement',
    rarity: 'common',
    icon: '🥤',
    effects: [{ type: 'stat_boost', value: 15, stat: 'spd', duration: 5, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 10,
    price: 25,
    obtainMethod: 'shop',
    flavor: 'Warning: May cause jitters and superhuman reflexes',
    consumeOnUse: true
  },
  {
    id: 'protein_shake',
    name: 'Protein Power Shake',
    description: 'Muscle-building protein drink',
    type: 'training',
    rarity: 'common',
    icon: '🥛',
    effects: [{ type: 'training_boost', value: 20, duration: 60, target: 'self' }],
    usageContext: 'training',
    stackable: true,
    maxStack: 25,
    price: 35,
    obtainMethod: 'shop',
    flavor: 'Vanilla flavored gains in a bottle',
    consumeOnUse: true
  },
  {
    id: 'first_aid_kit',
    name: 'First Aid Kit',
    description: 'Modern medical supplies for field treatment',
    type: 'healing',
    rarity: 'uncommon',
    icon: '🩹',
    effects: [{ type: 'heal', value: 40, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 8,
    price: 150,
    obtainMethod: 'shop',
    flavor: 'Contains bandages, antiseptic, and hope',
    consumeOnUse: true
  },

  // SCI-FI FUTURE
  {
    id: 'nano_repair_bot',
    name: 'Nano Repair Bots',
    description: 'Microscopic robots that repair cellular damage',
    type: 'healing',
    rarity: 'epic',
    icon: '🤖',
    effects: [{ type: 'heal', value: 80, target: 'self' }, { type: 'stat_boost', value: 10, stat: 'def', duration: 10 }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 5,
    price: 3500,
    obtainMethod: 'craft',
    flavor: 'Self-replicating medical technology from the 31st century',
    consumeOnUse: true
  },
  {
    id: 'quantum_battery',
    name: 'Quantum Energy Cell',
    description: 'Unlimited energy source from quantum fluctuations',
    type: 'enhancement',
    rarity: 'legendary',
    icon: '⚡',
    effects: [{ type: 'energy_restore', value: 100, target: 'self' }, { type: 'stat_boost', value: 25, stat: 'all', duration: 5 }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 2,
    price: 15000,
    obtainMethod: 'premium',
    flavor: 'Harnesses the power of parallel dimensions',
    consumeOnUse: true
  },
  {
    id: 'cybernetic_enhancer',
    name: 'Cybernetic Enhancement Chip',
    description: 'Neural implant that boosts cognitive function',
    type: 'enhancement',
    rarity: 'rare',
    icon: '🧠',
    effects: [{ type: 'stat_boost', value: 30, stat: 'atk', duration: 8, target: 'self' }],
    usageContext: 'battle',
    stackable: false,
    maxStack: 1,
    cooldown: 5,
    price: 2000,
    obtainMethod: 'craft',
    flavor: 'Wetware meets hardware in perfect harmony',
    consumeOnUse: false
  },

  // ANIME/MANGA
  {
    id: 'senzu_bean',
    name: 'Senzu Bean',
    description: 'Magical bean that fully restores health and energy',
    type: 'healing',
    rarity: 'epic',
    icon: '🫘',
    effects: [{ type: 'heal', value: 100, target: 'self' }, { type: 'energy_restore', value: 100, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 3,
    price: 8000,
    obtainMethod: 'quest',
    flavor: 'Grown on sacred towers, one bean feeds you for 10 days',
    consumeOnUse: true
  },
  {
    id: 'chakra_pill',
    name: 'Chakra Enhancement Pill',
    description: 'Dangerous pill that boosts chakra at great cost',
    type: 'enhancement',
    rarity: 'rare',
    icon: '💊',
    effects: [{ type: 'stat_boost', value: 50, stat: 'atk', duration: 3, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 5,
    price: 1500,
    obtainMethod: 'shop',
    flavor: 'Power at a price - use with extreme caution',
    consumeOnUse: true
  },

  // SUPERHERO COMICS
  {
    id: 'super_soldier_serum',
    name: 'Super Soldier Serum',
    description: 'Experimental serum that enhances human capabilities',
    type: 'enhancement',
    rarity: 'legendary',
    icon: '💉',
    effects: [{ type: 'stat_boost', value: 40, stat: 'all', duration: 12, target: 'self' }],
    usageContext: 'battle',
    stackable: false,
    maxStack: 1,
    cooldown: 10,
    price: 12000,
    obtainMethod: 'event',
    flavor: 'With great power comes great responsibility',
    consumeOnUse: true
  },
  {
    id: 'kryptonite_shard',
    name: 'Kryptonite Shard',
    description: 'Radioactive crystal that weakens certain enemies',
    type: 'battle',
    rarity: 'rare',
    icon: '💚',
    effects: [{ type: 'stat_boost', value: -30, stat: 'all', duration: 5, target: 'enemy' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 8,
    price: 2500,
    obtainMethod: 'drop',
    flavor: 'Green death for those from distant worlds',
    consumeOnUse: true
  },

  // HORROR/GOTHIC
  {
    id: 'holy_water',
    name: 'Blessed Holy Water',
    description: 'Sacred water blessed by ancient rituals',
    type: 'special',
    rarity: 'uncommon',
    icon: '💧',
    effects: [{ type: 'protection', value: 20, duration: 8, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 12,
    price: 200,
    obtainMethod: 'shop',
    flavor: 'Effective against creatures of darkness',
    consumeOnUse: true
  },
  {
    id: 'blood_vial',
    name: 'Crimson Blood Vial',
    description: 'Vampire blood with regenerative properties',
    type: 'healing',
    rarity: 'rare',
    icon: '🩸',
    effects: [{ type: 'heal', value: 60, target: 'self' }, { type: 'stat_boost', value: 15, stat: 'atk', duration: 5 }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 6,
    price: 1800,
    obtainMethod: 'drop',
    flavor: 'The gift and curse of the undead',
    consumeOnUse: true
  },

  // VIDEO GAME REFERENCES
  {
    id: 'mushroom_1up',
    name: '1-UP Mushroom',
    description: 'Green mushroom that grants an extra life',
    type: 'special',
    rarity: 'epic',
    icon: '🍄',
    effects: [{ type: 'special', value: 1, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 3,
    price: 5000,
    obtainMethod: 'event',
    flavor: 'The sound of coins and extra lives',
    consumeOnUse: true
  },
  {
    id: 'estus_flask',
    name: 'Estus Flask',
    description: 'Flask of golden liquid that heals the undead',
    type: 'healing',
    rarity: 'rare',
    icon: '🍯',
    effects: [{ type: 'heal', value: 75, target: 'self' }],
    usageContext: 'anytime',
    stackable: false,
    maxStack: 1,
    price: 3000,
    obtainMethod: 'quest',
    flavor: 'Kindled from the first flame itself',
    consumeOnUse: false
  },

  // FOOD & DRINK FROM ALL CULTURES
  {
    id: 'green_tea',
    name: 'Matcha Green Tea',
    description: 'Traditional Japanese tea that calms the mind',
    type: 'training',
    rarity: 'common',
    icon: '🍵',
    effects: [{ type: 'training_boost', value: 15, duration: 45, target: 'self' }],
    usageContext: 'training',
    stackable: true,
    maxStack: 20,
    price: 30,
    obtainMethod: 'shop',
    flavor: 'Ceremony in a cup, wisdom in every sip',
    consumeOnUse: true
  },
  {
    id: 'espresso_shot',
    name: 'Double Espresso',
    description: 'Italian coffee shot for instant alertness',
    type: 'enhancement',
    rarity: 'common',
    icon: '☕',
    effects: [{ type: 'stat_boost', value: 10, stat: 'spd', duration: 3, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 15,
    price: 20,
    obtainMethod: 'shop',
    flavor: 'Concentrated awakening from the streets of Rome',
    consumeOnUse: true
  },
  {
    id: 'honey_mead',
    name: 'Viking Honey Mead',
    description: 'Fermented honey drink that boosts courage',
    type: 'enhancement',
    rarity: 'uncommon',
    icon: '🍺',
    effects: [{ type: 'stat_boost', value: 20, stat: 'atk', duration: 4, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 8,
    price: 180,
    obtainMethod: 'shop',
    flavor: 'Drink of warriors and skalds alike',
    consumeOnUse: true
  },

  // MODERN TECH ITEMS
  {
    id: 'smartphone',
    name: 'Tactical Smartphone',
    description: 'Advanced phone with battle analysis apps',
    type: 'special',
    rarity: 'uncommon',
    icon: '📱',
    effects: [{ type: 'xp_boost', value: 25, duration: 30, target: 'self' }],
    usageContext: 'anytime',
    stackable: false,
    maxStack: 1,
    price: 800,
    obtainMethod: 'shop',
    flavor: 'Knowledge at your fingertips',
    consumeOnUse: false
  },
  {
    id: 'power_bank',
    name: 'Portable Power Bank',
    description: 'External battery for electronic devices',
    type: 'enhancement',
    rarity: 'common',
    icon: '🔋',
    effects: [{ type: 'energy_restore', value: 20, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 10,
    price: 75,
    obtainMethod: 'shop',
    flavor: 'Never run out of juice again',
    consumeOnUse: true
  },

  // MAGICAL ARTIFACTS
  {
    id: 'time_crystal',
    name: 'Temporal Crystal',
    description: 'Crystal that manipulates the flow of time',
    type: 'special',
    rarity: 'legendary',
    icon: '⏳',
    effects: [{ type: 'special', value: 2, target: 'self' }],
    usageContext: 'battle',
    stackable: true,
    maxStack: 2,
    cooldown: 8,
    price: 20000,
    obtainMethod: 'premium',
    flavor: 'Time is a flat circle, except when it\'s not',
    consumeOnUse: true
  },
  {
    id: 'luck_charm',
    name: 'Four-Leaf Clover',
    description: 'Rare clover that brings good fortune',
    type: 'enhancement',
    rarity: 'rare',
    icon: '🍀',
    effects: [{ type: 'special', value: 15, target: 'self' }],
    usageContext: 'anytime',
    stackable: true,
    maxStack: 5,
    price: 1200,
    obtainMethod: 'drop',
    flavor: 'Luck of the Irish in plant form',
    consumeOnUse: false
  }
];

// Item category helpers
export const getItemsByType = (type: ItemType): Item[] => {
  return allItems.filter(item => item.type === type);
};

export const getItemsByRarity = (rarity: ItemRarity): Item[] => {
  return allItems.filter(item => item.rarity === rarity);
};

export const getItemsByUsage = (usage: UsageContext): Item[] => {
  return allItems.filter(item => item.usageContext === usage);
};

export const getRandomItems = (count: number, rarity?: ItemRarity): Item[] => {
  const sourceItems = rarity ? getItemsByRarity(rarity) : allItems;
  const shuffled = [...sourceItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const calculateItemValue = (item: Item): number => {
  const rarityMultiplier = itemRarityConfig[item.rarity].valueMultiplier;
  return Math.floor(item.price * rarityMultiplier);
};

// Get items that can be used in a specific context
export const getUsableItems = (context: UsageContext, characterLevel: number = 1): Item[] => {
  return allItems.filter(item => {
    // Check usage context
    if (item.usageContext !== context && item.usageContext !== 'anytime') {
      return false;
    }
    
    // Check level requirements (if any)
    if (item.craftingCost && characterLevel < 1) {
      return false;
    }
    
    return true;
  });
};

// Check if a character can use a specific item
export const canUseItem = (item: Item, characterLevel: number, context: UsageContext): boolean => {
  // Check usage context
  if (item.usageContext !== context && item.usageContext !== 'anytime') {
    return false;
  }
  
  // Check level requirements (basic implementation)
  if (item.rarity === 'legendary' && characterLevel < 10) {
    return false;
  }
  if (item.rarity === 'epic' && characterLevel < 5) {
    return false;
  }
  
  return true;
};

// Crafting system interface
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  resultItem: string; // Item ID
  resultQuantity: number;
  materials: { itemId: string; quantity: number }[];
  goldCost: number;
  requiredLevel: number;
  craftingTime: number; // in minutes
  successRate: number; // 0-100
}

// Crafting recipes for items
export const craftingRecipes: CraftingRecipe[] = [
  {
    id: 'health_potion_craft',
    name: 'Brew Health Potion',
    description: 'Combine herbs to create a healing potion',
    resultItem: 'health_potion',
    resultQuantity: 1,
    materials: [
      { itemId: 'healing_herb', quantity: 2 },
      { itemId: 'pure_water', quantity: 1 }
    ],
    goldCost: 50,
    requiredLevel: 1,
    craftingTime: 5,
    successRate: 90
  },
  {
    id: 'strength_brew_craft',
    name: 'Brew Strength Elixir',
    description: 'Create a powerful strength-enhancing potion',
    resultItem: 'strength_brew',
    resultQuantity: 1,
    materials: [
      { itemId: 'warriors_root', quantity: 1 },
      { itemId: 'mountain_spring', quantity: 1 }
    ],
    goldCost: 100,
    requiredLevel: 3,
    craftingTime: 10,
    successRate: 75
  },
  {
    id: 'energy_drink_craft',
    name: 'Mix Energy Drink',
    description: 'Combine modern ingredients for instant energy',
    resultItem: 'energy_drink',
    resultQuantity: 1,
    materials: [
      { itemId: 'caffeine_extract', quantity: 1 },
      { itemId: 'sugar_cube', quantity: 2 }
    ],
    goldCost: 25,
    requiredLevel: 1,
    craftingTime: 2,
    successRate: 95
  }
];

// Demo item collection for UI testing
export const createDemoItemInventory = (): Item[] => {
  return [
    ...getRandomItems(3, 'common'),
    ...getRandomItems(2, 'uncommon'),
    ...getRandomItems(1, 'rare'),
  ];
};