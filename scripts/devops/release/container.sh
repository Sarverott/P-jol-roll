#!/usr/bin/env bash
# The image of webapp-server (resources/configs/webapp-server/Dockerfile) built and pushed to
# ghcr.io/<owner>/p-jol-roll-webapp-server, tagged with the release (v0.3.2 -> 0.3.2), its X.Y
# and latest. The demo space on Hugging Face runs :latest.
# Usage: container.sh <tag, e.g. v0.3.2>   (needs GH_TOKEN with packages: write)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
tag="${1:?release tag}"
version="${tag#v}"
owner=$(tr '[:upper:]' '[:lower:]' <<< "${GITHUB_REPOSITORY_OWNER:-sarverott}")
image="ghcr.io/$owner/p-jol-roll-webapp-server"

echo "${GH_TOKEN:?}" | docker login ghcr.io -u "$owner" --password-stdin
docker build \
  -f resources/configs/webapp-server/Dockerfile \
  --label "org.opencontainers.image.source=https://github.com/${GITHUB_REPOSITORY:-Sarverott/P-jol-roll}" \
  --label "org.opencontainers.image.version=$version" \
  --label "org.opencontainers.image.licenses=AGPL-3.0-only" \
  -t "$image:$version" -t "$image:${version%.*}" -t "$image:latest" .
for t in "$version" "${version%.*}" latest; do docker push -q "$image:$t"; done
output image "$image:$version"
