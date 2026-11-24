#!/usr/bin/env bash
# The torrents put on IPFS (phase 37): the owner's move - it publishes, as pushing to Hugging Face
# does. The IPFS node of compose (profile ipfs) is started, resources/torrents/torrents.car (made
# by task torrents) imported into it and its root pinned; the node then serves it to the network.
# Usage: task torrents:publish
set -euo pipefail
cd "$(dirname "$0")/../../.."

car=resources/torrents/torrents.car
if [ ! -f "$car" ] || [ ! -f resources/torrents/ROOT ]; then
  echo "no $car: task torrents first" >&2
  exit 1
fi
root=$(cat resources/torrents/ROOT)
read -r -p "put the torrents on IPFS under $root? (it publishes them) [y/N] " answer
[ "$answer" = "y" ] || { echo "not published"; exit 0; }

mkdir -p resources/.containerdatavol/ipfs
docker compose --profile ipfs up -d ipfs
until docker compose exec -T ipfs ipfs id > /dev/null 2>&1; do sleep 2; done
docker compose exec -T ipfs ipfs dag import --pin-roots /torrents/torrents.car
echo "pinned: $root"
echo "  ipfs://$root"
echo "  http://127.0.0.1:8088/ipfs/$root/index.json   (this node's gateway)"
echo "  https://ipfs.io/ipfs/$root                   (once the network finds this node)"
