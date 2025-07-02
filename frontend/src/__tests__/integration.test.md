# WiseSage Battle System - Manual Integration Test Guide

## Authentication Flow Test

### Test 1: User Registration with Robin Hood Starter Character
1. **Navigate to**: http://localhost:3000
2. **Click**: "Sign Up" or register button  
3. **Fill form** with:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. **Submit** registration
5. **Expected Result**: 
   - ✅ User should be redirected to onboarding
   - ✅ Robin Hood should be assigned as starter character
   - ✅ 4-step tutorial should appear explaining psychology system

### Test 2: User Login 
1. **Navigate to**: http://localhost:3000
2. **Click**: "Login" button
3. **Fill form** with existing user credentials
4. **Submit** login
5. **Expected Result**:
   - ✅ User should be authenticated
   - ✅ Main tab system should appear
   - ✅ User profile should show correct information

### Test 3: WebSocket Connection
1. **After login**, open browser dev tools
2. **Check Console** for WebSocket messages:
   - `🔌 Connected to battle server`
   - `✅ Authenticated as: [username]`
3. **Expected Result**:
   - ✅ No connection errors
   - ✅ Authentication successful

## Battle System Test

### Test 4: Battle Matchmaking
1. **Navigate to**: "Battle" tab
2. **Click**: "Find Match" button
3. **Expected Result**:
   - ✅ Matchmaking UI should appear
   - ✅ WebSocket should emit `find_match` event
   - ✅ User should enter queue

### Test 5: Character Collection
1. **Navigate to**: "Collection" tab
2. **Expected Result**:
   - ✅ Robin Hood should be visible
   - ✅ Character stats should display correctly
   - ✅ Equipment slots should be available

## API Connectivity Test

### Test 6: Backend Health Check
1. **Open browser** and navigate to: http://localhost:4000/health
2. **Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-30T...",
  "uptime": ...,
  "environment": "development"
}
```

### Test 7: Characters API
1. **Navigate to**: http://localhost:4000/api/characters
2. **Expected Result**:
   - ✅ JSON response with character data
   - ✅ Robin Hood should be in the list
   - ✅ Character has proper structure (id, name, stats, etc.)

## Error Scenarios Test

### Test 8: Network Disconnection
1. **While authenticated**, disconnect internet
2. **Expected Result**:
   - ✅ WebSocket should attempt reconnection
   - ✅ User should see connection status indicator
   - ✅ App should gracefully handle offline state

### Test 9: Invalid Authentication
1. **Clear localStorage** in dev tools
2. **Refresh page**
3. **Expected Result**:
   - ✅ User should be redirected to login
   - ✅ No authentication errors in console
   - ✅ App should handle unauthenticated state

## Performance Test

### Test 10: Load Time
1. **Open dev tools** → Network tab
2. **Navigate to**: http://localhost:3000
3. **Expected Result**:
   - ✅ Initial load < 3 seconds
   - ✅ No 404 errors for assets
   - ✅ React hydration successful

---

## Test Results Checklist

- [ ] Registration creates user with Robin Hood
- [ ] Login authenticates successfully  
- [ ] WebSocket connects and authenticates
- [ ] Battle matchmaking works
- [ ] Character collection displays correctly
- [ ] API endpoints respond correctly
- [ ] Error handling works gracefully
- [ ] Performance is acceptable

## Known Issues to Monitor

1. **Redis dependency**: Backend falls back to in-memory cache when Redis unavailable
2. **SSR compatibility**: WebSocket only initializes in browser
3. **Equipment duplicates**: Fixed duplicate key `peasant_sword_joan`
4. **Webpack modules**: Fixed module resolution errors

## Automated Test Status

- ✅ **Basic Jest setup**: Working
- ✅ **WebSocket hook tests**: 6/6 passing  
- ⚠️ **Auth context tests**: Needs localStorage mock fixes
- ⚠️ **Component tests**: Complex dependencies need more mocking
- ⚠️ **Backend tests**: Redis mocking needed for cache tests