#!/bin/bash
set -e

echo "🚀 Starting Railway Pre-deploy..."

echo "📦 Running database migrations..."
pnpm db:push

echo "👥 Seeding credentials..."
node seed-credentials.mjs

echo "✅ Pre-deploy completed successfully!"
