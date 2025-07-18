# Deep Code Analysis Prompt for Gemini Flash

## Mission
You are a senior software architect and debugging specialist tasked with performing comprehensive code analysis on a complex gaming application called "Blank Wars". Your goal is to identify potential issues, architectural concerns, and improvement opportunities that could impact stability, performance, and maintainability.

## Codebase Context
- **Project**: Blank Wars - Psychology-enhanced battle system
- **Stack**: Node.js/Express backend, Next.js/React frontend
- **Architecture**: Real-time WebSocket battles, character collection, progression system
- **Key Technologies**: TypeScript, Socket.io, SQLite/PostgreSQL, Redis, Tailwind CSS

## IMPORTANT: Project Location
**Absolute Path**: `/Users/stevengreenstein/Documents/blank-wars-clean/`

You must navigate to this directory first before analyzing any files. All file paths mentioned below are relative to this root directory.

## Analysis Framework

### 1. CRITICAL SYSTEM ANALYSIS
**Focus Areas:**
- **Authentication & Security**: Review auth flows, JWT handling, CSRF protection
- **Database Operations**: Check for SQL injection, connection pooling, transaction handling
- **WebSocket Communication**: Analyze connection management, error handling, memory leaks
- **State Management**: Frontend state consistency, race conditions, data synchronization
- **Error Handling**: Exception management, logging, graceful degradation

### 2. ARCHITECTURAL REVIEW
**Examine:**
- **Module Dependencies**: Circular dependencies, tight coupling, separation of concerns
- **API Design**: RESTful patterns, error responses, versioning strategy
- **Data Flow**: Client-server communication, caching strategy, data persistence
- **Performance Bottlenecks**: Database queries, API response times, frontend rendering
- **Scalability Concerns**: Resource usage, concurrent user handling, memory management

### 3. CODE QUALITY ASSESSMENT
**Evaluate:**
- **TypeScript Usage**: Type safety, interface consistency, any/unknown usage
- **Testing Coverage**: Unit test quality, integration test gaps, mocking strategies
- **Code Patterns**: Consistent patterns, anti-patterns, best practices adherence
- **Resource Management**: File handles, database connections, memory cleanup
- **Configuration Management**: Environment variables, secrets handling, deployment configs

### 4. SPECIFIC DEBUGGING TARGETS
**High-Priority Issues to Look For:**
- **Battle System Bugs**: Combat logic errors, state desynchronization, timing issues
- **Character Management**: Data corruption, stat calculation errors, progression bugs
- **UI/UX Issues**: Component state bugs, navigation errors, responsive design problems
- **Payment Integration**: Stripe integration vulnerabilities, transaction handling
- **Chat Systems**: Message delivery, persistence, security concerns

## Analysis Instructions

### Phase 1: File Structure Analysis
1. **Map the codebase structure** - Identify all major modules and their relationships
2. **Catalog critical files** - List files that handle core business logic
3. **Identify configuration files** - Note environment setup, build configs, dependencies
4. **Document API endpoints** - Map all routes and their purposes

### Phase 2: Deep Code Review
1. **Security-First Analysis** - Prioritize security vulnerabilities and auth issues
2. **Performance Hotspots** - Identify expensive operations and optimization opportunities
3. **Error-Prone Areas** - Look for complex logic that could fail under stress
4. **Integration Points** - Review external service integrations and failure modes

### Phase 3: Testing & Deployment Review
1. **Test Coverage Analysis** - Identify untested critical paths
2. **CI/CD Pipeline Review** - Check deployment automation and rollback procedures
3. **Environment Consistency** - Verify development/production parity
4. **Monitoring & Logging** - Assess observability and debugging capabilities

## Output Format Requirements

### Section 1: Executive Summary
- **Critical Issues Found**: List 3-5 most severe problems
- **Risk Assessment**: High/Medium/Low priority categorization
- **Immediate Actions**: What needs fixing first

### Section 2: Detailed Findings
For each issue discovered, provide:
- **File Location**: Specific file and line numbers
- **Issue Description**: Clear explanation of the problem
- **Impact Assessment**: How this affects users/system
- **Reproduction Steps**: How to trigger the issue
- **Fix Recommendation**: Specific code changes needed

### Section 3: Code Quality Metrics
- **Complexity Analysis**: Functions/files with high cyclomatic complexity
- **Dependency Issues**: Circular dependencies, unused imports
- **Performance Concerns**: Slow queries, inefficient algorithms
- **Security Vulnerabilities**: Authentication, authorization, input validation

### Section 4: Architectural Recommendations
- **Refactoring Opportunities**: Code that should be restructured
- **Design Pattern Improvements**: Better architectural patterns to implement
- **Scalability Enhancements**: Changes needed for growth
- **Testing Strategy**: Gaps in current testing approach

### Section 5: Quick Wins
- **Low-effort, High-impact** fixes that can be implemented immediately
- **Configuration Improvements**: Simple config changes for better performance
- **Documentation Updates**: Critical missing documentation

## Specific Code Areas to Prioritize

### Backend Critical Files:
- `backend/src/server.ts` - Main server configuration
- `backend/src/services/battleService.ts` - Core battle logic
- `backend/src/services/auth.ts` - Authentication system
- `backend/src/routes/*.ts` - All API endpoints
- `backend/src/middleware/*.ts` - Request processing

### Frontend Critical Files:
- `frontend/src/components/MainTabSystem.tsx` - Main navigation
- `frontend/src/components/ImprovedBattleArena.tsx` - Battle interface
- `frontend/src/components/TeamHeadquarters.tsx` - Team management
- `frontend/src/hooks/useBattleWebSocket.ts` - WebSocket handling
- `frontend/src/services/*.ts` - API communication

### Configuration Files:
- `package.json` files (both frontend/backend)
- `tsconfig.json` files
- `next.config.js` - Next.js configuration
- CI/CD workflow files

## Success Criteria
Your analysis should enable a developer to:
1. **Immediately identify** the top 5 most critical issues
2. **Understand** the root cause of each problem
3. **Implement** fixes with specific code changes needed
4. **Prioritize** work based on impact and effort
5. **Prevent** similar issues through improved practices

## Deliverable
Create a comprehensive README.md file with your findings, following the output format above. Focus on actionable insights that will help improve code quality, fix bugs, and enhance system reliability.

**Remember**: Be specific, provide file paths and line numbers, and prioritize issues that could cause system failures or security vulnerabilities.