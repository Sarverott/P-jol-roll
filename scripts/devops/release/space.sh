#!/usr/bin/env bash
# The demo space follows the releases without its Dockerfile being edited (phase 22): the
# Dockerfile kept in resources/configs/space/ takes the release as a build argument, and
# Hugging Face hands the space's variables to the build as build arguments.
#   space.sh            the Dockerfile of the config into resources/space (the local side only;
#                       pushing it stays the owner's: task resources:push -- space)
#   space.sh refresh    the space's variable P_JOL_ROLL_VERSION set to the release and a fresh
#                       build asked for (needs HF_TOKEN; the release workflow runs it)
# The release comes from resources/configs/space/space.env, an environment variable winning,
# else the newest tag v<version>. The token is never printed.
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
config=resources/configs/space
# a line of space.env counts only when the environment does not set that name
while IFS='=' read -r name value; do
  [[ "$name" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
  [ -n "${!name:-}" ] || export "$name=$value"
done < "$config/space.env"

release() {
  if [ -n "${P_JOL_ROLL_VERSION:-}" ]; then echo "${P_JOL_ROLL_VERSION#v}"; return; fi
  git fetch -q --tags origin 2> /dev/null || true
  local tag
  tag=$(git tag --list 'v*' --sort=-v:refname | head -n 1)
  [ -n "$tag" ] || { echo "no release tag found" >&2; exit 1; }
  echo "${tag#v}"
}

case "${1:-local}" in
  local)
    mkdir -p resources/space
    if cmp -s "$config/Dockerfile" resources/space/Dockerfile; then
      echo "resources/space/Dockerfile is already the one of $config"
    else
      cp "$config/Dockerfile" resources/space/Dockerfile
      echo "resources/space/Dockerfile written from $config - push it once: task resources:push -- space"
    fi
    echo "the release comes from the space's variable: task resources:space:refresh (now $(release))"
    ;;
  refresh)
    version=$(release)
    if [ -z "${HF_TOKEN:-}" ]; then
      echo "HF_TOKEN is not set - the space keeps the release it has (wanted: $version)"
      exit 0
    fi
    api="https://huggingface.co/api/spaces/${SPACE_REPO}"
    # the token goes in a header read from stdin, so it is not on the command line
    hf() { curl -fsS -H @- "$@" <<< "Authorization: Bearer ${HF_TOKEN}"; }
    hf -X POST "$api/variables" -H 'Content-Type: application/json' \
      -d "{\"key\":\"P_JOL_ROLL_VERSION\",\"value\":\"$version\",\"description\":\"the release of ghcr.io/sarverott/p-jol-roll-webapp-server the space builds from\"}" > /dev/null
    echo "space $SPACE_REPO: P_JOL_ROLL_VERSION=$version"
    # a factory reboot builds the image again; a plain restart keeps the old one (phase 15)
    hf -X POST "$api/restart?factory=true" > /dev/null
    echo "space $SPACE_REPO: built again"
    ;;
  *)
    echo "usage: space.sh [local|refresh]" >&2
    exit 2
    ;;
esac
