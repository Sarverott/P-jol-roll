#!/usr/bin/env bash
# Taken from the BOS core (scripts/workflows/mirrors.sh) for P_JOL_ROLL's mirrors (phase 46):
# GitLab, Bitbucket, sourcehut, Gitea and a Gitea of our own (MIRROR_OWN_GITEA_URL; a mirror
# whose address is not set is left out, said, not failed).
# Every branch and tag of this repository pushed to each mirror of .github/bos.json
# (mirrors.to), and one status badge per place written into <badges dir>:
#   source-github.com.json   "github.com source: 200 OK"
#   mirror-gitea.com.json    "gitea.com mirror: 200 OK" | "404 NOT_FOUND" | "403 FORBIDDEN"...
# A mirror's status is the HTTP status of its page; when its update failed (or its secret
# is missing) it is "403 FORBIDDEN". A failed mirror never stops the others; the script
# fails at the end if one did.
# Usage: mirrors.sh <badges dir>   (each mirror's secret in the environment variable its
#   entry names: a token for https, a private SSH key for ssh)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
badges="${1:?badges dir}"
mkdir -p "$badges"
settings=.github/bos.json

# the reason phrase of an HTTP status, in capitals with _: 404 NOT_FOUND
reason() {
  case "$1" in
    200) echo "OK" ;;
    301) echo "MOVED_PERMANENTLY" ;;
    302) echo "FOUND" ;;
    401) echo "UNAUTHORIZED" ;;
    403) echo "FORBIDDEN" ;;
    404) echo "NOT_FOUND" ;;
    429) echo "TOO_MANY_REQUESTS" ;;
    500) echo "INTERNAL_SERVER_ERROR" ;;
    502) echo "BAD_GATEWAY" ;;
    503) echo "SERVICE_UNAVAILABLE" ;;
    000) echo "UNREACHABLE" ;;
    *) echo "STATUS" ;;
  esac
}

# the HTTP status of a page, following redirects; 000 when it cannot be reached
status_of() {
  curl -s -o /dev/null -L --max-time 20 -w '%{http_code}' "$1" || true
}

# badge <file> <label> <status>: a shields.io endpoint badge
badge() {
  local color=red
  case "$3" in
    2??) color=brightgreen ;;
    3??) color=yellow ;;
  esac
  jq -n --arg label "$2" --arg message "$3 $(reason "$3")" --arg color "$color" \
    '{schemaVersion: 1, label: $label, message: $message, color: $color}' > "$badges/$1"
  echo "$2: $3 $(reason "$3")"
}

# every branch of origin as a local ref of its own, so they are pushed as branches
git fetch --quiet --prune --tags origin '+refs/heads/*:refs/mirror/heads/*'
refspecs=('+refs/mirror/heads/*:refs/heads/*' '+refs/tags/*:refs/tags/*')

# push <name> <git url> <user> <secret>: true when the mirror took every ref
push() {
  local name="$1" url="$2" user="$3" secret="${4:-}"
  if [ -z "$secret" ]; then
    echo "::warning::$name: no secret - not updated"
    return 1
  fi
  if [[ "$url" == git@* ]]; then
    local key
    key=$(mktemp)
    printf '%s\n' "$secret" > "$key"
    chmod 600 "$key"
    local server="${url#git@}"
    ssh-keyscan -q "${server%%:*}" >> ~/.ssh/known_hosts 2>/dev/null
    GIT_SSH_COMMAND="ssh -i $key -o IdentitiesOnly=yes" git push --quiet --prune "$url" "${refspecs[@]}"
    local result=$?
    rm -f "$key"
    return $result
  fi
  local scheme="${url%%://*}" host="${url#*://}"
  # bitbucket.org: an access token (repository, workspace) signs in as x-token-auth, an
  # Atlassian API token (ATATT…, scope write:repository:bitbucket) as x-bitbucket-api-token-auth
  if [ "$user" = x-token-auth ] && [[ "$secret" == ATATT* ]]; then
    user=x-bitbucket-api-token-auth
  fi
  git push --quiet --prune "$scheme://$user:$secret@$host" "${refspecs[@]}"
}

mkdir -p ~/.ssh
source_host=$(jq -r '.mirrors.source.host' "$settings")
badge "source-$source_host.json" "$source_host source" "$(status_of "$(jq -r '.mirrors.source.web' "$settings")")"

failed=()
while read -r mirror; do
  name=$(jq -r .name <<< "$mirror")
  host=$(jq -r .host <<< "$mirror")
  secret_name=$(jq -r .secret <<< "$mirror")
  # MIRRORS_ONLY=own-gitea,gitlab: only these (a check of one mirror, task unittesting:mirrors-gitea)
  if [ -n "${MIRRORS_ONLY:-}" ] && [[ ",$MIRRORS_ONLY," != *",$name,"* ]]; then
    continue
  fi
  # an address of the owner's own server, from the environment
  git_url=$(jq -r .git <<< "$mirror")
  web=$(jq -r .web <<< "$mirror")
  git_url="${git_url//\$MIRROR_OWN_GITEA_URL/${MIRROR_OWN_GITEA_URL:-}}"
  web="${web//\$MIRROR_OWN_GITEA_URL/${MIRROR_OWN_GITEA_URL:-}}"
  if [[ "$git_url" == /* ]]; then
    echo "::notice::$name: its address is not set (MIRROR_OWN_GITEA_URL) - left out"
    continue
  fi
  echo "::group::$name ($host)"
  if push "$name" "$git_url" "$(jq -r '.user // ""' <<< "$mirror")" "${!secret_name:-}"; then
    status=$(status_of "$web")
  else
    echo "::error::$name: the update failed"
    failed+=("$name")
    status=403
  fi
  badge "mirror-$host.json" "$host mirror" "$status"
  echo "::endgroup::"
done < <(jq -c '.mirrors.to[]' "$settings")

if [ ${#failed[@]} -gt 0 ]; then
  echo "::error::not updated: ${failed[*]}"
  exit 1
fi
