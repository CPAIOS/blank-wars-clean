# WiseSage Wars - Battle System

A psychology-enhanced battle system where character interactions and team chemistry impact physical combat outcomes.

## 🏗️ Project Structure

```
├── frontend/          # Next.js React application
├── backend/           # Node.js Express API server
├── .github/workflows/ # CI/CD automation
└── docs/             # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "_____ Wars"
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev  # Runs on http://localhost:4000
   ```

2. **Start the frontend application**
   ```bash
   cd frontend
   npm run dev  # Runs on http://localhost:3000
   ```

## 🧪 Testing

### Running Tests

**Backend Tests**
```bash
cd backend
npm test                    # Run all tests
npm test -- cacheService   # Run specific test file
npm test -- --coverage     # Run with coverage report
```

**Frontend Tests**
```bash
cd frontend
npm test                    # Run all tests
npm test -- --watchAll=false  # Run once without watch mode
npm test -- --coverage     # Run with coverage report
```

### Test Status
- ✅ **Backend**: 25+ passing tests (battleService, cacheService, basic tests)
- ✅ **Frontend**: 14 passing tests (AuthContext, MainTabSystem, WebSocket hooks)
- 🔧 **Integration**: Ready for E2E testing setup

## 🔄 CI/CD Pipeline

### Automated Testing
Our GitHub Actions workflow automatically:
- ✅ **Runs on every push/PR** to main and develop branches
- ✅ **Tests both Node.js 18.x and 20.x** for compatibility
- ✅ **Runs backend and frontend tests** in parallel
- ✅ **Generates test coverage reports**
- ✅ **Performs security audits** on dependencies
- ✅ **Builds production artifacts** for deployment validation

### Workflow Triggers
```yaml
# Triggers CI pipeline
git push origin main        # Push to main branch
git push origin develop     # Push to develop branch
# Or create a Pull Request targeting main/develop
```

### Pipeline Status
Check the **Actions** tab in your GitHub repository to see:
- 🟢 **All tests passing**: Ready to merge/deploy
- 🟡 **Tests running**: Pipeline in progress  
- 🔴 **Tests failing**: Review failures before merging

## 🏛️ Architecture

### Backend Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Caching**: Redis with in-memory fallback
- **WebSockets**: Socket.io for real-time battles
- **Testing**: Jest with comprehensive mocking

### Frontend Stack  
- **Framework**: Next.js 13+ (React 18)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: React Context + hooks
- **Testing**: Jest + React Testing Library
- **Icons**: Lucide React

### Key Features
- 🎮 **Real-time battle system** with WebSocket communication
- 🧠 **Psychology mechanics** affecting combat outcomes
- 👥 **Character collection** and team building
- 🏆 **Progression system** with levels and equipment
- 🎨 **Responsive UI** with smooth animations

## 📝 Development Workflow

### Branch Strategy
```bash
main           # Production-ready code
develop        # Integration branch for features
feature/*      # Individual feature branches
bugfix/*       # Bug fix branches
hotfix/*       # Critical production fixes
```

### Making Changes
1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Ensure existing tests pass
   - Follow existing code style

3. **Test locally**
   ```bash
   # Test backend
   cd backend && npm test
   
   # Test frontend  
   cd frontend && npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - CI pipeline will automatically run
   - All tests must pass before merging
   - Request code review from team members

## 🛠️ Available Scripts

### Backend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm test           # Run test suite
npm run lint       # Run ESLint (if configured)
```

### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm test           # Run test suite
npm run lint       # Run ESLint
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=./data/blankwars.db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=development
```

## 📊 Testing Strategy

### Coverage Goals
- **Backend**: 80%+ line coverage
- **Frontend**: 70%+ component coverage
- **Critical paths**: 100% coverage (auth, battles, payments)

### Test Types
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and user flows
- **E2E Tests**: Complete user journeys (planned)

## 🚢 Deployment

### Production Readiness Checklist
- ✅ All tests passing in CI
- ✅ No security vulnerabilities in dependencies
- ✅ Environment variables configured
- ✅ Database migrations ready
- ✅ Build artifacts generated successfully

### Deployment Options
- **Frontend**: Vercel, Netlify, or static hosting
- **Backend**: Railway, Render, DigitalOcean, or VPS
- **Database**: PostgreSQL on cloud provider
- **Cache**: Redis cloud service

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Write tests for your changes**
4. **Ensure all tests pass**
5. **Submit a Pull Request**

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Write descriptive commit messages
- Add JSDoc comments for complex functions

## 📈 Project Status

- ✅ **Core MVP**: Complete and functional
- ✅ **Testing Framework**: Robust test suite with CI/CD
- 🔄 **In Progress**: Performance optimization and additional features
- 📋 **Planned**: E2E testing, advanced battle mechanics, mobile app

## 📞 Support

For questions or issues:
1. Check existing GitHub Issues
2. Create a new Issue with detailed description
3. Include steps to reproduce any bugs
4. Provide environment details (Node.js version, OS, etc.)

---

**Built with ❤️ for strategy and psychology gaming**