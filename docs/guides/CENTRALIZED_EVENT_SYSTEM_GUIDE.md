# Centralized Event System & Persistent Memory Guide

## Overview

The Centralized Event System transforms Blank Wars from a series of disconnected interactions into a living, breathing world where every action has consequences and characters truly remember their experiences. This guide explains how the new features work and how they enhance gameplay.

---

## 🎯 Core Features

### 1. **Persistent Character Memory**
Characters now remember events across ALL game systems:
- Battle victories and defeats
- Therapy breakthroughs and setbacks  
- Training achievements and struggles
- Kitchen conflicts and resolutions
- Equipment changes and preferences
- Social interactions and relationship changes

**Before**: Characters had no memory between scenes
**After**: Characters reference past experiences naturally in conversation

### 2. **Cross-System Awareness**
Characters are now aware of events from other game areas:
- Equipment advisor mentions recent battle stress affecting gear choices
- Performance coach references kitchen conflicts impacting focus
- Therapist knows about training exhaustion and battle trauma
- Skills trainer aware of relationship dynamics affecting learning

### 3. **Strategic Conflict Resolution**
Engaging with conflicts now provides significant rewards:
- **Experience Multipliers**: 100-200 XP for resolution vs 10-30 for avoidance
- **Stat Boosts**: Temporary +2-5 stat increases for 48-96 hours
- **Skill Unlocks**: Permanent abilities only available through conflict resolution
- **Relationship Bonuses**: Build lasting bonds that enhance all interactions

### 4. **Smart Context Compression**
AI gets rich context without overwhelming prompts:
- Recent events summarized in ~100-200 tokens
- Domain-specific filtering (shows battle context for performance coach)
- Relationship summaries with current status
- Emotional state tracking based on recent experiences

---

## 🎮 How It Works In Game

### **Character Conversations**

**Old System**:
```
Coach: "How can I help with your training today?"
```

**New System**:
```
Coach: "I know the kitchen situation with Joan is stressing you out, and 
that loss to Tesla yesterday shook your confidence. Let's work on combat 
techniques to rebuild your focus - your attack is at 85 now, up from 78 
last week."
```

Characters now:
- Reference specific recent events
- Mention actual stats and current state
- Connect different areas of your game experience
- Show awareness of relationship dynamics

### **Performance Coaching Chat**

Characters are now aware of:
- **Your exact level, stats, and experience points**
- **Win/loss record with specific numbers**: "You've won 7 out of 12 recent battles"
- **Recent training progress**: References skills learned and stat improvements  
- **Household tensions**: How living conflicts affect battle performance
- **Equipment changes**: How new gear impacts combat effectiveness

**Example Enhanced Response**:
```
"Your attack stat of 92 is impressive, but I noticed your win rate dropped 
to 58% after that kitchen argument with Achilles. The team chemistry is at 
75% - we need to work on focus techniques since that housing stress is 
affecting your reaction time in battles."
```

### **Equipment Advisor Chat**

Characters now reference:
- **Current equipped items by name**: "Your Iron Sword is solid, but..."
- **Specific inventory contents**: "I see you have a Flame Blade in storage"
- **Stat-based recommendations**: "With your 85 attack, this weapon would boost you to 92"
- **Recent battle performance**: "Since that defeat cost you confidence, maybe a stronger shield"

**Example Enhanced Response**:
```
"I notice you're still using the Iron Sword from last week, but with your 
attack now at 85, that Flame Blade in your inventory would be perfect. 
Plus, after losing to the Tesla team, a confidence boost from better gear 
might help your next battle."
```

### **Skill Development Chat**

Characters track:
- **Current abilities with specific names and cooldowns**
- **Available training points**: "You have 23 skill points to spend"
- **Learning progress**: References recently acquired skills
- **Archetype optimization**: Suggests skills based on your fighting style

**Example Enhanced Response**:
```
"You've learned 3 abilities so far - Warrior's Strike, Shield Bash, and 
Iron Will. With 23 training points available and your Warrior archetype, 
I recommend focusing on defensive skills since your defense is only 67. 
The stress from household conflicts shows you need better mental resilience."
```

---

## 🏆 Strategic Conflict System

### **Risk vs Reward Analysis**

The system now provides real-time analysis for every conflict:

**Engagement Value Calculation**:
- Base experience (100-200 XP)
- Stat boost potential (+2-5 temporary increases)
- Skill unlock opportunities (permanent abilities)
- Relationship improvement (+3-5 trust/respect)
- Streak bonuses (consecutive resolutions)

**Avoidance Cost Calculation**:
- Missed experience (only 10-30 XP)
- Accumulating stress penalties
- Relationship decay over time
- Reduced growth opportunities
- Social isolation effects

### **Conflict Resolution Approaches**

Each approach has different outcomes:

**🔥 Aggressive Approach**:
- Builds personal confidence (+3 attack boost)
- May damage relationships (-2 trust)
- Quick resolution but potential backlash
- Best for: Solo conflicts, building dominance

**🤝 Diplomatic Approach**:
- Builds social skills (+3 charisma boost)
- Improves relationships (+3 trust/respect)
- Moderate experience gains
- Best for: Two-person conflicts, long-term relationships

**👥 Collaborative Approach**:
- Highest experience rewards (+150-200 XP)
- Major relationship improvements (+5 all participants)
- Unlocks team-building abilities
- Best for: Group conflicts, maximum rewards

**😐 Avoidant Approach**:
- Minimal experience (+15 XP)
- Gradual relationship decay (-1 per person)
- Accumulating stress penalties
- Missed skill development opportunities

### **Streak System**

Consecutive conflict resolutions provide escalating bonuses:
- **3 Resolutions**: +30% experience for 48 hours
- **5 Resolutions**: Permanent +2 to all social stats  
- **7 Collaborative Resolutions**: "Harmony Aura" prevents conflicts for 72 hours

---

## 🎯 Player Guidance System

### **Strategic Dashboard**

The new Conflict Guidance Panel provides:

**Current Status Assessment**:
- Character's conflict resolution streak
- Social skill development level
- Recent avoidance penalties
- Relationship network health

**Next Best Action**:
- Specific conflict opportunities
- Recommended approach for each
- Expected rewards vs risks
- Long-term strategy suggestions

**Warning System**:
- Alerts for suboptimal avoidance patterns
- Notifications about accumulating penalties
- Relationship health warnings
- Growth opportunity alerts

### **Conflict Analysis Example**

```
📊 CONFLICT ANALYSIS: Kitchen Dispute (Medium Severity)

RECOMMENDATION: ENGAGE (Collaborative Approach)

Engagement Value: 78/100
Avoidance Value: 32/100

Strategic Reasoning:
✅ High-severity conflicts offer the best rewards
🔥 Streak bonus active (3 resolved)
📈 Great opportunity to build social skills

Potential Rewards:
Experience: +150 XP
Immediate: +3 Wisdom (72 hours)
Long-term: Team Builder skill unlock
Relationships: +4 trust with all participants

Optimal Strategy: COLLABORATIVE
Expected Outcome: Strong team bonding, skill unlocks, major experience gains
Risk Level: Low
```

---

## 🔧 Technical Implementation

### **Event Publishing**

Every significant game action now creates trackable events:

**Battle System**:
```typescript
// Automatically publishes on battle completion
await eventPublisher.publishBattleEvent({
  winnerId: 'achilles',
  loserId: 'tesla_team',
  participants: ['achilles', 'joan', 'holmes'],
  battleDuration: 1200000,
  teamworkRating: 85,
  strategyUsed: 'collaborative'
});
```

**Therapy System**:
```typescript
// Publishes on therapy breakthrough
await eventPublisher.publishTherapyEvent({
  characterId: 'achilles',
  sessionType: 'individual',
  breakthroughs: ['anger_management'],
  conflictsAddressed: ['kitchen_disputes']
});
```

**Training System**:
```typescript
// Publishes on training completion
await eventPublisher.publishTrainingSession({
  characterId: 'achilles',
  trainingType: 'combat_technique',
  skillsFocused: ['sword_work'],
  improvement: 'significant'
});
```

### **Context Generation**

Smart context is automatically generated for each chat:

```typescript
// Performance coaching gets battle-focused context
const context = await eventContextService.getPerformanceContext(characterId);
// Returns: "PERFORMANCE: 7W/3L (70% win rate, 📈 improving)"

// Equipment chat gets gear-focused context  
const context = await eventContextService.getEquipmentContext(characterId);
// Returns: "EQUIPMENT: Recent changes - Iron Sword equipped, Flame Blade available"
```

### **Memory Persistence**

Character memories are automatically created and ranked:

```typescript
// High-importance events become lasting memories
memory = {
  content: "Epic victory against overwhelming odds",
  importance: 9, // 1-10 scale
  emotional_intensity: 8,
  emotional_valence: 'positive',
  associated_characters: ['joan', 'holmes']
}
```

---

## 🚀 Getting Started

### **For Players**

1. **Start Conversations**: Notice how characters now reference recent events
2. **Engage with Conflicts**: Try resolving disputes instead of avoiding them
3. **Build Streaks**: Aim for consecutive conflict resolutions for bonus rewards
4. **Use Guidance**: Check the conflict analysis before making decisions
5. **Track Progress**: Watch how relationships evolve based on your choices

### **For Developers**

1. **Event Publishing**: Use `EventPublisher.getInstance()` in any game system
2. **Context Integration**: Add event context to chat components
3. **Memory Queries**: Use `GameEventBus.getInstance().getCharacterEvents()`
4. **Relationship Tracking**: Access via `getRelationshipSummary()`
5. **Testing**: Use browser console methods for debugging

### **Browser Console Commands**

```javascript
// Test living context system
await window.livingContextTest.quickTest('achilles');

// Test event system  
await window.eventSystemTest.quickEventTest();

// Analyze conflict engagement value
window.gameBalance.analyzeConflictEngagementValue('achilles', 'kitchen_dispute', 'medium');
```

---

## 📈 Benefits Summary

### **For Player Experience**:
- **Immersive Storytelling**: Characters feel alive and aware
- **Strategic Depth**: Meaningful choices with lasting consequences  
- **Progression Rewards**: Clear incentives for engagement
- **Relationship Building**: Dynamic social gameplay
- **Personalized Content**: Responses tailored to your specific journey

### **For Game Balance**:
- **Engagement Incentives**: Conflict resolution 10x more rewarding than avoidance
- **Strategic Complexity**: Multiple valid approaches to each situation
- **Long-term Planning**: Decisions affect future opportunities
- **Social Dynamics**: Relationship networks create emergent gameplay
- **Skill Development**: Clear progression paths through interaction

### **for Narrative Coherence**:
- **Cross-System Continuity**: Events in one area affect all others
- **Character Development**: Natural growth through experience
- **World Building**: Interconnected systems create living world
- **Emotional Investment**: Players care about relationship outcomes
- **Replay Value**: Different choices lead to different character arcs

---

## 🎯 Advanced Features

### **Relationship Evolution**

Relationships now have multiple dimensions:
- **Trust Level**: -100 to +100, affects cooperation
- **Respect Level**: -100 to +100, affects influence  
- **Affection Level**: -100 to +100, affects loyalty
- **Rivalry Intensity**: 0 to 100, affects competition
- **Shared Experiences**: Common positive memories
- **Conflict History**: Unresolved disputes
- **Interaction Frequency**: Recent communication level

### **Memory Importance System**

Events are ranked by importance (1-10):
- **9-10**: Life-changing events (epic victories, major breakthroughs)
- **7-8**: Significant events (conflict resolutions, skill unlocks)
- **5-6**: Notable events (training completions, casual conversations)
- **3-4**: Minor events (equipment changes, daily interactions)
- **1-2**: Trivial events (automatically cleaned up after 2 weeks)

### **Emotional State Tracking**

Characters maintain emotional states based on recent events:
- **Confidence**: Affected by victories, defeats, and personal achievements
- **Stress**: Increased by conflicts, training exhaustion, and overcrowding
- **Social Connection**: Influenced by relationship quality and interaction frequency
- **Growth Motivation**: Driven by skill development and positive reinforcement

---

## 🔮 Future Possibilities

The centralized event system opens up many future enhancements:

### **Advanced Analytics**:
- Player behavior pattern analysis
- Optimal progression path recommendations
- Personalized content generation
- Predictive conflict modeling

### **Dynamic Content**:
- Procedurally generated conflicts based on character history
- Adaptive difficulty based on resolution success rate
- Emergent storylines from character interactions
- Context-aware quest generation

### **Social Features**:
- Cross-player relationship networks
- Shared conflict resolution challenges
- Team-based progression systems
- Community-driven character development

### **AI Enhancement**:
- More sophisticated personality evolution
- Contextual dialogue generation
- Predictive character behavior
- Adaptive coaching strategies

---

This system transforms Blank Wars into a truly persistent world where every interaction matters and characters grow through their experiences. The combination of strategic incentives, cross-system awareness, and persistent memory creates a rich, evolving gameplay experience that rewards engagement and builds meaningful relationships between characters.