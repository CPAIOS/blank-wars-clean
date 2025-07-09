# 🎮 Blank Wars Quick Start Guide

## Starting the Game Locally

### Option 1: Use the Start Script
```bash
./start-servers.sh
```

### Option 2: Manual Start
**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Accessing the Game
- **Game URL:** http://localhost:3007
- **Backend API:** http://localhost:3006

## Testing the New Real Estate Agent Chat

1. Open http://localhost:3007
2. Navigate to the **Facilities** tab
3. Scroll down to **"Real Estate Agent Advisory"**
4. Select an agent:
   - **Vance "The Closer"** - Aggressive, high-pressure sales
   - **Barty "The Bureaucrat"** - Deadpan, regulation-obsessed
   - **Celeste "The Aura"** - Spiritual, holistic approach
5. Chat with them about your facilities!

## What the Agents Know

Your Real Estate Agents now have full strategic intelligence:
- **Housing situation** (overcrowding, sleep arrangements)
- **Battle performance penalties** from poor housing
- **Character conflicts** (who can't share rooms)
- **Facility costs and benefits**
- **Strategic recommendations** for maximum impact

## Common Issues

### "Connection refused" errors
- Make sure both servers are running
- Check ports aren't in use: `lsof -i :3006 -i :3007`
- Kill processes: `lsof -ti:3006 | xargs kill -9`

### Frontend won't start
- Try: `cd frontend && rm -rf .next && npm run dev`

### Backend compilation errors
- Use dev server: `npm run dev` (not `npm start`)
- The TypeScript errors in usageTrackingService.ts are pre-existing

### Real Estate Chat not working
- Check browser console for errors
- Verify backend is running on port 3006
- Check `backend.log` for server errors

## Logs
- Backend: `tail -f backend.log`
- Frontend: `tail -f frontend.log`

## Success Indicators
- Backend: "🚀 Blank Wars API Server running!" 
- Frontend: "✓ Ready in [time]"
- Browser: Game loads at http://localhost:3007

---

**🎉 Your Real Estate Agents are ready to give strategic advice!**