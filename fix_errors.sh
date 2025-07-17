#!/bin/bash

echo "=== Comprehensive Error Fix Script ==="
echo "Started at: $(date)"
echo

# Backend errors check
echo "1. Checking Backend TypeScript Errors..."
cd /home/mike/code/blank-wars-clean/backend
npm run build 2>&1 | head -20

echo
echo "2. Checking Frontend Build..."
cd /home/mike/code/blank-wars-clean/frontend
npm run build 2>&1 | head -20

echo
echo "=== Error Summary ==="
echo "Check completed at: $(date)"
