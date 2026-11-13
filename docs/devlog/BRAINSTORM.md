# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

## Q1. What exactly fails on Parrot OS with the bare repository?

"issues with Parrot os louching in bare repo in external drive" - I have no
error text and no picture of the setup. What I can guess from the words:

- a **bare repository** on the external drive (an archive mirror, or a
  sarcophag) that the machine clones from, or works in;
- the drive formatted **exFAT or NTFS**: git then refuses it as "dubious
  ownership" (`safe.directory`), `npm install` fails on symlinks in
  `node_modules/.bin`, and files lose their executable bit (hooks, `tsx`);
- the drive **mounted `noexec`** (the usual for removable media), so nothing
  in it can be run.

Please paste the command and the error, and say what the drive is formatted
with (`lsblk -f`) and how it is mounted (`findmnt <path>`).

*Lean:* the working copy and `node_modules` on the machine's own disk, the
bare repository on the drive only as a remote, and the gathered data on the
drive through `RESOURCES_DIR`. That works with any filesystem.

## Q2. The branches of the BOS loop here, and pushing

Following the BOS pattern, I made `development` from `master`, then
`dev/Sarverott` (your edit) and `dev/Cleo` (my work), merged with `--no-ff`.
Nothing is pushed. In the BOS core you let an agent push `development`, its
own `dev/<name>` and `revision` without asking.

*Lean:* the same here - I push `development` and `dev/Cleo`; `master`,
tags, releases and repository settings stay yours. Until you answer, I push
nothing.

## Q3. "Do not commit" in AGENTS.md

Rule 1 of `AGENTS.md` says agents never commit. Your inquiry asks for every
step as a commit, the BOS way.

*Lean:* rule 1 becomes the BOS routine (own `dev/<name>`, conventional
commits, one step each, never `master`), and the owner's edits are taken in
on `dev/Sarverott` with a message saying how I understood them. Done in
phase 0 already, because the inquiry asks for it; say so if you meant only
the plan.

## Q4. The termui experiment

`src/index.tsx`, `src/main.js` (empty), `termui.config.ts` and
`termui.config.json` came with "test of termui and fatal errors while
unresolvable versions". `ink`, `react` and `termui` are not in
`package.json`, so it cannot run, and it makes `task verify` red (Biome and
tsc).

*Lean:* move it into `src/tui/` with both configs, keep it out of the checks
until it is wanted, and add its packages then. The other way is to drop it;
it stays in git history either way.

## Q5. `docs/agents/` or `docs/.agents/`

The BOS core keeps agents' notes in `docs/.agents/` (`CLEO.md`, `NOTES.md`).
This repository has `docs/agents/` (`ideas.md`, `things-to-check.md`,
`point-of-view.md`) and is an Obsidian vault, which hides directories that
start with a dot.

*Lean:* keep `docs/agents/`, add `NOTES.md` there in the BOS form. Moving my
`point-of-view.md` is your call anyway, since you keep it read-only.

## Q6. Where the website lives

*Lean:* MkDocs Material over `docs/`, built into `site/` like the BOS core,
published on GitHub Pages by a workflow from `master`. The Hugging Face space
stays the place where people browse the data itself. Publishing is yours; I
build and check it locally.

## Q7. The project's place in the workshop

The project lies at `forge/sarverott/github-repos/P-jol-roll`. The workshop
rule is `forge/<scope>/<repository>`, so either the scope is `sarverott` and
`github-repos` is one level too many, or the scope is `github-repos`. I did
not run `bos workshop status` (the core says never on the home workshop
unless you ask).

*Lean:* scope `sarverott`, the move made by you or by `bos` when you run it;
nothing moved by me.

## Q8. Versions

*Lean:* `0.1.0` when phase 1 closes, then Y for every closed phase and Z for
steps counted at the phase's close - without the per-commit bump hook of the
BOS core, which needs the `bos` command in the hooks here.

## Q9. The Workflow SDK pilot after the downgrade

Your edit moved `workflow` to 2.0.6, which `npm audit fix --force` proposed
for the `nanoid` advisory. The pilot was written for 5.x.

*Lean:* back to the newest 5.x (5.5.0 today) if the advisory is gone there,
else keep 5.x with the advisory recorded (it bites only on a negative size,
which nothing here sends). If you rather not carry the SDK at all, the pilot
leaves and `task gather:changes` stays the daily way.

## Q10. The external machine

What runs there, and how does what it gathers come back? Does it push to
the Hugging Face bucket itself (with your token), or does the drive travel?

*Lean:* the external machine gathers into the drive, seals, and pushes the
bucket itself; this machine pulls. Checksum records make both sides
comparable with `task seal -- --check`.
