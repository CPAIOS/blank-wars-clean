#!/bin/bash
# Script to create integration branch and set up for comprehensive fixes

echo "Creating integration branch from current main..."
git checkout main
git pull origin main
git checkout -b integrated-mobile-and-comprehensive-fixes

echo "Branch 'integrated-mobile-and-comprehensive-fixes' created successfully!"
echo "Current branch:"
git branch --show-current

echo "Ready for integration of fixes!"