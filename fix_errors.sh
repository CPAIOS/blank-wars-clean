#!/bin/bash

echo "=== Comprehensive Error Fix Script ==="
echo "Started at: $(date)"
echo

# Check if NVM is available and use latest LTS Node.js
echo "🔧 Setting up Node.js environment..."
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "Loading NVM..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Use Node.js 20.x which is compatible with Next.js
    echo "Switching to Node.js 20.x (LTS Iron)..."
    nvm use 20.19.4 2>/dev/null || nvm use lts/iron 2>/dev/null || nvm use --lts
    echo "Current Node.js version: $(node --version)"
else
    echo "⚠️  NVM not found. Using system Node.js: $(node --version)"
    echo "⚠️  Note: Frontend build may require Node.js >= 18.18.0"
fi
echo

# Backend errors check
echo "1. Checking Backend TypeScript Errors..."
cd /home/mike/code/blank-wars-clean/backend
npm run build 2>&1 | head -20

echo
echo "2. Checking Frontend TypeScript Compilation..."
cd /home/mike/code/blank-wars-clean/frontend
echo "Running TypeScript check (without build)..."
npx tsc --noEmit 2>&1 | head -20

echo
echo "3. Testing Frontend Build (if TypeScript passes)..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "✅ TypeScript check passed. Testing build..."
    npm run build 2>&1 | head -20
else
    echo "❌ TypeScript errors found. Skipping build test."
fi

echo
echo "=== Error Summary ==="
echo "Check completed at: $(date)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
