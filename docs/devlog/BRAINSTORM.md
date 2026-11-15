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
