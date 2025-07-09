import { HeadquartersTier, RoomTheme, RoomElement, PurchasableBed } from '../types/headquarters';

// Purchasable bed options for expanding room capacity
export const PURCHASABLE_BEDS: PurchasableBed[] = [
  {
    id: 'additional_bunk',
    name: 'Additional Bunk Bed',
    type: 'bunk_bed',
    description: 'A sturdy metal bunk bed that sleeps 2 fighters. Decent comfort for the price.',
    capacity: 2,
    comfortBonus: 10,
    cost: { coins: 15000, gems: 25 },
    icon: '🛏️'
  },
  {
    id: 'air_mattress',
    name: 'Air Mattress',
    type: 'air_mattress',
    description: 'Inflatable mattress for emergency sleeping. Better than the floor, barely.',
    capacity: 1,
    comfortBonus: 2,
    cost: { coins: 5000, gems: 5 },
    icon: '🛌'
  }
];

// Headquarters progression tiers - determines building size and capacity
export const HEADQUARTERS_TIERS: HeadquartersTier[] = [
  {
    id: 'spartan_apartment',
    name: 'Spartan Apartment',
    description: 'A cramped 2-room apartment where legendary warriors share bunk beds. Not ideal, but everyone starts somewhere!',
    maxRooms: 2,
    charactersPerRoom: 4,
    cost: { coins: 0, gems: 0 },
    unlockLevel: 1,
    roomUpgrades: ['basic_furniture']
  },
  {
    id: 'basic_house',
    name: 'Basic House',
    description: 'A modest house with individual rooms. Characters finally get some privacy and better sleep!',
    maxRooms: 6,
    charactersPerRoom: 3,
    cost: { coins: 25000, gems: 50 },
    unlockLevel: 10,
    roomUpgrades: ['basic_furniture', 'private_rooms']
  },
  {
    id: 'team_mansion',
    name: 'Team Mansion',
    description: 'A luxurious mansion with themed rooms. Characters can customize their living spaces for battle bonuses!',
    maxRooms: 10,
    charactersPerRoom: 2,
    cost: { coins: 100000, gems: 200 },
    unlockLevel: 25,
    roomUpgrades: ['luxury_furniture', 'themed_rooms', 'common_areas']
  },
  {
    id: 'elite_compound',
    name: 'Elite Compound',
    description: 'The ultimate headquarters with specialized facilities, training rooms, and maximum theme bonuses!',
    maxRooms: 15,
    charactersPerRoom: 1,
    cost: { coins: 500000, gems: 1000 },
    unlockLevel: 50,
    roomUpgrades: ['elite_furniture', 'specialized_facilities', 'max_bonuses']
  }
];

// Room themes - legacy single-theme system with battle bonuses
export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'gothic',
    name: 'Gothic Chamber',
    description: 'Dark stone walls, candles, and an ominous atmosphere perfect for creatures of the night',
    bonus: 'Magic Damage',
    bonusValue: 15,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🦇'
  },
  {
    id: 'medieval',
    name: 'Medieval Hall',
    description: 'Stone walls, banners, and weapon racks - a warriors paradise',
    bonus: 'Physical Damage',
    bonusValue: 15,
    suitableCharacters: ['achilles', 'joan', 'robin_hood'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '⚔️'
  },
  {
    id: 'victorian',
    name: 'Victorian Study',
    description: 'Elegant furniture, books, and scientific instruments for the intellectual mind',
    bonus: 'Critical Chance',
    bonusValue: 12,
    suitableCharacters: ['holmes'],
    cost: { coins: 7000, gems: 15 },
    backgroundColor: 'bg-emerald-900/20',
    textColor: 'text-emerald-300',
    icon: '🔍'
  },
  {
    id: 'egyptian',
    name: 'Pharaoh\'s Chamber',
    description: 'Golden decorations, hieroglyphs, and royal splendor fit for a pharaoh',
    bonus: 'Defense',
    bonusValue: 20,
    suitableCharacters: ['cleopatra'],
    cost: { coins: 8000, gems: 20 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '👑'
  },
  {
    id: 'mystical',
    name: 'Mystical Sanctuary',
    description: 'Magical crystals, ancient symbols, and ethereal energy',
    bonus: 'Mana Regeneration',
    bonusValue: 25,
    suitableCharacters: ['merlin', 'sun_wukong'],
    cost: { coins: 6000, gems: 12 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🔮'
  },
  {
    id: 'wild_west',
    name: 'Saloon Room',
    description: 'Wooden furniture, spittoons, and the spirit of the frontier',
    bonus: 'Speed',
    bonusValue: 18,
    suitableCharacters: ['billy_the_kid'],
    cost: { coins: 4000, gems: 8 },
    backgroundColor: 'bg-orange-900/20',
    textColor: 'text-orange-300',
    icon: '🤠'
  },
  {
    id: 'futuristic',
    name: 'Tech Lab',
    description: 'Holographic displays, advanced equipment, and cutting-edge technology',
    bonus: 'Accuracy',
    bonusValue: 20,
    suitableCharacters: ['tesla', 'space_cyborg', 'agent_x'],
    cost: { coins: 10000, gems: 25 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '🤖'
  },
  {
    id: 'sports_den',
    name: 'Sports Den',
    description: 'Baseball memorabilia, trophies, and all-American spirit',
    bonus: 'Stamina',
    bonusValue: 15,
    suitableCharacters: ['sammy_slugger'],
    cost: { coins: 3000, gems: 5 },
    backgroundColor: 'bg-green-900/20',
    textColor: 'text-green-300',
    icon: '⚾'
  },
  {
    id: 'mongolian',
    name: 'Khan\'s Yurt',
    description: 'Traditional Mongolian decorations and symbols of conquest',
    bonus: 'Leadership',
    bonusValue: 20,
    suitableCharacters: ['genghis_khan'],
    cost: { coins: 6000, gems: 15 },
    backgroundColor: 'bg-red-900/20',
    textColor: 'text-red-300',
    icon: '🏹'
  },
  {
    id: 'alien_lab',
    name: 'Research Pod',
    description: 'Advanced alien technology and experimental equipment',
    bonus: 'Experience Gain',
    bonusValue: 30,
    suitableCharacters: ['alien_grey'],
    cost: { coins: 15000, gems: 50 },
    backgroundColor: 'bg-indigo-900/20',
    textColor: 'text-indigo-300',
    icon: '🛸'
  },
  {
    id: 'nordic',
    name: 'Viking Lodge',
    description: 'Wooden halls, fur pelts, and the spirit of the wild hunt',
    bonus: 'Berserker Rage',
    bonusValue: 25,
    suitableCharacters: ['fenrir'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-slate-900/20',
    textColor: 'text-slate-300',
    icon: '🐺'
  }
];

// Multi-element room decoration system for advanced customization
export const ROOM_ELEMENTS: RoomElement[] = [
  // Wall Decor
  {
    id: 'gothic_tapestries',
    name: 'Gothic Tapestries',
    category: 'wallDecor',
    description: 'Dark velvet tapestries with mysterious symbols',
    bonus: 'Magic Damage',
    bonusValue: 8,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 2000, gems: 5 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🪶',
    compatibleWith: ['gothic_chandelier', 'stone_floors'],
    incompatibleWith: ['neon_strips', 'holographic_panels']
  },
  {
    id: 'weapon_displays',
    name: 'Weapon Displays',
    category: 'wallDecor',
    description: 'Mounted swords, shields, and battle trophies',
    bonus: 'Physical Damage',
    bonusValue: 8,
    suitableCharacters: ['achilles', 'joan', 'robin_hood'],
    cost: { coins: 2500, gems: 4 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '⚔️',
    compatibleWith: ['wooden_furniture', 'torch_lighting'],
    incompatibleWith: ['crystal_displays', 'tech_panels']
  },
  {
    id: 'holographic_panels',
    name: 'Holographic Panels',
    category: 'wallDecor',
    description: 'Advanced tech displays with data streams',
    bonus: 'Accuracy',
    bonusValue: 10,
    suitableCharacters: ['tesla', 'space_cyborg', 'agent_x'],
    cost: { coins: 4000, gems: 12 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '📱',
    compatibleWith: ['led_lighting', 'metal_floors'],
    incompatibleWith: ['gothic_tapestries', 'wooden_furniture']
  },

  // Furniture
  {
    id: 'throne_chair',
    name: 'Royal Throne',
    category: 'furniture',
    description: 'Ornate golden throne for true royalty',
    bonus: 'Leadership',
    bonusValue: 12,
    suitableCharacters: ['cleopatra', 'genghis_khan'],
    cost: { coins: 3000, gems: 8 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '👑',
    compatibleWith: ['golden_accents', 'marble_floors'],
    incompatibleWith: ['wooden_furniture', 'tech_stations']
  },
  {
    id: 'wooden_furniture',
    name: 'Rustic Wood Set',
    category: 'furniture',
    description: 'Handcrafted wooden tables and chairs',
    bonus: 'Stamina',
    bonusValue: 8,
    suitableCharacters: ['billy_the_kid', 'robin_hood'],
    cost: { coins: 1500, gems: 3 },
    backgroundColor: 'bg-orange-900/20',
    textColor: 'text-orange-300',
    icon: '🪑',
    compatibleWith: ['weapon_displays', 'torch_lighting'],
    incompatibleWith: ['throne_chair', 'tech_stations']
  },
  {
    id: 'tech_stations',
    name: 'Tech Workstations',
    category: 'furniture',
    description: 'Advanced computer terminals and lab equipment',
    bonus: 'Critical Chance',
    bonusValue: 10,
    suitableCharacters: ['tesla', 'holmes', 'alien_grey'],
    cost: { coins: 5000, gems: 15 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '💻',
    compatibleWith: ['holographic_panels', 'led_lighting'],
    incompatibleWith: ['throne_chair', 'wooden_furniture']
  },

  // Lighting
  {
    id: 'gothic_chandelier',
    name: 'Gothic Chandelier',
    category: 'lighting',
    description: 'Ornate iron chandelier with flickering candles',
    bonus: 'Magic Damage',
    bonusValue: 6,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 2000, gems: 6 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🕯️',
    compatibleWith: ['gothic_tapestries', 'stone_floors'],
    incompatibleWith: ['led_lighting', 'neon_strips']
  },
  {
    id: 'led_lighting',
    name: 'LED Strip System',
    category: 'lighting',
    description: 'Color-changing LED lights with smart controls',
    bonus: 'Speed',
    bonusValue: 8,
    suitableCharacters: ['tesla', 'space_cyborg'],
    cost: { coins: 3500, gems: 10 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '💡',
    compatibleWith: ['holographic_panels', 'tech_stations'],
    incompatibleWith: ['gothic_chandelier', 'torch_lighting']
  },
  {
    id: 'torch_lighting',
    name: 'Medieval Torches',
    category: 'lighting',
    description: 'Classic wall-mounted torches for authentic ambiance',
    bonus: 'Physical Damage',
    bonusValue: 6,
    suitableCharacters: ['achilles', 'joan'],
    cost: { coins: 1000, gems: 2 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '🔥',
    compatibleWith: ['weapon_displays', 'wooden_furniture'],
    incompatibleWith: ['led_lighting', 'gothic_chandelier']
  },

  // Accessories
  {
    id: 'crystal_displays',
    name: 'Mystical Crystals',
    category: 'accessories',
    description: 'Glowing crystals with magical properties',
    bonus: 'Mana Regeneration',
    bonusValue: 15,
    suitableCharacters: ['merlin', 'sun_wukong'],
    cost: { coins: 2500, gems: 8 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🔮',
    compatibleWith: ['gothic_chandelier', 'stone_floors'],
    incompatibleWith: ['weapon_displays', 'tech_stations']
  },
  {
    id: 'golden_accents',
    name: 'Golden Decorations',
    category: 'accessories',
    description: 'Luxurious gold trim and ornamental pieces',
    bonus: 'Defense',
    bonusValue: 10,
    suitableCharacters: ['cleopatra', 'genghis_khan'],
    cost: { coins: 4000, gems: 12 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '✨',
    compatibleWith: ['throne_chair', 'marble_floors'],
    incompatibleWith: ['wooden_furniture', 'metal_floors']
  },

  // Flooring
  {
    id: 'stone_floors',
    name: 'Ancient Stone',
    category: 'flooring',
    description: 'Weathered stone blocks with mystical runes',
    bonus: 'Defense',
    bonusValue: 8,
    suitableCharacters: ['dracula', 'merlin'],
    cost: { coins: 3000, gems: 7 },
    backgroundColor: 'bg-gray-900/20',
    textColor: 'text-gray-300',
    icon: '🗿',
    compatibleWith: ['gothic_tapestries', 'crystal_displays'],
    incompatibleWith: ['metal_floors', 'tech_stations']
  },
  {
    id: 'marble_floors',
    name: 'Royal Marble',
    category: 'flooring',
    description: 'Polished marble with golden veins',
    bonus: 'Leadership',
    bonusValue: 8,
    suitableCharacters: ['cleopatra', 'achilles'],
    cost: { coins: 5000, gems: 15 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '⬜',
    compatibleWith: ['throne_chair', 'golden_accents'],
    incompatibleWith: ['wooden_furniture', 'stone_floors']
  },
  {
    id: 'metal_floors',
    name: 'Tech Flooring',
    category: 'flooring',
    description: 'Reinforced metal grating with LED strips',
    bonus: 'Speed',
    bonusValue: 8,
    suitableCharacters: ['tesla', 'space_cyborg'],
    cost: { coins: 4000, gems: 10 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '🔲',
    compatibleWith: ['holographic_panels', 'led_lighting'],
    incompatibleWith: ['stone_floors', 'marble_floors']
  }
];