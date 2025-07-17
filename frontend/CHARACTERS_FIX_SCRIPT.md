# Characters.ts Fix Strategy

## Critical Issues Identified:
1. 55+ TypeScript errors in characters.ts
2. Missing history fields in 40+ relationship objects
3. Type mismatches in progression nodes ('active' vs allowed types)
4. Missing battle-specific fields in character templates
5. Interface mismatches in experience/skills/abilities

## Quick Fix Strategy:
1. Use `any` temporarily for complex interfaces to get build working
2. Fix critical history field issues with batch replacements
3. Address progression node type issues
4. Restore proper typing incrementally

## High Priority Fixes:
- Fix relationship history fields (required property)
- Fix progression node types
- Add missing battle stats to character templates
- Fix character creation functions

This is documented for systematic fixing.
