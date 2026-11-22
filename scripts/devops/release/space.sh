#!/usr/bin/env bash
# The demo space follows the releases without its Dockerfile being edited (phase 22): the
# Dockerfile kept in resources/configs/space/ takes the release as a build argument, and
# Hugging Face hands the space's variables to the build as build arguments. The space's own
# files are kept in git too (phase 27): Dockerfile, and hub/README.md as its README.md.
#   space.sh            the space's files of the config into resources/space (the local side
#                       only; pushing it by hand stays the owner's: task resources:push -- space)
#   space.sh refresh    the space's files brought from git when they differ, its variable
#                       P_JOL_ROLL_VERSION set to the release, a fresh build, and then waited
#                       for until the space runs that release (the release workflow runs it)
# The token: in a workflow with id-token: write, a short one of the space's trusted publisher
# (GitHub's OIDC token exchanged on Hugging Face, no secret kept); else HF_TOKEN. Never printed.
# The release comes from resources/configs/space/space.env, an environment variable winning,
# else the newest tag v<version>.
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
config=resources/configs/space
# a line of space.env counts only when the environment does not set that name
while IFS='=' read -r name value; do
  [[ "$name" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
  [ -n "${!name:-}" ] || export "$name=$value"
done < "$config/space.env"
# the space's files: where each lands in the space, and where it is kept here
declare -A FILES=([Dockerfile]="$config/Dockerfile" [README.md]="$config/hub/README.md")
# how long a build may take before the release says it failed
WAIT_MINUTES="${WAIT_MINUTES:-25}"

release() {
  if [ -n "${P_JOL_ROLL_VERSION:-}" ]; then echo "${P_JOL_ROLL_VERSION#v}"; return; fi
  git fetch -q --tags origin 2> /dev/null || true
  local tag
  tag=$(git tag --list 'v*' --sort=-v:refname | head -n 1)
  [ -n "$tag" ] || { echo "no release tag found" >&2; exit 1; }
  echo "${tag#v}"
}

# a token of the trusted publisher: GitHub's OIDC token (audience huggingface.co) exchanged
# for a token of this one space, valid an hour (huggingface.co/docs/hub/trusted-publishers)
oidc_token() {
  [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] || return 1
  local id
  id=$(curl -fsS -H @- "${ACTIONS_ID_TOKEN_REQUEST_URL}&audience=https://huggingface.co" \
    <<< "Authorization: bearer ${ACTIONS_ID_TOKEN_REQUEST_TOKEN}" | jq -r '.value // empty') || return 1
  [ -n "$id" ] || return 1
  jq -n --arg token "$id" --arg resource "spaces/$SPACE_REPO" '{
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    subject_token: $token, resource: $resource}' |
    curl -fsS -X POST https://huggingface.co/oauth/token -H 'Content-Type: application/json' -d @- |
    jq -r '.access_token // empty'
}

case "${1:-local}" in
  local)
    mkdir -p resources/space
    for path in "${!FILES[@]}"; do
      if cmp -s "${FILES[$path]}" "resources/space/$path"; then
        echo "resources/space/$path is already the one of ${FILES[$path]}"
      else
        cp "${FILES[$path]}" "resources/space/$path"
        echo "resources/space/$path written from ${FILES[$path]}"
      fi
    done
    echo "every release brings them to the space by itself; the release comes from the space's variable (now $(release))"
    ;;
  refresh)
    version=$(release)
    # the header of the token in a file only this user reads: not on a command line, and stdin
    # stays free for what a request sends
    auth=$(mktemp)
    trap 'rm -f "$auth"' EXIT
    use() { printf 'Authorization: Bearer %s\n' "$1" > "$auth"; }
    if token=$(oidc_token) && [ -n "$token" ]; then
      use "$token"
      echo "the token: the space's trusted publisher (OIDC)"
    elif [ -n "${HF_TOKEN:-}" ]; then
      use "$HF_TOKEN"
      echo "the token: HF_TOKEN (no trusted publisher answered)"
    else
      echo "no trusted publisher answered and HF_TOKEN is not set - the space keeps the release it has (wanted: $version)"
      exit 0
    fi
    api="https://huggingface.co/api/spaces/${SPACE_REPO}"
    # a request refused to the publisher's token is asked again with HF_TOKEN, when there is one
    # (what a token of a trusted publisher may do beyond a push is not documented)
    hf() {
      local body
      body=$(mktemp)
      cat > "$body"
      if curl -fsS -H @"$auth" --data-binary @"$body" "$@"; then rm -f "$body"; return; fi
      if [ -n "${HF_TOKEN:-}" ] && ! grep -qF "$HF_TOKEN" "$auth"; then
        echo "refused to the trusted publisher's token - asked again with HF_TOKEN" >&2
        use "$HF_TOKEN"
        curl -fsS -H @"$auth" --data-binary @"$body" "$@" && { rm -f "$body"; return; }
      fi
      rm -f "$body"
      return 1
    }

    # 1. the space's files, from git, only those that differ (a commit builds the space again)
    commit=""
    for path in "${!FILES[@]}"; do
      if curl -fsS "https://huggingface.co/spaces/${SPACE_REPO}/raw/main/$path" | cmp -s - "${FILES[$path]}"; then
        continue
      fi
      commit+=$(jq -cn --arg path "$path" --arg content "$(base64 -w0 < "${FILES[$path]}")" \
        '{key: "file", value: {path: $path, content: $content, encoding: "base64"}}')$'\n'
      echo "space $SPACE_REPO: $path differs from ${FILES[$path]}"
    done

    # 2. the release, as the variable the build takes as an argument
    jq -cn --arg value "$version" '{key: "P_JOL_ROLL_VERSION", value: $value,
      description: "the release of ghcr.io/sarverott/p-jol-roll-webapp-server the space builds from"}' |
      hf -X POST "$api/variables" -H 'Content-Type: application/json' > /dev/null
    echo "space $SPACE_REPO: P_JOL_ROLL_VERSION=$version"

    # 3. built again: by the commit of its files, or else by a factory reboot (a plain restart
    #    keeps the old image - phase 15)
    if [ -n "$commit" ]; then
      header=$(jq -cn --arg summary "P_JOL_ROLL v$version: the space's files from git" \
        '{key: "header", value: {summary: $summary, description: "resources/configs/space of https://github.com/Sarverott/P-jol-roll"}}')
      printf '%s\n%s' "$header" "$commit" |
        hf -X POST "$api/commit/main" -H 'Content-Type: application/x-ndjson' > /dev/null
      echo "space $SPACE_REPO: its files committed, built again"
    else
      hf -X POST "$api/restart?factory=true" < /dev/null > /dev/null
      echo "space $SPACE_REPO: built again"
    fi

    # 4. waited for: the space running, and its api answering with this release
    url="https://${SPACE_HOST:?SPACE_HOST in space.env}"
    sleep 30
    for ((minute = 0; minute < WAIT_MINUTES * 2; minute++)); do
      runtime=$(curl -fsS "$api" | jq -c '.runtime | {stage, errorMessage}') || runtime='{}'
      stage=$(jq -r '.stage // "unknown"' <<< "$runtime")
      case "$stage" in
        RUNNING)
          served=$(curl -fsS -m 30 "$url/openapi.json" | jq -r '.info.version // empty') || served=""
          if [ "$served" = "$version" ]; then
            echo "space $SPACE_REPO: running v$version at $url"
            exit 0
          fi
          ;;
        BUILD_ERROR | RUNTIME_ERROR | CONFIG_ERROR | NO_APP_FILE)
          echo "space $SPACE_REPO: $stage - $(jq -r '.errorMessage // "no message"' <<< "$runtime")" >&2
          echo "the logs: https://huggingface.co/spaces/${SPACE_REPO}?logs=build" >&2
          exit 1
          ;;
      esac
      echo "space $SPACE_REPO: $stage, serving ${served:-nothing yet}"
      sleep 30
    done
    echo "space $SPACE_REPO: not running v$version after $WAIT_MINUTES minutes (last: $stage)" >&2
    exit 1
    ;;
  *)
    echo "usage: space.sh [local|refresh]" >&2
    exit 2
    ;;
esac
