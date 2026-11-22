# Hugging Face

What the hub does to a push, learnt by pushing 165 thousand files.

- **128 commits an hour per repository.** The 129th gets 429 and "retry in
  about 1 hour". `push` waits that out and sends the same commit again;
  commits hold 1000 files, so an hour moves 128 thousand.
- **A text with control characters is binary to it.** One such file refuses
  the whole commit. Texts are made clean (`printable()`), and `push` holds
  back any that are not and names them.
- **A push never deletes.** Files that went away here stay there until
  `task resources:prune` (it asks first, and never touches the bucket).
- **The bucket is not git.** Raw files go there by their own sync and are
  never pruned: a file may live on one machine only.
- **The space mounts the bucket at `/data`.** The image keeps its cache
  and logs there by default, so the space's `Dockerfile` moves them to
  `/tmp`; otherwise each page read lands in the bucket.
- Pushing is the owner's move; agents prepare and check (AGENTS.md rule 5).

## Cases

- [Hugging Face refuses the 129th commit of an hour](../cataclistics/hub-commit-limit.md)
- [A markdown text taken for a binary file](../cataclistics/hub-binary-text.md)
- [The demo space keeps files of its old version](../cataclistics/hub-push-never-deletes.md)
- [The demo space writes its cache into the bucket](../cataclistics/space-cache-in-bucket.md)

See also [the guide](../../guides/huggingface.md).
