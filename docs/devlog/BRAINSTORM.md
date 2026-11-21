# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

## Q11. The scope declaration file (from Q7)

"optional relative scoping where we place subelements inside scopes with
detailed configs in scope's declaration file" - I read it as: the project
may stay at `forge/sarverott/github-repos/P-jol-roll`, and the directory
between (`github-repos`) declares itself a scope by a file in it that names
its sub-elements and their settings. Two things I do not know: is it a
file of this repository or of the workshop (outside git here), and does it
already have a name and a form in BOS?

*Lean:* a workshop-side file, `forge/sarverott/github-repos/.bos-scope.json`
or whatever BOS names it, written by you or by `bos`; this repository only
says in `.github/bos.json` that it may live inside a nested scope. Until
the answer I touch nothing outside the repository.

## Q12. The podcasts and the audience

The NOTE in `compose.yaml` links podcasts about the project in 11
languages on Google Drive.

*Lean:* link the folder from the README and from the home page of the
website, under "Read on", as it is. Say if they should rather move to the
Hugging Face space or into `resources/`.
