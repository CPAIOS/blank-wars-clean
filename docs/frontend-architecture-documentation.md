# Blank Wars Frontend Architecture Documentation

## Project Overview

**Blank Wars** is a character management gaming application where users coach legendary historical and mythological characters through psychological challenges and strategic battles. The frontend is built with Next.js 15, React 19, and TypeScript.

## Technology Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript 5.x (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion 12.x
- **State Management**: React Context API + Zustand for specific features
- **Data Fetching**: TanStack React Query
- **Real-time**: Socket.IO client
- **Testing**: Jest 30.x with React Testing Library

## Directory Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── favicon.ico
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Main homepage
│   │   └── test/
│   │       └── page.tsx         # Test page
│   │
│   ├── components/              # React Components (59 files)
│   │   ├── __tests__/           # Component tests
│   │   ├── MainTabSystem.tsx    # Primary navigation system
│   │   ├── AuthModal.tsx        # Authentication UI
│   │   ├── TutorialSystem.tsx   # Help & onboarding system
│   │   ├── Character Management/
│   │   │   ├── CharacterDatabase.tsx
│   │   │   ├── CharacterProgression.tsx
│   │   │   ├── EquipmentManager.tsx
│   │   │   └── TrainingInterface.tsx
│   │   ├── Battle System/
│   │   │   ├── ImprovedBattleArena.tsx    # Main battle component (⚠️ 2,412 lines)
│   │   │   ├── TestBattleArena.tsx
│   │   │   ├── GameplanTracker.tsx
│   │   │   └── TeamBuilder.tsx
│   │   ├── Social Features/
│   │   │   ├── Clubhouse.tsx
│   │   │   ├── CommunityBoard.tsx
│   │   │   ├── GraffitiWall.tsx
│   │   │   └── Leaderboards.tsx
│   │   └── Training System/
│   │       ├── TrainingGrounds.tsx        # Training activities (⚠️ 1,419 lines)
│   │       ├── TrainingInterface.tsx      # Mental health training
│   │       ├── ProgressionDashboard.tsx
│   │       └── AICoach.tsx
│   │
│   ├── contexts/                # React Contexts
│   │   ├── __tests__/
│   │   └── AuthContext.tsx      # User authentication & coach progression
│   │
│   ├── data/                    # Static Data & Game Logic
│   │   ├── characters.ts        # Character definitions
│   │   ├── equipment.ts         # Equipment & gear systems
│   │   ├── characterProgression.ts  # Level & XP systems
│   │   ├── abilities.ts         # Character abilities & skills
│   │   ├── clubhouse.ts         # Social features data
│   │   └── userAccount.ts       # User profile structures
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── __tests__/
│   │   ├── useBattleWebSocket.ts    # Real-time battle connections
│   │   ├── useBattleAnnouncer.ts    # Battle commentary
│   │   └── useTimeoutManager.ts     # Game timing logic
│   │
│   ├── services/                # External Services & APIs
│   │   ├── apiClient.ts         # HTTP client configuration
│   │   ├── authService.ts       # Authentication service
│   │   ├── audioService.ts      # Sound effects & music
│   │   ├── battleWebSocket.ts   # Battle real-time communication
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
│   │   └── progressionIntegration.ts # XP & leveling
│   │
│   └── utils/                   # Utility Functions
│       ├── dataOptimization.ts # Performance utilities
│       ├── logger.ts           # Logging system
│       └── optimizedStorage.ts # Local storage management
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

**Location**: `src/contexts/AuthContext.tsx`

- **Coach Progression System**: Dynamic titles based on level and wins
- **Demo User**: Built-in demo account for development
- **Security**: HttpOnly cookies, secure token handling

```typescript
// Coach progression example
getCoachTitle(level: 25, wins: 95) → "Veteran Coach Lv.25"
```

### 2. Character Management System

**Location**: `src/components/Character*` and `src/data/characters.ts`

- **Character Database**: Browse & recruit legendary characters
- **Progression System**: XP, levels, skill trees, and tier advancement
- **Equipment System**: Weapons, armor, accessories with stat bonuses
- **Training System**: Mental health, skill development, psychology-based coaching

### 3. Battle System

**Location**: `src/components/ImprovedBattleArena.tsx` (⚠️ Needs refactoring)

- **Psychology-based Combat**: Characters can deviate from strategy
- **Real-time WebSocket**: Live battle communication
- **Team Strategy**: Formation-based tactical combat
- **Battle AI**: Personality-driven decision making

### 4. Social Features

**Location**: `src/components/Social*/` and `src/data/clubhouse.ts`

- **Clubhouse**: Community hub with message boards
- **Graffiti Wall**: Creative expression system
- **Leaderboards**: Competitive rankings
- **Community Events**: Social activities and tournaments

### 5. Training System

**Location**: `src/components/Training*` and `src/systems/trainingSystem.ts`

- **Mental Health Management**: Stress, focus, morale tracking
- **Skill Development**: Combat, survival, mental, social skills
- **Training Activities**: Specialized coaching sessions
- **Progress Tracking**: Training points, completion rates

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

// Game State (Zustand - planned)
Battle state, character stats, real-time updates
```

### API Integration

```typescript
// Backend Communication
Backend: localhost:4000 (SQLite database)
Frontend: localhost:3009+ (avoid port conflicts)

// Real-time Features
WebSocket: Battle updates, live coaching
HTTP: Authentication, character data, progression
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

## Known Issues & Technical Debt

### Critical Issues
1. **⚠️ Build Configuration**: TypeScript/ESLint errors ignored in builds
2. **⚠️ Component Size**: ImprovedBattleArena.tsx (2,412 lines) needs refactoring
3. **⚠️ Test Coverage**: Low test coverage (~10%)

### Architectural Improvements Needed
1. **State Management**: Implement Zustand for game state
2. **Component Architecture**: Split large components
3. **Error Boundaries**: Add comprehensive error handling
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
npm run dev -- -p 3009  # Avoid port conflicts
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

**Last Updated**: Character Development Handoff - January 2025
**Architecture Version**: 2.0 (Post-Character Tab Integration)