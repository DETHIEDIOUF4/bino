#!/usr/bin/env bash
# Obsolète — AidaFALL utilise PostgreSQL (Neon / local). Voir docs/DATABASE.md
echo "ℹ️  MongoDB n'est plus utilisé. Configurez DATABASE_URL dans backend/.env et lancez :"
echo "    cd backend && npm run db:push && npm run dev"
exit 0
