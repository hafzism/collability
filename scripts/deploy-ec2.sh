#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ ! -f ".env.production" ]; then
  echo "Missing .env.production on the EC2 server."
  echo "Create it from .env.production.example before deploying."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" pull

docker compose -f "$COMPOSE_FILE" run --rm api sh -lc \
  "cd /app/packages/database && pnpm exec prisma migrate deploy"

docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker compose -f "$COMPOSE_FILE" ps
docker image prune -f
