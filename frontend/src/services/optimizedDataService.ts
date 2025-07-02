/**
 * Optimized data service for large game data structures
 * Implements lazy loading, indexing, and caching for better performance
 */

import { createLazyLoader, createIndexedAccess, memoize } from '@/utils/dataOptimization';

// Lazy loaders for large data files
export const loadCharacters = createLazyLoader(
  () => import('@/data/characters').then(m => m.gameCharacters || []),
  'characters'
);

export const loadAbilities = createLazyLoader(
  () => import('@/data/abilities').then(m => m.characterAbilities || []),
  'abilities'
);

export const loadEquipment = createLazyLoader(
  () => import('@/data/equipment').then(m => m.equipmentDatabase || []),
  'equipment'
);

export const loadItems = createLazyLoader(
  () => import('@/data/items').then(m => m.itemDatabase || []),
  'items'
);

// Indexed access for fast lookups
let characterIndex: ReturnType<typeof createIndexedAccess> | null = null;
let abilityIndex: ReturnType<typeof createIndexedAccess> | null = null;
let equipmentIndex: ReturnType<typeof createIndexedAccess> | null = null;
let itemIndex: ReturnType<typeof createIndexedAccess> | null = null;

export async function getCharacterIndex() {
  if (!characterIndex) {
    const characters = await loadCharacters();
    if (Array.isArray(characters)) {
      characterIndex = createIndexedAccess(characters, 'characters');
    } else {
      // Handle object format
      const characterArray = Object.values(characters);
      characterIndex = createIndexedAccess(characterArray, 'characters');
    }
  }
  return characterIndex;
}

export async function getAbilityIndex() {
  if (!abilityIndex) {
    const abilities = await loadAbilities();
    if (Array.isArray(abilities)) {
      abilityIndex = createIndexedAccess(abilities, 'abilities');
    } else {
      const abilityArray = Object.values(abilities);
      abilityIndex = createIndexedAccess(abilityArray, 'abilities');
    }
  }
  return abilityIndex;
}

export async function getEquipmentIndex() {
  if (!equipmentIndex) {
    const equipment = await loadEquipment();
    if (Array.isArray(equipment)) {
      equipmentIndex = createIndexedAccess(equipment, 'equipment');
    } else {
      const equipmentArray = Object.values(equipment);
      equipmentIndex = createIndexedAccess(equipmentArray, 'equipment');
    }
  }
  return equipmentIndex;
}

export async function getItemIndex() {
  if (!itemIndex) {
    const items = await loadItems();
    if (Array.isArray(items)) {
      itemIndex = createIndexedAccess(items, 'items');
    } else {
      const itemArray = Object.values(items);
      itemIndex = createIndexedAccess(itemArray, 'items');
    }
  }
  return itemIndex;
}

// Optimized lookup functions
export const getCharacterById = memoize(async (id: string) => {
  const index = await getCharacterIndex();
  return index.getById(id);
});

export const getCharactersByIds = memoize(async (ids: string[]) => {
  const index = await getCharacterIndex();
  return index.getByIds(ids);
}, (ids) => ids.sort().join(','));

export const getAbilityById = memoize(async (id: string) => {
  const index = await getAbilityIndex();
  return index.getById(id);
});

export const getEquipmentById = memoize(async (id: string) => {
  const index = await getEquipmentIndex();
  return index.getById(id);
});

export const getItemById = memoize(async (id: string) => {
  const index = await getItemIndex();
  return index.getById(id);
});

// Filtered searches with memoization
export const getCharactersByArchetype = memoize(async (archetype: string) => {
  const index = await getCharacterIndex();
  return index.search(char => char.archetype === archetype);
});

export const getCharactersByRarity = memoize(async (rarity: string) => {
  const index = await getCharacterIndex();
  return index.search(char => char.rarity === rarity);
});

export const getEquipmentByType = memoize(async (type: string) => {
  const index = await getEquipmentIndex();
  return index.search(item => item.type === type);
});

export const getAbilitiesByType = memoize(async (type: string) => {
  const index = await getAbilityIndex();
  return index.search(ability => ability.type === type);
});

// Batch operations for efficiency
export async function preloadEssentialData() {
  // Load only the most commonly used data
  const promises = [
    loadCharacters(),
    loadAbilities(),
    // Don't preload equipment and items unless needed
  ];
  
  await Promise.all(promises);
}

export async function getCharacterWithDependencies(characterId: string) {
  const character = await getCharacterById(characterId);
  if (!character) return null;
  
  // Load related data in parallel
  const [abilities, equipment] = await Promise.all([
    character.abilities ? getCharactersByIds(character.abilities) : [],
    character.equipment ? getEquipmentById(character.equipment.weapon?.id || '') : null,
  ]);
  
  return {
    character,
    abilities,
    equipment
  };
}

// Clean up function for memory management
export function clearOptimizedDataCache() {
  characterIndex = null;
  abilityIndex = null;
  equipmentIndex = null;
  itemIndex = null;
}