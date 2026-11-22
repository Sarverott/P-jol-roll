# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

## Q15. Vector embeddings: what for, made where

The owner wrote "and some vector embedding maybe" next to the map of the whole
law (phase 14). Embeddings of the texts would place acts by meaning: the map
could draw them, the search could find an act by what it says rather than its
words, and the advisor agent of M4 would read through them.

They need the texts first (phase 12) and a model to make them: a small local
one (multilingual, Polish), run by the owner like the gathering, kept in the
dataset beside the texts; or one behind an API, which costs per text.

*Lean:* after phase 12, a small local multilingual model, its vectors as one
more table of the dataset; Typesense (phase 14) can search them by itself, so
no separate vector database.
