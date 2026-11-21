# Gathering on a second machine

The whole source is hundreds of thousands of requests and days of work, so
the heavy downloading can run on another machine, with the data on an
external drive. This page says how to set it up so that it works on any
Linux (Parrot OS included) and on any drive, and how to check what comes
back. How the data travels home is still open (Q10 in the
[devlog](../devlog/BRAINSTORM.md)); both ways are described.

## The layout that works on any drive

| What | Where | Why |
| ---- | ----- | --- |
| The working copy and `node_modules` | the machine's own disk, e.g. `~/__WORKSHOP/forge/sarverott/P-jol-roll` | `npm` needs symlinks and executable files, which exFAT and NTFS drives do not keep, and removable drives are usually mounted `noexec` |
| A bare repository (optional) | the external drive | a plain remote: `git clone /media/<you>/<drive>/P-jol-roll.git`; git only reads and writes objects there |
| The gathered data | the external drive, through `RESOURCES_DIR` | big files, written whole (`.part` first), nothing in it is ever run |

```sh
# on the second machine
git clone https://github.com/Sarverott/P-jol-roll.git ~/__WORKSHOP/forge/sarverott/P-jol-roll
cd ~/__WORKSHOP/forge/sarverott/P-jol-roll
npm install                                   # Node 24, npm 11 (.nvmrc)
mkdir -p /media/$USER/<drive>/p-jol-roll-resources
cp resources/.map.json resources/frontends.json /media/$USER/<drive>/p-jol-roll-resources/
echo "RESOURCES_DIR=/media/$USER/<drive>/p-jol-roll-resources" >> .env
task check                                    # nothing asks the internet
task gather -- 2026 --acts --limit 5          # a small run first
```

`.env.example` lists every setting; every task reads `.env` of the working copy (`dotenv` in `Taskfile.yml`),
so `RESOURCES_DIR` set there holds for all of them; a variable set in the
shell wins over it. `npm run ...` without Task does not read `.env`: there,
export the variable first. `.env` is ignored by git.

## When something refuses

| What you see | Cause | What to do |
| ------------ | ----- | ---------- |
| `fatal: detected dubious ownership in repository` | git refuses a repository whose files belong to another user; on exFAT and NTFS every file seems to belong to whoever mounted the drive | `git config --global --add safe.directory /media/<you>/<drive>/P-jol-roll.git` for that one path; better, keep the working copy on the internal disk |
| `npm install` fails with `EPERM` or `symlink` errors | the filesystem of the drive has no symlinks (exFAT, FAT32) | install on the internal disk (the layout above) |
| `Permission denied` when a hook, `tsx` or `task` runs | the drive is mounted `noexec` (`findmnt -o TARGET,OPTIONS <path>` shows it) | do not run anything from the drive; only data lives there |
| no `task` binary after `npm install` | npm 11 skips install scripts that are not approved | `package.json` approves `@go-task/cli` in `allowScripts`; if it was installed by hand with an older checkout, run `npm install` again |
| hooks do not stop a bad commit | `@go-task/cli` older than 3.54 drops the exit code | `npm install` from this version of the repository brings 3.54 |

`lsblk -f` shows how a drive is formatted, `findmnt <path>` how it is
mounted. `task unittesting:parrot-os-drive` shows the three refusals above
on Parrot OS with a FAT drive mounted `noexec`, and the layout of this
page working on the same drive.

## Bringing the data back

The second machine gathers, then seals, so every file it took has a
checksum record in `dataset/files/`:

```sh
task seal            # records for anything gathered without one
task seal -- --check # reads every file again, names any that differ
```

Then one of two ways (Q10):

- **It pushes to Hugging Face itself**, with the owner's token in `.env`:
  `task resources:push -- bucket`, `task resources:push -- dataset`. The
  home machine takes it with `task resources:pull -- dataset` (and
  `bucket` when it wants the raw files), then `task seal -- --check`.
- **The drive travels home**: point `RESOURCES_DIR` at it there, run
  `task seal -- --check`, then push from home.

Either way, a file with a record is not asked for again, so two machines
that share the dataset do not gather the same files twice. Split the work
by journal or by years (`task gather -- 1990 1991 --acts --limit 0
--publisher MP`) when both machines gather at once.
