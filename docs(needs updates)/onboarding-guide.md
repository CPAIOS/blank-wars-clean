# Blank Wars - Agent Onboarding Guide

Welcome to the Blank Wars development team! This guide will help you quickly get up to speed with the project, its vision, and how to contribute effectively.

## 🎯 Project Overview

Blank Wars is a revolutionary psychology-enhanced battle system where character interactions and team chemistry significantly impact physical combat outcomes. Our core innovation lies in making the management of AI personalities and their psychological needs the central gameplay mechanic. Players will form deep emotional bonds with their AI characters through a unique chat system, turning AI unpredictability into a strategic strength.

## 🚀 Quick Start for New Agents

1.  **Understand the Vision:** Read the `docs/architecture-overview.md` to grasp the high-level system architecture, core game mechanics, and monetization strategy.

2.  **Explore the Codebase:**
    *   **Frontend:** Located in `frontend/`. This is a Next.js (React/TypeScript) application. Key areas:
        *   `frontend/src/app/`: Next.js App Router pages.
        *   `frontend/src/components/`: Reusable UI components.
        *   `frontend/src/contexts/`: React Contexts for global state (e.g., authentication).
        *   `frontend/src/hooks/`: Custom React Hooks for reusable logic.
        *   `frontend/src/services/`: Frontend services for API interaction, audio, etc.
        *   `frontend/src/systems/`: Client-side game system logic (e.g., battle, training).
        *   `frontend/src/utils/`: Utility functions and data optimization.
        *   `frontend/src/data/`: **CRITICAL**: This directory contains the definitive character data (`characters.ts`), abilities (`abilities.ts`), and other game-specific data. This is the source of truth for game content.
    *   **Backend:** Located in `backend/`. This is a Node.js (Express/TypeScript) API server.
        *   `backend/src/server.ts`: The main entry point and currently contains most API route definitions.
        *   `backend/src/services/`: Backend business logic and external integrations (e.g., auth, chat, battle, database adapter).
        *   `backend/src/database/`: Database initialization and query helpers.
        *   `backend/src/middleware/`: Express middleware (e.g., rate limiting, CSRF).
        *   `backend/src/types/`: Shared TypeScript type definitions.
    *   **Database Schema:** Refer to `database-setup.sql` at the project root for the PostgreSQL database schema.

3.  **Set up Your Development Environment:** Follow the instructions in `docs/quick-start-guide.md` to get the project running locally.

4.  **Review Current Status:** Read `docs/handoff-reports.md` for a detailed history of development, completed features, and known issues.

## 📋 Rolling List of Project Accomplishments

This section tracks key milestones and achievements in the Blank Wars project. Please add to this list as you complete significant tasks.

*   **2025-07-02:** Consolidated and organized project documentation into the `docs/` directory. Created a new `architecture-overview.md` and `handoff-reports.md` for clarity and consistency. (Agent Gemini)
*   **2025-07-02:** Implemented comprehensive backend battle system, including AI decision-making, status effects, cooldowns, and psychological modifiers. (Agent Gemini)
*   **2025-07-02:** Completed backend payment integration with Stripe, including checkout flows and subscription management. (Agent Gemini)
*   **2025-07-02:** Finalized frontend pack opening experience with animations and card reveal logic. (Agent Gemini)
*   **2025-07-02:** Developed a robust Express API server with modular routes, WebSocket integration, and error handling. (Agent Gemini)
*   **2025-07-02:** Created a character database import script to populate the backend with all 17 detailed characters. (Agent Gemini)
*   **2025-07-02:** Implemented a transactional email service for user notifications and confirmations. (Agent Gemini)
*   **2025-07-02:** Developed a basic analytics tracking system for user behavior and game metrics. (Agent Gemini)
*   **2025-06-29:** Initial comprehensive project handoff, outlining core concepts, technical architecture, and psychology system status. (Previous Agent)
*   **2025-06-29:** Completed 17 unique character psychology profiles and 102 legendary abilities. (Previous Agent)
*   **2025-06-29:** Implemented core battle flow mechanics, including pre-battle huddles, round-by-round combat, and mid-battle coaching timeouts. (Previous Agent)
*   **2025-06-29:** Completed UI integration for psychology battle components, campaign systems, training systems, and story arcs. (Previous Agent)
*   **2025-06-29:** Revolutionized item system to span all genres and time periods (35+ items). (Previous Agent)
*   **2025-06-29:** Implemented critical stability fixes across various components, ensuring the app runs stable. (Previous Agent)

## 💡 Key Insights for Development

*   **Psychology is Core:** Remember that managing AI personalities and their psychological needs is the central gameplay mechanic. Every feature should reinforce this.
*   **AI Unpredictability as Strength:** Leverage AI's inherent unpredictability to create dynamic and engaging character behaviors, rather than trying to eliminate it.
*   **Emotional Bonding:** The chat system is crucial for fostering deep emotional connections between players and their characters. Prioritize its authenticity and responsiveness.
*   **Modular Architecture:** The project is designed with a modular architecture. When adding new features, strive to maintain clear separation of concerns and reusability.
*   **Testing is Key:** Comprehensive testing (unit, integration, E2E) is vital for maintaining stability and ensuring new features don't introduce regressions.

## 📞 Support & Communication

*   **Questions:** If you have questions, first consult the relevant documentation in `docs/`. If you can't find an answer, ask in the team's communication channel.
*   **Reporting Issues:** Use the project's issue tracking system (e.g., GitHub Issues) to report bugs or propose new features.
*   **Contributing:** Follow the established development workflow (branching strategy, code style, PR process) as outlined in the `README.md` and `docs/handoff-reports.md`.

Let's build something amazing together! 🚀
