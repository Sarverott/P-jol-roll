# ROADMAP

Where P_JOL_ROLL goes, on the version scale of the BOS craft loop. The why is
in [VISION.md](VISION.md), the checklist in [TODO.md](TODO.md).

## Versions

| Event | Project (semver `vX.Y.Z`) |
| ----- | ------------------------- |
| step: one finished, checked piece of work, one commit | Z |
| phase: every item of a TODO phase ticked | Y |
| milestone: a group of phases that changes what the project can do | X |

The version lives in `package.json`; every other version field is synced
from it. Every commit on a `dev/*` branch bumps Z, as in the BOS core (Q8).
Closing a phase bumps Y, pushes, and opens the pull request to `master`;
every push to `master` releases its version (phase 8). Phases 0-3 were
closed before the rule; their one bump makes `0.1.0`.

## Milestones

| Milestone | Phases | What the project can do after it |
| --------- | ------ | -------------------------------- |
| M0: gathered (October 2026, before this devlog) | - | gather every act, seal, compile, markdown, read it through api, MCP, website, window |
| M1: standing on its own feet | 0, 1, 2, 3 | install and check from clean, say what it does, live in the BOS loop |
| M2: seen and spread | 4, 5 | present itself on a website, gather on more than one machine |
| M3: run as services | 6, 7, 8, 9 | start with `task`, run every part as a container, logs in one place |
| M4: read by a model | 10-36 (18-21, 23-29: the loop's own upkeep on the way) | PDF texts into markdown, a dataset for training; every function in every interface; the law mastermind (Q18): deepseek-R1 in Ollama and on Hugging Face, a qwen agent in the shell, social simulations by MiroFish or OASIS, a Python stack |
| M5: no centre | 37-41 | torrents pointed to by IPFS, a WireGuard network with load balancing, mirrors per voivodeship or district, no central infrastructure (Cosmos SDK) - modular, one part at a time (Q10); a Go stack for these circuits, ESP32 boards as off-grid mesh nodes (PP4); devices of the person in the desktop app: printers, phones, FIDO keys for signing (Q17) |

The milestones and the phases live on GitHub too (phase 28): a milestone of
the repository per milestone here, an issue per phase in its milestone
(closed when its TODO is ticked), an issue per `Q<n>` and `PP<n>`, all of
them on the project board. The markdown is the source; `task github:devlog`
brings it there again (`scripts/devops/github/devlog.sh`).
