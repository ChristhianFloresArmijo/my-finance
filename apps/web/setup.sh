#!/bin/sh

# Install dependencies on container start
echo "📦 Installing dependencies with pnpm..."
pnpm install || echo "⚠️  Some packages may have failed, but continuing..."

echo "🧹 Cleaning pnpm store..."
pnpm store prune

echo "✅ Dependencies ready!"
echo "💡 Run 'make dev' (or pnpm dev) inside the container to start the Vite dev server."

tail -f /dev/null