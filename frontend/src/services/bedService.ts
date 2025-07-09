import { HeadquartersState, Bed, PurchasableBed } from '../types/headquarters';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

/**
 * Purchase a bed for a room
 */
export const purchaseBed = async (
  roomId: string,
  bedType: PurchasableBed,
  headquarters: HeadquartersState,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void,
  setMoveNotification: (notification: { message: string; type: string }) => void
) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room) return;

  // Check if player has enough currency
  if (headquarters.currency.coins < bedType.cost.coins || headquarters.currency.gems < bedType.cost.gems) {
    alert(`Not enough currency! Need ${bedType.cost.coins} coins and ${bedType.cost.gems} gems.`);
    return;
  }

  // Generate unique bed ID
  const newBedId = `${bedType.type}_${Date.now()}`;
  const newBed: Bed = {
    id: newBedId,
    type: bedType.type,
    position: { x: room.beds.length, y: 0 }, // Simple positioning
    capacity: bedType.capacity,
    comfortBonus: bedType.comfortBonus
  };

  try {
    // Call API to purchase bed
    const response = await fetch(`${API_URL}/api/headquarters/purchase-bed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        roomId,
        bedData: {
          id: newBedId,
          type: bedType.type,
          position: newBed.position,
          capacity: bedType.capacity,
          comfortBonus: bedType.comfortBonus,
          cost: bedType.cost
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to purchase bed');
    }

    // Update local state on success
    setHeadquarters(prev => ({
      ...prev,
      currency: {
        coins: prev.currency.coins - bedType.cost.coins,
        gems: prev.currency.gems - bedType.cost.gems
      },
      rooms: prev.rooms.map(r => 
        r.id === roomId 
          ? { ...r, beds: [...r.beds, newBed] }
          : r
      )
    }));

    setMoveNotification({
      message: `${bedType.name} purchased for ${room.name}! +${bedType.capacity} sleeping capacity`,
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to purchase bed:', error);
    setMoveNotification({
      message: `Failed to purchase ${bedType.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error'
    });
  }
};

/**
 * Load headquarters data from API
 */
export const loadHeadquarters = async (): Promise<HeadquartersState | null> => {
  try {
    const response = await fetch(`${API_URL}/api/headquarters`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to load headquarters');
    }

    const data = await response.json();
    return data.headquarters;
  } catch (error) {
    console.error('Failed to load headquarters:', error);
    return null;
  }
};

/**
 * Save headquarters data to API
 */
export const saveHeadquarters = async (headquarters: HeadquartersState): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/headquarters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ headquarters })
    });

    if (!response.ok) {
      throw new Error('Failed to save headquarters');
    }

    return true;
  } catch (error) {
    console.error('Failed to save headquarters:', error);
    return false;
  }
};