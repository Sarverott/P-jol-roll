#!/bin/sh
# case -bare-repo-on-drive (Q1): an external drive as Parrot OS mounts it - FAT, owned by
# the user who mounted it, noexec - holding a bare repository. It shows what refuses when
# the working copy lives on the drive, and that the layout of docs/guides/second-machine.md
# works: the bare repository on the drive as a remote, the working copy and node_modules on
# the internal disk, gathered data on the drive through RESOURCES_DIR.
# Needs a privileged container to mount the image: task unittesting:parrot-os-drive
set -u
pass=0
fail=0
ok() { pass=$((pass + 1)); echo "ok    $1"; }
bad() { fail=$((fail + 1)); echo "FAIL  $1"; }
expect() { # <what> <command...>: the command has to succeed
  what="$1"; shift
  if "$@" > /tmp/out 2>&1; then ok "$what"; else bad "$what"; tail -3 /tmp/out; fi
}
refuse() { # <what> <command...>: the command has to fail, as the guide says it does
  what="$1"; shift
  if "$@" > /tmp/out 2>&1; then bad "$what (it worked)"; else ok "$what: $( (grep -m1 -iE "eperm|symlink|denied|dubious" /tmp/out || tail -1 /tmp/out) | cut -c1-100)"; fi
}

echo "case -bare-repo-on-drive on $(. /etc/os-release && echo "$PRETTY_NAME")"
drive=/media/gatherer/DRIVE
me=$(id -u gatherer)
truncate -s 2G /tmp/drive.img && mkfs.vfat -n DRIVE /tmp/drive.img > /dev/null
mkdir -p "$drive"
mount -o loop,noexec,nosuid,nodev,uid="$me",gid="$me" /tmp/drive.img "$drive"
findmnt -no FSTYPE,OPTIONS "$drive"

as() { sudo -u gatherer -H "$@"; }
src=/home/gatherer/P-jol-roll

# the image holds no .git (.dockerignore): the copy becomes a repository first, then its
# bare clone goes onto the drive
expect "the copy in the image as a repository" as sh -c "cd $src && git init -q -b development && git add -A && git -c user.name=t -c user.email=t@t commit -q --no-verify -m 'test: the copy'"
expect "bare repository written to the drive" as git clone -q --bare "$src" "$drive/P-jol-roll.git"

# the working copy on the drive: what the guide's table says refuses
expect "working copy cloned onto the drive" as git clone -q "$drive/P-jol-roll.git" "$drive/work"
refuse "npm ci on the drive (no symlinks on FAT)" as sh -c "cd $drive/work && npm ci --ignore-scripts --no-audit --no-fund"
printf '#!/bin/sh\necho hook ran\n' > "$drive/work/hook.sh"; chmod +x "$drive/work/hook.sh" 2> /dev/null
refuse "running a script from the drive (noexec)" as "$drive/work/hook.sh"

# the same drive as another user sees it: git's dubious ownership
refuse "git in the drive's repository as root (dubious ownership)" git -C "$drive/P-jol-roll.git" log -1

# the layout of the guide
expect "clone from the drive onto the internal disk" as git clone -q "$drive/P-jol-roll.git" /home/gatherer/work
expect "node_modules on the internal disk" as sh -c "cp -a $src/node_modules /home/gatherer/work/"
expect "gathering against the local copy of the API, data on the drive" as sh -c "cd /home/gatherer/work && RESOURCES_DIR=$drive/resources npx vitest run tests/gather.test.ts"
expect "a commit pushed back to the bare repository on the drive" as sh -c "cd /home/gatherer/work && git -c user.name=t -c user.email=t@t commit -q --allow-empty --no-verify -m 'test: from the internal disk' && git push -q origin HEAD"

umount "$drive"
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
