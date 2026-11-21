# shellcheck shell=bash
# Sourced by every script of scripts/devops/: strict mode, the root of the repository as the
# working directory, the bot's identity and the step's outputs. As in the BOS core's
# scripts/workflows/_common.sh.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# the workflows' git author: GitHub's own bot
bot_identity() {
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
}

# name=value into the step's outputs (GITHUB_OUTPUT), echoed when run by hand
output() {
  echo "$1=$2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1=$2" >> "$GITHUB_OUTPUT"; fi
}

# the version in package.json
version() { jq -r .version package.json; }

# the merge driver of .gitattributes (the higher version wins), for merges made here
merge_driver() {
  git config merge.version.name 'P_JOL_ROLL - the higher version, then a three-way merge'
  git config merge.version.driver 'node src/devtools/version.ts merge %O %A %B'
}
