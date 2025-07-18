# Persistent Memory System Manual
**Complete Guide to Cross-Chat Memory Integration & Comedy Template System**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Memory Flow](#memory-flow)
5. [Comedy Template System](#comedy-template-system)
6. [Integration Guide](#integration-guide)
7. [Event Types & Categories](#event-types--categories)
8. [Chat System Integrations](#chat-system-integrations)
9. [API Reference](#api-reference)
10. [Testing & Debugging](#testing--debugging)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

---

## System Overview

### What It Does
The Persistent Memory System creates a living psychological simulation where characters remember events across all 15 chat systems. Characters can reference past interactions from other contexts, creating authentic continuity and natural comedy through contradictions and embarrassing callbacks.

### Key Features
- **Cross-System Memory**: Characters remember events from all 15 integrated chat systems
- **Dynamic Comedy**: Flexible template system generates authentic humor from real character history
- **Psychological Continuity**: Rich character development through persistent memory
- **Performance Optimized**: Efficient memory filtering and context compression
- **Privacy-Aware**: Confessionals import memories but don't export (maintaining logical privacy)

### Integration Status
✅ **15/15 Chat Systems Integrated (100% Complete)**

---

## Architecture

### High-Level Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat Systems  │───▶│  GameEventBus    │───▶│ Character       │
│   (15 systems)  │    │  (Event Hub)     │    │ Memories        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Event Publisher │    │EventContextService│    │ Comedy Template │
│                 │    │ (Context Engine) │    │ Service         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow
1. **Event Publishing**: Chat systems publish events to GameEventBus
2. **Memory Storage**: Events are converted to CharacterMemory objects
3. **Context Generation**: EventContextService creates rich context from memories
4. **Comedy Integration**: ComedyTemplateService generates cross-chat humor
5. **Chat Enhancement**: Context and comedy are injected into new conversations

---

## Core Components

### 1. GameEventBus (`gameEventBus.ts`)
Central event hub that manages all character memories and relationships.

**Key Responsibilities:**
- Event publishing and storage
- Memory retrieval and filtering
- Character relationship tracking
- Cross-reference metadata management

**Core Interfaces:**
```typescript
interface GameEvent {
  type: string;
  source: string;
  primaryCharacterId: string;
  secondaryCharacterIds?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: EventCategory;
  description: string;
  metadata: Record<string, any>;
  tags: string[];
}

interface CharacterMemory {
  id: string;
  characterId: string;
  content: string;
  memoryType: string;
  emotionalIntensity: number;
  timestamp: Date;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  associatedCharacters: string[];
  tags: string[];
  crossReferenceData?: {
    canReferencedIn: string[];
    comedyTags: string[];
    embarrassmentLevel: number;
    secretLevel: number;
    contradictionPotential: number;
    quotability: number;
    comedyPotential: number;
  };
}
```

### 2. EventContextService (`eventContextService.ts`)
Generates rich context from character memories for enhanced conversations.

**Key Methods:**
- `getKitchenContext()`: Social conflicts and living arrangements
- `getTherapyContext()`: Emotional struggles and breakthroughs  
- `getRealEstateContext()`: Housing preferences and complaints
- `getTrainingContext()`: Performance issues and improvements
- `getEquipmentContext()`: Battle performance and gear needs
- `getConfessionalContext()`: Import-only context (no export)
- `getComedyContext()`: Cross-chat humor opportunities

### 3. ComedyTemplateService (`comedyTemplateService.ts`)
Creates flexible cross-chat humor using variable templates.

**Template Categories:**
- **Contradiction**: "Funny, because in {chatSystem} {timeReference} you were {action} about {topic}..."
- **Embarrassing**: "Remember when you had that {emotionalEvent} in {chatSystem} about {topic}?"
- **Ironic**: "Of all people to give advice about {topic}, considering what happened in {chatSystem}..."
- **Callback**: "Here we go again... just like in {chatSystem} when you {pastBehavior} about {topic}."

---

## Memory Flow

### Event Lifecycle
```
1. USER ACTION → Chat System
2. Chat System → EVENT PUBLISHED → GameEventBus
3. GameEventBus → MEMORY CREATED → Character Memory Store
4. Other Chat Systems → CONTEXT REQUEST → EventContextService  
5. EventContextService → MEMORY RETRIEVAL → GameEventBus
6. EventContextService → CONTEXT GENERATION → Rich Context
7. ComedyTemplateService → HUMOR GENERATION → Comedy References
8. Enhanced Context → CHAT SYSTEM → More Authentic Interactions
```

### Memory Categories
- **Social**: Kitchen arguments, clubhouse conversations, group activities
- **Therapy**: Emotional breakthroughs, personal struggles, therapy sessions
- **Performance**: Training results, battle outcomes, skill development
- **Equipment**: Gear advice, equipment failures, upgrade requests
- **Financial**: Budget discussions, spending decisions, financial stress
- **Facilities**: Housing complaints, real estate negotiations, living arrangements
- **Battle**: Team strategies, combat coaching, battle communications
- **Coaching**: 1-on-1 performance improvement, skill development
- **Drama**: AI-generated conflicts, message board drama, social tensions

### Privacy Model
- **Most Systems**: Full integration (import + export memories)
- **Confessional**: Import-only (can reference past memories but doesn't create new memories for other systems)
- **Reasoning**: Maintains logical privacy - other characters never reference confessional content

---

## Comedy Template System

### Design Philosophy
**Flexible > Fixed Templates**

❌ **Rigid Templates (Avoided):**
```
"Didn't you just say in therapy that you were working on your anger issues?"
```
- Hard-coded chat system and topic
- Only works for one specific scenario
- Breaks immersion when doesn't match reality

✅ **Variable Templates (Implemented):**
```
"Funny, because in {chatSystem} {timeReference} you were {action} about {topic}..."
```
- Adapts to real memory content
- Works across any chat system combination
- Creates authentic humor from actual character history

### Template Selection Logic
Templates are selected based on memory metadata:

```typescript
// High embarrassment + dramatic tags
"Remember when you had that {emotionalEvent} in {chatSystem} about {topic}?"

// High contradiction potential  
"Funny, because in {chatSystem} {timeReference} you were {action} about {topic}..."

// High quotability + ironic situation
"Of all people to say that, considering what happened in {chatSystem}..."
```

### Variable Extraction
Variables are automatically extracted from memory data:
- `{chatSystem}`: Mapped from event source (kitchen_table → "kitchen")
- `{timeReference}`: Natural time conversion (2 hours ago → "earlier today")
- `{topic}`: Key phrases from memory content
- `{action}`: Derived from memory type (conflict → "arguing")
- `{emotionalEvent}`: Based on severity + tags (high + dramatic → "breakdown")

---

## Integration Guide

### Adding Memory Integration to a Chat System

#### Step 1: Import Required Services
```typescript
import GameEventBus from '../services/gameEventBus';
import EventContextService from '../services/eventContextService';
```

#### Step 2: Import Context (Before sending message)
```typescript
// Import relevant context for enhanced conversations
let chatContext = '';
let comedyContext = '';
try {
  const contextService = EventContextService.getInstance();
  chatContext = await contextService.getChatSpecificContext(characterId);
  comedyContext = contextService.getComedyContext(characterId, 'chat_type', currentTopic);
} catch (error) {
  console.error('Error getting context:', error);
}
```

#### Step 3: Add Context to Prompt
```typescript
const context = {
  character,
  currentSituation: 'your current context',
  chatContext, // Add imported context
  comedyContext // Add comedy cross-references
};
```

#### Step 4: Publish Events (After message sent)
```typescript
// Publish chat event for future memory integration
try {
  const eventBus = GameEventBus.getInstance();
  await eventBus.publish({
    type: 'specific_event_type',
    source: 'chat_system_name',
    primaryCharacterId: characterId,
    severity: 'medium',
    category: 'appropriate_category',
    description: `${character.name} in chat: "${message.substring(0, 100)}..."`,
    metadata: { 
      chatType: 'your_chat_type',
      // Add relevant metadata
    },
    tags: ['relevant', 'tags', 'for', 'filtering']
  });
} catch (error) {
  console.error('Error publishing event:', error);
}
```

### Chat System Context Methods
Each chat system has a dedicated context method in EventContextService:

```typescript
// Kitchen Table Chat
getKitchenContext(characterId: string): Promise<string>

// Therapy Sessions  
getTherapyContext(characterId: string): Promise<string>

// Real Estate/Housing
getRealEstateContext(characterId: string): Promise<string>

// Training & Performance
getTrainingContext(characterId: string): Promise<string>

// Equipment & Gear
getEquipmentContext(characterId: string): Promise<string>

// And 10+ more methods for all integrated systems...
```

---

## Event Types & Categories

### Event Categories
- `social`: Kitchen table, clubhouse, group activities
- `therapy`: Therapy sessions, personal problems, emotional growth
- `performance`: Training, skills, battle performance
- `equipment`: Gear advice, equipment management
- `financial`: Budget discussions, financial planning
- `facilities`: Real estate, housing, living arrangements
- `battle`: Team strategies, combat, battle communications
- `coaching`: 1-on-1 coaching, performance improvement
- `drama`: AI drama, message board conflicts

### Common Event Types
- `kitchen_conversation`: General kitchen table discussions
- `kitchen_argument`: Heated kitchen disputes
- `therapy_breakthrough`: Major emotional progress
- `therapy_resistance`: Difficulty in therapy
- `training_success`: Good training performance
- `training_struggle`: Poor training performance
- `equipment_advice_request`: Asking for gear help
- `real_estate_complaint`: Housing dissatisfaction
- `team_strategy_discussion`: Battle planning
- `combat_coaching_session`: 1-on-1 performance coaching
- `social_drama`: General social conflicts
- `group_activity_started`: Joining group activities

### Severity Levels
- `low`: Minor interactions, casual conversations
- `medium`: Significant events, important discussions
- `high`: Major conflicts, breakthroughs, dramatic moments
- `critical`: Life-changing events, major crises

---

## Chat System Integrations

### Completed Integrations (15/15)

1. **Confessional** (Import-only)
   - Context: References past events for rich monologues
   - Events: None exported (maintains privacy)

2. **Kitchen Table** 
   - Context: Social conflicts, living arrangements
   - Events: Conversations, arguments, living complaints

3. **Therapy Sessions**
   - Context: Emotional struggles, breakthrough history
   - Events: Therapy progress, emotional breakthroughs, resistance

4. **Personal Problems**
   - Context: Past issues, emotional patterns
   - Events: Problem discussions, advice seeking

5. **Training**
   - Context: Performance history, improvement areas
   - Events: Training success/failure, skill development

6. **Real Estate/Housing**
   - Context: Living preferences, past housing issues
   - Events: Housing complaints, upgrade requests

7. **Message Board**
   - Context: Past posts, social dynamics
   - Events: Public posts, announcements

8. **Equipment**
   - Context: Battle performance, gear history
   - Events: Equipment advice, gear requests

9. **Skills/Abilities**
   - Context: Skill development, ability struggles
   - Events: Skill discussions, ability improvements

10. **Clubhouse Lounge**
    - Context: Social interactions, team dynamics
    - Events: Social conversations, team bonding

11. **AI Drama Board**
    - Context: Past drama, social tensions
    - Events: AI-generated drama posts, rivalry escalations

12. **Group Activities**
    - Context: Team participation, social dynamics
    - Events: Activity participation, team building

13. **Financial Advisor**
    - Context: Spending patterns, financial decisions
    - Events: Financial advice, budget discussions

14. **Team Chat Panel**
    - Context: Battle team dynamics, strategy history
    - Events: Team communication, battle strategies

15. **1-on-1 Combat Coaching**
    - Context: Combat performance, improvement areas
    - Events: Coaching sessions, performance feedback

---

## API Reference

### GameEventBus Methods

```typescript
// Singleton access
GameEventBus.getInstance(): GameEventBus

// Event publishing
publish(event: GameEvent): Promise<void>

// Memory retrieval
getCharacterMemories(characterId: string, filter?: EventFilter): CharacterMemory[]
getRecentMemories(characterId: string, timeRange: string): CharacterMemory[]
getMemoriesByCategory(characterId: string, category: EventCategory): CharacterMemory[]

// Relationship management
getCharacterRelationships(characterId: string): CharacterRelationship[]
updateRelationship(from: string, to: string, change: number, reason: string): void
```

### EventContextService Methods

```typescript
// Singleton access
EventContextService.getInstance(): EventContextService

// Context generation
getKitchenContext(characterId: string): Promise<string>
getTherapyContext(characterId: string): Promise<string>
getRealEstateContext(characterId: string): Promise<string>
// ... [13 more context methods]

// Comedy integration
getComedyContext(characterId: string, currentChatType: string, currentTopic?: string): string
generateComedyReferences(characterId: string, currentChatType: string, currentTopic?: string): string[]
```

### ComedyTemplateService Methods

```typescript
// Singleton access
ComedyTemplateService.getInstance(): ComedyTemplateService

// Comedy generation
generateComedyReference(targetMemory: CharacterMemory, currentContext: string, currentTopic: string): string | null
generateMultipleReferences(memories: CharacterMemory[], currentContext: string, currentTopic: string, maxReferences?: number): string[]
```

---

## Testing & Debugging

### Build Testing
```bash
npm run build  # Verify compilation success
npm run lint   # Check for code quality issues
```

### Memory Debugging
```typescript
// Check character memories
const eventBus = GameEventBus.getInstance();
const memories = eventBus.getCharacterMemories('character_id');
console.log('Character memories:', memories);

// Test context generation
const contextService = EventContextService.getInstance();
const context = await contextService.getTherapyContext('character_id');
console.log('Therapy context:', context);

// Test comedy generation
const comedyContext = contextService.getComedyContext('character_id', 'kitchen_table', 'bathroom schedules');
console.log('Comedy context:', comedyContext);
```

### Event Flow Verification
```typescript
// Verify event publishing
const eventBus = GameEventBus.getInstance();
await eventBus.publish({
  type: 'test_event',
  source: 'test_system',
  primaryCharacterId: 'test_character',
  severity: 'medium',
  category: 'social',
  description: 'Test event for debugging',
  metadata: {},
  tags: ['test']
});

// Check if memory was created
const memories = eventBus.getCharacterMemories('test_character');
console.log('New memory created:', memories[memories.length - 1]);
```

---

## Performance Considerations

### Memory Limits
- Default memory limit: 20 recent events per context request
- Configurable limits based on chat system needs
- Automatic cleanup of very old memories (if implemented)

### Context Compression
- Efficient filtering by relevance to current chat type
- Memory categorization for faster retrieval
- Smart caching of frequently accessed contexts

### Event Publishing Optimization
- Asynchronous event publishing doesn't block UI
- Batch publishing for multiple characters in group activities
- Error handling prevents memory system failures from breaking chat

### Comedy Template Performance
- Template selection based on metadata filters
- Variable extraction optimized for common patterns
- Maximum reference limits (3) prevent context bloat

---

## Future Enhancements

### Potential Improvements

1. **Advanced Relationship Modeling**
   - Friendship/rivalry strength affects memory sharing
   - Characters might lie about or distort memories of enemies
   - Ally characters get more detailed context about shared experiences

2. **Memory Decay System**
   - Older memories become less detailed/accurate
   - Important memories (high quotability) persist longer
   - Characters might misremember embarrassing events

3. **Emotional Context Tracking**
   - Character mood affects how they reference past events
   - Sad characters focus on negative memories
   - Happy characters reference positive breakthroughs

4. **Cross-Character Memory Sharing**
   - Characters can remind each other of shared experiences
   - Group memories from activities affect multiple characters
   - Witnesses to events can corroborate or dispute memories

5. **Memory Clustering**
   - Related memories grouped for better context
   - Patterns in behavior identified across time
   - Character development arcs tracked automatically

6. **Advanced Comedy Templates**
   - Character-specific humor styles
   - Relationship-based comedy (different humor for rivals vs friends)
   - Situational comedy templates based on current context

### Technical Enhancements

1. **Memory Persistence**
   - Save/load memory state between sessions
   - Export character psychological profiles
   - Memory backup and recovery systems

2. **Analytics Dashboard**
   - Memory network visualization
   - Character relationship graphs
   - Comedy effectiveness tracking

3. **Performance Optimization**
   - Memory indexing for faster retrieval
   - Context caching strategies
   - Lazy loading of older memories

---

## Conclusion

The Persistent Memory System transforms the game from isolated chat interactions into a living psychological simulation. Characters now have rich, evolving personalities that grow more authentic with every interaction across all 15 integrated systems.

**Key Achievements:**
- ✅ 100% chat system integration (15/15)
- ✅ Flexible comedy template system
- ✅ Rich cross-system context flow
- ✅ Privacy-aware confessional system
- ✅ Performance-optimized architecture
- ✅ Production-ready with successful builds

The system creates authentic character continuity, natural humor through contradictions, and a truly living simulation where every interaction matters and contributes to the evolving character psychology.

---

**Version**: 1.0  
**Last Updated**: July 2025  
**Integration Status**: Complete (15/15 systems)  
**Build Status**: ✅ Successful  

For questions or issues, refer to the individual service documentation or check the integration examples in the codebase.