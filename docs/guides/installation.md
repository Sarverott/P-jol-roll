# Installation

## What you need

| Thing | Why |
| --- | --- |
| Node.js 24 and npm | everything runs on it (the code is TypeScript, run with `tsx`) |
| git | to clone; the repository has one submodule, the Obsidian plugin |
| about 1 GB of disk | dependencies, and the Camoufox browser that `npm install` downloads for `checkup` |
| [Task](https://taskfile.dev), optional | shorter commands. A copy comes with the dependencies: `npx task` |

Disk for the data is a separate matter: see
[how big it is](gathering.md#how-big-it-is).

## Steps

```sh
git clone --recurse-submodules https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll
npm install
task verify
```

`npm install` also downloads the browser (`camoufox-js fetch`) and sets up
the git hooks (husky). `task verify` runs the Biome check, the build and the
tests. The tests ask nothing on the internet.

Then try a small gathering:

```sh
task gather -- 2026 --acts --limit 5
```

It writes the lists and the listing of 2026 into `resources/dataset/` and
the files of five acts into `resources/bucket/`.

## Without Task

Every task is one npm script underneath:

| With Task | Without |
| --- | --- |
| `task gather -- 2026` | `npm run gather -- 2026` |
| `task checkup -- 2026` | `npm run checkup -- 2026` |
| `task resources:plan -- dataset` | `npm run hub -- plan dataset` |
| `task verify` | `npx biome check && npm run build && npx vitest run` |

## Token for Hugging Face

Only sending data needs it. Reading public repositories does not.

```sh
echo "HF_TOKEN=hf_..." > .env
```

`.env` is ignored by git. The token needs write access to the repositories
listed in `resources/.map.json`. See [Hugging Face](huggingface.md).

## Settings from the environment

| Variable | Default | What it changes |
| --- | --- | --- |
| `ELI_API` | `https://api.sejm.gov.pl/eli` | where `gather` asks. Tests point it at a local copy |
| `RESOURCES_DIR` | `resources` | where everything is written and read |
| `HF_TOKEN` | none | token for `hub push` and for private repositories |
| `CRAWLEE_STORAGE_DIR` | `storage` | where the crawler keeps its queue of requests while it runs |

## The Obsidian vault

The repository is also an Obsidian vault: open its directory in Obsidian to
read the docs with links. `.obsidian/plugins/hefaisto` is a separate
repository ([Sarverott/hefaisto](https://github.com/Sarverott/hefaisto)).
Nothing in gathering depends on it.
