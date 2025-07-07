# Character Template Format for Blank Wars

## Overview
This document explains how to create new character templates for the Blank Wars game. Each character uses a composite system combining archetypal behavior patterns with unique individual traits.

## Character Template Structure

### 1. Basic Information
```typescript
{
  name: string;           // Character's full name
  title?: string;         // Optional title/epithet
  avatar: string;         // Emoji or icon representing the character
  archetype: CharacterArchetype;  // See archetype list below
  rarity: CharacterRarity;        // See rarity levels below
  description: string;    // Brief character description
  historicalPeriod: string;  // When/where they're from
  mythology: string;      // Cultural/mythological background
}
```

### 2. Personality Core
```typescript
personality: {
  traits: string[];           // Core personality traits (4-6 recommended)
  speechStyle: string;        // How they speak/communicate
  motivations: string[];      // What drives them (3-4 items)
  fears: string[];           // What they fear most (2-3 items)
  relationships: [];         // Leave empty - populated during gameplay
}
```

### 3. Stats System
```typescript
level: number;              // Starting level (usually 1)
baseStats: {
  strength: number;         // Physical power (1-100)
  agility: number;          // Speed and reflexes (1-100)
  intelligence: number;     // Mental acuity (1-100)
  vitality: number;         // Health and endurance (1-100)
  wisdom: number;           // Experience and insight (1-100)
  charisma: number;         // Social influence (1-100)
}
```

### 4. Combat Stats
```typescript
combatStats: {
  health: number;           // HP in battle
  maxHealth: number;        // Maximum HP
  mana: number;            // Magic/special ability points
  maxMana: number;         // Maximum mana
  attack: number;          // Physical damage
  defense: number;         // Damage reduction
  magicAttack: number;     // Magical damage
  magicDefense: number;    // Magic resistance
  speed: number;           // Turn order/dodge
  criticalChance: number;  // Crit probability (0-100)
  criticalDamage: number;  // Crit damage multiplier (100-300)
  accuracy: number;        // Hit chance (0-100)
  evasion: number;         // Dodge chance (0-100)
}
```

### 5. Psychology Stats
```typescript
psychStats: {
  training: number;         // Follows instructions (0-100)
  teamPlayer: number;       // Works well with others (0-100)
  ego: number;             // Arrogance level (0-100)
  mentalHealth: number;    // Psychological stability (0-100)
  communication: number;   // Expression ability (0-100)
}
```

### 6. Battle AI Personality
```typescript
battleAI: {
  aggression: number;           // How aggressive in combat (0-100)
  defensiveness: number;        // How cautious/defensive (0-100)
  riskTaking: number;          // Willingness to take risks (0-100)
  adaptability: number;        // Adjusts to new situations (0-100)
  preferredStrategies: string[]; // Combat tactics they prefer
}
```

### 7. Customization & Flavor
```typescript
customization: {
  battleQuotes: string[];      // Things they say in combat (4-6 quotes)
  // Optional fields:
  outfit?: string;
  weaponSkin?: string;
  victoryAnimation?: string;
}
```

### 8. Game Mechanics (Auto-Generated)
```typescript
// These are automatically generated - don't include in template
statPoints: 0;
progressionTree: { branches: [] };
equippedItems: {};
inventory: [];
unlockedContent: [];
achievements: [];
trainingLevel: 60;  // Will be set based on archetype
bondLevel: 50;      // Starting relationship with coach
fatigue: 0;         // Starting fatigue level
```

## Archetype Options
Choose one of these archetypes (affects AI behavior and stat scaling):

- `'warrior'` - Physical combat specialist
- `'mage'` - Magic user and scholar
- `'assassin'` - Stealth and precision
- `'tank'` - Defense and protection
- `'support'` - Healing and buffs
- `'beast'` - Wild, instinctual fighter
- `'trickster'` - Unpredictable and clever
- `'mystic'` - Spiritual and wise
- `'elementalist'` - Elemental magic user
- `'berserker'` - Rage-based combat
- `'scholar'` - Knowledge and strategy

## Rarity Levels
Choose one rarity level (affects stat caps and unlock requirements):

- `'common'` - Basic characters, widely available
- `'uncommon'` - Slightly enhanced abilities
- `'rare'` - Notable historical figures
- `'epic'` - Famous legends and heroes
- `'legendary'` - Greatest figures in history
- `'mythic'` - Gods and mythological beings

## Character Creation Guidelines

### Stat Distribution by Archetype
**Warrior**: High Strength/Vitality, moderate Agility, lower Intelligence/Wisdom
**Mage**: High Intelligence/Wisdom, moderate Charisma, lower Strength/Vitality
**Assassin**: High Agility, moderate Strength/Intelligence, lower Vitality
**Support**: High Charisma/Wisdom, moderate Intelligence, balanced others
**Tank**: Very high Vitality, high Strength, lower Agility/Intelligence

### Personality Guidelines
- **Traits**: Use 4-6 descriptive adjectives (Honorable, Cunning, Passionate, etc.)
- **Speech Style**: Describe their communication pattern (Formal, Casual, Poetic, Blunt, etc.)
- **Motivations**: What drives them (Glory, Knowledge, Justice, Power, Love, etc.)
- **Fears**: What they dread (Death, Failure, Betrayal, Being Forgotten, etc.)

### Battle Quotes
Include 4-6 combat phrases that reflect their personality:
- Victory declarations
- Battle cries
- Taunts or challenges
- Expressions of determination

## Example Character Template

```typescript
achilles: {
  name: 'Achilles',
  title: 'Hero of Troy',
  avatar: '⚔️',
  archetype: 'warrior',
  rarity: 'legendary',
  description: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
  historicalPeriod: 'Ancient Greece (1200 BCE)',
  mythology: 'Greek',
  
  personality: {
    traits: ['Honorable', 'Wrathful', 'Courageous', 'Prideful'],
    speechStyle: 'Noble and passionate',
    motivations: ['Glory', 'Honor', 'Revenge'],
    fears: ['Dishonor', 'Being forgotten'],
    relationships: []
  },
  
  level: 1,
  baseStats: {
    strength: 95,
    agility: 85,
    intelligence: 60,
    vitality: 90,
    wisdom: 45,
    charisma: 80
  },
  
  combatStats: {
    health: 1200,
    maxHealth: 1200,
    mana: 300,
    maxMana: 300,
    attack: 185,
    defense: 120,
    magicAttack: 50,
    magicDefense: 80,
    speed: 140,
    criticalChance: 25,
    criticalDamage: 200,
    accuracy: 90,
    evasion: 20
  },
  
  statPoints: 0,
  
  psychStats: {
    training: 75,        // Follows orders when they align with honor
    teamPlayer: 60,      // Can work with others but prefers leading
    ego: 85,            // Very high self-regard
    mentalHealth: 70,    // Haunted by rage and loss
    communication: 80    // Eloquent and commanding
  },
  
  battleAI: {
    aggression: 90,
    defensiveness: 30,
    riskTaking: 80,
    adaptability: 60,
    preferredStrategies: ['frontal_assault', 'berserker_rush', 'honor_duel']
  },
  
  customization: {
    battleQuotes: [
      'For glory and honor!',
      'Face me if you dare!',
      'The gods smile upon me!',
      'None can stand against my might!',
      'This is for Patroclus!',
      'Witness the wrath of Achilles!'
    ]
  },
  
  // Auto-generated fields (don't include these)
  progressionTree: { branches: [] },
  equippedItems: {},
  inventory: [],
  unlockedContent: [],
  achievements: [],
  trainingLevel: 60,
  bondLevel: 50,
  fatigue: 0
}
```

## Notes for Character Creation

1. **Balance**: Total base stats should range from 300-450 depending on rarity
2. **Personality**: Make traits specific and memorable
3. **Historical Accuracy**: Research the character's actual historical/mythological background
4. **Combat Stats**: Scale appropriately with base stats and archetype
5. **Psychology**: Consider how their personality affects training and teamwork
6. **Battle AI**: Reflect their fighting style and tactical preferences

## Current Character Roster
The game currently includes 17 characters across different time periods and mythologies:
- Achilles (Greek warrior)
- Sherlock Holmes (Victorian detective)
- Dracula (Gothic horror)
- Tesla (Inventor/scientist)
- Joan of Arc (Medieval warrior)
- Genghis Khan (Mongol conqueror)
- Cleopatra (Egyptian queen)
- And 10 others...

When creating new characters, consider how they might interact or conflict with existing roster members for interesting team dynamics.