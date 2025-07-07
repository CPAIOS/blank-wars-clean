# Project Overview: Blank Wars

Welcome to the Blank Wars project! This document provides a comprehensive tour of the codebase, explaining its structure, key components, and how different parts of the application interconnect. This overview is designed to help new agents quickly understand the system and contribute effectively.

## 1. Project Root Structure

The project is organized into several top-level directories:

*   `backend/`: Contains all server-side code, APIs, and real-time communication logic.
*   `frontend/`: Contains all client-side code, user interfaces, and frontend logic.
*   `docs/`: Documentation and design specifications.
*   `scripts/`: Utility scripts for development, deployment, or data management.
*   `node_modules/`: Installed Node.js dependencies for both frontend and backend.
*   `package.json`, `package-lock.json`: Define project metadata and dependencies for both frontend and backend (managed as a monorepo or shared dependencies).
*   `Dockerfile`: Defines the Docker image for containerizing the backend application.
*   `.env*`: Environment configuration files (e.g., `.env`, `.env.example`, `.env.test`).
*   `api-endpoints.ts`: **Crucial.** A centralized definition of all API endpoints (REST and WebSocket events), their expected payloads, and responses. This is invaluable for cross-service communication and ensuring frontend/backend compatibility.
*   `database-setup.sql`: Contains the SQL commands to set up the database schema and initial data.
*   `DELEGATION_INSTRUCTIONS.md`: A project management or workflow document, indicating how tasks are delegated or how the team operates.
*   `deployment-config.txt`: Contains specific configurations related to application deployment.
*   `quick_kitchen_test.js`, `test_chat_systems.js`, `test_openai.js`, `test_socket_connection.js`: Standalone test scripts for specific backend functionalities.

## 2. Frontend Architecture (`frontend/src/`)

The frontend is a React/Next.js application. Its `src` directory is structured to separate concerns:

*   **`app/`**:
    *   **Purpose**: Defines Next.js routes and global application settings.
    *   **Key Files**:
        *   `layout.tsx`: The root layout, wrapping the entire application (likely includes global providers like `AuthContext`).
        *   `page.tsx`: The main landing page/homepage.
        *   `globals.css`: Global Tailwind CSS styles.
        *   `api/socket/route.ts`: **Crucial.** This is the Next.js API route that serves as the WebSocket server endpoint for real-time communication.
        *   `coach/page.tsx`, `test-kitchen/page.tsx`, `simple-test/page.tsx`, `simple/page.tsx`, `test-chat/page.tsx`, `test/page.tsx`, `debug-test/page.tsx`: Specific pages for different features, testing, or demonstrations.
        *   `favicon.ico`: Application icon.
*   **`components/`**:
    *   **Purpose**: Reusable UI building blocks.
    *   **Key Components**:
        *   `MainTabSystem.tsx`: The top-level navigation for major game sections (Battle, Headquarters, Training, etc.).
        *   `ImprovedBattleArena.tsx`: **Central & Complex.** The main battle interface. It orchestrates many battle-related features and is a primary area for refactoring due to its high complexity and state management.
        *   `BattleHUD.tsx`, `TeamDisplay.tsx`, `TeamOverview.tsx`, `BattleRewards.tsx`: Presentational components for displaying battle information.
        *   `TeamBuilder.tsx`: Manages team creation and composition.
        *   **Headquarters (HQ) & Facilities**:
            *   `TeamHeadquarters.tsx`: The main dashboard for the HQ, displaying its status and navigation to sub-sections.
            *   `FacilitiesManager.tsx`: UI for managing and upgrading physical spaces within the HQ.
            *   `Clubhouse.tsx`, `ClubhouseLounge.tsx`: Social areas within the HQ, where characters might interact.
            *   `TrainingFacilitySelector.tsx`: UI for assigning characters to specific training facilities within the HQ.
            *   `Confessional.tsx` (Implied): UI for characters to give "confessional" interviews, central to the mockumentary theme.
            *   `KitchenTable.tsx` (Implied): UI representing the kitchen area for character interactions, driving "house drama."
        *   **Training & Coaching**:
            *   `TrainingGrounds.tsx`, `TrainingInterface.tsx`: Manage character training sessions.
            *   `AICoach.tsx`: General component for AI-driven coaching interactions.
            *   `CoachingInterface.tsx`, `CoachingPanel.tsx`: Broader UIs for coaching interactions.
            *   `SkillDevelopmentChat.tsx`: Chat for discussing skill development with an AI coach.
            *   `EquipmentAdvisorChat.tsx`: Chat for getting equipment advice from an AI.
            *   `PerformanceCoachingChat.tsx`: Chat for one-on-one performance coaching with an AI.
            *   `TrainingProgressComponent.tsx`: Displays progress of ongoing training sessions.
        *   **Character Management & Progression**:
            *   `AbilityManager.tsx`: UI for managing character abilities.
            *   `CharacterCardWithEquipment.tsx`: Displays characters with equipped items.
            *   `CharacterLevelManager.tsx`: Manages character leveling up.
            *   `CharacterSelector.tsx`: Generic component for selecting characters.
            *   `CharacterCollection.tsx`, `CharacterDatabase.tsx`: For viewing available characters.
            *   `CharacterProgression.tsx`, `SkillTree.tsx`: UIs for character growth and skill unlocking.
            *   `CombatSkillProgression.tsx`: Tracks and displays combat skill development.
            *   `StoryArcViewer.tsx`: Implies a narrative or story progression system for characters.
        *   **Equipment & Inventory**:
            *   `CraftingInterface.tsx`: UI for crafting new items.
            *   `CraftingProgressionDemo.tsx`: Demo for crafting progression.
            *   `EquipmentDetailsModal.tsx`: Modal for detailed equipment info.
            *   `EquipmentInventory.tsx`: UI for managing equipped and unequipped items.
            *   `EquipmentManager.tsx`: Orchestrates the overall equipment system.
            *   `EquipmentProgressionTracker.tsx`: Tracks equipment upgrades.
            *   `EquipmentShowcaseDemo.tsx`: Demo for showcasing equipment.
            *   `equipmentVisualIndex.ts`: Maps equipment IDs to visual representations.
            *   `InventoryManager.tsx`: Manages player's overall inventory.
            *   `ItemManager.tsx`: Manages individual items.
        *   **Social & Community**:
            *   `FriendList.tsx`: UI for managing friends and requests.
            *   `Leaderboards.tsx`: Displays player rankings.
            *   `Lobby.tsx`: UI for creating and joining game lobbies.
            *   `MatchmakingPanel.tsx`: UI for the matchmaking process.
            *   `SimpleChatDemo.tsx`: Basic chat demonstration.
            *   `TeamBuildingActivities.tsx`: Activities to improve team cohesion.
            *   `CommunityBoard.tsx`, `AIMessageBoard.tsx`: Public forums/message boards.
            *   `GraffitiWall.tsx`: A unique, visual social communication method.
        *   **Monetization**:
            *   `CardPackOpening.tsx`, `PackOpening.tsx`: Interfaces for opening card packs.
            *   `MembershipSelection.tsx`: UI for purchasing memberships.
            *   `MerchStore.tsx`: A storefront for merchandise.
        *   **Authentication & User Profiles**:
            *   `AuthModal.tsx`: Login/signup modal.
            *   `UserProfile.tsx`, `AccountManager.tsx`: Handle user authentication and profile display.
        *   **Tutorials & Onboarding**:
            *   `NewUserOnboarding.tsx`: Dedicated UI flow for new user onboarding.
            *   `PsychologyTutorial.tsx`: Tutorial focused on the psychology system.
            *   `Tutorial.tsx`, `TutorialDemo.tsx`, `TutorialSystem.tsx`: General tutorial components and core system.
*   **`contexts/`**:
    *   **Purpose**: React Context providers for global state management.
    *   **Key Files**:
        *   `AuthContext.tsx`: **Crucial.** Manages user authentication state (tokens, user profile) across the application.
*   **`data/`**:
    *   **Purpose**: Defines data structures (TypeScript interfaces/types), mock data, and core game data logic.
    *   **Key Files**:
        *   `battleFlow.ts`, `teamBattleSystem.ts`: Define core battle mechanics, character stats, and team dynamics.
        *   `characters.ts`: Base character definitions, including diverse types (historical, mythological, fantastical, e.g., Skeleton Mage, Rainbow Unicorn).
        *   `characterPsychology.ts`: **Crucial for Psychology System.** Defines `PsychologyState`, deviation risks, stability factors, and rules for psychological state updates.
        *   `aiJudgeSystem.ts`: Defines `JudgeDecision` and rules for AI judge assessment of character deviations.
        *   `coachingSystem.ts`: Defines `CoachingSession` and `CoachingEngine`, detailing how coaching actions impact character psychological stats and team chemistry (e.g., player therapy, meditation, dinners, team building exercises).
        *   `equipment.ts`, `characterEquipment.ts`, `equipmentBattleIntegration.ts`: Define equipment and its effects.
        *   `craftingSystem.ts`: Defines rules and recipes for crafting.
        *   `inventory.ts`, `items.ts`: Define inventory and item structures.
        *   `abilities.ts`, `legendaryAbilities.ts`, `skills.ts`, `skillInteractions.ts`: Define character abilities and skills.
        *   `characterProgression.ts`, `combatSkillProgression.ts`, `experience.ts`: Define character and skill progression rules.
        *   `facilities.ts`, `clubhouse.ts`: Define HQ facilities and social areas.
        *   `memberships.ts`, `merchandise.ts`: Define monetization data.
        *   `tutorialSteps.ts`: Defines content and steps for tutorials.
        *   `userAccount.ts`: User-specific data structures.
        *   `weightClassSystem.ts`: Defines matchmaking weight classes.
        *   `aiCoaching.ts`: Defines data and logic for AI coaching behaviors.
*   **`hooks/`**:
    *   **Purpose**: Encapsulate reusable stateful logic for React components.
    *   **Key Files**:
        *   `useBattleAnnouncer.ts`: Manages battle announcements and voice synthesis.
        *   `useBattleWebSocket.ts`: Intended to manage the WebSocket connection for battle. **Note:** Its current implementation can lead to multiple connections if not used carefully.
        *   `useTimeoutManager.ts`: Utility for managing `setTimeout` calls.
        *   `useLobby.ts`: Manages lobby-related state and interactions.
        *   `useTutorial.ts`: Manages tutorial state and progression.
*   **`services/`**:
    *   **Purpose**: Abstract interactions with external APIs and side effects.
    *   **Key Files**:
        *   `apiClient.ts`: Generic HTTP client for REST API calls.
        *   `authService.ts`, `userService.ts`: Handle authentication and user data.
        *   `battleWebSocket.ts`: **Crucial.** The singleton service managing the primary Socket.io connection for battles.
        *   `audioService.ts`: Manages audio playback.
        *   `teamCoachingService.ts`, `kitchenChatService.ts`: Services for AI-driven chat interactions.
        *   `cacheService.ts`: Client-side caching.
        *   `optimizedDataService.ts`: For efficient data handling.
        *   `roomImageService.ts`: Manages HQ room images.
        *   `promptTemplateService.ts`: Manages AI prompt templates.
        *   `usageService.ts`: Frontend service for interacting with backend usage tracking.
*   **`systems/`**:
    *   **Purpose**: Contains the core business logic and game rules, often implemented as static classes.
    *   **Key Files**:
        *   `battleEngine.ts`: Orchestrates the battle flow.
        *   `physicalBattleEngine.ts`: Handles physical combat calculations, including `calculatePsychologyModifier` and `performGameplanAdherenceCheck` (for game plan adherence rolls).
        *   `postBattleAnalysis.ts`: Analyzes battle outcomes, psychological consequences (trauma, growth), and relationship changes.
        *   `battleStateManager.ts`: Attempts to manage concurrent state updates.
        *   `trainingSystem.ts`: Core logic for character training.
        *   `campaignProgression.ts`: Manages campaign/story progression.
        *   `progressionIntegration.ts`: Integrates various progression systems.
        *   `storyArcs.ts`: Backend logic for narrative story arcs.
*   **`utils/`**:
    *   **Purpose**: Small, pure utility functions.
    *   **Key Files**: `characterUtils.ts`, `headquartersUtils.ts` (calculates HQ bonuses/penalties, including for sleeping arrangements/overcrowding), `aiChatResponses.ts`, `dataOptimization.ts`, `logger.ts`, `optimizedStorage.ts`.
*   **`__tests__/`**: Contains frontend integration tests (`integration.test.md`).

## 3. Backend Architecture (`backend/src/`)

The backend is a Node.js/Express.js/Socket.io application, primarily written in TypeScript.

*   **`server.ts`**:
    *   **Purpose**: The main entry point. Initializes the Express app, Socket.io server, middleware, and routes.
    *   **Key Responsibilities**: Sets up CORS, security headers (Helmet), compression, rate limiting, and error handling. It also initializes core services and connects to the database.
    *   **AI-Driven Endpoints**:
        *   `POST /api/confessional-interview`: AI-powered endpoint for generating "Hostmaster" interview questions, probing character psychology based on HQ context.
        *   `POST /api/confessional-character-response`: AI-powered endpoint for generating character responses in confessional interviews.
    *   **Socket.io Handlers**: Manages all WebSocket communication, including:
        *   Authentication (`auth`).
        *   Lobby management (`create_lobby`, `join_lobby`, `leave_lobby`, `set_ready`, `start_battle`, `list_public_lobbies`).
        *   Matchmaking (`find_match`, `find_battle`).
        *   Battle joining (`join_battle`).
        *   **AI Chat Interactions**: `chat_message`, `kitchen_chat_request`, `team_chat_message`. These handlers are crucial for the "revolutionary customized use of each" chat, passing detailed `characterData` and `battleContext` to the `aiChatService` for situationally appropriate, personality-driven responses.
*   **`routes/`**:
    *   **Purpose**: Defines RESTful API endpoints.
    *   **Key Files**:
        *   `auth.ts`: User registration, login, token refresh, logout, profile retrieval.
        *   `userRoutes.ts`: User profile management, friend system (add, accept, reject, list friends), user search, user's owned characters.
        *   `characterRoutes.ts`: Retrieves all available character templates.
        *   `cardPackRoutes.ts`: Manages digital card packs.
        *   `paymentRoutes.ts`: Handles payment checkout sessions (integrates with Stripe).
        *   `usage.ts`: Provides and tracks user usage limits for various features.
        *   `battleRoutes.ts`: Provides battle status and user's active battles (real-time battle logic is via WebSockets).
*   **`services/`**:
    *   **Purpose**: Encapsulates core business logic and interactions with external systems/database.
    *   **Key Files**:
        *   `auth.ts`: User authentication and JWT handling.
        *   `userService.ts`: User-related business logic (profiles, friends).
        *   `battleService.ts`: **Crucial.** Manages battle matchmaking, in-battle state, and real-time battle events via Socket.io.
        *   `aiChatService.ts`: **Crucial.** Integrates with AI models (e.g., OpenAI) for dynamic character responses in chat, coaching, and confessional interviews. This service is the core of the "revolutionary customized use of each" chat, tailoring responses based on detailed context.
        *   `CardPackService.ts`: Logic for card pack purchases and redemption.
        *   `PaymentService.ts`: Handles payment processing (Stripe integration).
        *   `lobbyService.ts`: Manages game lobbies.
        *   `usageTrackingService.ts`: Tracks and enforces feature usage limits.
        *   `databaseAdapter.ts`: Provides an abstraction layer for database operations.
        *   `trainingService.ts`: Backend logic for character training and progression.
        *   `analytics.ts`: For collecting and processing analytics data.
        *   `cacheService.ts`: Backend caching service.
        *   `hostmasterService.ts`: Dedicated backend service for the Hostmaster character's logic.
        *   `redisService.ts`: Implies use of Redis for caching/sessions.
*   **`database/`**:
    *   **Purpose**: Manages database connection and data models.
    *   **Key Files**: `index.ts` (initialization), `sqlite.ts` (SQLite connection for dev).
    *   `models/` (Inferred & Crucial): This directory would contain the actual database schema definitions (e.g., for users, characters, inventory, battles, friendships, lobbies, etc.) if an ORM is used, or direct SQL model definitions. This is the blueprint of the game's persistent data.
*   **`middleware/`**:
    *   **Purpose**: Express middleware for cross-cutting concerns.
    *   **Key Files**: `rateLimiter.ts`, `csrf.ts`.
*   **`types/`**:
    *   **Purpose**: Shared TypeScript interfaces and types for backend modules.

## 4. Interconnection: Frontend & Backend Data Flow

The application's functionality relies heavily on the seamless interaction between the frontend and backend:

*   **Authentication & User Data**:
    *   Frontend `AuthModal.tsx` sends login/register requests to `backend/routes/auth.ts`.
    *   Backend responds with JWTs set as `httpOnly` cookies.
    *   Frontend `AuthContext.tsx` manages the client-side authentication state.
    *   Frontend `userService.ts` and `apiClient.ts` make authenticated requests to `backend/routes/userRoutes.ts` for profile and friend data.
*   **Battle System (Real-time Core)**:
    *   Frontend `ImprovedBattleArena.tsx` (via `useBattleWebSocket.ts`) connects to the Socket.io server (`frontend/app/api/socket/route.ts` which proxies to `backend/server.ts`).
    *   Frontend emits events like `find_match`, `join_battle`, `select_strategy`, `chat_message`.
    *   Backend `battleService.ts` processes these events, manages battle state, and emits real-time updates (`battle_state_update`, `round_start`, `battle_end`) back to the frontend.
    *   Backend `aiChatService.ts` generates AI responses for chat messages, sent back via Socket.io.
*   **AI-Driven Features (REST & WebSockets) - The Revolutionary Chat System**:
    *   Frontend components (e.g., `TeamManagementCoaching.tsx`, `SkillDevelopmentChat.tsx`, `EquipmentAdvisorChat.tsx`, `PerformanceCoachingChat.tsx`) interact with backend AI services.
    *   Some AI interactions are via REST (`/api/confessional-interview`), others via WebSockets (`kitchen_chat_request`, `team_chat_message`).
    *   Backend `aiChatService.ts` is the central hub for all AI model interactions. It receives **situationally appropriate prompts with variable fields that stack on top of static character fields**, uniquely stamped onto each API call and tailored to each chat location.
    *   **One-on-One Chats**: `SkillDevelopmentChat.tsx`, `EquipmentAdvisorChat.tsx`, `PerformanceCoachingChat.tsx` are designed for direct user-to-AI character interaction.
    *   **Group Chats**: `TeamChatPanel.tsx` (in-battle/strategy), and implied Clubhouse Lounge chat and Kitchen Chat (supported by backend handlers) are group chats with different purposes and character.
*   **Monetization**:
    *   Frontend `MembershipSelection.tsx` and `CardPackOpening.tsx` trigger requests to `backend/routes/paymentRoutes.ts` to create checkout sessions.
    *   Stripe (or similar) sends webhooks to `backend/server.ts` (`/api/webhooks/stripe`) to confirm payments, which `PaymentService.ts` processes.
*   **Usage Tracking**:
    *   Frontend components implicitly trigger usage tracking (e.g., AI chat requests).
    *   Frontend can query `backend/routes/usage.ts` to display remaining limits.
*   **Headquarters (HQ) Management**:
    *   Frontend components (`TeamHeadquarters.tsx`, `FacilitiesManager.tsx`) allow players to manage HQ facilities and character assignments.
    *   `frontend/utils/headquartersUtils.ts` calculates HQ bonuses/penalties (e.g., from sleeping arrangements/overcrowding), which directly impact character stats and team chemistry.
    *   Backend AI services (`aiChatService.ts`, `hostmasterService.ts`) use HQ context to drive "reality show" drama in confessional and kitchen chats.

## 5. Key Architectural Principles & Considerations

*   **Separation of Concerns**: The project generally follows this principle, with distinct directories for UI, data, services, and business logic.
*   **Client-Server Communication**: A hybrid approach using both REST APIs (for data fetching/mutations) and WebSockets (for real-time interactions).
*   **State Management**: React Context (`AuthContext`) for global state, `useState`/`useReducer` for local component state.
*   **Service Layer**: Dedicated services (both frontend and backend) encapsulate interactions with external APIs and databases.
*   **Security**: Implementation of JWTs, `httpOnly` cookies, rate limiting, and CSRF protection.
*   **Pervasive Psychology System**: Character psychology is a core, dynamic element influencing combat, team dynamics, social interactions, and narrative. It's managed through dedicated data models, UI components, and AI services.
*   **Revolutionary AI Character Interaction**: The game features highly customized AI chat experiences tailored to specific characters, contexts, and chat locations, going beyond simple chatbots.
*   **"God Component" Anti-Pattern**: `ImprovedBattleArena.tsx` is a notable exception to the separation of concerns, consolidating too much logic and state, making it a primary source of complexity and potential instability. This is a key area for future refactoring.
*   **Psychological Chaos System**: The game includes a system where character psychological risk levels determine adherence to game plans. If a character deviates, the system triggers chaotic choices (determined by AI) and an AI judge assesses the outcome, potentially awarding damage.

This overview should serve as a valuable guide for understanding the Blank Wars codebase.
