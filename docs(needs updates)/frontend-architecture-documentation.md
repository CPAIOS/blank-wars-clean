# Blank Wars Frontend Architecture Documentation

## Project Overview

**Blank Wars** is a comprehensive character coaching and management gaming application where users coach legendary historical and mythological characters through psychological challenges, strategic battles, and complex financial systems. The frontend is built with Next.js 15, React 19, and TypeScript with a focus on real-time interactions and character progression.

## Technology Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript 5.x (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with Lucide React icons + MUI Charts
- **Animations**: Framer Motion 12.x
- **State Management**: React Context API + Zustand 5.x for game state
- **Data Fetching**: TanStack React Query 5.x + Axios
- **Real-time**: Socket.IO client 4.8.x
- **Testing**: Jest 30.x with React Testing Library
- **Additional**: OpenAI API integration, Emotion for styling

## Directory Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/socket/          # Socket.IO API routes
│   │   ├── coach/               # Coach-specific pages
│   │   ├── game/                # Main game interface
│   │   ├── debug-test/          # Development testing pages
│   │   ├── test-chat/           # Chat system testing
│   │   ├── test-facilities/     # Facility system testing
│   │   ├── test-kitchen/        # Kitchen chat testing
│   │   ├── simple/              # Simplified interfaces
│   │   ├── favicon.ico
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Main homepage
│   │
│   ├── components/              # React Components (90+ files)
│   │   ├── archive/             # Archived component versions
│   │   ├── MainTabSystem.tsx    # Primary navigation system
│   │   ├── AuthModal.tsx        # Authentication UI
│   │   ├── TutorialSystem.tsx   # Help & onboarding system
│   │   ├── ErrorBoundary.tsx    # Error handling
│   │   │
│   │   ├── Character System/
│   │   │   ├── CharacterDatabase.tsx
│   │   │   ├── CharacterProgression.tsx
│   │   │   ├── CharacterEchoManager.tsx      # Character AI conversations
│   │   │   ├── CharacterLevelManager.tsx
│   │   │   ├── CharacterCollection.tsx
│   │   │   ├── CharacterSelector.tsx
│   │   │   └── CharacterSlotUpgrade.tsx
│   │   │
│   │   ├── Equipment & Progression/
│   │   │   ├── EquipmentManager.tsx
│   │   │   ├── EquipmentInventory.tsx
│   │   │   ├── EquipmentProgressionTracker.tsx
│   │   │   ├── CombatSkillProgression.tsx
│   │   │   ├── CraftingInterface.tsx
│   │   │   ├── AbilityManager.tsx
│   │   │   └── SkillTree.tsx
│   │   │
│   │   ├── Battle System/
│   │   │   ├── ImprovedBattleArena.tsx       # Main battle component
│   │   │   ├── SimpleBattleArena.tsx
│   │   │   ├── CompletePsychologyBattleSystem.tsx
│   │   │   ├── BattleArenaWrapper.tsx
│   │   │   ├── BattleHUD.tsx
│   │   │   ├── BattleRewards.tsx
│   │   │   ├── GameplanTracker.tsx
│   │   │   ├── TeamBuilder.tsx
│   │   │   └── MatchmakingPanel.tsx
│   │   │
│   │   ├── Coaching & Psychology/
│   │   │   ├── CoachProgressionDashboard.tsx
│   │   │   ├── CoachingInterface.tsx
│   │   │   ├── CoachingPanel.tsx
│   │   │   ├── CoachingSessionChat.tsx
│   │   │   ├── ConflictGuidancePanel.tsx
│   │   │   ├── TeamManagementCoaching.tsx
│   │   │   └── TherapyModule.tsx
│   │   │
│   │   ├── Financial System/
│   │   │   ├── FinancialAdvisorChat.tsx
│   │   │   ├── RealEstateAgentChat.tsx
│   │   │   └── [Various financial coaching components]
│   │   │
│   │   ├── Social Features/
│   │   │   ├── Clubhouse.tsx
│   │   │   ├── ClubhouseLounge.tsx
│   │   │   ├── CommunityBoard.tsx
│   │   │   ├── GraffitiWall.tsx
│   │   │   ├── TeamHeadquarters.tsx
│   │   │   └── Leaderboards.tsx
│   │   │
│   │   ├── Training System/
│   │   │   ├── TrainingGrounds.tsx
│   │   │   ├── TrainingInterface.tsx
│   │   │   ├── TrainingFacilitySelector.tsx
│   │   │   ├── FacilitiesManager.tsx
│   │   │   ├── PersonalTrainerChat.tsx
│   │   │   └── SkillDevelopmentChat.tsx
│   │   │
│   │   └── Card & Pack System/
│   │       ├── CardCollection.tsx
│   │       ├── CardPackOpening.tsx
│   │       ├── PackOpening.tsx
│   │       ├── TradingCard.tsx
│   │       └── NewUserOnboarding.tsx
│   │
│   ├── contexts/                # React Contexts
│   │   ├── __tests__/
│   │   └── AuthContext.tsx      # User authentication & coach progression
│   │
│   ├── data/                    # Static Data & Game Logic (40+ files)
│   │   ├── characters.ts        # Character definitions
│   │   ├── equipment.ts         # Equipment & gear systems
│   │   ├── characterProgression.ts  # Level & XP systems
│   │   ├── abilities.ts         # Character abilities & skills
│   │   ├── skills.ts            # Skill system definitions
│   │   ├── clubhouse.ts         # Social features data
│   │   ├── facilities.ts        # Training facility data
│   │   ├── coachingSystem.ts    # Psychology coaching data
│   │   ├── financialPromptTemplateService.ts # Financial coaching prompts
│   │   ├── kitchenChatService.ts # Kitchen interaction system
│   │   ├── therapyChatService.ts # Therapy system data
│   │   ├── realEstateAgents.ts  # Real estate agent data
│   │   ├── combatSkillProgression.ts # Combat progression
│   │   ├── equipmentProgression.ts # Equipment advancement
│   │   ├── craftingSystem.ts    # Item crafting system
│   │   └── userAccount.ts       # User profile structures
│   │
│   ├── hooks/                   # Custom React Hooks (15+ files)
│   │   ├── __tests__/
│   │   ├── useBattleWebSocket.ts    # Real-time battle connections
│   │   ├── useBattleAnnouncer.ts    # Battle commentary
│   │   ├── useBattleState.ts        # Battle state management
│   │   ├── useBattleFlow.ts         # Battle progression logic
│   │   ├── useBattleFinancialIntegration.ts # Financial battle integration
│   │   ├── useCoachingSystem.ts     # Psychology coaching hooks
│   │   ├── usePsychologySystem.ts   # Psychology management
│   │   ├── useCardCollectionSystem.ts # Card collection logic
│   │   ├── useMatchmaking.ts        # Battle matchmaking
│   │   ├── useLobby.ts              # Lobby system
│   │   ├── useTutorial.ts           # Tutorial system hooks
│   │   └── useTimeoutManager.ts     # Game timing logic
│   │
│   ├── services/                # External Services & APIs (35+ files)
│   │   ├── apiClient.ts         # HTTP client configuration
│   │   ├── authService.ts       # Authentication service
│   │   ├── coachProgressionAPI.ts # Coach progression API
│   │   ├── audioService.ts      # Sound effects & music
│   │   ├── battleWebSocket.ts   # Battle real-time communication
│   │   ├── battleFinancialService.ts # Financial battle integration
│   │   ├── characterService.ts  # Character management API
│   │   ├── echoService.ts       # Character conversation system
│   │   ├── packService.ts       # Card pack system
│   │   ├── headquartersService.ts # Team headquarters logic
│   │   ├── roomService.ts       # Room-based interactions
│   │   ├── financialPsychologyService.ts # Financial psychology
│   │   ├── spiralPreventionService.ts # Crisis prevention
│   │   ├── teamCoachingService.ts # Team management
│   │   ├── eventPublisher.ts    # Event system coordination
│   │   ├── gameEventBus.ts      # Cross-system event management
│   │   ├── cacheService.ts      # Client-side caching
│   │   └── optimizedDataService.ts  # Performance optimizations
│   │
│   ├── systems/                 # Game System Logic
│   │   ├── __tests__/
│   │   ├── battleEngine.ts      # Core battle mechanics
│   │   ├── physicalBattleEngine.ts  # Physical combat system
│   │   ├── battleStateManager.ts    # Battle state management
│   │   ├── trainingSystem.ts    # Character development
│   │   ├── coachingSystem.ts    # Psychology-based coaching
│   │   ├── campaignProgression.ts   # Story progression
│   │   ├── storyArcs.ts         # Narrative systems
│   │   ├── progressionIntegration.ts # XP & leveling
│   │   └── postBattleAnalysis.ts # Battle analysis system
│   │
│   ├── types/                   # TypeScript Type Definitions
│   │   ├── headquarters.ts      # Team headquarters types
│   │   ├── lobby.ts             # Lobby system types
│   │   └── user.ts              # User profile types
│   │
│   ├── tests/                   # Integration Tests
│   │   ├── financialSystemIntegrationTest.ts
│   │   └── runIntegrationTest.ts
│   │
│   └── utils/                   # Utility Functions
│       ├── aiChatResponses.ts   # AI response handling
│       ├── battleCharacterUtils.ts # Battle character utilities
│       ├── characterAnalysis.ts # Character analysis tools
│       ├── characterUtils.ts    # Character helper functions
│       ├── headquartersUtils.ts # Team headquarters utilities
│       ├── roomCalculations.ts  # Room-based calculations
│       ├── dataOptimization.ts  # Performance utilities
│       ├── logger.ts            # Logging system
│       └── optimizedStorage.ts  # Local storage management
│
├── public/                      # Static Assets
│   ├── next.svg
│   ├── vercel.svg
│   └── [other-svgs]
│
├── Configuration Files
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── jest.config.mjs            # Jest testing configuration
├── package.json               # Dependencies & scripts
└── README.md                  # Project documentation
```

## Core Systems Architecture

### 1. Authentication & User Management

**Location**: `src/contexts/AuthContext.tsx` + `src/services/authService.ts`

- **Enhanced Security**: JWT tokens with refresh mechanism, secure cookie handling
- **Coach Progression Integration**: Real-time progression tracking with backend sync
- **User Profile Management**: Comprehensive account settings and preferences
- **PostgreSQL Integration**: Full database synchronization for user data

```typescript
// Coach progression example
getCoachTitle(level: 25, wins: 95) → "Veteran Coach Lv.25"

// Enhanced coach progression with backend integration
const { progression, bonuses } = await CoachProgressionAPI.getProgression(userId);
// Returns: level, experience, titles, skill points, bonuses
```

### 2. Character Management System

**Location**: `src/components/Character*` and integrated progression system

- **Character Echo System**: Advanced AI conversations with personality modeling
- **Dual Progression Tracks**: Character XP/levels + Coach progression integration
- **Equipment & Crafting**: Full equipment progression with visual upgrades
- **Character Collection**: Pack opening, trading, and slot management
- **Skill Trees**: Combat mastery, battle tactics, specialized abilities
- **Real-time Synchronization**: Live character state updates across battle system

### 3. Enhanced Battle System

**Location**: `src/components/*BattleArena*` + `src/systems/battleEngine.ts`

- **Psychology-based Combat**: Characters can deviate from strategy
- **Battle AI**: Personality-driven decision making
- **Real-time WebSocket**: Live battle communication
- **Team Strategy**: Formation-based tactical combat
- **Dual Progression Awards**: Character XP + Coach XP in single battles
- **Financial Integration**: Character wealth, spending decisions affect battles
- **Morale & Stress Management**: Dynamic psychological factors during combat
- **Event Broadcasting**: Cross-system event coordination
- **Post-Battle Analysis**: Comprehensive performance analytics and progression

### 4. Coaching & Psychology System

**Location**: `src/components/Coaching*` + `src/services/*Psychology*`

- **Multi-domain Coaching**: Performance, financial, relationship, crisis intervention
- **Coach Progression**: XP from battles (40%), psychology management (30%), character development (30%)
- **Financial Coaching**: Spiral prevention, financial conflict resolution, wealth management
- **Team Chemistry**: Dynamic team relationships affecting battle performance
- **Therapy Integration**: Mental health support with specialized chat interfaces

### 5. Social & Team Features

**Location**: `src/components/Social*` + `src/components/Team*`

- **Clubhouse**: Community hub with message boards
- **Graffiti Wall**: Creative expression system
- **Leaderboards**: Competitive rankings
- **Community Events**: Social activities and tournaments
- **Team Headquarters**: Room-based interactions with financial implications
- **Enhanced Clubhouse**: Multi-room social hub with AI interactions
- **Real Estate System**: Property management affecting team performance
- **Kitchen & Lounge Systems**: Social bonding with psychological benefits
- **Event Broadcasting**: Cross-system event coordination for social activities

### 6. Training & Facilities System

**Location**: `src/components/Training*` + `src/components/Facilities*`

- **Mental Health Management**: Stress, focus, morale tracking
- **Skill Development**: Combat, survival, mental, social skills
- **Training Activities**: Specialized coaching sessions
- **Progress Tracking**: Training points, completion rates
- **Specialized Facilities**: Different training environments with unique benefits
- **AI Coaching Staff**: Personal trainers, skill development coaches, equipment advisors
- **Individual & Team Metrics**: Comprehensive training analytics
- **Financial Training**: Wealth management education integrated with character growth

### 7. Card & Pack System

**Location**: `src/components/Card*` + `src/services/packService.ts`

- **New User Onboarding**: Guided pack opening experience
- **Collection Management**: Advanced card organization and trading
- **Character Acquisition**: Pack-based character recruitment with rarity systems
- **Visual Card System**: Enhanced card display with equipment visualization

## Key Components Deep Dive

### MainTabSystem.tsx
**Primary navigation component organizing the entire application:**

```typescript
// Tab structure
characters: [database, progression, equipment, training, abilities, chat]
training: [activities, progress, facilities, membership, coach]
battle: [team-arena, gameplan, teams, packs]
social: [clubhouse]
store: [merch]
```

### Character Tab Integration
**Recent improvements moved training systems to character management:**

- ✅ **Character Progression**: Moved from Training to Character tab
- ✅ **Equipment System**: Centralized in Character tab
- ✅ **Training Interface**: Added as Character sub-tab for better UX

### TutorialSystem.tsx
**Comprehensive help system with contextual tutorials:**

- **Getting Started**: Coach progression and fundamentals
- **Character Management**: Database, progression, equipment
- **Training System**: Mental health and skill development
- **Battle System**: Psychology-based combat mechanics

## Data Flow Architecture

### State Management Strategy

```typescript
// Global State (React Context)
AuthContext → User authentication & coach progression

// Local State (React useState)
Component-specific UI state, form inputs, temporary data

// Server State (React Query)
API data fetching, caching, synchronization

// Game State (Zustand 5.x)
Battle state, character stats, real-time updates, progression tracking
```

### API Integration

```typescript
// Backend Communication
Backend: localhost:3006 (PostgreSQL database)
Frontend: localhost:3007 (standardized port)

// Real-time Features
WebSocket: Battle updates, live coaching, cross-system events
HTTP: RESTful APIs for authentication, character data, progression
Socket.IO: Event broadcasting, room-based interactions

// New Character Progression APIs
GET  /api/character-progression/:characterId
POST /api/character-progression/:characterId/award-xp
POST /api/character-progression/:characterId/unlock-skill
POST /api/character-progression/:characterId/progress-skill
POST /api/character-progression/:characterId/unlock-ability
GET  /api/character-progression/xp-calculator/:level

// New Coach Progression APIs  
GET  /api/coach-progression
GET  /api/coach-progression/xp-history
GET  /api/coach-progression/skills
GET  /api/coach-progression/leaderboard
POST /api/coach-progression/award-battle-xp
POST /api/coach-progression/award-psychology-xp
POST /api/coach-progression/award-character-development-xp
POST /api/coach-progression/award-gameplan-adherence-xp
POST /api/coach-progression/award-team-chemistry-xp
```

## Performance Considerations

### Code Splitting Strategy
- ✅ **Lazy Loading**: Non-critical components use React.lazy()
- ⚠️ **Large Components**: Battle arena (2,412 lines) needs splitting
- ⚠️ **Bundle Size**: 358kB first load (acceptable but improvable)

### Optimization Opportunities
```typescript
// Current: Large monolithic components
const ImprovedBattleArena = () => { /* 2,400+ lines */ }

// Recommended: Split into smaller components
const BattleArena = () => (
  <BattleArenaProvider>
    <BattleHeader />
    <BattleField />
    <BattleControls />
  </BattleArenaProvider>
)
```

## Security Implementation

### Authentication Security
- ✅ **HttpOnly Cookies**: Tokens stored securely server-side
- ✅ **No Vulnerabilities**: Clean npm audit
- ✅ **Environment Variables**: Properly configured
- ✅ **Password Hashing**: Bcrypt with 12 salt rounds

### Data Protection
- ✅ **Secure Headers**: Proper CORS configuration
- ⚠️ **localStorage**: Game state stored locally (non-sensitive)
- ✅ **Input Validation**: Client and server-side validation

## Development Workflow

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run test         # Jest testing
```

### Code Quality Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Code formatting
- **Jest**: Unit and integration testing

## Recent Major Updates (July 2025)

### Character Progression System Integration
- **Backend Service**: Complete CharacterProgressionService with XP, levels, skills, abilities
- **Database Schema**: New PostgreSQL tables for character and coach progression
- **Battle Integration**: Automatic XP awarding for both characters and coaches
- **API Endpoints**: Full REST API for progression management
- **Dual Progression**: Characters gain XP/skills while coaches earn progression points

### Authentication & Security Enhancements
- **JWT Refresh Tokens**: Enhanced security with token refresh mechanism
- **Cross-Origin Fixes**: Resolved authentication cookie issues
- **PostgreSQL Migration**: Moved from SQLite to PostgreSQL for production readiness

### New Systems Added
- **Financial Coaching**: Spiral prevention, wealth management, financial psychology
- **Event Broadcasting**: Cross-system event coordination via Socket.IO
- **Enhanced Chat Systems**: Group chat with character AI personalities
- **Pack Opening Experience**: Improved new user onboarding flow

## Known Issues & Technical Debt

### Critical Issues
1. **⚠️ Build Configuration**: TypeScript/ESLint errors ignored in builds
2. **⚠️ Component Size**: ImprovedBattleArena.tsx (2,412 lines) needs refactoring
3. **⚠️ Test Coverage**: Low test coverage (~10%)

### Architectural Improvements Needed
1. **State Management**: Expand Zustand usage for complex game state (Zustand 5.x implemented)
2. **Component Architecture**: Split large components
3. **Error Boundaries**: Add comprehensive error handling (ErrorBoundary.tsx added)
4. **Performance**: Implement memoization and virtualization

## Getting Started for New Developers

### Prerequisites
```bash
Node.js 18+ 
npm 9+
```

### Setup Instructions
```bash
cd frontend/
npm install
npm run dev  # Runs on port 3007 (configured in package.json)
```

### Key Files to Understand
1. `src/app/page.tsx` - Application entry point
2. `src/components/MainTabSystem.tsx` - Navigation structure
3. `src/contexts/AuthContext.tsx` - Authentication logic
4. `src/data/characters.ts` - Game data structure
5. `src/systems/battleEngine.ts` - Core game mechanics

## Future Roadmap

### Phase 1: Stabilization
- Fix TypeScript build configuration
- Split large components
- Improve test coverage
- Add error boundaries

### Phase 2: Performance
- Implement proper state management
- Add memoization strategies
- Optimize bundle splitting
- Performance monitoring

### Phase 3: Features
- Advanced battle mechanics
- Enhanced social features
- Mobile responsiveness
- PWA capabilities

---

## Contact & Support

For questions about the frontend architecture or development workflow, reference this documentation and the comprehensive site audit report. The codebase follows modern React patterns with room for architectural improvements in component organization and state management.

**Last Updated**: July 19, 2025 - Character Progression System Integration
**Architecture Version**: 3.0 (Dual Progression System + PostgreSQL Migration)
**Major Changes**: Added character/coach progression, enhanced authentication, financial coaching systems