# Contributing to P_JOL_ROLL

P_JOL_ROLL gathers every act published in the Polish journals of laws
(Dziennik Ustaw and Monitor Polski) from the open ELI API of Sejm, and keeps
it as a dataset and a bucket of raw files. By taking part you agree to follow
the [Code of Conduct](CODE_OF_CONDUCT.md).

Polish and English are both welcome in issues and discussions. Code, comments
and documentation are written in English.

## Setting up

You need:

- Node.js 24 and npm
- about 1 GB of disk for dependencies and the browser of `checkup`
  (Camoufox, downloaded by `npm install`)
- optional: [Task](https://taskfile.dev) installed globally. Without it,
  `npx task` runs the one that comes with the dependencies.
- optional: a Hugging Face token in `.env` as `HF_TOKEN=...`, only for
  sending data (see [moving data to Hugging Face](../docs/guides/huggingface.md))

```sh
git clone --recurse-submodules https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll && npm install
```

`task --list` shows every task. The most used:

| Task | What it does |
| --- | --- |
| `task verify` | Biome check, build and tests. Run it before you open a pull request |
| `task format` | Applies Biome formatting and safe fixes |
| `task gather -- 2026 --acts --limit 5` | A small gathering: one year, files of 5 acts |
| `task checkup -- 2026 --limit 6` | The browser visits 6 pages that show gathered acts |
| `task resources:plan -- dataset` | Compares a local directory with Hugging Face, changes nothing |

More in [the guides](../docs/README.md).

## Making a change

1. **Open an issue first** when the change is bigger than a fix, so the work
   is not done twice.
2. **Branch from `master`** and name the branch `feature/<short-name>` or
   `fix/<short-name>`. `master` is the only long-lived branch for now. The
   workshop's loop of branches (`development` → `revision` → `testing` →
   `releasing` → `master`) will be set up later, and this page will change
   with it.
3. **Keep tests away from the real source.** Tests never ask
   `api.sejm.gov.pl`, a government website or Hugging Face. `ELI_API` and
   `RESOURCES_DIR` in the environment point the code at a local copy;
   `tests/gather.test.ts` shows how.
4. **Follow the code that is there.** Tabs, double quotes, short file names.
   Addresses and data stay out of handlers: addresses of the API live in
   `src/eli.ts`, paths of files in `src/store.ts`, websites in
   `resources/frontends.json`.
5. **Run `task verify`.** The pre-commit hook also checks staged files with
   Biome.
6. **Open a pull request into `master`.** Sett Sarverott reviews and merges.

Comments that start with `// NOTE:` are tasks left by the maintainer, and
`ANSWER:` lines under them are replies. Leave both in place.

## Manners toward the source

These are rules of the project and a pull request that breaks them is not
merged:

- **Say who is asking.** Requests to the API carry the project's own
  User-Agent with the address of this repository.
- **Go slowly.** Two requests at a time and 120 per minute by default. Do not
  raise the defaults.
- **Do not ask twice.** A file that is already gathered is not requested
  again.
- **Websites are visited one page at a time**, only by `checkup`. A website
  whose `robots.txt` disallows crawlers is marked so in
  `resources/frontends.json`.
- **Poland only.** Sources of other Polish public institutions can be
  proposed with the "new source" issue form. Sources of other governments are
  out of scope.

## Data and responsibility

- The gathered data is not kept in this repository. `resources/dataset`,
  `resources/bucket` and `resources/space` are ignored by git; never commit
  gathered files.
- Only the maintainer sends data to Hugging Face.
- Acts are official publications. Some of them, mostly in Monitor Polski,
  name private persons. Do not build features that collect or profile
  persons named in acts.
- Nothing in this project is legal advice. See
  [what the data is and is not](../docs/guides/data.md#what-it-is-not).

Security problems go privately to the maintainer, as written in
[SECURITY.md](SECURITY.md).

## Working with AI agents

Agents work here under [AGENTS.md](../AGENTS.md). If you use one for a
contribution, you answer for what it wrote: read it, run it and say in the
pull request that an agent was used. `docs/agents/` holds notes written by
agents; `docs/agents/point-of-view.md` is personal and is not edited by
anyone else.

## License

P_JOL_ROLL is licensed under [AGPL-3.0-only](../LICENSE). Contributions are
accepted under the same license.
