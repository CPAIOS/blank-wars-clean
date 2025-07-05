# Blank Wars - Critical Issues Delegation Instructions

## Project Context
- **Project**: Blank Wars - Character battle system with chat functionality
- **Recent Work**: Character migration completed (17 characters migrated from frontend to both SQLite and PostgreSQL)
- **Current State**: Core functionality exists but has critical architectural issues preventing production readiness

## Delegation Overview
These tasks should be delegated to separate Claude Code sessions to work in parallel. Each task is self-contained and has clear acceptance criteria.

---

## 🔴 HIGH PRIORITY TASKS (Critical - Must Fix Before Launch)

### TASK 1: Fix Frontend Authentication System
**Session Focus**: Frontend Authentication
**Estimated Effort**: 2-3 hours
**Files**: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/authService.ts`

**Current Issue**: 
- AuthContext hardcoded to DEMO_USER instead of real authentication
- No persistence across page refreshes
- Missing useEffect for auth state restoration

**Required Changes**:
1. **Remove DEMO_USER initialization** from `frontend/src/contexts/AuthContext.tsx` lines 78-98
2. **Change initial state** from `useState<UserProfile | null>(DEMO_USER)` to `useState<UserProfile | null>(null)`
3. **Add useEffect hook** in AuthProvider component:
   ```typescript
   useEffect(() => {
     const initializeAuth = async () => {
       setIsLoading(true);
       try {
         const profile = await authService.getProfile();
         setUser(profile);
       } catch (error) {
         console.log('No valid session found');
         setUser(null);
       } finally {
         setIsLoading(false);
       }
     };
     initializeAuth();
   }, []);
   ```
4. **Update isAuthenticated logic** to properly reflect backend state
5. **Test**: Verify auth persists across page refreshes and handles expired tokens

**Acceptance Criteria**:
- [ ] DEMO_USER completely removed
- [ ] Authentication state persists across page refreshes
- [ ] Expired tokens properly handled
- [ ] Loading states work correctly
- [ ] No authentication-related console errors

---

### TASK 2: Replace Backend UserService Mock
**Session Focus**: Backend User Data Layer
**Estimated Effort**: 3-4 hours
**Files**: `backend/src/services/userService.ts`, `backend/src/services/databaseAdapter.ts`

**Current Issue**: 
- userService.ts uses in-memory arrays instead of database
- Other services expect persistent user data
- No real user profile management

**Required Changes**:
1. **Replace mock implementation** in `backend/src/services/userService.ts`
2. **Implement database operations** using `dbAdapter` or direct queries:
   - `findUserById(id: string)` - Query users table
   - `findUserProfile(userId: string)` - Get user profile data
   - `updateUserProfile(userId: string, updates)` - Update user data
   - `addFriend(userId1, userId2)` - Friend system if needed
   - `searchUsers(query: string)` - User search functionality
3. **Use existing database schema** from `database-setup.sql` users table
4. **Maintain same API interface** so other services don't break
5. **Add proper error handling** for database failures

**Database Schema Reference**:
```sql
users table: id, username, email, subscription_tier, level, experience, total_battles, total_wins, etc.
```

**Acceptance Criteria**:
- [ ] All in-memory arrays removed
- [ ] All methods use database operations
- [ ] Error handling implemented
- [ ] API interface maintained for backward compatibility
- [ ] User profiles persist across server restarts

---

### TASK 3: Modularize Backend Routing
**Session Focus**: Backend Route Organization
**Estimated Effort**: 2-3 hours
**Files**: `backend/src/server.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/userRoutes.ts`

**Current Issue**:
- All routes defined directly in server.ts (lines ~200-400)
- Dedicated route files exist but are unused (dead code)
- Poor code organization and maintainability

**Required Changes**:
1. **Move auth routes** from server.ts to `backend/src/routes/auth.ts`:
   - `/api/auth/register`
   - `/api/auth/login` 
   - `/api/auth/refresh`
   - `/api/auth/logout`
   - `/api/auth/profile`

2. **Move user/character routes** to appropriate files:
   - `/api/characters` → new `characterRoutes.ts`
   - `/api/user/characters` → `userRoutes.ts`
   - `/api/battles/status` → new `battleRoutes.ts`
   - `/api/user/battles` → `userRoutes.ts`

3. **Update server.ts imports**:
   ```typescript
   import authRouter from './routes/auth';
   import userRouter from './routes/userRoutes';
   import characterRouter from './routes/characterRoutes';
   
   app.use('/api/auth', authRouter);
   app.use('/api/users', userRouter);
   app.use('/api/characters', characterRouter);
   ```

4. **Remove direct route definitions** from server.ts
5. **Test all routes** still work after refactoring

**Acceptance Criteria**:
- [ ] All routes moved to dedicated files
- [ ] server.ts imports and uses route modules
- [ ] No duplicate route definitions
- [ ] All endpoints still functional
- [ ] Clean separation of concerns

---

## 🟡 MEDIUM PRIORITY TASKS (Important for Quality)

### TASK 4: Fix CI/CD Quality Enforcement
**Session Focus**: DevOps/CI Pipeline
**Estimated Effort**: 1 hour
**Files**: `.github/workflows/ci.yml`

**Current Issue**: 6 instances of `continue-on-error: true` allow quality issues to accumulate

**Required Changes**:
1. **Remove continue-on-error: true** from all linting and type checking steps
2. **Keep continue-on-error** only for coverage upload (non-critical)
3. **Ensure pipeline fails** on linting/type errors to enforce quality

**Acceptance Criteria**:
- [ ] Pipeline fails on linting errors
- [ ] Pipeline fails on type checking errors  
- [ ] Coverage uploads can still fail without breaking pipeline
- [ ] Documentation updated if needed

---

### TASK 5: Fix WebSocket Authentication Format
**Session Focus**: WebSocket Communication
**Estimated Effort**: 30 minutes
**Files**: `frontend/src/services/battleWebSocket.ts`

**Current Issue**: 
- Frontend sends `{ token: accessToken }`
- Backend expects just `token: string`

**Required Changes**:
1. **Update authenticateWithToken method** in battleWebSocket.ts line ~85:
   ```typescript
   // BEFORE
   this.socket.emit('auth', { token: accessToken });
   
   // AFTER  
   this.socket.emit('auth', accessToken);
   ```

2. **Update authenticate method** similarly if present
3. **Test WebSocket authentication** works correctly

**Acceptance Criteria**:
- [ ] WebSocket auth payload matches backend expectations
- [ ] Authentication succeeds in battle system
- [ ] No WebSocket auth errors in console

---

### TASK 6: Frontend Linting Cleanup
**Session Focus**: Frontend Code Quality
**Estimated Effort**: 3-4 hours
**Files**: Multiple frontend files (see `frontend/lint_output.txt`)

**Required Changes**:
1. **Run npm run lint** in frontend directory
2. **Fix all linting errors** systematically:
   - Remove unused imports and variables
   - Change `let` to `const` where appropriate
   - Fix missing useEffect dependencies
   - Replace `any` types with specific types
   - Convert require() to import statements

**Acceptance Criteria**:
- [ ] `npm run lint` passes with zero errors
- [ ] All warnings addressed or justified
- [ ] No `any` types remain (or documented exceptions)
- [ ] Code follows project style guidelines

---

### TASK 7: Enable TypeScript Strict Mode
**Session Focus**: Frontend Type Safety
**Estimated Effort**: 4-6 hours (may find many issues)
**Files**: `frontend/tsconfig.json`, multiple TypeScript files

**Current Issue**: 
- `tsconfig.json` has `"strict": false` 
- Documentation claims strict mode is enabled
- Type safety compromised

**Required Changes**:
1. **Enable strict mode** in `frontend/tsconfig.json`: `"strict": true`
2. **Fix all new TypeScript errors** that appear
3. **Focus on**:
   - Null/undefined checks
   - Function parameter types
   - Return type annotations
   - Proper type guards

**Warning**: This will likely generate many errors. Consider doing this incrementally or after other tasks.

**Acceptance Criteria**:
- [ ] TypeScript strict mode enabled
- [ ] All strict mode errors resolved
- [ ] Better type safety throughout codebase
- [ ] Documentation matches actual configuration

---

## Session Delegation Instructions

### For Each New Claude Code Session:

#### 1. **Session Setup Instructions** (Copy this exactly):
```
I'm working on Blank Wars character battle system. Previous agent completed character migration (17 characters from frontend to both SQLite and PostgreSQL databases). 

PROJECT LOCATION: /Users/gabrielgreenstein/blank-wars-clean/
CURRENT WORKING DIRECTORY: /Users/gabrielgreenstein/blank-wars-clean/backend/src

My specific task: [INSERT SPECIFIC TASK FROM BELOW]

FIRST ACTION: Please navigate to the project root and confirm you can see these key directories:
- frontend/
- backend/ 
- docs/
- .github/
```

#### 2. **File Navigation Instructions**:
Before starting work, have the agent confirm they can access these key files:
- **Frontend Auth**: `frontend/src/contexts/AuthContext.tsx`
- **Backend UserService**: `backend/src/services/userService.ts`
- **Backend Routes**: `backend/src/server.ts` and `backend/src/routes/`
- **Database Schema**: `database-setup.sql`
- **CI Pipeline**: `.github/workflows/ci.yml`
- **WebSocket**: `frontend/src/services/battleWebSocket.ts`

#### 3. **Required Task-Specific Context**:
For each task, provide the agent with:
- **Exact files to modify** (from task description)
- **Current state description** (what's wrong)
- **Desired end state** (acceptance criteria)
- **Code snippets** provided in task instructions

#### 4. **Work Documentation Requirements**:
At the end of each session, the agent MUST provide a structured report:

```markdown
# Task Completion Report: [TASK NAME]

## ✅ Work Completed
- [ ] List each file modified with brief description
- [ ] List each specific change made
- [ ] Any issues encountered and how resolved

## 📁 Files Modified
- `path/to/file1.ts` - Description of changes
- `path/to/file2.tsx` - Description of changes

## 🧪 Testing Performed
- [ ] Describe testing done to verify changes work
- [ ] Any error checking or edge cases tested

## ⚠️ Deviations from Plan
- List any changes from original task instructions
- Reasoning for any deviations

## 📋 Acceptance Criteria Status
- [ ] Criterion 1: ✅ Complete / ❌ Not Complete / ⚠️ Partial
- [ ] Criterion 2: ✅ Complete / ❌ Not Complete / ⚠️ Partial
- [ ] [etc for all criteria]

## 🔄 Next Steps / Handoff Notes
- Any follow-up work needed
- Dependencies for other tasks
- Integration notes
```

#### 5. **Quality Requirements**:
- Focus ONLY on the assigned task
- Follow the acceptance criteria exactly
- Test changes work before marking complete
- Document any deviations from plan
- Preserve existing functionality
- Maintain code style consistency

### Recommended Parallel Execution:
- **Session 1**: TASK 1 (Frontend Auth)
- **Session 2**: TASK 2 (Backend UserService) 
- **Session 3**: TASK 3 (Backend Routing)
- **Session 4**: TASK 4 + TASK 5 (Quick CI/WebSocket fixes)
- **Session 5**: TASK 6 (Linting - can run independently)
- **Session 6**: TASK 7 (TypeScript Strict - after others complete)

### Success Criteria for All Tasks:
- [ ] All high priority tasks completed
- [ ] Application functionality preserved
- [ ] No new bugs introduced
- [ ] Code quality improved
- [ ] Production readiness significantly increased

---

## 📋 Example Delegation Message (Copy & Paste)

**For TASK 1 (Frontend Authentication):**
```
I'm working on Blank Wars character battle system. Previous agent completed character migration (17 characters from frontend to both SQLite and PostgreSQL databases). 

PROJECT LOCATION: /Users/gabrielgreenstein/blank-wars-clean/
CURRENT WORKING DIRECTORY: /Users/gabrielgreenstein/blank-wars-clean/backend/src

My specific task: Fix Frontend Authentication - remove DEMO_USER and add proper useEffect auth check

FIRST ACTION: Please navigate to the project root and confirm you can see these key directories:
- frontend/
- backend/ 
- docs/
- .github/

TASK DETAILS: Read TASK 1 in /Users/gabrielgreenstein/blank-wars-clean/DELEGATION_INSTRUCTIONS.md for complete instructions. Main issue is that frontend/src/contexts/AuthContext.tsx is hardcoded to DEMO_USER instead of real authentication with no persistence across page refreshes.

REQUIRED: Provide a structured completion report as specified in the delegation instructions when finished.
```

---

## Notes:
- Character migration is ✅ COMPLETE (17 characters in both databases)
- Database schema supports all required functionality
- Focus on fixing architectural issues, not adding features
- Maintain backward compatibility where possible
- Each session MUST provide the structured completion report for easy review