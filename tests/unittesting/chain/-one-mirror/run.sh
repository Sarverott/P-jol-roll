#!/usr/bin/env bash
# The chain of the law with one mirror (phase 39), on this machine: lawchaind built, a chain of
# one validator - the mirror - started on ports of its own, the root of a year (pjolchain roots,
# from a seal table made here) recorded by the mirror's account, and the agreement queried: one of
# one mirror, agreed. An account that is not a validator is refused. Everything it starts it stops.
# Needs Go. Usage: task unittesting:chain
set -euo pipefail
cd "$(dirname "$0")/../../../.."
work=$(mktemp -d)
node=""
cleanup() {
  if [ -n "$node" ]; then
    kill "$node" 2> /dev/null || true
    for _ in $(seq 1 20); do kill -0 "$node" 2> /dev/null || break; sleep 0.5; done
    kill -9 "$node" 2> /dev/null || true
    wait "$node" 2> /dev/null || true
  fi
  rm -rf "$work"
}
trap cleanup EXIT

(cd stacks/go/lawchain && go build -o "$work/lawchaind" ./cmd/lawchaind)
law() { "$work/lawchaind" --home "$work/home" "$@"; }
keys=(--keyring-backend test)
law init mirror --chain-id law-test > /dev/null 2>&1
law keys add mazowieckie "${keys[@]}" > /dev/null 2>&1
law keys add stranger "${keys[@]}" > /dev/null 2>&1
for who in mazowieckie stranger; do
  law genesis add-genesis-account "$who" 1000000000stake "${keys[@]}" > /dev/null
done
law genesis gentx mazowieckie 100000000stake --chain-id law-test "${keys[@]}" > /dev/null 2>&1
law genesis collect-gentxs > /dev/null 2>&1
sed -i 's/^minimum-gas-prices = .*/minimum-gas-prices = "0stake"/' "$work/home/config/app.toml"

rpc=tcp://127.0.0.1:36657
if ss -ltn 2> /dev/null | grep -qE ':3665[67] |:39090 '; then
  echo "a port of the test chain is taken (36656, 36657, 39090)" >&2
  exit 1
fi
"$work/lawchaind" --home "$work/home" start --rpc.laddr "$rpc" --p2p.laddr tcp://127.0.0.1:36656 --grpc.address 127.0.0.1:39090 \
  --api.enable=false --grpc-web.enable=false > "$work/node.log" 2>&1 &
node=$!
height() { law status --node "$rpc" 2> /dev/null | sed -nE 's/.*"latest_block_height":"([0-9]+)".*/\1/p'; }
for _ in $(seq 1 60); do [ "$(height)" -ge 2 ] 2> /dev/null && break; sleep 1; done
[ "$(height)" -ge 2 ] || { tail -20 "$work/node.log" >&2; echo "the chain did not start" >&2; exit 1; }

# a year sealed here, as task seal writes it, and its root
mkdir -p "$work/resources/dataset/files/DU"
printf '%s\n' '{"path":"DU/2026/a.json","sha256":"aa"}' '{"path":"DU/2026/b.pdf","sha256":"bb"}' \
  > "$work/resources/dataset/files/DU/2026.jsonl"
read -r journal year root files < <(cd stacks/go && go run ./cmd/pjolchain roots -resources "$work/resources")

tx() { law tx law record-seal "$journal" "$year" "$root" "$files" --from "$1" "${keys[@]}" \
  --chain-id law-test --node "$rpc" --yes --output json | sed -nE 's/.*"txhash":"([0-9A-F]+)".*/\1/p'; }
# the result of a transaction once its block is made (a block every few seconds)
included() {
  for _ in $(seq 1 30); do
    law query tx "$1" --node "$rpc" --output json 2> /dev/null && return
    sleep 1
  done
}
result=$(included "$(tx mazowieckie)")
echo "$result" | tr -d ' \n' | grep -q '"code":0,' || { echo "the mirror's seal was not taken: $result" >&2; exit 1; }
answer=$(law query law agreement "$journal" "$year" --node "$rpc" --output json | tr -d ' \n')
if ! echo "$answer" | grep -q "\"root\":\"$root\"" || ! echo "$answer" | grep -q '"agreed":true'; then
  echo "no agreement: $answer" >&2
  exit 1
fi

# a stranger's seal goes into a block, refused by the module
result=$(included "$(tx stranger)")
echo "$result" | grep -q "is not a mirror" || { echo "a stranger's seal was not refused: $result" >&2; exit 1; }
echo "the chain of the law: one mirror sealed $journal $year, agreed; a stranger refused"
