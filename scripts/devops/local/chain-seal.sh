#!/usr/bin/env bash
# The roots of the years this machine sealed (task seal) recorded on the chain of the law (phase
# 39), by this mirror's key: one record-seal per year. It sends transactions to the network of
# mirrors, so it says what it will send and asks first.
# Usage: task chain:seal -- <key> [journal]     (LAWCHAIN_NODE, LAWCHAIN_ID, LAWCHAIN_HOME)
set -euo pipefail
cd "$(dirname "$0")/../../.."
key="${1:?the key of this mirror: task chain:seal -- <key>}"
journal="${2:-}"
node="${LAWCHAIN_NODE:-tcp://127.0.0.1:26657}"
chain="${LAWCHAIN_ID:-lawchain}"
home="${LAWCHAIN_HOME:-resources/.containerdatavol/lawchain}"
command -v lawchaind > /dev/null || { echo "no lawchaind: task chain:build" >&2; exit 1; }

roots=$(cd stacks/go && go run ./cmd/pjolchain roots -resources ../../resources ${journal:+-journal "$journal"})
[ -n "$roots" ] || { echo "nothing sealed here: task seal" >&2; exit 1; }
echo "$roots" | head -5
echo "... $(echo "$roots" | wc -l) year(s) in all"
read -r -p "record them on $chain at $node as $key? [y/N] " answer
[ "$answer" = "y" ] || { echo "nothing sent"; exit 0; }
while read -r one year root files; do
  lawchaind tx law record-seal "$one" "$year" "$root" "$files" --from "$key" --home "$home" \
    --chain-id "$chain" --node "$node" --yes --output json > /dev/null
  echo "sent: $one $year"
done <<< "$roots"
