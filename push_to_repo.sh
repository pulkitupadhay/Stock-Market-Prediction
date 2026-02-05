#!/bin/bash

cd "/Users/prince/Documents/augment-projects/major project"

echo "=== Cleaning up empty directories ==="
rmdir backend/data backend/models 2>/dev/null || true

echo ""
echo "=== Git Status ==="
git status

echo ""
echo "=== Adding all changes ==="
git add -A

echo ""
echo "=== Committing ==="
git commit -m "🧹 Clean up project and add Risk Analysis

- Remove unnecessary temporary scripts
- Keep only essential project files
- Add Risk Analysis functionality with comprehensive metrics
- Add /api/risk/:symbol endpoint
- Implement volatility, drawdown, VaR, Sharpe ratio calculations
- Create Risk Analysis dashboard with professional UI
- Add color-coded risk levels and recommendations"

echo ""
echo "=== Pushing to GitHub ==="
git push origin main

echo ""
echo "✅ Done! Check https://github.com/pulkitupadhay/Stock-Market-Prediction"

