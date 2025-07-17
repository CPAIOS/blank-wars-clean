#!/bin/bash
# Safe branch creation and push script

echo "Creating integration branch..."
git checkout -b integrated-mobile-and-comprehensive-fixes

echo "Adding all changes..."
git add .

echo "Creating commit..."
git commit -m "Integrate comprehensive fixes for critical system issues

- Fix JSON parsing errors for all 17 characters in databaseAdapter.ts
- Resolve double /api/ URL construction bug in apiClient.ts  
- Add missing coach progression endpoints to coachingRoutes.ts
- Fix PostgreSQL INSERT OR REPLACE syntax in headquartersService.ts
- Add headquarters initialization during user registration in auth.ts
- Fix hardcoded localhost URLs in TeamChatPanel, kitchenChatService, trainingChatService
- Convert all socket connections to use NEXT_PUBLIC_API_URL environment variable

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Pushing to GitHub..."
git push -u origin integrated-mobile-and-comprehensive-fixes

echo "Branch creation and push complete!"
echo "Current branch:"
git branch --show-current

echo "GitHub branch URL will be available at:"
echo "https://github.com/[your-username]/blank-wars-clean/tree/integrated-mobile-and-comprehensive-fixes"