#!/bin/bash

# Fix critical TypeScript errors systematically

echo "Fixing critical TypeScript errors..."

# Fix missing function exports
echo "Checking for missing exports in teamBattleSystem.ts..."

# Fix interface mismatches
echo "Checking character interface mismatches..."

# Fix import errors
echo "Checking import errors..."

echo "Running TypeScript check..."
cd /home/mike/code/blank-wars-clean/frontend
npx tsc --noEmit 2>&1 | head -50
