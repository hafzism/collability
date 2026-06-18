#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE="docker compose --env-file .env.production -f $COMPOSE_FILE"

if [ ! -f ".env.production" ]; then
  echo "Missing .env.production on the EC2 server."
  echo "Create it from .env.production.example before deploying."
  exit 1
fi

$COMPOSE pull

$COMPOSE run --rm api sh -lc \
  "cd /app/packages/database && pnpm exec prisma migrate deploy"

$COMPOSE up -d --remove-orphans
$COMPOSE ps
docker image prune -f
