#!/usr/bin/env bash
# ============================================================
#  Reinicia la DEMO pública con los datos ficticios de siempre.
#  Lo corre el cron todas las noches (ver DEPLOY-ORACLE.md):
#     0 7 * * * ~/Costify-BackEnd/deploy/reset-demo.sh >> ~/reset-demo.log 2>&1
#  El seed solo funciona dentro de api-demo (DEMO_MODE=true y base *demo*),
#  así que nunca puede tocar la base de producción.
# ============================================================
set -e
cd "$(dirname "$0")"
echo "==> $(date -u +%FT%TZ) reiniciando la demo"
docker compose -f docker-compose.prod.yml exec -T api-demo node scripts/seed-demo.js
