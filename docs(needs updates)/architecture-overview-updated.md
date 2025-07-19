# Blank Wars - Current Architecture Overview (Updated)

## Date: July 19, 2025
## Status: Reflects implemented features and current system state

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer - IMPLEMENTED"
        WEB[Web App<br/>Next.js 14 + TypeScript]
        MOBILE[Future: Mobile PWA]
    end
    
    subgraph "API Layer - IMPLEMENTED"
        SERVER[Express.js Server<br/>Rate Limiting + CORS]
        SOCKET[Socket.io<br/>Real-time Communication]
    end
    
    subgraph "Core Services - IMPLEMENTED"
        AUTH[✅ Auth Service<br/>JWT + httpOnly Cookies]
        USER[✅ User Service<br/>PostgreSQL Integration]
        CHAR[✅ Character Service<br/>Collection Management]
        CHAT[✅ Chat Service<br/>OpenAI Integration]
        BATTLE[✅ Battle System<br/>WebSocket-based]
        HQ[✅ Headquarters<br/>Facility Management]
    end
    
    subgraph "AI Layer - IMPLEMENTED"
        OPENAI[OpenAI GPT-3.5/4<br/>Character Responses]
        COACHING[AI Coaching<br/>Performance & Skills]
        ESTATE[Real Estate Agents<br/>Facility Consultation]
    end
    
    subgraph "Data Layer - IMPLEMENTED"
        PG[(✅ PostgreSQL<br/>Users, Characters, Battles)]
        CACHE[(In-Memory Cache<br/>Session Data)]
    end
    
    WEB --> SERVER
    WEB --> SOCKET
    SERVER --> AUTH
    SERVER --> USER
    SERVER --> CHAR
    SERVER --> CHAT
    SERVER --> BATTLE
    SERVER --> HQ
    
    CHAT --> OPENAI
    COACHING --> OPENAI
    ESTATE --> OPENAI
    
    AUTH --> PG
    USER --> PG
    CHAR --> PG
    BATTLE --> PG
```

---

## 2. Implemented Frontend Architecture

### Current Web Application Structure
```typescript
// ✅ IMPLEMENTED - Tech Stack
{
  framework: "Next.js 14 (App Router)",
  styling: "Tailwind CSS + Framer Motion",
  state: "React Context + useState/useEffect",
  realtime: "Socket.io Client",
  authentication: "httpOnly Cookies + JWT",
  deployment: "Vercel"
}

// ✅ IMPLEMENTED - Current Route Structure
/app
├── page.tsx                    // Main game dashboard
├── coach/page.tsx             // Coach progression system
├── game/page.tsx              // Battle arena
├── test-chat/page.tsx         // Chat testing
├── test-facilities/page.tsx   // HQ facilities testing
└── debug-test/page.tsx        // Development testing
```

### Main Tab System (Core UI)
```typescript
// ✅ IMPLEMENTED - Main Navigation Tabs
const implementedTabs = {
  coach: {
    subTabs: [
      "front-office",      // ✅ Coach progression dashboard
      "team-dashboard",    // ✅ Team stats overview
      "performance-coaching", // ✅ 1-on-1 combat training
      "individual-sessions",  // ✅ Personal life coaching
      "financial-advisory",   // ✅ Financial management
      "therapy",             // ✅ Character therapy sessions
      "group-events"         // ✅ Team building activities
    ]
  },
  
  characters: {
    subTabs: [
      "progression",    // ✅ Character leveling & stats
      "equipment",      // ✅ Weapons & armor + AI advisor
      "abilities"       // ✅ Skills & abilities + AI coach
    ]
  },
  
  headquarters: {
    subTabs: [
      "overview"        // ✅ Team base + facility management
    ]
  },
  
  training: {
    subTabs: [
      "activities",     // ✅ Daily training sessions
      "progress",       // ✅ Training progress tracking
      "membership"      // ✅ Training tier subscriptions
    ]
  },
  
  battle: {
    subTabs: [
      "team-arena",     // ✅ 3v3 combat system
      "gameplan",       // ✅ Strategy tracking
      "teams",          // ✅ Team building
      "packs"           // ✅ Character pack opening
    ]
  },
  
  social: {
    subTabs: [
      "clubhouse"       // ✅ Community features
    ]
  },
  
  store: {
    subTabs: [
      "merch"           // ✅ Merchandise purchasing
    ]
  }
};
```

---

*This document reflects the actual implemented state as of July 19, 2025. The project has moved from architectural planning to a functional, deployable application with core features working.*