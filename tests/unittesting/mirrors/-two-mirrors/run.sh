#!/usr/bin/env bash
# Two mirrors of the law joined by WireGuard and balanced by Traefik (phase 38), in containers on
# this machine: pjolmesh makes their keys and configurations from a registry of two, each mirror
# is a WireGuard container with a stand-in of the api in its network namespace, and Traefik in
# mirror a's namespace must answer from both - b's answers coming through the tunnel.
# Needs Docker, Go and the wireguard module of the kernel. Everything it starts it removes.
# Usage: task unittesting:mirrors
set -euo pipefail
cd "$(dirname "$0")/../../../.."
work=$(mktemp -d)
net=pjr-mirrors-test
names=(pjr-mirror-a pjr-mirror-b pjr-api-a pjr-api-b pjr-traefik)
cleanup() {
  docker rm -f "${names[@]}" > /dev/null 2>&1 || true
  docker network rm "$net" > /dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

cat > "$work/mirrors.yaml" << 'YAML'
network: 10.42.0.0/16
port: 51820
domain: ""
mirrors:
  - {name: a, code: 2, endpoint: "pjr-mirror-a:51820"}
  - {name: b, code: 4, endpoint: "pjr-mirror-b:51820"}
YAML
mesh() { (cd stacks/go && go run ./cmd/pjolmesh "$1" -registry "$work/mirrors.yaml" -resources "$work/$2" "$2" > /dev/null); }
for mirror in a b; do
  mkdir -p "$work/$mirror/secrets/wireguard"
  mesh keys "$mirror"
done
for mirror in a b; do
  mesh mirror "$mirror"
  mkdir -p "$work/www-$mirror/api"
  echo "{\"mirror\":\"$mirror\"}" > "$work/www-$mirror/api/host"
done

docker network create "$net" > /dev/null
for mirror in a b; do
  docker run -d --name "pjr-mirror-$mirror" --network "$net" --cap-add NET_ADMIN \
    --sysctl net.ipv4.conf.all.src_valid_mark=1 \
    -v "$work/$mirror/.containerdatavol/mirror/wireguard:/etc/wireguard:ro" \
    procustodibus/wireguard:v1.0.20260223 > /dev/null
  docker run -d --name "pjr-api-$mirror" --network "container:pjr-mirror-$mirror" \
    -v "$work/www-$mirror:/www:ro" busybox:1.37 httpd -f -p 8080 -h /www > /dev/null
done
docker run -d --name pjr-traefik --network container:pjr-mirror-a \
  -v "$work/a/.containerdatavol/mirror/traefik:/etc/traefik:ro" traefik:v3.6 \
  --entrypoints.web.address=:80 --providers.file.filename=/etc/traefik/dynamic.yaml > /dev/null

# the keys pjolmesh made are WireGuard's own: wg derives the same public key from the private
for mirror in a b; do
  derived=$(docker exec -i "pjr-mirror-$mirror" wg pubkey < "$work/$mirror/secrets/wireguard/$mirror.key")
  grep -q "$derived" "$work/mirrors.yaml" || { echo "wg derives another public key for $mirror" >&2; exit 1; }
done

# the tunnel: a reaches b's api at b's address on the network
for _ in $(seq 1 30); do
  docker exec pjr-mirror-a wget -qO- -T 2 http://10.42.4.1:8080/api/host 2> /dev/null | grep -q '"b"' && break
  sleep 1
done
docker exec pjr-mirror-a wget -qO- -T 2 http://10.42.4.1:8080/api/host | grep -q '"b"' || {
  echo "no answer of b through the tunnel" >&2
  docker exec pjr-mirror-a wg show >&2
  exit 1
}
docker exec pjr-mirror-a wg show | grep -q "latest handshake" || { echo "no handshake" >&2; exit 1; }

# Traefik balances the site over both mirrors
seen=""
for _ in $(seq 1 12); do
  seen+=$(docker exec pjr-mirror-a wget -qO- -T 2 http://127.0.0.1/api/host 2> /dev/null || true)
  sleep 0.3
done
case "$seen" in
  *'"a"'*'"b"'* | *'"b"'*'"a"'*) echo "two mirrors: joined by WireGuard, balanced by Traefik" ;;
  *) echo "Traefik did not answer from both: $seen" >&2; exit 1 ;;
esac
