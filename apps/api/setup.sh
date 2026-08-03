#! /bin/sh

# Run as root to fix permissions
if [ "$(id -u)" = "0" ]; then
    # Match Dockerfile user (ARG user=app) and WORKDIR /usr/share/${user}.
    # Bind mount may leave host-owned files; app must write node_modules and Prisma output.
    for dir in /usr/share/app/node_modules /usr/share/app/src/generated; do
        [ -e "$dir" ] && chown -R app:app "$dir"
    done
    exec su -s /bin/sh app -c "$0 $*"
fi

# Now running as app user
echo "📦 Installing dependencies with pnpm..."
pnpm install || echo "⚠️  Some packages may have failed, but continuing..."

echo "🧹 Cleaning pnpm store..."
pnpm store prune

echo "✅ Dependencies ready!"
echo "🐳 Container is running. Run 'pnpm dev' to start the application."

# Keep container alive for manual commands
tail -f /dev/null
