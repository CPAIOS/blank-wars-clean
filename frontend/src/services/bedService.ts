import { HeadquartersState, Bed, PurchasableBed } from '../types/headquarters';

/**
 * Purchase a bed for a room
 */
export const purchaseBed = (
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

  // Update headquarters state
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
};