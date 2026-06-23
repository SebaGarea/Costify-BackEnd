#!/usr/bin/env bash
# ============================================================
#  Deploy de Costify Backend en la VM (Oracle Cloud)
# ------------------------------------------------------------
#  Trae el código nuevo de la rama main y reconstruye los
#  contenedores. Tu .env.production NO se toca.
#
#  Uso (parado en cualquier lado de la VM):
#     ~/Costify-BackEnd/deploy/deploy.sh
#  o, estando en la carpeta deploy:
#     ./deploy.sh
# ============================================================
set -e  # si algo falla, corta acá (no sigue con pasos rotos)

# Ir a la raíz del repo sin importar desde dónde se ejecute el script
cd "$(dirname "$0")/.."

echo "==> 1/4 Trayendo cambios de GitHub (rama main)..."
git pull origin main

echo "==> 2/4 Reconstruyendo y levantando contenedores..."
cd deploy
docker compose -f docker-compose.prod.yml up -d --build

echo "==> 3/4 Limpiando imágenes viejas (libera disco)..."
docker image prune -f

echo "==> 4/4 Estado de los contenedores:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "==> Verificando /health (la app tarda unos segundos en arrancar)..."
OK=0
for i in $(seq 1 10); do
  if curl -fsS https://costify.duckdns.org/health > /dev/null 2>&1; then
    OK=1
    break
  fi
  echo "    intento $i/10... esperando a que la app responda"
  sleep 3
done

if [ "$OK" -eq 1 ]; then
  echo "✅ Deploy OK — el backend responde con HTTPS."
else
  echo "⚠️  El /health no respondió tras 30s. Revisá los logs:"
  echo "    docker compose -f docker-compose.prod.yml logs --tail 40"
fi
