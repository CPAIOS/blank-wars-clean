// Character Inventory and Equipment Management System
// Complete item storage, equipment slots, and stat management

export interface InventoryItem {
  id: string;
  itemId: string; // References Item or Equipment ID
  quantity: number;
  acquiredDate: Date;
  isEquipped?: boolean;
  equipmentSlot?: 'weapon' | 'armor' | 'accessory';
  enhancementLevel?: number;
  customStats?: Record<string, number>;
  isLocked?: boolean; // Prevents accidental sale/deletion
  isFavorite?: boolean;
}

export interface EquippedItems {
  weapon?: InventoryItem;
  armor?: InventoryItem;
  accessory?: InventoryItem;
}

export interface QuickAccessSlots {
  slot1?: InventoryItem; // Consumable quick-use
  slot2?: InventoryItem;
  slot3?: InventoryItem;
  slot4?: InventoryItem;
}

export interface CharacterInventory {
  characterId: string;
  items: InventoryItem[];
  equipped: EquippedItems;
  quickAccess: QuickAccessSlots;
  maxSlots: number;
  sortPreference: 'type' | 'rarity' | 'level' | 'name' | 'recent';
  autoSort: boolean;
  lastUpdated: Date;
}

export interface InventoryFilter {
  type?: 'all' | 'equipment' | 'consumables' | 'enhancers' | 'crafting' | 'special';
  rarity?: 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  equipped?: 'all' | 'equipped' | 'unequipped';
  search?: string;
  minLevel?: number;
  maxLevel?: number;
}

export interface StatComparison {
  current: Record<string, number>;
  preview: Record<string, number>;
  changes: Record<string, number>;
}

export interface EquipmentLoadout {
  id: string;
  name: string;
  description?: string;
  equipment: EquippedItems;
  quickAccess: QuickAccessSlots;
  createdDate: Date;
  lastUsed?: Date;
  isActive: boolean;
  tags: string[];
}

// Inventory management functions
export function createCharacterInventory(characterId: string, maxSlots: number = 50): CharacterInventory {
  return {
    characterId,
    items: [],
    equipped: {},
    quickAccess: {},
    maxSlots,
    sortPreference: 'type',
    autoSort: true,
    lastUpdated: new Date()
  };
}

export function addItemToInventory(
  inventory: CharacterInventory,
  itemId: string,
  quantity: number = 1
): { success: boolean; updatedInventory: CharacterInventory; error?: string } {
  // Check if inventory has space
  const currentItems = inventory.items.reduce((sum, item) => sum + item.quantity, 0);
  if (currentItems + quantity > inventory.maxSlots) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Inventory full'
    };
  }

  // Check if item already exists (for stackable items)
  const existingItem = inventory.items.find(item => item.itemId === itemId);
  
  const updatedInventory = { ...inventory };
  
  if (existingItem) {
    // Update existing item quantity
    updatedInventory.items = inventory.items.map(item =>
      item.itemId === itemId 
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // Add new item
    const newItem: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      quantity,
      acquiredDate: new Date(),
      isEquipped: false
    };
    updatedInventory.items = [...inventory.items, newItem];
  }

  updatedInventory.lastUpdated = new Date();

  // Auto-sort if enabled
  if (updatedInventory.autoSort) {
    updatedInventory.items = sortInventoryItems(updatedInventory.items, inventory.sortPreference);
  }

  return {
    success: true,
    updatedInventory
  };
}

export function removeItemFromInventory(
  inventory: CharacterInventory,
  inventoryItemId: string,
  quantity: number = 1
): { success: boolean; updatedInventory: CharacterInventory; error?: string } {
  const item = inventory.items.find(item => item.id === inventoryItemId);
  
  if (!item) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Item not found'
    };
  }

  if (item.isLocked) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Item is locked'
    };
  }

  if (item.isEquipped) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Cannot remove equipped item'
    };
  }

  if (quantity >= item.quantity) {
    // Remove item completely
    const updatedInventory = {
      ...inventory,
      items: inventory.items.filter(i => i.id !== inventoryItemId),
      lastUpdated: new Date()
    };
    return { success: true, updatedInventory };
  } else {
    // Reduce quantity
    const updatedInventory = {
      ...inventory,
      items: inventory.items.map(i =>
        i.id === inventoryItemId 
          ? { ...i, quantity: i.quantity - quantity }
          : i
      ),
      lastUpdated: new Date()
    };
    return { success: true, updatedInventory };
  }
}

export function equipItem(
  inventory: CharacterInventory,
  inventoryItemId: string,
  slot: 'weapon' | 'armor' | 'accessory'
): { success: boolean; updatedInventory: CharacterInventory; error?: string; unequippedItem?: InventoryItem } {
  const item = inventory.items.find(item => item.id === inventoryItemId);
  
  if (!item) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Item not found'
    };
  }

  // Check if item is already equipped
  if (item.isEquipped) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Item is already equipped'
    };
  }

  const updatedInventory = { ...inventory };
  let unequippedItem: InventoryItem | undefined;

  // Unequip current item in slot if exists
  if (updatedInventory.equipped[slot]) {
    const currentEquipped = updatedInventory.equipped[slot]!;
    unequippedItem = currentEquipped;
    
    // Mark as unequipped
    updatedInventory.items = updatedInventory.items.map(i =>
      i.id === currentEquipped.id
        ? { ...i, isEquipped: false, equipmentSlot: undefined }
        : i
    );
  }

  // Equip new item
  updatedInventory.items = updatedInventory.items.map(i =>
    i.id === inventoryItemId
      ? { ...i, isEquipped: true, equipmentSlot: slot }
      : i
  );

  updatedInventory.equipped[slot] = updatedInventory.items.find(i => i.id === inventoryItemId)!;
  updatedInventory.lastUpdated = new Date();

  return {
    success: true,
    updatedInventory,
    unequippedItem
  };
}

export function unequipItem(
  inventory: CharacterInventory,
  slot: 'weapon' | 'armor' | 'accessory'
): { success: boolean; updatedInventory: CharacterInventory; error?: string } {
  const equippedItem = inventory.equipped[slot];
  
  if (!equippedItem) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'No item equipped in this slot'
    };
  }

  const updatedInventory = {
    ...inventory,
    items: inventory.items.map(item =>
      item.id === equippedItem.id
        ? { ...item, isEquipped: false, equipmentSlot: undefined }
        : item
    ),
    equipped: {
      ...inventory.equipped,
      [slot]: undefined
    },
    lastUpdated: new Date()
  };

  return {
    success: true,
    updatedInventory
  };
}

export function setQuickAccessSlot(
  inventory: CharacterInventory,
  slotNumber: 1 | 2 | 3 | 4,
  inventoryItemId?: string
): { success: boolean; updatedInventory: CharacterInventory; error?: string } {
  const slotKey = `slot${slotNumber}` as keyof QuickAccessSlots;
  
  if (!inventoryItemId) {
    // Clear slot
    const updatedInventory = {
      ...inventory,
      quickAccess: {
        ...inventory.quickAccess,
        [slotKey]: undefined
      },
      lastUpdated: new Date()
    };
    return { success: true, updatedInventory };
  }

  const item = inventory.items.find(item => item.id === inventoryItemId);
  
  if (!item) {
    return {
      success: false,
      updatedInventory: inventory,
      error: 'Item not found'
    };
  }

  const updatedInventory = {
    ...inventory,
    quickAccess: {
      ...inventory.quickAccess,
      [slotKey]: item
    },
    lastUpdated: new Date()
  };

  return {
    success: true,
    updatedInventory
  };
}

export function filterInventoryItems(items: InventoryItem[], filter: InventoryFilter): InventoryItem[] {
  return items.filter(item => {
    // Type filter
    if (filter.type && filter.type !== 'all') {
      // This would need to check against the actual item data
      // For now, we'll assume the filter passes
    }

    // Rarity filter
    if (filter.rarity && filter.rarity !== 'all') {
      // This would need to check against the actual item data
    }

    // Equipped filter
    if (filter.equipped && filter.equipped !== 'all') {
      if (filter.equipped === 'equipped' && !item.isEquipped) return false;
      if (filter.equipped === 'unequipped' && item.isEquipped) return false;
    }

    // Search filter
    if (filter.search) {
      // This would need to check against item names/descriptions
    }

    return true;
  });
}

export function sortInventoryItems(items: InventoryItem[], sortBy: CharacterInventory['sortPreference']): InventoryItem[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.acquiredDate).getTime() - new Date(a.acquiredDate).getTime();
      case 'name':
        return a.itemId.localeCompare(b.itemId);
      case 'type':
      case 'rarity':
      case 'level':
      default:
        // These would need actual item data to sort properly
        return a.itemId.localeCompare(b.itemId);
    }
  });
}

export function calculateInventoryStats(inventory: CharacterInventory): {
  totalItems: number;
  usedSlots: number;
  availableSlots: number;
  equippedItems: number;
  valueByRarity: Record<string, number>;
} {
  const totalItems = inventory.items.reduce((sum, item) => sum + item.quantity, 0);
  const equippedItems = Object.values(inventory.equipped).filter(Boolean).length;
  
  return {
    totalItems,
    usedSlots: totalItems,
    availableSlots: inventory.maxSlots - totalItems,
    equippedItems,
    valueByRarity: {} // Would calculate based on actual item data
  };
}

export function createLoadout(
  name: string,
  description: string,
  equipment: EquippedItems,
  quickAccess: QuickAccessSlots,
  tags: string[] = []
): EquipmentLoadout {
  return {
    id: `loadout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    equipment,
    quickAccess,
    createdDate: new Date(),
    isActive: false,
    tags
  };
}

export function applyLoadout(
  inventory: CharacterInventory,
  loadout: EquipmentLoadout
): { success: boolean; updatedInventory: CharacterInventory; errors: string[] } {
  let updatedInventory = { ...inventory };
  const errors: string[] = [];

  // Unequip all current items
  Object.keys(updatedInventory.equipped).forEach(slot => {
    const result = unequipItem(updatedInventory, slot as any);
    if (result.success) {
      updatedInventory = result.updatedInventory;
    }
  });

  // Equip loadout items
  Object.entries(loadout.equipment).forEach(([slot, item]) => {
    if (item) {
      // Find the item in inventory
      const inventoryItem = updatedInventory.items.find(i => i.itemId === item.itemId);
      if (inventoryItem) {
        const result = equipItem(updatedInventory, inventoryItem.id, slot as any);
        if (result.success) {
          updatedInventory = result.updatedInventory;
        } else {
          errors.push(`Failed to equip ${slot}: ${result.error}`);
        }
      } else {
        errors.push(`Item not found in inventory: ${item.itemId}`);
      }
    }
  });

  // Set quick access slots
  Object.entries(loadout.quickAccess).forEach(([slotKey, item]) => {
    if (item) {
      const slotNumber = parseInt(slotKey.replace('slot', '')) as 1 | 2 | 3 | 4;
      const inventoryItem = updatedInventory.items.find(i => i.itemId === item.itemId);
      if (inventoryItem) {
        const result = setQuickAccessSlot(updatedInventory, slotNumber, inventoryItem.id);
        if (result.success) {
          updatedInventory = result.updatedInventory;
        } else {
          errors.push(`Failed to set quick access slot ${slotNumber}: ${result.error}`);
        }
      }
    }
  });

  return {
    success: errors.length === 0,
    updatedInventory,
    errors
  };
}

// Demo inventory data
export function createDemoInventory(characterId: string): CharacterInventory {
  const inventory = createCharacterInventory(characterId, 50);
  
  // Add some demo items
  const demoItems: { itemId: string; quantity: number }[] = [
    { itemId: 'iron_sword', quantity: 1 },
    { itemId: 'steel_armor', quantity: 1 },
    { itemId: 'health_potion', quantity: 5 },
    { itemId: 'mana_potion', quantity: 3 },
    { itemId: 'strength_enhancer', quantity: 2 },
    { itemId: 'mythril_ring', quantity: 1 },
    { itemId: 'magic_scroll', quantity: 4 },
    { itemId: 'crafting_ore', quantity: 10 },
    { itemId: 'ancient_relic', quantity: 1 },
    { itemId: 'speed_boots', quantity: 1 }
  ];

  let updatedInventory = inventory;
  
  demoItems.forEach(({ itemId, quantity }) => {
    const result = addItemToInventory(updatedInventory, itemId, quantity);
    if (result.success) {
      updatedInventory = result.updatedInventory;
    }
  });

  return updatedInventory;
}