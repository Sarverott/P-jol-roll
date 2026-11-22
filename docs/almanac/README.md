# Almanac

The place for what the project learnt the hard way: problems met while
working with the law's data and the tools around it, how each was solved,
the topics they belong to, and the rules that came out of them. It is the
almanac of BOS (the Blacksmith Organization System, its `docs/almanac/`)
tried out in one project: the same kinds of knowledge, kept as data that
code reads and as pages people read.

| Part | What it holds | Read by |
| --- | --- | --- |
| [cataclistics/](#cases) | one page per case: what happened, its cause, the solution, where it was seen. Each page is an issue ready for GitHub | people, `task almanac:issues` |
| [solutions/](#topics) | one article per topic: what to know before touching it, and its cases | people |
| [patterning/p-jol-roll.json](patterning/p-jol-roll.json) | each case as a chain of events up to the one where it broke (its cataclysm), with its solution | `task almanac:recall`, `task almanac:predict` |
| [rulesets/p-jol-roll.json](rulesets/p-jol-roll.json) | the rules of AGENTS.md as data: the first rule that applies decides | `task almanac:judge` |
| [FAQ](faq.md) | short answers to what is asked again and again | people |

## How it is used

```sh
task almanac:recall -- hub:push hub:           # which cases began like this, and what solved them
task almanac:predict -- hub:push               # what followed this before
task almanac:judge -- push dataset --actor agent   # violation: Hugging Face is the owner's
task almanac:cases                             # every case with its issue, when opened
task almanac:issues:open -- hub-binary-text   # the case opened on GitHub (asks; the owner's move)
```

An event is written `<where>:<what>` (`hub:push`, `tsc:module-not-found`);
`recall` takes a start of one too (`hub:`). Chains seen more often weigh
more in `predict`, as in BOS (`src/almanac/patterning.ts` follows BOS's
`src/core/patterning.ts`).

## A new case

When something breaks and is solved:

1. a chain in `patterning/p-jol-roll.json`: `id`, `title`, `events`,
   `cataclysm`, `solution`, `seen` (runs, logs, versions), `topic`, `page`;
2. its page `cataclistics/<id>.md`, with front matter `id`, `labels`
   (labels that exist on GitHub), `status`, and `issue` left empty;
3. a line in the article of its topic, `solutions/<topic>.md`.

`tests/almanac.test.ts` checks that chains, pages and articles point at
each other. Opening the issue is the owner's move: `task almanac:issues:open --
<id>` makes it with `gh`, closes a solved one at once as completed
(so it can be found, and it says how it was solved), and writes its number
into the page.

## Cases

| Topic | Cases |
| --- | --- |
| [Hugging Face](solutions/hugging-face.md) | [129th commit of an hour](cataclistics/hub-commit-limit.md) · [a text taken for binary](cataclistics/hub-binary-text.md) · [the space keeps old files](cataclistics/hub-push-never-deletes.md) · [the space writes into the bucket](cataclistics/space-cache-in-bucket.md) |
| [Texts of PDFs](solutions/pdf-texts.md) | [a damaged PDF](cataclistics/damaged-pdf.md) · [a producer in UTF-16](cataclistics/utf16-producer.md) |
| [Security](solutions/security.md) | [the first CodeQL scan](cataclistics/codeql-first-scan.md) |
| [Containers](solutions/containers.md) | [language packs left out of the image](cataclistics/container-missing-locales.md) · [a `?raw` import outside `src/`](cataclistics/container-bundler-imports.md) · [port 5353](cataclistics/mdns-port.md) |
| [Dependencies](solutions/dependencies.md) | [hooks that blocked nothing](cataclistics/hooks-never-blocked.md) · [a forced audit fix](cataclistics/forced-audit-downgrade.md) · [install scripts of npm 11](cataclistics/npm-install-scripts.md) · [Biome breaks quoted Vue attributes](cataclistics/biome-html-quotes.md) |
| [GitHub workflows](solutions/github-workflows.md) | [Dependabot](cataclistics/dependabot-flow.md) · ["action required"](cataclistics/action-required.md) · [a bump left behind](cataclistics/bump-left-behind.md) · [Copilot's pull requests into master](cataclistics/copilot-prs-to-master.md) |
| [Translations](solutions/translations.md) | [Vite skips dotfiles](cataclistics/vite-glob-dotfiles.md) · [linkedom and the observer](cataclistics/i18n-test-dom.md) · [names changed by the model](cataclistics/argos-mangles-names.md) |
| [The viewer](solutions/viewer.md) | [sigma's edges](cataclistics/sigma-edges.md) · [parquet in zstd](cataclistics/hyparquet-zstd.md) · [two servers, no notices](cataclistics/inotify-watches.md) |
| [The source API](solutions/source-api.md) | [`/changes` wants a time](cataclistics/eli-changes-400.md) |
| [The terminal](solutions/terminal.md) | [Ctrl+C in the launcher](cataclistics/launcher-ctrl-c.md) · [no workflows in the web interface](cataclistics/workflow-web-manifest.md) |
| [The repository](solutions/repository.md) | [the media submodule](cataclistics/gist-submodule.md) |

## Topics

Every article of `solutions/` is listed above. What BOS's almanac also
has - roles, scenarios, simulations, knowledge - is not used here yet.
