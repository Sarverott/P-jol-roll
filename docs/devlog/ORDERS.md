# ORDERS: answers to the open questions

The owner's answers to `Q<n>` of [BRAINSTORM.md](BRAINSTORM.md), written below
the line. Agents move them word for word into the changelog and leave this
file with its header only.

---

### Q6

yes, website of project lives in `site/` dir that is builded for github pages branch publishing sourced from master branch and it replaces inside it content of branch (like in Amoorion - `https://github.com/Sarverott/amoorion/tree/github-pages`). demo of webapp explorer of documents static building (explained among notes of `compose.yaml` commentary) should be placed in `resources/space/webapp` dir to be pushed later on. website for documentation is delegated to be published as docs in readthedocs ( https://lex-polonica.readthedocs.io/ ).

### Q7

later on we will move it, for now we will add optional relative scoping where we place subelements inside scopes with detailed configs in scope's declaration file

### Q8 

sync all versioning info and bumps process with this repository version value. we need to automate it to be as we use to per-commit bumping - you know what to do.

### Q9

try to check dependabot's PRs and npm audit raports. you can turn it back to newest versions of dependencies like `nanoid` or `workflow` packages, but it should be not rich in vulnerabilities - try to minimize unneccecery risks.

If we need to consider replacements for any packages, please identify them and put forward your suggestions in `PROPOSALS.md`.

### Q10

> DISCLAIMER: it should be implemented not all-at-once but in more distant future as modular feachering.

right now we work only on one machine with single entrypoint to WAN and single source of thruth. we want to split it all into torrents, point them out with ipfs, build tunneled network with wireguard to be managable and loadbalancers to divide work and rule over more then one machine that we can use to proceede that all.

drive should be easy to making mirrors of it and in later concept i was thinking about placing hosts of that in every capital city of a voivodeship at least, or even instance per every district in poland. each such instance would be an independent host for the district administration 

no centralized infrastructure, blockchained with cosmos sdk

### Q1

for that we have to add rich logging into project and delegation of network log collector like `rsyslog` (add that to stuff related with docker compose)

inside `tests/unittesting/` dir should be containers to test system on other OS we want to support. add `parrot-os` dir and inside it setup for headless gatherer `headless-server` with case named `-gather-and-parse`.

later on we will also integrate virtualbox stations and proxmox inside there to test all possibilities - this will come here even later then decentralization.