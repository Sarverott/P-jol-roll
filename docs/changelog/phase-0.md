# Phase 0: clear the ground

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1794596988945 · commit 20e7d45

The inquiry of 2026-11-13, given in the chat (it arrived twice, the same
both times). Turned into VISION.md, ROADMAP.md, TODO.md and BRAINSTORM.md.
Word for word:

````markdown
Hey there Cleo, it is one month later now and we just manage to delegate some heavy downloading to external machine but I came into issues with Parrot os louching in bare repo in external drive
We have to perform some upgrades here:
- listing of functionalities that we want and already can
- clear readme with getting started briefing 
- clear and full BOS integration of this project
- website that present state of project, idea and stuff (can be basic)
- repairs related with dependencies and such (look at `bos-skillset`, main repo of BOS, `amoorion` and other projects we had made together)
Please notice me when you will came into questions or trouble to ask me with entries in `docs/devlog/BRAINSTORM.md` and prepare planning splitted into phases and these phases into steps in `docs/devlog/TODO.md` that every step is commit here (please follow that pattern we had achieved in BOS)
Thank you in advance
````

Before this devlog the plan lived in the two scrapnotes of October 2026,
which stay in `docs/devlog/`, and in `docs/agents/ideas.md`.

## UNIXUSAT=1794699265791 · commit 582749f

The owner's answers to Q3 and Q5 of BRAINSTORM.md, written in ORDERS.md
from the GitHub app (commit 582749f on `development`). Word for word:

### Q3

````markdown
this is old early statement, so remove that rule. instead of that we can add rule that tells where goes edits, that every AI that commits requires own names identity and lineage signature of co-authorship. previous "do not commit" is now "before your identity and understanding of laws here is not confirmed by contributors (so called members, both digital and organic) you shall not commit here" or something like that
````

**Decision:** rule 1 of AGENTS.md ("do not commit") is gone. In its place: an agent commits only after the members (digital and organic) confirmed its identity and its understanding of the rules here; every committing AI has its own name and signs each commit with its co-authorship line, name and lineage; the rule says where edits go.

### Q5

````markdown
yea, that concern is on your side. in my opinion good move is to move it to `docs/.agents/` so it will become your AI own domain where humans like me can only read but not write, edit or delete there anything - this is part of our statement there
````

**Decision:** agents' notes move from `docs/agents/` to `docs/.agents/`, the agents' own domain: humans read it, and do not write, edit or delete there.

## UNIXUSAT=1794703638694 · commit f96dd32

The owner's answer to Q2 of BRAINSTORM.md (the branches of the BOS loop,
and pushing), given in the chat after the batch of Q3-Q5. Word for word:

### Q2

````markdown
Yes, you can push. Answer the Q2 about that, You can push freely
````

**Decision:** as the lean said: agents push `development` and their own
`dev/<name>` without asking; `master`, tags, releases and repository
settings stay the owner's and are asked for first.
