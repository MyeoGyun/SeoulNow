#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=${1:-/home/ubuntu/SeoulNow}
COMPOSE_FILE=${2:-docker-compose.yml}
BRANCH=${3:-main}

if [[ ! -d "$REPO_DIR" ]]; then
  echo "[deploy] clone directory $REPO_DIR does not exist" >&2
  exit 1
fi

cd "$REPO_DIR"

echo "[deploy] fetching latest code"
if [[ -d .git ]]; then
  git fetch --all --prune
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "[deploy] directory is not a git repository" >&2
  exit 1
fi

echo "[deploy] pulling container updates"
docker compose -f "$COMPOSE_FILE" pull || true

echo "[deploy] rebuilding images"
docker compose -f "$COMPOSE_FILE" build --pull

echo "[deploy] applying compose stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[deploy] pruning old images"
docker image prune -f

echo "[deploy] deployment finished"
