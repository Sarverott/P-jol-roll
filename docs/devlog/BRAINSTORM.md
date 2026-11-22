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

## Q16. Texts of PDFs: a file per act, or a year in a file

`task text -- --pdf` (phase 12) writes one markdown file per act, as texts
from HTML have been: about 125 thousand more files in the dataset, 165
thousand in all. Hugging Face advises a git repository (which a dataset is)
to keep under about 100 thousand files and under 10 thousand per folder
(docs/guides/huggingface.md); folders of a year stay under that, the whole
does not. Every push of them is also commits of 1000 files, 126 of them, at
most 128 an hour.

Packed instead: `texts/<journal>/<year>.jsonl`, one line per act with its
markdown and its record. One file per year (about 230 files), one commit;
the training collection reads it directly; the demo and the api take a year
and pick the act out (a year of DU is a few MB of text).

*Lean:* a year in a file for every text, from HTML and from PDF alike, the
per-act markdown files kept only on the local side for people to open; the
dataset on Hugging Face gets the packed years. Until the answer, nothing of
it is pushed by me anyway - pushing is yours.
