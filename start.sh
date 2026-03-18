#!/bin/sh
set -e

echo "Resolving any failed migrations..."
node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260128164700_add_session_fields 2>/dev/null || true
node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260201171801_add_store_manager_and_analytics 2>/dev/null || true
node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260213194212_add_price_authority_tables 2>/dev/null || true
node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260317000000_add_multitenancy 2>/dev/null || true

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Starting Next.js server on port ${PORT:-3000}..."
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"
exec node server.js
