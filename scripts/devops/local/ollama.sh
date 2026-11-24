#!/usr/bin/env bash
# The Ollama of this machine served from its own drive (phase 31, the owner's order): the
# directory of its models is OLLAMA_MODELS - the variable Ollama itself reads - from the shell
# or from .env. The first start copies the models it had there (~/.ollama/models, or FROM=...),
# never deleting them where they were; the copy is resumable and checked.
#   ollama.sh where    where the models are read from, and how much is there
#   ollama.sh copy     the models copied (again: only what is missing), then checked
#   ollama.sh serve    copied when the directory has none yet, then `ollama serve` from there
# Stop the Ollama that runs first (its terminal, or kill <pid> from: ss -ltnp | grep 11434).
# Usage: task ollama:serve / ollama:copy / ollama:where
set -euo pipefail
cd "$(dirname "$0")/../../.."

# OLLAMA_MODELS from the shell, else its line in .env (only that line is read)
if [ -z "${OLLAMA_MODELS:-}" ] && [ -f .env ]; then
  OLLAMA_MODELS=$(sed -nE 's/^[[:space:]]*OLLAMA_MODELS[[:space:]]*=[[:space:]]*"?([^"#]*[^"#[:space:]])"?.*$/\1/p' .env | tail -1)
fi
to="${OLLAMA_MODELS:-}"
from="${FROM:-$HOME/.ollama/models}"
command="${1:-where}"

if [ -z "$to" ]; then
  echo "OLLAMA_MODELS is not set: a line in .env, e.g. OLLAMA_MODELS=/run/media/sarverott/setternet-A60/.HoA/ollama" >&2
  exit 1
fi

ready() {
  if [ ! -d "$to" ] || [ ! -w "$to" ]; then
    root=$(dirname "$to")
    echo "$to is not a directory this user can write. Made once by its owner:" >&2
    echo "  sudo mkdir -p '$to' && sudo chown -R $(id -un):$(id -gn) '$root'" >&2
    exit 1
  fi
}

count() { find "$1/manifests" -type f 2> /dev/null | wc -l; }

copy() {
  ready
  if [ ! -d "$from/manifests" ]; then
    echo "nothing to copy: $from has no models"
    return
  fi
  echo "copying $(du -sh "$from" | cut -f1) of models: $from -> $to"
  # the blobs never change once written, so a copy taken while Ollama runs is whole; the
  # manifests go last, so a model appears there only when its blobs are in place
  rsync -a --info=progress2 "$from/blobs" "$to/"
  rsync -a "$from/manifests" "$to/"
  missing=$(cd "$from" && find blobs -type f | while read -r blob; do
    [ "$(stat -c %s "$blob")" = "$(stat -c %s "$to/$blob" 2> /dev/null || echo -)" ] || echo "$blob"
  done)
  if [ -n "$missing" ]; then
    echo "not copied whole: $missing" >&2
    exit 1
  fi
  echo "copied and checked: $(count "$to") model(s) in $to; $from is kept as it was"
}

case "$command" in
  where)
    echo "OLLAMA_MODELS=$to"
    if [ -d "$to" ]; then
      echo "  $(count "$to") model(s), $(du -sh "$to" 2> /dev/null | cut -f1)"
    else
      echo "  not made yet"
    fi
    echo "copied from: $from ($(count "$from") model(s))"
    ;;
  copy) copy ;;
  serve)
    ready
    if ss -ltn 2> /dev/null | grep -q ":11434 "; then
      echo "port 11434 is taken - an Ollama runs already; stop it first:" >&2
      ss -ltnp 2> /dev/null | grep ":11434 " >&2 || true
      exit 1
    fi
    [ "$(count "$to")" -gt 0 ] || copy
    export OLLAMA_MODELS="$to"
    echo "ollama serve, its models in $OLLAMA_MODELS"
    exec ollama serve
    ;;
  *)
    echo "usage: ollama.sh where|copy|serve" >&2
    exit 1
    ;;
esac
