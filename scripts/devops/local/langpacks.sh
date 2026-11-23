#!/usr/bin/env bash
# The language packs live in their gist (phase 28), the submodule resources/locales: the source
# the project reads, not a copy of what it makes.
#   langpacks.sh pull                 the submodule checked out at the gist's newest commit
#   langpacks.sh publish "<what>"     the packs changed here (task i18n:collect, i18n:translate,
#                                     a person's review) committed in the gist and pushed, and
#                                     the submodule's new commit staged here for your next commit
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
packs=resources/locales

case "${1:-pull}" in
  pull)
    git submodule update --init --remote "$packs"
    echo "$packs at $(git -C "$packs" log --oneline -1)"
    ;;
  publish)
    shift; what="${*:?what changed in the packs, for the gist's commit}"
    if [ -z "$(git -C "$packs" status --porcelain)" ]; then
      echo "$packs: nothing changed"
    else
      git -C "$packs" checkout -q -B master
      git -C "$packs" add -A
      git -C "$packs" commit -q -m "$what"
      git -C "$packs" push -q origin master
      echo "$packs: $(git -C "$packs" log --oneline -1) pushed to the gist"
    fi
    git add "$packs"
    echo "the submodule's commit is staged - commit it with your next step"
    ;;
  *)
    echo "usage: langpacks.sh pull | publish \"<what changed>\"" >&2
    exit 2
    ;;
esac
