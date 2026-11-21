#!/usr/bin/env bash
# Releases the version in package.json unless its tag exists: an annotated tag v<version>
# and the GitHub release, with notes generated from the pull requests.
# Outputs tag=v<version>, or nothing when it is released already.
# Usage: release.sh [--prerelease]   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
tag="v$(version)"
git fetch -q --tags origin
if git rev-parse -q --verify "refs/tags/$tag" > /dev/null; then
  echo "$tag is released already"
  exit 0
fi

bot_identity
git tag -a "$tag" -m "$tag"
git push -q origin "$tag"
gh release create "$tag" --title "$tag" --generate-notes --verify-tag "$@"
output tag "$tag"
