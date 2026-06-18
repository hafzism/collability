#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE="docker compose --env-file .env.production -f $COMPOSE_FILE"

if [ ! -f ".env.production" ]; then
  echo "Missing .env.production on the EC2 server."
  echo "Create it from .env.production.example before deploying."
  exit 1
fi

docker container prune -f
docker image prune -af
docker builder prune -af

$COMPOSE pull

$COMPOSE run --rm api sh -lc \
  "cd node_modules/@repo/database && /app/apps/api/node_modules/.bin/prisma migrate deploy"

$COMPOSE up -d --remove-orphans
$COMPOSE ps
docker image prune -f
