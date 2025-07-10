# Gemini - 2025-07-09

## Project Overview
"Blank Wars" is a complex 3v3 team battle game with a focus on character psychology and team chemistry. It's a full-stack application with a Next.js frontend and a Node.js/Express backend.

## Current Status

### Local Development Environment
The local development environment is currently working. I have successfully integrated several new characters into both the frontend and backend data structures.

### Deployment
Deployment on Railway is still noted as failing. The primary suspected cause is the Railway build system looking for the application in the wrong directory.

## Contributions (What I've Done)

### Character Integration
I have successfully formatted and integrated the following new characters into both `frontend/src/data/characters.ts` and `backend/src/database/sqlite.ts`:

*   **Kaelan** (Town Guard - Common Warrior)
*   **Elara** (Apprentice Wizard - Common Mage)
*   **Roric** (Thug - Common Assassin)
*   **Griselda** (Shieldbearer - Common Tank)
*   **Orin** (Acolyte - Common Support)
*   **Vargr** (Wolf - Common Beast)
*   **Feste** (Jester - Common Trickster)
*   **Cassandra** (Seer - Common Mystic)
*   **Ignis** (Fire Apprentice - Common Elementalist)
*   **Aidan** (Student - Common Scholar)
*   **Snarl** (Goblin - Common Assassin)
*   **Clatter** (Skeleton Soldier - Common Warrior)
*   **Grak** (Orc Grunt - Uncommon Warrior)
*   **Barkus** (Treant - Rare Tank) - *Renamed from "Groot" to avoid copyright issues.*
*   **Gargan** (Gargoyle - Uncommon Tank)
*   **Grom** (Barbarian - Common Berserker)
*   **Sir Kaelen** (Knight - Common Warrior)
*   **Musashi** (Miyamoto Musashi - Rare Duelist)
*   **Alexandros** (Alexander the Great - Epic Commander)
*   **Circe** (Circe - Mythic Mage)
*   **Aethelred** (Unicorn - Rare Support)
*   **Sniff** (Kobold - Uncommon Trickster)
*   **Aura** (Pegasus - Epic Support)
*   **Riddle** (Sphinx - Rare Scholar)
*   **Lyra** (Elf - Rare Assassin)
*   **Borin** (Dwarf - Uncommon Tank)
*   **Malakor** (Demon - Epic Berserker)
*   **Seraphina** (Angel - Epic Support)
*   **Unit 734** (Robot - Rare Scholar)
*   **Xylar** (Alien - Legendary Elementalist)
*   **Skarr** (Lizard Monster - Uncommon Beast)
*   **Gloop** (Slime Monster - Common Tank)
*   **Lycan** (Were-Creature - Rare Berserker)
*   **Ursin** (Werebear - Rare Tank)
*   **Skabb** (Wererat - Uncommon Assassin)
*   **Ignis** (Dragon - Legendary Elementalist)
*   **Gemini** (Crystal Tortoise - Epic Tank)
*   **Celeste** (Starlight Raven - Legendary Mystic)

### General Problem-Solving
I have addressed various issues as documented in previous handoff notes, including:
*   Initial setup and dependency installation.
*   Troubleshooting `nodemon` and `ts-node` configuration.
*   Fixing TypeScript compilation errors.
*   Addressing environment variable issues.
*   Resolving SQLite `archetype` constraint errors.
*   Addressing Redis connection errors.
*   Resolving frontend port conflicts.
*   Refactoring the chat system to fix a critical WebSocket resource leak.

## Noted Problems

### Deployment Issue
*   **Problem:** The application is not deploying successfully on Railway.
*   **Suspected Cause:** The Railway build system is likely looking for the `package.json` in the root of the project, but the backend application is located in the `/backend` directory.
*   **Solution:** The "Root Directory" setting for the `blank-wars-clean` service on Railway needs to be changed to `backend`.

### Game Bugs (from previous handoff `README-Gemini-2025-07-07.md`)
*   **Kitchen Table Chat:** Producing repetitive, nonsensical responses.
*   **Individual Character Chat:** Incorrectly shows "out of chats" on first use.
*   **Battle Tab:** Crashes the application when accessed.
*   **Equipment System:** Items cannot be equipped or added to character slots.
*   **Authentication System:** No way to log in, can't access Coach profile.
*   **Missing Features:** Confessionals Tab, Facilities Tab, Available Fighters Tab, Tutorial Button, Coach Profile.

## Future Plans

### Immediate Priority
1.  **Fix Deployment:** The user needs to manually set the "Root Directory" in Railway to `backend` and trigger a new deployment.

### Next Steps (Once Deployment is Fixed)
1.  **Address Game Bugs:** Systematically debug and fix the known bugs, prioritizing:
    *   Battle Tab crash.
    *   Kitchen Table Chat and Individual Character Chat issues.
    *   Equipment System functionality.
    *   Authentication system implementation.
2.  **Continue Character Integration:** Complete the integration of any remaining characters from the provided lists.
3.  **Implement New Features:** Begin work on missing features such as the Confessionals Tab, Facilities Tab, Available Fighters Tab, Tutorial Button, and Coach Profile.
4.  **Enhance Character AI:** Once core functionality is stable, revisit the AI chat prompts and character data to further enhance personality and engagement.

This document provides a comprehensive overview of the project's current state and a clear roadmap for future development.
