# Card Pack System Handoff Notes

## Project Goal
Fix new user registration to properly show starter pack and characters received, not silently add them.

## Current Status
✅ **Backend Working**: 
- Pack tables added to PostgreSQL schema (`/Users/gabrielgreenstein/blank-wars-clean/backend/src/database/postgres.ts` lines 223-239)
- PackService working and creating starter packs during registration
- Auth service (`/Users/gabrielgreenstein/blank-wars-clean/backend/src/services/auth.ts` lines 126-153) successfully generates and claims starter packs
- Backend logs confirm users get 3 characters on registration

❌ **Frontend Issue**:
- NO post-registration flow to show pack opening
- Components exist but aren't connected:
  - `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/NewUserOnboarding.tsx` - Not used anywhere
  - `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/CardPackOpening.tsx` - Has pack opening animation
  - `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/PackOpening.tsx` - Alternative pack component

## Key Files

### Backend (Working)
- `/Users/gabrielgreenstein/blank-wars-clean/backend/src/services/auth.ts` - Registration with pack generation
- `/Users/gabrielgreenstein/blank-wars-clean/backend/src/services/packService.ts` - Pack creation/claiming logic
- `/Users/gabrielgreenstein/blank-wars-clean/backend/src/database/postgres.ts` - Pack tables (lines 223-239)
- `/Users/gabrielgreenstein/blank-wars-clean/backend/src/routes/auth.ts` - Registration endpoint
- `/Users/gabrielgreenstein/blank-wars-clean/backend/backend.log` - Shows successful pack grants

### Frontend (Needs Work)
- `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/contexts/AuthContext.tsx` - Handle post-registration flow
- `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/AuthModal.tsx` - Registration UI
- `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/NewUserOnboarding.tsx` - Unused onboarding
- `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/CardPackOpening.tsx` - Pack animation

## What's Happening Now
1. User registers → Backend creates account + generates starter pack with 3 characters
2. Pack is auto-claimed → Characters added to user's roster
3. Frontend fetches characters → They appear in game
4. **MISSING**: No UI feedback about receiving starter pack!

## TODOs / Next Steps

1. **Connect Onboarding Flow**:
   - After successful registration in AuthContext, set a flag like `showOnboarding: true`
   - Display `NewUserOnboarding` component
   - After onboarding, show pack opening

2. **Show Pack Opening**:
   - Either use existing `CardPackOpening` component
   - OR create simpler "You received these starter characters!" screen
   - Show the 3 characters they got with names/descriptions

3. **Consider Alternative**:
   - Instead of pack system, could directly show "Welcome! Here are your starter characters"
   - Less complex but less exciting

## Important Context
- Test shows Robin Hood should be starter (see `/Users/gabrielgreenstein/blank-wars-clean/frontend/src/__tests__/integration.test.md`)
- But pack system gives random characters
- Backend uses PostgreSQL not SQLite
- Pack types defined in packService: `standard_starter` gives 3 cards

## Error to Watch For
- Backend has some XP errors for anonymous users (see backend.log lines 893+)
- Not related to pack issue but shows in logs

Good luck!