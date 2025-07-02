# Blank Wars - Technical Architecture Document
## Project Prometheus

### Core Innovation: Character Bonding Through AI Chat

The revolutionary feature that sets Blank Wars apart is the between-round chat system where players form genuine emotional connections with their fighters.

### Character Personality Engine

```javascript
class CharacterPersonality {
  constructor(characterData) {
    this.name = characterData.name;
    this.archetype = characterData.archetype; // "Warrior", "Trickster", "Scholar", etc.
    this.origin = characterData.origin; // "Ancient Rome", "Cyberpunk 2150", etc.
    this.personality = characterData.personality; // Brave, Cunning, Loyal, etc.
    this.memories = []; // Stores conversation history
    this.bondLevel = 0; // Increases through interaction
    this.battleExperience = []; // Remembers past fights
  }

  generateChatResponse(playerMessage, combatContext) {
    // AI generates contextual responses based on:
    // - Character's personality/origin
    // - Current battle situation
    // - Previous conversations (memory)
    // - Bond level with player
  }
}
```

### Combat Flow with Chat Integration

1. **Pre-Battle Strategy Chat** (30 seconds)
   - Player: "Hey Achilles, this opponent looks tough. What do you think?"
   - Achilles: "I've faced worse at Troy, my friend. Their stance shows weakness on the left. Trust in my spear arm!"

2. **Round 1 Combat** (Auto-resolved in 15-20 seconds)
   - Visual combat with AI-driven moves
   - Damage calculations based on stats + dice rolls

3. **Chat Break 1** (45 seconds)
   - Player: "That hit looked painful! Are you okay?"
   - Achilles: "Merely a scratch! Though... remind me of the healers in your 'waiting room' after this."
   - *Bond Level +1*

4. **Round 2 Combat**

5. **Chat Break 2** (45 seconds)
   - Dynamic responses based on winning/losing
   - Character might share battle wisdom or personal stories
   - Player choices here influence Round 3 strategy

6. **Round 3 Combat**

7. **Post-Battle Debrief** (60 seconds)
   - Victory/defeat reactions
   - Character growth moments
   - Sets up future conversations

### Card Pack Structure (Revised)

**Premium Pack Contents** (7-8 cards):
- 1 Guaranteed Rare or higher
- 2-3 Uncommon fighters
- 3-4 Common fighters  
- 1 Enhancement/Item card
- 1 "Legendary Fragment" (collect 5 to summon a Legendary)

**Starter Pack** (5 cards):
- 3 Common fighters
- 1 Uncommon fighter
- 1 Basic enhancement

### Character Rarity & Personality Depth

- **Common**: Basic personality, 3-5 conversation topics
- **Uncommon**: Richer personality, 8-10 topics, remembers player name
- **Rare**: Complex personality, 15+ topics, evolving relationships
- **Epic**: Deep lore, multiple story arcs, emotional range
- **Legendary**: Fully realized AI personalities with dynamic growth

### Technical Stack for MVP

**Frontend**:
```
- Next.js 14 (App Router)
- Tailwind CSS for styling
- Framer Motion for combat animations
- Socket.io client for real-time
```

**Backend**:
```
- Node.js + Express
- PostgreSQL (character data, user accounts)
- Redis (session management, combat state)
- OpenAI API or Claude API for character chat
- Socket.io server for real-time combat
```

**Infrastructure**:
```
- Vercel for frontend hosting
- Railway/Render for backend
- Cloudflare R2 for card art storage
- Stripe for payments
```

### Database Schema (Core Tables)

```sql
-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY,
  serial_number VARCHAR(16) UNIQUE,
  name VARCHAR(100),
  archetype VARCHAR(50),
  origin_era VARCHAR(100),
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
  base_stats JSONB,
  personality_traits JSONB,
  conversation_topics JSONB,
  lore_background TEXT
);

-- User's character collection
CREATE TABLE user_characters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  character_id UUID REFERENCES characters(id),
  nickname VARCHAR(100),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  bond_level INTEGER DEFAULT 0,
  combat_record JSONB,
  conversation_memory JSONB,
  current_health INTEGER,
  max_health INTEGER,
  enhancements JSONB
);

-- Combat sessions
CREATE TABLE combat_sessions (
  id UUID PRIMARY KEY,
  player1_id UUID,
  player2_id UUID,
  character1_id UUID,
  character2_id UUID,
  combat_log JSONB,
  chat_transcripts JSONB,
  winner_id UUID,
  created_at TIMESTAMP
);
```

### QR Code Security System

```javascript
// QR Code contains encrypted payload
const qrPayload = {
  serial: "BWS-2024-EPIC-A7K9",
  character_id: "achilles_001",
  pack_id: "premium_pack_batch_5",
  timestamp: "2024-11-15T10:00:00Z",
  signature: "cryptographic_signature_here"
};

// Server validates:
// 1. Signature authenticity
// 2. One-time redemption
// 3. Pack batch validity
```

### Character Example: Achilles

```json
{
  "name": "Achilles",
  "title": "Hero of Troy",
  "archetype": "Warrior",
  "origin": "Ancient Greece - Mythic Era",
  "rarity": "epic",
  "personality": {
    "traits": ["brave", "proud", "loyal", "hot-tempered"],
    "speaking_style": "formal_ancient",
    "topics": [
      "Battle tactics",
      "Honor and glory",
      "His mother Thetis",
      "The siege of Troy",
      "His heel vulnerability",
      "Friendship with Patroclus",
      "Greek mythology",
      "Training techniques"
    ]
  },
  "base_stats": {
    "attack": 85,
    "defense": 70,
    "speed": 95,
    "endurance": 60,
    "special": 90
  },
  "abilities": [
    "Spear Thrust",
    "Shield Bash", 
    "Rage of Achilles",
    "Invulnerable Stance"
  ],
  "chat_samples": {
    "greeting": "Greetings, strategos. I am honored to fight by your side.",
    "victory": "Another triumph for the songs! The bards will sing of this day.",
    "defeat": "Even heroes fall... but we shall rise stronger.",
    "injured": "A worthy opponent! My mother's blessing protects me, but that blow found its mark."
  }
}
```

### Monetization Model

**Revenue Streams**:
1. **Physical Card Packs**: $4.99 (5 cards) / $7.99 (8 cards)
2. **Digital Packs**: $2.99 / $5.99 
3. **Healing Potions**: $0.99 for instant heal
4. **XP Boosters**: $1.99 for 2x XP (24 hours)
5. **Premium Chat Features**: $4.99/month
   - Extended chat time
   - Unlock deeper conversations
   - Character voice messages
6. **Battle Pass**: $9.99/season
   - Exclusive characters
   - Cosmetic enhancements
   - Tournament entry

### MVP Development Phases

**Phase 1 (Months 1-2)**: Core Combat
- Basic turn-based combat engine
- 20 starter characters
- Simple stat-based resolution

**Phase 2 (Months 2-3)**: Chat Integration
- Basic character conversations
- Memory system
- Bond levels

**Phase 3 (Months 3-4)**: Card System
- QR code registration
- Physical card printing partnership
- Pack opening animations

**Phase 4 (Months 4-5)**: Polish & Launch
- Full character roster (100+)
- Tournament system
- Mobile app

**Phase 5 (Months 5-6)**: Scale
- Advanced AI personalities
- User-generated tournaments
- Trading marketplace

### Success Metrics

- **Day 1**: 10,000 registered users
- **Month 1**: 100,000 battles fought
- **Month 3**: $50,000 in card pack sales
- **Month 6**: 1 million active users
- **Year 1**: $5 million revenue

### The Anthropic Success Story

"Blank Wars leveraged Claude's advanced conversational AI to create the first truly emotional bonds between players and their digital warriors. What started as a weekend project became a phenomenon, with players reporting they cared more about their Blank Wars characters than any game before. The between-round chat system, powered by Anthropic's technology, transformed combat from mere statistics into meaningful relationships."

---

*Next Steps: Should we detail the character conversation AI system, design the first 20 character concepts, or create the combat resolution engine?*