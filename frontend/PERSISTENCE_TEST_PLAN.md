# 🧪 DATA PERSISTENCE TESTING PLAN

## Test Overview
This document outlines comprehensive tests to verify that all character progression, financial decisions, therapy outcomes, and training improvements are properly persisted to the backend.

## 🔍 Test Categories

### 1. **FINANCIAL COACHING SYSTEM**
**Location**: `/src/components/FinancialAdvisorChat.tsx:583`

**Test Cases**:
- [ ] Make a financial decision → Check API call to `updateFinancials`
- [ ] Verify decision saved to backend → Check API call to `saveDecision`
- [ ] Refresh page → Verify financial data persists
- [ ] Test error handling → Disconnect network and verify fallback behavior
- [ ] Verify local state updates immediately for UX

**Expected API Calls**:
```typescript
await characterAPI.updateFinancials(selectedCharacter.id, {
  wallet: newWalletAmount,
  financialStress: newStressLevel,
  coachTrustLevel: newTrustLevel
});

await characterAPI.saveDecision(selectedCharacter.id, {
  decision: decision.description,
  amount: decision.amount,
  coachDecision,
  outcome: outcome.result,
  timestamp: new Date()
});
```

### 2. **THERAPY SYSTEM**
**Location**: `/src/components/TherapyModule.tsx:854`

**Test Cases**:
- [ ] Complete therapy session → Check API call to `saveTherapySession`
- [ ] Verify experience bonus applied → Check API call to `incrementStats`
- [ ] Verify immediate rewards processed → Check stat updates
- [ ] Verify long-term rewards processed → Check permanent stat improvements
- [ ] Verify relationship changes saved → Check relationship updates
- [ ] Test error handling → Verify error banner appears on failure

**Expected API Calls**:
```typescript
await characterAPI.saveTherapySession(characterId, {
  sessionId: activeSession.id,
  rewards,
  experienceBonus: rewards.experienceBonus,
  immediateRewards: rewards.immediate,
  longTermRewards: rewards.longTerm,
  relationshipChanges: rewards.relationshipChanges
});

await characterAPI.incrementStats(characterId, {
  experience: rewards.experienceBonus,
  mentalHealth: immediateStatBonus,
  // ... other stat updates
});
```

### 3. **TRAINING SYSTEM**
**Location**: `/src/systems/trainingSystem.ts:700`

**Test Cases**:
- [ ] Complete training session → Check API call to `saveTrainingProgress`
- [ ] Verify stat improvements applied → Check API call to `incrementStats`
- [ ] Verify incremental updates (not overwrites) → Check stat values increase
- [ ] Test error handling → Verify training interface shows errors
- [ ] Test localStorage fallback → Verify offline mode works

**Expected API Calls**:
```typescript
await characterAPI.saveTrainingProgress(characterId, {
  statType,
  improvement: change,
  trainingType: 'psychology',
  timestamp: new Date()
});

await characterAPI.incrementStats(characterId, {
  [statType]: change
});
```

### 4. **BATTLE SYSTEM**
**Location**: `/src/components/ImprovedBattleArena.tsx:172`

**Test Cases**:
- [ ] Load headquarters data → Check API call to `getHeadquarters`
- [ ] Load character roster → Check API call to `getUserCharacters`
- [ ] Verify player stats from user profile → Check user data integration
- [ ] Test error handling → Verify error messages appear
- [ ] Test fallback data → Verify demo data loads on API failure

**Expected API Calls**:
```typescript
await characterAPI.getHeadquarters(user.id);
await characterAPI.getUserCharacters();
```

### 5. **API CLIENT INTEGRITY**
**Location**: `/src/services/apiClient.ts`

**Test Cases**:
- [ ] Verify all API methods exist and have proper types
- [ ] Test timeout handling (10 second timeout)
- [ ] Test error interceptors → Verify user-friendly error messages
- [ ] Test authentication errors → Verify 401 handling
- [ ] Test network errors → Verify connection error handling

## 🔧 Test Execution Steps

### Step 1: API Method Verification
```bash
# Check that all API methods are properly typed
grep -n "any" src/services/apiClient.ts
# Should return minimal results - no `any` types in critical interfaces
```

### Step 2: Financial System Test
1. Open Financial Advisor Chat
2. Make a financial decision
3. Open browser DevTools → Network tab
4. Verify API calls are made to:
   - `PUT /api/characters/{id}/financials`
   - `POST /api/characters/{id}/decisions`
5. Refresh page and verify data persists

### Step 3: Therapy System Test
1. Open Therapy Module
2. Complete a therapy session
3. Check Network tab for API calls to:
   - `POST /api/characters/{id}/therapy`
   - `POST /api/characters/{id}/stats/increment`
4. Verify character stats are updated

### Step 4: Training System Test
1. Open Training Interface
2. Start and complete a training session
3. Check Network tab for API calls to:
   - `POST /api/characters/{id}/training`
   - `POST /api/characters/{id}/stats/increment`
4. Verify stat improvements are incremental

### Step 5: Battle System Test
1. Open Battle Arena
2. Check Network tab for API calls to:
   - `GET /api/users/{id}/headquarters`
   - `GET /api/user/characters`
3. Verify data loads correctly
4. Test error handling by blocking network requests

### Step 6: Error Handling Test
1. Block network requests in DevTools
2. Attempt operations in each system
3. Verify error messages appear
4. Verify fallback behavior works
5. Re-enable network and verify recovery

## 📊 Success Criteria

### ✅ All Tests Pass When:
1. **No placeholder comments remain** - All "in a real app would..." comments removed
2. **All API calls use proper types** - No `any` types in critical interfaces
3. **Data persists across page refreshes** - All character progression saved
4. **Error handling works correctly** - Users see helpful error messages
5. **Fallback behavior works** - Systems degrade gracefully on API failure
6. **Local state updates immediately** - Good UX during API calls

### ❌ Test Failures Indicate:
1. **API calls not being made** - Check network tab for missing requests
2. **Wrong API endpoints** - Verify URL patterns match backend
3. **Type errors** - Check TypeScript compilation
4. **No error handling** - Missing try-catch blocks or error UI
5. **Data not persisting** - API calls succeed but data doesn't save

## 🚨 Critical Issues to Watch For

1. **Race conditions** - Multiple API calls interfering with each other
2. **Memory leaks** - Uncleared timeouts or event listeners
3. **Authentication issues** - API calls failing due to auth problems
4. **Data corruption** - Incorrect data being sent to backend
5. **Performance issues** - Too many API calls or inefficient updates

## 📝 Test Results Template

```
## Test Results - [Date]

### Financial Coaching System
- [ ] API calls made: ✅/❌
- [ ] Data persists: ✅/❌
- [ ] Error handling: ✅/❌
- [ ] Notes: 

### Therapy System
- [ ] API calls made: ✅/❌
- [ ] Data persists: ✅/❌
- [ ] Error handling: ✅/❌
- [ ] Notes:

### Training System
- [ ] API calls made: ✅/❌
- [ ] Data persists: ✅/❌
- [ ] Error handling: ✅/❌
- [ ] Notes:

### Battle System
- [ ] API calls made: ✅/❌
- [ ] Data persists: ✅/❌
- [ ] Error handling: ✅/❌
- [ ] Notes:

### Overall Status: ✅ PASS / ❌ FAIL
```

---

**Next Steps**: Execute this test plan systematically and document any issues found.